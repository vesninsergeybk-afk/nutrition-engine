const STORE_KEY = "muscle-memory-learning-v1";
const TOKEN_KEY = "muscle-memory-account-token-v1";

function apiBase() {
  const explicit = document.querySelector('meta[name="muscle-memory-api-base"]')?.content?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (
    /\.pages\.dev$/i.test(location.hostname) ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname)
  ) {
    return "";
  }
  return location.origin.replace(/\/$/, "");
}
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const recordTime = (r) => Math.max(Number(r?.lastReviewedAt)||0, Number(r?.lastSeen)||0);

function mergeRecord(a,b) {
  if (!a) return clone(b)||{};
  if (!b) return clone(a)||{};
  const newer = recordTime(b) > recordTime(a) ? b : a;
  return {
    ...clone(newer),
    attempts: Math.max(Number(a.attempts)||0,Number(b.attempts)||0),
    correct: Math.max(Number(a.correct)||0,Number(b.correct)||0),
    wrong: Math.max(Number(a.wrong)||0,Number(b.wrong)||0),
    lastSeen: Math.max(Number(a.lastSeen)||0,Number(b.lastSeen)||0),
    reviewDebt: Math.max(Number(a.reviewDebt)||0,Number(b.reviewDebt)||0),
    reviewCount: Math.max(Number(a.reviewCount)||0,Number(b.reviewCount)||0),
    lapses: Math.max(Number(a.lapses)||0,Number(b.lapses)||0),
    lastReviewedAt: Math.max(Number(a.lastReviewedAt)||0,Number(b.lastReviewedAt)||0),
  };
}

export function mergeLearningStores(localStore, remoteStore) {
  const local = localStore?.version===1 ? localStore : {};
  const remote = remoteStore?.version===1 ? remoteStore : {};
  const records={};
  for (const key of new Set([...Object.keys(local.records||{}),...Object.keys(remote.records||{})])) {
    records[key]=mergeRecord(local.records?.[key],remote.records?.[key]);
  }
  const confusions={};
  for (const key of new Set([...Object.keys(local.confusions||{}),...Object.keys(remote.confusions||{})])) {
    const a=local.confusions?.[key], b=remote.confusions?.[key];
    if(!a) confusions[key]=clone(b);
    else if(!b) confusions[key]=clone(a);
    else confusions[key]={
      ...(Number(b.lastSeen)>Number(a.lastSeen)?clone(b):clone(a)),
      count:Math.max(Number(a.count)||0,Number(b.count)||0),
      lastSeen:Math.max(Number(a.lastSeen)||0,Number(b.lastSeen)||0),
    };
  }
  const sessionMap=new Map();
  for(const entry of [...(remote.sessions||[]),...(local.sessions||[])]){
    if(!entry) continue;
    const id=entry.sessionId||[entry.startedAt||0,entry.completedAt||0,entry.mode||"",entry.region||""].join(":");
    const prev=sessionMap.get(id);
    if(!prev||Number(entry.completedAt)>=Number(prev.completedAt)) sessionMap.set(id,clone(entry));
  }
  return {
    version:1,
    updatedAt:Math.max(Number(local.updatedAt)||0,Number(remote.updatedAt)||0),
    records,
    confusions,
    sessions:[...sessionMap.values()].sort((a,b)=>Number(a.completedAt)-Number(b.completedAt)).slice(-100),
  };
}

function loadLocal() {
  try { const x=JSON.parse(localStorage.getItem(STORE_KEY)||"null"); return x?.version===1?x:null; }
  catch { return null; }
}
function saveLocal(store) {
  try {
    const x=clone(store); x.updatedAt=Date.now();
    localStorage.setItem(STORE_KEY,JSON.stringify(x)); return x;
  } catch { return store; }
}
function errorText(code) {
  return ({
    "invalid-username":"Имя пользователя: 3–32 символа, буквы, цифры, точка, дефис или подчёркивание.",
    "invalid-email":"Проверьте адрес электронной почты.",
    "weak-password":"Пароль должен содержать не менее 10 символов.",
    "consent-required":"Нужно отдельно дать согласие на обработку персональных данных.",
    "username-or-email-exists":"Такое имя пользователя или email уже зарегистрированы.",
    "invalid-credentials":"Неверное имя пользователя, email или пароль.",
    "too-many-attempts":"Слишком много попыток. Попробуйте позже.",
    "invalid-or-expired-reset":"Ссылка восстановления недействительна или истекла.",
    "authentication-required":"Сессия завершилась. Войдите снова.",
  })[code] || "Не удалось выполнить действие. Проверьте соединение.";
}

export function initAccountClient({button,getStore,onStoreMerged=()=>{},onStateChange=()=>{}}={}) {
  const base=apiBase();
  const buttons=[button,document.querySelector("#account-button-mobile")].filter(Boolean);
  const dialog=document.querySelector("#account-dialog");
  const offline=document.querySelector("#account-offline");
  const auth=document.querySelector("#account-auth");
  const profile=document.querySelector("#account-profile");
  const message=document.querySelector("#account-message");
  const login=document.querySelector("#account-login-form");
  const register=document.querySelector("#account-register-form");
  const consent=document.querySelector("#account-consent-form");
  const recovery=document.querySelector("#account-recovery-form");
  const reset=document.querySelector("#account-reset-form");
  const syncState=document.querySelector("#account-sync-state");
  const consentLink=document.querySelector("#account-consent-link");
  const privacyLink=document.querySelector("#account-privacy-link");
  const resetToken=new URLSearchParams(location.search).get("reset")||"";
  if(resetToken){
    const cleanUrl=new URL(location.href);
    cleanUrl.searchParams.delete("reset");
    history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
  }
  let config={enabled:false}, user=null, revision=0;
  let token=localStorage.getItem(TOKEN_KEY)||"";
  let pendingRegistration=null;
  let syncTimer=0, syncing=false;

  const msg=(text,kind="")=>{message.textContent=text||"";message.dataset.kind=kind;};
  const setButton=()=>{
    for(const item of buttons){
      if(!base||!config.enabled){
        item.textContent="Прогресс на устройстве";
        item.dataset.state="local";
        item.title="Прогресс сохраняется локально на этом устройстве.";
      }else{
        item.textContent=user?user.username:"Войти";
        item.dataset.state=user?"online":"ready";
        item.title=user?"Аккаунт и синхронизация прогресса":"Войти, чтобы сохранять прогресс между устройствами";
      }
    }
  };
  const panel=(name)=>{
    login.hidden=name!=="login";
    register.hidden=name!=="register";
    consent.hidden=name!=="consent";
    recovery.hidden=name!=="recovery";
    reset.hidden=name!=="reset";
    document.querySelectorAll("[data-account-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.accountTab===name)));
    msg("");
  };
  async function request(path,options={}) {
    const headers={"content-type":"application/json",...(options.headers||{})};
    if(token)headers.authorization="Bearer "+token;
    const response=await fetch(base+path,{...options,headers,cache:"no-store"});
    let payload={};try{payload=await response.json();}catch{}
    if(!response.ok){const e=new Error(payload.error||"request-failed");e.code=payload.error||"request-failed";e.status=response.status;e.payload=payload;throw e;}
    return payload;
  }
  function clearSession(){
    token="";user=null;revision=0;localStorage.removeItem(TOKEN_KEY);
    profile.hidden=true;auth.hidden=!config.enabled;setButton();onStateChange({user:null,synced:false});
  }
  function applySession(payload){
    token=payload.token;user=payload.user;localStorage.setItem(TOKEN_KEY,token);
    auth.hidden=true;offline.hidden=true;profile.hidden=false;
    document.querySelector("#account-username").textContent=user.username;
    document.querySelector("#account-email").textContent=user.email;
    setButton();onStateChange({user,synced:false});
  }
  async function syncNow(){
    if(!user||!token||!config.enabled||syncing)return;
    syncing=true;syncState.textContent="Сохраняю прогресс…";
    try{
      const local=getStore?.()||loadLocal();
      const out=await request("/api/progress",{method:"PUT",body:JSON.stringify({revision,store:local})});
      revision=Number(out.revision)||revision+1;syncState.textContent="Прогресс синхронизирован.";onStateChange({user,synced:true});
    }catch(e){
      if(e.status===409&&e.payload?.latest){
        const latest=e.payload.latest;
        const merged=mergeLearningStores(getStore?.()||loadLocal(),latest.store);
        revision=Number(latest.revision)||0;
        onStoreMerged(saveLocal(merged));syncing=false;return syncNow();
      }
      if(e.status===401){clearSession();msg(errorText("authentication-required"),"error");}
      else syncState.textContent="Нет связи с облаком. Локальный прогресс сохранён.";
    }finally{syncing=false;}
  }
  function scheduleSync(){
    if(syncTimer)clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>void syncNow(),900);
  }
  async function pullMerge(){
    const remote=await request("/api/progress");revision=Number(remote.revision)||0;
    const merged=mergeLearningStores(getStore?.()||loadLocal(),remote.store);
    onStoreMerged(saveLocal(merged));await syncNow();
  }
  async function restore(){
    if(!token||!config.enabled)return;
    try{const out=await request("/api/account/me");user=out.user;profile.hidden=false;auth.hidden=true;
      document.querySelector("#account-username").textContent=user.username;document.querySelector("#account-email").textContent=user.email;setButton();await pullMerge();
    }catch{clearSession();}
  }
  function open(){
    if(!base||!config.enabled){offline.hidden=false;auth.hidden=true;profile.hidden=true;}
    else if(user){offline.hidden=true;auth.hidden=true;profile.hidden=false;}
    else{offline.hidden=true;auth.hidden=false;profile.hidden=true;panel(resetToken?"reset":"login");}
    if(!dialog.open)dialog.showModal();
  }

  for(const item of buttons) item.addEventListener("click",open);
  document.querySelector("#account-close")?.addEventListener("click",()=>dialog.close());
  dialog?.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  document.querySelectorAll("[data-account-tab]").forEach(b=>b.addEventListener("click",()=>panel(b.dataset.accountTab)));
  document.querySelector("#account-forgot")?.addEventListener("click",()=>panel("recovery"));
  document.querySelectorAll("[data-back-login]").forEach(b=>b.addEventListener("click",()=>panel("login")));
  document.querySelectorAll("[data-back-register]").forEach(b=>b.addEventListener("click",()=>panel("register")));

  login?.addEventListener("submit",async e=>{
    e.preventDefault();const d=new FormData(login);
    try{const out=await request("/api/account/login",{method:"POST",body:JSON.stringify({identifier:d.get("identifier"),password:d.get("password")})});applySession(out);await pullMerge();msg("Готово. Локальный и облачный прогресс объединены.","success");}
    catch(err){msg(errorText(err.code),"error");}
  });
  register?.addEventListener("submit",e=>{
    e.preventDefault();
    const d=new FormData(register);
    if(d.get("password")!==d.get("passwordConfirm")){
      msg("Пароли не совпадают.","error");
      return;
    }
    pendingRegistration={
      username:d.get("username"),
      email:d.get("email"),
      password:d.get("password"),
    };
    consent.reset();
    panel("consent");
  });

  consent?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!pendingRegistration){
      panel("register");
      msg("Сначала заполните данные аккаунта.","error");
      return;
    }
    const d=new FormData(consent);
    if(d.get("consent")!=="on"){
      msg("Для продолжения нужно отдельно подтвердить согласие.","error");
      return;
    }
    try{
      const out=await request("/api/account/register",{
        method:"POST",
        body:JSON.stringify({
          ...pendingRegistration,
          consentAccepted:true,
          consentVersion:config.consentVersion,
        })
      });
      pendingRegistration=null;
      applySession(out);
      await pullMerge();
      msg("Аккаунт создан. Текущий прогресс сохранён.","success");
    }catch(err){
      msg(errorText(err.code),"error");
    }
  });
  recovery?.addEventListener("submit",async e=>{
    e.preventDefault();const d=new FormData(recovery);
    try{await request("/api/account/request-password-reset",{method:"POST",body:JSON.stringify({email:d.get("email")})});msg("Если email зарегистрирован, на него отправлена ссылка.","success");}
    catch(err){msg(errorText(err.code),"error");}
  });
  reset?.addEventListener("submit",async e=>{
    e.preventDefault();const d=new FormData(reset);
    if(d.get("password")!==d.get("passwordConfirm"))return msg("Пароли не совпадают.","error");
    try{await request("/api/account/reset-password",{method:"POST",body:JSON.stringify({token:resetToken,password:d.get("password")})});history.replaceState({},"",location.pathname+location.hash);panel("login");msg("Пароль изменён. Теперь можно войти.","success");}
    catch(err){msg(errorText(err.code),"error");}
  });
  document.querySelector("#account-sync-now")?.addEventListener("click",()=>void pullMerge());
  document.querySelector("#account-export")?.addEventListener("click",async()=>{
    try{
      const payload=await request("/api/account/export");
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      link.download="muscle-memory-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      msg("Выгрузка подготовлена.","success");
    }catch(err){msg(errorText(err.code),"error");}
  });
  document.querySelector("#account-logout")?.addEventListener("click",async()=>{try{await request("/api/account/logout",{method:"POST",body:"{}"});}catch{}clearSession();panel("login");msg("Вы вышли. Локальный прогресс сохранён.");});
  document.querySelector("#account-delete")?.addEventListener("click",async()=>{
    if(!confirm("Удалить аккаунт и весь облачный прогресс? Локальную копию на этом устройстве это не удалит."))return;
    try{await request("/api/account",{method:"DELETE",body:"{}"});clearSession();panel("login");msg("Аккаунт и облачный прогресс удалены.","success");}
    catch(err){msg(errorText(err.code),"error");}
  });

  window.addEventListener("muscle-memory:store-saved",()=>{
    if(user)scheduleSync();
  });

  void (async()=>{
    if(!base){setButton();return;}
    try{const r=await fetch(base+"/api/account/config",{cache:"no-store"});config=r.ok?await r.json():{enabled:false};}catch{config={enabled:false};}
    setButton();
    if(!config.enabled)return;
    consentLink.href=new URL(config.consentUrl,base+"/").href;
    privacyLink.href=new URL(config.privacyUrl,base+"/").href;
    if(resetToken){open();panel("reset");}
    await restore();
  })();

  return {open,sync:syncNow,getUser:()=>user};
}
