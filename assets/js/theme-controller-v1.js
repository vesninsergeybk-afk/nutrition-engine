// nutrition calculator v5.3.155 — verified compact theme toggle controller
// Responsibility: select/persist the visual theme and update only html[data-theme].
(function(){
  'use strict';
  var VERSION = 'v5.3.155_theme_switcher_verified_v3';
  var STORAGE_KEY = 'nutritionCalculator.uiTheme.v1';
  var THEMES = ['modern', 'retro-2bit'];

  function valid(value){ return THEMES.indexOf(value) !== -1; }
  function current(){
    var value = document.documentElement.getAttribute('data-theme');
    return valid(value) ? value : 'modern';
  }
  function syncControls(theme){
    var isRetro = theme === 'retro-2bit';
    var controls = document.querySelectorAll('[data-theme-value]');
    for (var i=0;i<controls.length;i++){
      var selected = controls[i].getAttribute('data-theme-value') === theme;
      controls[i].setAttribute('aria-pressed', selected ? 'true' : 'false');
      controls[i].classList.toggle('active', selected);
    }
    var toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-checked', isRetro ? 'true' : 'false');
      toggle.classList.toggle('is-retro', isRetro);
      toggle.setAttribute('aria-label', isRetro ? 'Переключить на современную тему' : 'Переключить на двухбитную тему');
      toggle.setAttribute('title', isRetro ? 'Сейчас включена тема 2-bit' : 'Сейчас включена современная тема');
    }
    var toggleText = document.getElementById('themeToggleText');
    if (toggleText) toggleText.textContent = isRetro ? '2-bit' : 'Современная';
    var status = document.getElementById('themeStatus');
    if (status) status.textContent = isRetro ? 'Двухбитное оформление включено' : 'Современное оформление включено';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name','theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', isRetro ? '#111111' : '#f7fbff');
  }
  function setTheme(theme, options){
    options = options || {};
    if (!valid(theme)) theme = 'modern';
    var previous = current();
    document.documentElement.setAttribute('data-theme', theme);
    if (options.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch(_) {}
    }
    syncControls(theme);
    if (previous !== theme && options.silent !== true) {
      try { window.dispatchEvent(new CustomEvent('nutrition:themechange', { detail:{ theme:theme, previous:previous, version:VERSION } })); } catch(_) {}
    }
    return theme;
  }
  function reset(){
    try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
    return setTheme('modern', { persist:false });
  }
  function bind(){
    syncControls(current());
    document.addEventListener('click', function(event){
      var toggle = event.target && event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
      if (toggle) {
        event.preventDefault();
        setTheme(current() === 'retro-2bit' ? 'modern' : 'retro-2bit');
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest('[data-theme-value]') : null;
      if (!button) return;
      var next = button.getAttribute('data-theme-value');
      if (!valid(next)) return;
      event.preventDefault();
      setTheme(next);
    });
    window.addEventListener('storage', function(event){
      if (event && event.key === STORAGE_KEY && valid(event.newValue) && event.newValue !== current()) {
        setTheme(event.newValue, { persist:false });
      }
    });
  }

  window.NutritionTheme = {
    version: VERSION,
    storageKey: STORAGE_KEY,
    themes: THEMES.slice(),
    get: current,
    set: setTheme,
    reset: reset
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
