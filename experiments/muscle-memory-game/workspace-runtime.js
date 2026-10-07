// The functions live in app.js so the adapter uses the actual trainer state.
// This file is included by the release assembler; it is not a second trainer.
let workspaceReady = false;
let workspaceRestoring = false;
let workspaceSaveTimer = 0;
let workspaceLastSaved = '';
let workspacePending = null;
const workspaceStatus = document.querySelector('[data-workspace-status]');
const workspaceMessages = {
  ready: 'Состояние сохраняется в этом браузере.',
  pending: 'Сохраняю изменения…',
  saved: 'Состояние сохраняется в этом браузере.',
  restored: 'Сохранённый контекст восстановлен.',
  incompatible: 'Сохранённую сессию не удалось прочитать. Она оставлена без изменений. Новая сессия будет временной.',
  unavailable: 'Браузер не разрешил сохранить сессию. Не закрывайте эту вкладку, если хотите продолжить.',
  conflict: 'Сессия изменилась в другой вкладке. Изменения в этой вкладке не будут сохранены. Можно продолжить в той вкладке или обновить страницу.',
  invalid: 'Сессию не удалось сохранить. Не закрывайте эту вкладку, если хотите продолжить.',
  partial: 'Часть сохранённого вида сейчас недоступна. Остальной контекст восстановлен.',
};
function workspaceNotify(status) {
  if (!workspaceStatus) return;
  workspaceStatus.textContent = workspaceMessages[status] || workspaceMessages.ready;
  workspaceStatus.dataset.state = status;
}
const workspaceStorage = new WorkspaceStorage('anatomy', {
  validate: validAnatomyWorkspace,
  onStatus: status => { if (status !== 'saved') workspaceNotify(status); },
});

function captureWorkspace() {
  const hidden = values => values.flatMap((visible, id) => visible === false ? [id] : []);
  const selection = atlasSelection();
  return {
    version: 1, model: currentModelSource, mode: appMode,
    region: selectedLearningRegion, regional: regionIsolation.checked,
    practice: selectedSessionMode, size: Number(learningSessionSize.value) || 10,
    correct, wrong, session: encodeLearningSession(learningSession),
    phase: !learningSession ? 'setup' : sessionSummaryShown ? 'summary' : locked ? 'feedback' : 'question',
    wrongAttempts: currentItemWrongAttempts,
    navigationActions: currentItemNavigationActions,
    pendingNavigation: pendingNavigationSid,
    deadline: examDeadline, examSeconds: Number(examItemSeconds.value),
    question: questionEl.textContent, feedback: feedbackEl.textContent,
    feedbackKind: ['correct', 'wrong', 'navigation'].find(kind => feedbackEl.classList.contains(kind)) || '',
    search: searchInput.value,
    progress: structuredClone(learningStore),
    scroll: Math.max(0, window.scrollY),
    panelScroll: Math.max(0, document.querySelector('.panel')?.scrollTop || 0),
    view: {
      selection, camera: camera.position.toArray(), target: controls.target.toArray(),
      preset: viewPreset.value,
      hiddenMuscles: hidden(structureVisibility), hiddenBones: hidden(boneVisibility),
      hiddenStudy: studyStructures.filter(entry => !studyStructureIsVisible(entry.id)).map(entry => entry.id),
      manualBones: [...atlasHiddenBones],
      boneMode: boneDisplayMode, muscleMode: muscleDisplayMode,
      skinMode: skinDisplayMode, connectiveMode: connectiveDisplayMode,
      opacity: Number(muscleTransparency.value), isolated, bonesView: Boolean(atlasBonesView),
      connectiveLayers: connectiveLayerInputs.filter(input => input.checked).map(input => input.dataset.connectiveLayer),
      referenceLayers: referenceLayerInputs.filter(input => input.checked).map(input => input.dataset.referenceLayer),
    },
  };
}

function scheduleWorkspaceSave() {
  if (!workspaceReady || workspaceRestoring || !anatomyMesh) return;
  clearTimeout(workspaceSaveTimer);
  if (workspaceStorage.writable) workspaceNotify('pending');
  workspaceSaveTimer = setTimeout(() => void saveWorkspace(), 120);
}
async function saveWorkspace() {
  clearTimeout(workspaceSaveTimer);
  if (!workspaceReady || workspaceRestoring || !anatomyMesh) return;
  const payload = captureWorkspace();
  const serialized = JSON.stringify(payload);
  if (serialized === workspaceLastSaved) {
    await workspaceStorage.flush();
    if (workspaceStorage.writable && workspaceStorage.revision > 0) workspaceNotify('saved');
    return;
  }
  if (await workspaceStorage.write(payload)) {
    workspaceLastSaved = serialized;
    workspaceNotify(JSON.stringify(captureWorkspace()) === serialized ? 'saved' : 'pending');
  }
}

function matchesWorkspaceRequest(saved) {
  const request = new URLSearchParams(location.search);
  const region = request.get('scope') || request.get('region');
  return (!request.get('mode') || request.get('mode') === saved.mode) &&
    (!region || region === saved.region) &&
    (!request.get('practice') || request.get('practice') === saved.practice) &&
    (!request.get('size') || Number(request.get('size')) === saved.size);
}

async function restoreWorkspace(saved) {
  workspaceRestoring = true;
  try {
    if (!learningAreaOptionExists(saved.region)) { workspaceNotify('partial'); return; }
    // Existing progress is migrated into the durable workspace boundary. The
    // original learning engine retains its compatibility cache and semantics.
    if (Number(saved.progress.updatedAt) > Number(learningStore.updatedAt)) {
      learningStore = structuredClone(saved.progress);
    }
    selectedLearningRegion = learningRegion.value = saved.region;
    regionIsolation.checked = saved.regional;
    applyLearningRegion();
    setLearningMode(saved.practice, { reset: false });
    learningSessionSize.value = String(saved.size);
    examItemSeconds.value = String(saved.examSeconds || 20);
    setMode(saved.mode);
    learningSession = decodeLearningSession(saved.session, learningCatalog);
    correct = saved.correct; wrong = saved.wrong;
    correctEl.textContent = String(correct); wrongEl.textContent = String(wrong);
    if (saved.session && !learningSession) { workspaceNotify('partial'); return; }
    if (learningSession) {
      document.body.classList.add('session-active');
      exitLearningSessionButton.hidden = false;
      startLearningSessionButton.textContent = 'Перезапустить';
      applyTrainingDisplayOverride();
      syncQuestionCardPlacement();
      if (saved.phase === 'summary') {
        finishLearningSession();
      } else {
        const nextIndex = learningSession.index;
        if (saved.phase === 'feedback') learningSession.index = Math.max(0, nextIndex - 1);
        prepareSessionItem();
        learningSession.index = nextIndex;
        currentItemWrongAttempts = saved.wrongAttempts;
        currentItemNavigationActions = saved.navigationActions;
        pendingNavigationSid = saved.pendingNavigation;
        locked = saved.phase === 'feedback';
        if (locked) {
          clearExamTimer(); answerButton.hidden = true;
          quizActions.hidden = false; quizActions.classList.add('next-only');
          nextButton.disabled = false;
          nextButton.textContent = sessionProgress(learningSession).finished ? 'Итоги' : 'Следующая';
          for (const button of nameChoicesEl.querySelectorAll('button')) button.disabled = true;
        } else if (learningSession.mode === 'exam') {
          startExamTimer(saved.deadline);
        }
        renderSessionProgress();
      }
    }
    for (const input of referenceLayerInputs) {
      input.checked = saved.view.referenceLayers.includes(input.dataset.referenceLayer);
      if (input.checked) {
        try { await handleReferenceLayerChange(input); } catch { workspaceNotify('partial'); }
      }
    }
    if (saved.view.bonesView && saved.mode === 'explore') setAtlasBonesView(true);
    const view = captureAtlasView();
    view.meshes = [];
    view.hidden = saved.view.hiddenMuscles;
    view.isolated = saved.view.isolated;
    view.selection = saved.view.selection;
    view.boneMode = saved.view.boneMode; view.muscleMode = saved.view.muscleMode;
    view.skinMode = saved.view.skinMode; view.connectiveMode = saved.view.connectiveMode;
    view.opacity = String(saved.view.opacity);
    view.connectiveLayers = connectiveLayerInputs.map(input => saved.view.connectiveLayers.includes(input.dataset.connectiveLayer));
    view.referenceLayers = referenceLayerInputs.map(input => input.checked);
    view.muscles = structureVisibility.map((_, id) => !saved.view.hiddenMuscles.includes(id));
    view.bones = boneVisibility.map((_, id) => !saved.view.hiddenBones.includes(id));
    view.study = studyStructures.map(entry => !saved.view.hiddenStudy.includes(entry.id));
    view.manualBones = saved.view.manualBones;
    view.camera = new THREE.Vector3().fromArray(saved.view.camera);
    view.target = new THREE.Vector3().fromArray(saved.view.target);
    view.preset = saved.view.preset;
    restoreAtlasView(view);
    if (learningSession && !sessionSummaryShown && currentTarget) {
      const ids = recognitionStructureIds(currentTarget, Math.max(0, learningSession.index - (locked ? 1 : 0)));
      highlightStructures(ids, locked ? 'correct' : 'selected');
    }
    // restoreAtlasView derives view controls; the exercise phase owns its prompt.
    questionEl.textContent = saved.question;
    feedbackEl.textContent = saved.feedback;
    feedbackEl.className = 'feedback' + (saved.feedbackKind ? ' ' + saved.feedbackKind : '');
    searchInput.value = saved.search; renderSearchResults(saved.search);
    if (saved.pendingNavigation != null) {
      revealDeeperButton.hidden = false; revealDeeperButton.disabled = false;
    }
    renderProgressPanel();
    document.querySelector('.panel')?.scrollTo({ top: saved.panelScroll || 0, behavior: 'instant' });
    window.scrollTo({ top: saved.scroll || 0, behavior: 'instant' });
    workspaceNotify('restored');
    canvas.dataset.workspaceRestored = 'true';
  } finally { workspaceRestoring = false; }
}

async function bootWorkspace() {
  const saved = await workspaceStorage.read();
  if (saved && matchesWorkspaceRequest(saved)) {
    workspacePending = saved; modelSource.value = saved.model;
  }
  await loadSelectedModel(modelSource.value);
}

for (const type of ['click', 'input', 'change', 'keydown']) {
  document.querySelector('#atlas-page').addEventListener(type, scheduleWorkspaceSave, { capture: true });
}
controls.addEventListener('end', scheduleWorkspaceSave);
window.addEventListener('scroll', scheduleWorkspaceSave, { passive: true });
document.querySelector('.panel')?.addEventListener('scroll', scheduleWorkspaceSave, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) void saveWorkspace(); });
window.addEventListener('pagehide', () => void saveWorkspace());
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!workspaceReady || !link || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
  event.preventDefault();
  // Stop submitting GPU frames while the final snapshot is committed. The
  // current canvas remains visible and the navigation does not compete with
  // a full-body software-rendering frame for main-thread time.
  webglSession.pause();
  void saveWorkspace().then(() => location.assign(url.href)).catch(() => {
    workspaceNotify('invalid'); webglSession.resume();
  });
});
window.addEventListener('pageshow', () => webglSession.resume());

document.querySelector('[data-anatomy-export]')?.addEventListener('click', () => {
  const data = {format:'VesninMed.Anatomy',schemaVersion:1,exportedAt:new Date().toISOString(),payload:captureWorkspace()};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url;link.download='vesninmed-anatomy.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('.workspace-backup').open=false;
});
document.querySelector('[data-anatomy-import]')?.addEventListener('change', async event => {
  try {
    const file=event.target.files[0];if(!file)return;
    if(file.size>2*1024*1024)throw new Error('Файл больше 2 МБ.');
    const data=JSON.parse(await file.text());
    if(data.format!=='VesninMed.Anatomy'||data.schemaVersion!==1||!validAnatomyWorkspace(data.payload))throw new Error('Нужна резервная копия сессии Anatomy этой версии.');
    if(!confirm('Восстановить сессию из файла? Текущую сессию можно предварительно скачать.'))return;
    workspacePending=data.payload;modelSource.value=data.payload.model;
    await loadSelectedModel(modelSource.value);await saveWorkspace();
  } catch(error) {
    workspaceStatus.textContent='Импорт не выполнен: '+error.message+' Текущая сессия сохранена.';
  } finally {event.target.value='';document.querySelector('.workspace-backup').open=false;}
});
document.addEventListener('keydown', event => {
  const menu=document.querySelector('.workspace-backup');
  if(event.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}
});
document.addEventListener('click', event => {
  const menu=document.querySelector('.workspace-backup');if(menu?.open&&!menu.contains(event.target))menu.open=false;
});
