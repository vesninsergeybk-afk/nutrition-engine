/* HF8 profile-first workspace static/browser self-test. */
(function(w,d){'use strict';
  function byId(id){return d.getElementById(id);}
  function run(){
    var api=w.NutritionWorkspaceProfileHF8,nav=w.NavigationShellV1,input=byId('needs_person_name'),routes=nav&&nav.routes||{},errors=[];
    if(!api)errors.push('profile_api_missing');
    if(!routes.profile)errors.push('profile_route_missing');
    if(routes.ration&&routes.ration.ids&&routes.ration.ids.indexOf('needsCompact')>=0)errors.push('needs_still_in_ration');
    if(routes.profile&&routes.profile.ids&&routes.profile.ids.indexOf('needsCompact')<0)errors.push('needs_not_in_profile');
    if(!input||input.placeholder!=='Иван Иванов')errors.push('ivan_placeholder_missing');
    if(!byId('workspaceProfilePanel'))errors.push('profile_panel_missing');
    if(!byId('workspacePersonContext'))errors.push('person_context_missing');
    return {ok:errors.length===0,version:'v5.3.210-rc2-hf8',errors:errors,route:nav&&nav.getState?nav.getState().route:null,ready:api&&api.isReady?api.isReady():false};
  }
  w.WorkspaceProfileNeedsSelftestHF8={run:run};
  w.setTimeout(function(){try{w.dispatchEvent(new CustomEvent('workspace-profile:selftest',{detail:run()}));}catch(_){}},700);
})(window,document);
