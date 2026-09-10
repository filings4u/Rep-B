(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const state={db:null,services:[],plans:[],addons:[],serviceAddons:[],forms:[],versions:[],blocks:[],sessions:[],configs:[],flowServiceKey:null,flowSteps:[],flowSelectedKey:null,flowDirty:false};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
  const date=v=>v?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';

  async function resolveDb(){
    if(state.db) return state.db;
    if(typeof window.filings4uRequireAdmin==='function'){
      try{ const auth=await window.filings4uRequireAdmin(); state.db=auth?.db||auth?.supabase||null; }catch(e){ console.error('[wizard manager] guard failed',e); }
    }
    state.db=state.db||window.filings4uSupabase||window.supabaseClient||window.filings4uDb||null;
    return state.db;
  }
  function panel(name){
    $$('[data-wizard-panel]').forEach(b=>b.classList.toggle('is-active',b.dataset.wizardPanel===name));
    $$('[data-wizard-view]').forEach(v=>v.classList.toggle('is-active',v.dataset.wizardView===name));
    try{sessionStorage.setItem('filings4u-wizard-panel',name)}catch(_){}
  }
  async function q(table,columns='*',order=null,limit=null){
    const db=await resolveDb(); if(!db?.from) throw new Error('Supabase client unavailable');
    let x=db.from(table).select(columns); if(order) x=x.order(order,{ascending:true}); if(limit) x=x.limit(limit);
    const {data,error}=await x; if(error) throw error; return data||[];
  }
  async function load(){
    const results=await Promise.allSettled([
      q('wizard_v2_services','service_key,service_title,category,service_type,requires_jurisdiction,requires_authorization,form_key,is_active,sort_order,government_fee_mode,government_fee_key,fixed_government_fee','sort_order'),
      q('wizard_v2_service_plans','id,service_key,plan_key,plan_name,service_fee,currency,is_active,sort_order','sort_order'),
      q('wizard_v2_addons','addon_key,addon_name,price,currency,is_active','addon_name'),
      q('wizard_v2_service_addons','service_key,addon_key,is_recommended,sort_order','sort_order'),
      q('wizard_form_definitions','id,service_key,form_key,form_title,description,is_active,published_version_id','form_title'),
      q('wizard_form_versions','id,definition_id,version_number,status,schema,change_note,created_at,published_at','version_number'),
      q('wizard_form_blocks','id,block_key,block_name,block_category,description,is_system,is_active,schema','block_name'),
      q('wizard_v2_sessions','id,service_key,plan_key,status,current_step_key,first_name,last_name,email_address,company_name,started_at','started_at',40),
      q('catalog_wizard_configs','service_key,welcome_title,welcome_message,application_label,addons_label,authorization_label,summary_label,checkout_label,show_addons,show_summary,require_contact_capture,allow_save_resume,allow_back_navigation,checkout_enabled,success_redirect_url,config','service_key')
    ]);
    const keys=['services','plans','addons','serviceAddons','forms','versions','blocks','sessions','configs'];
    results.forEach((r,i)=>{ if(r.status==='fulfilled') state[keys[i]]=r.value; else console.warn(`[wizard manager] ${keys[i]} unavailable`,r.reason); });
    renderAll();
  }
  function text(id,v){const e=document.getElementById(id);if(e)e.textContent=Number(v||0).toLocaleString()}
  function renderAll(){
    text('wizardServiceCount',state.services.length); text('wizardPlanCount',state.plans.length); text('wizardFormCount',state.forms.length); text('wizardSessionCount',state.sessions.length); text('wizardVersionCount',state.versions.length); text('wizardBlockCount',state.blocks.length);
    const cat=$('#wizardServiceCategory'); if(cat){const current=cat.value;cat.innerHTML='<option value="">All categories</option>'+[...new Set(state.services.map(s=>s.category))].sort().map(x=>`<option>${esc(x)}</option>`).join('');cat.value=current;}
    renderServices();renderFlowServiceList();renderPlans();renderForms();renderBlocks();renderAddons();renderSessions();renderSettingsList();
  }
  function renderServices(){
    const body=$('#wizardServicesBody');if(!body)return; const term=($('#wizardServiceSearch')?.value||'').toLowerCase(), category=$('#wizardServiceCategory')?.value||'';
    const rows=state.services.filter(s=>(!category||s.category===category)&&(`${s.service_title} ${s.service_key} ${s.category}`.toLowerCase().includes(term)));
    body.innerHTML=rows.map(s=>`<tr><td><strong>${esc(s.service_title)}</strong><small>${esc(s.category)} · ${esc(s.service_key)}</small></td><td>${esc(s.service_type||'—')}</td><td><span class="wizard-pill ${s.requires_jurisdiction?'':'is-off'}">${s.requires_jurisdiction?'Jurisdiction':'No jurisdiction'}</span> <span class="wizard-pill ${s.requires_authorization?'':'is-off'}">${s.requires_authorization?'Authorization':'No authorization'}</span></td><td>${esc(s.form_key)}</td><td><span class="wizard-pill ${s.is_active?'':'is-off'}">${s.is_active?'Active':'Inactive'}</span></td><td><button class="wizard-mini-button" data-wizard-config="${esc(s.service_key)}">Configure</button></td></tr>`).join('')||'<tr><td colspan="6">No services match this filter.</td></tr>';
  }
  const FLOW_DEFAULTS=[
    {key:'service',label:'Service',enabled:true,locked:true,description:'Entry point selected from the website or service catalog.'},
    {key:'jurisdiction',label:'Jurisdiction',enabled:true,description:'Collect the filing state when this service requires state jurisdiction.'},
    {key:'application',label:'Application',enabled:true,locked:true,description:'Render the published application form for the selected service.'},
    {key:'addons',label:'Add-ons',enabled:true,description:'Offer service-specific add-ons and recommended upsells.'},
    {key:'authorization',label:'Authorization',enabled:true,description:'Collect authorization or power-of-attorney details when required.'},
    {key:'summary',label:'Summary',enabled:true,description:'Review answers, selections and pricing before checkout.'},
    {key:'payment',label:'Payment',enabled:true,description:'Create the final quote/payment step when checkout is enabled.'}
  ];
  function flowDefaultsFor(service,c={}){
    const labels={application:c.application_label||'Application',addons:c.addons_label||'Add-ons',authorization:c.authorization_label||'Authorization',summary:c.summary_label||'Summary',payment:c.checkout_label||'Payment'};
    return FLOW_DEFAULTS.map(x=>({...x,label:labels[x.key]||x.label,enabled:x.key==='jurisdiction'?!!service.requires_jurisdiction:x.key==='authorization'?!!service.requires_authorization:x.key==='addons'?c.show_addons!==false:x.key==='summary'?c.show_summary!==false:x.key==='payment'?c.checkout_enabled!==false:true,condition:x.key==='jurisdiction'?{field:'requires_jurisdiction',operator:'is_truthy',value:''}:x.key==='authorization'?{field:'requires_authorization',operator:'is_truthy',value:''}:null}));
  }
  function normalizedFlow(service,c={}){
    const base=flowDefaultsFor(service,c),saved=Array.isArray(c.config?.flow?.steps)?c.config.flow.steps:[];
    const byKey=Object.fromEntries(base.map(x=>[x.key,x]));
    const ordered=[];
    saved.forEach(x=>{if(byKey[x.key]){ordered.push({...byKey[x.key],...x,locked:byKey[x.key].locked});delete byKey[x.key]}});
    base.forEach(x=>{if(byKey[x.key])ordered.push(byKey[x.key])});
    return ordered;
  }
  function renderFlowServiceList(){
    const root=$('#wizardFlowServiceList');if(!root)return;const term=($('#wizardFlowServiceSearch')?.value||'').toLowerCase();
    root.innerHTML=state.services.filter(s=>`${s.service_title} ${s.service_key} ${s.category}`.toLowerCase().includes(term)).map(s=>`<button type="button" class="${state.flowServiceKey===s.service_key?'is-active':''}" data-flow-service="${esc(s.service_key)}"><strong>${esc(s.service_title)}</strong><small>${esc(s.category)} · ${esc(s.service_type||'service')}</small></button>`).join('')||'<p class="wizard-flow-empty-list">No services match.</p>';
    if(!state.flowServiceKey&&state.services[0])openFlow(state.services[0].service_key);
  }
  function openFlow(key){
    const service=state.services.find(s=>s.service_key===key);if(!service)return;const c=state.configs.find(x=>x.service_key===key)||{};
    state.flowServiceKey=key;state.flowSteps=normalizedFlow(service,c);state.flowSelectedKey=null;state.flowDirty=false;
    $('#wizardFlowTitle').textContent=service.service_title;$('#wizardFlowServiceType').textContent=`${service.category} · ${service.service_type||'service'}`;$('#wizardFlowDescription').textContent=service.requires_jurisdiction?'This service currently requires jurisdiction.':'This service currently bypasses jurisdiction.';
    renderFlowServiceList();renderFlowCanvas();showFlowInspector(null);setFlowStatus('');
  }
  function setFlowStatus(text,kind=''){const el=$('#wizardFlowStatus');if(!el)return;el.textContent=text;el.dataset.kind=kind}
  function renderFlowCanvas(){
    const root=$('#wizardFlowCanvas');if(!root)return;if(!state.flowServiceKey){root.innerHTML='<div class="wizard-flow-empty"><p>Select a service to build its journey.</p></div>';return}
    root.innerHTML=state.flowSteps.map((step,i)=>`<div class="wizard-flow-node ${step.enabled?'':'is-disabled'} ${state.flowSelectedKey===step.key?'is-selected':''}" draggable="${step.locked?'false':'true'}" data-flow-step="${esc(step.key)}"><button class="wizard-flow-drag" type="button" aria-label="Reorder" ${step.locked?'disabled':''}>⋮⋮</button><div class="wizard-flow-node-icon">${i+1}</div><div class="wizard-flow-node-main"><span>${step.locked?'Required step':step.enabled?'Active step':'Skipped step'}</span><strong>${esc(step.label)}</strong><small>${esc(step.description||'')}</small>${step.condition?.field?`<em>When ${esc(step.condition.field)} ${esc(step.condition.operator||'equals')} ${esc(step.condition.value||'')}</em>`:''}</div><button class="wizard-flow-edit" type="button" data-flow-edit="${esc(step.key)}">Edit</button></div>${i<state.flowSteps.length-1?'<div class="wizard-flow-connector"><span>↓</span></div>':''}`).join('');
    bindFlowDrag();
  }
  function showFlowInspector(key){
    state.flowSelectedKey=key;const empty=$('#wizardFlowInspectorEmpty'),form=$('#wizardFlowInspectorForm'),step=state.flowSteps.find(s=>s.key===key);if(!step){if(empty)empty.hidden=false;if(form)form.hidden=true;renderFlowCanvas();return}
    empty.hidden=true;form.hidden=false;$('#wizardFlowInspectorTitle').textContent=step.label;$('#wizardFlowStepKey').value=step.key;$('#wizardFlowStepLabel').value=step.label;$('#wizardFlowStepEnabled').checked=step.enabled!==false;$('#wizardFlowStepEnabled').disabled=!!step.locked;$('#wizardFlowEnabledHelp').textContent=step.locked?'This step is required and cannot be disabled.':'Show this step in the journey.';$('#wizardFlowConditionField').value=step.condition?.field||'';$('#wizardFlowConditionOperator').value=step.condition?.operator||'equals';$('#wizardFlowConditionValue').value=step.condition?.value||'';
    const notes={service:'The service entry point is always required.',jurisdiction:'This also updates wizard_v2_services.requires_jurisdiction.',application:'The application step is always required and renders the published service form.',addons:'This also updates catalog_wizard_configs.show_addons.',authorization:'This also updates wizard_v2_services.requires_authorization.',summary:'This also updates catalog_wizard_configs.show_summary.',payment:'This also updates catalog_wizard_configs.checkout_enabled.'};$('#wizardFlowRuntimeNote').textContent=notes[step.key]||'';renderFlowCanvas();
  }
  function applyFlowInspector(e){e.preventDefault();const key=$('#wizardFlowStepKey').value,step=state.flowSteps.find(s=>s.key===key);if(!step)return;step.label=$('#wizardFlowStepLabel').value.trim()||step.label;if(!step.locked)step.enabled=$('#wizardFlowStepEnabled').checked;const field=$('#wizardFlowConditionField').value.trim(),value=$('#wizardFlowConditionValue').value.trim();step.condition=field?{field,operator:$('#wizardFlowConditionOperator').value,value}:null;state.flowDirty=true;setFlowStatus('Unsaved changes','dirty');showFlowInspector(key)}
  function bindFlowDrag(){
    let dragging=null;$$('.wizard-flow-node[draggable="true"]','#wizardFlowCanvas').forEach(node=>{node.addEventListener('dragstart',e=>{dragging=node.dataset.flowStep;e.dataTransfer.effectAllowed='move';node.classList.add('is-dragging')});node.addEventListener('dragend',()=>{node.classList.remove('is-dragging');dragging=null});node.addEventListener('dragover',e=>{if(!dragging||dragging===node.dataset.flowStep)return;e.preventDefault();node.classList.add('is-dragover')});node.addEventListener('dragleave',()=>node.classList.remove('is-dragover'));node.addEventListener('drop',e=>{e.preventDefault();node.classList.remove('is-dragover');const from=state.flowSteps.findIndex(x=>x.key===dragging),to=state.flowSteps.findIndex(x=>x.key===node.dataset.flowStep);if(from<0||to<0)return;const [moved]=state.flowSteps.splice(from,1);state.flowSteps.splice(to,0,moved);state.flowDirty=true;setFlowStatus('Unsaved changes','dirty');renderFlowCanvas()})});
  }
  async function resetFlow(){
    if(!state.flowServiceKey)return;const ok=await window.filings4uDialog.confirm('Reset this service to the default filings4u wizard flow? Your changes are not saved until you click Save flow.',{title:'Reset flow',confirmText:'Reset defaults'});if(!ok)return;const service=state.services.find(s=>s.service_key===state.flowServiceKey),c=state.configs.find(x=>x.service_key===state.flowServiceKey)||{};state.flowSteps=flowDefaultsFor(service,c);state.flowSelectedKey=null;state.flowDirty=true;setFlowStatus('Defaults loaded — save to apply','dirty');renderFlowCanvas();showFlowInspector(null)
  }
  async function saveFlow(){
    if(!state.flowServiceKey)return;const db=await resolveDb();if(!db?.from)return;const key=state.flowServiceKey,service=state.services.find(s=>s.service_key===key),existing=state.configs.find(x=>x.service_key===key)||{};setFlowStatus('Saving…');
    const step=k=>state.flowSteps.find(x=>x.key===k);const flow={version:1,steps:state.flowSteps.map((x,i)=>({key:x.key,label:x.label,enabled:x.enabled!==false,sort_order:(i+1)*10,condition:x.condition||null}))};
    try{
      const serviceUpdate={requires_jurisdiction:!!step('jurisdiction')?.enabled,requires_authorization:!!step('authorization')?.enabled,updated_at:new Date().toISOString()};const su=await db.from('wizard_v2_services').update(serviceUpdate).eq('service_key',key).select('service_key,requires_jurisdiction,requires_authorization').single();if(su.error)throw su.error;
      const payload={service_key:key,application_label:step('application')?.label||'Application',addons_label:step('addons')?.label||'Add-ons',authorization_label:step('authorization')?.label||'Authorization',summary_label:step('summary')?.label||'Summary',checkout_label:step('payment')?.label||'Payment',show_addons:!!step('addons')?.enabled,show_summary:!!step('summary')?.enabled,checkout_enabled:!!step('payment')?.enabled,config:{...(existing.config||{}),flow},updated_at:new Date().toISOString()};
      const cu=await db.from('catalog_wizard_configs').upsert(payload,{onConflict:'service_key'}).select('service_key,welcome_title,welcome_message,application_label,addons_label,authorization_label,summary_label,checkout_label,show_addons,show_summary,require_contact_capture,allow_save_resume,allow_back_navigation,checkout_enabled,success_redirect_url,config').single();if(cu.error)throw cu.error;
      Object.assign(service,su.data);const ci=state.configs.findIndex(x=>x.service_key===key);if(ci>=0)state.configs[ci]=cu.data;else state.configs.push(cu.data);state.flowDirty=false;setFlowStatus('Flow saved','saved');renderServices();renderSettingsList();setTimeout(()=>{if(!state.flowDirty)setFlowStatus('')},1800)
    }catch(error){console.error('[wizard flow] save failed',error);setFlowStatus('Save failed','error');await window.filings4uDialog.alert('The flow could not be saved. No browser alert was used; this message is part of the filings4u management interface.',{title:'Flow save failed'})}
  }

  function renderPlans(){const body=$('#wizardPlansBody');if(!body)return;const term=($('#wizardPlanSearch')?.value||'').toLowerCase();const names=Object.fromEntries(state.services.map(s=>[s.service_key,s.service_title]));body.innerHTML=state.plans.filter(p=>`${p.plan_name} ${p.plan_key} ${names[p.service_key]||p.service_key}`.toLowerCase().includes(term)).map(p=>`<tr><td><strong>${esc(names[p.service_key]||p.service_key)}</strong><small>${esc(p.service_key)}</small></td><td><strong>${esc(p.plan_name)}</strong><small>${esc(p.plan_key)}</small></td><td>${money(p.service_fee)}</td><td><span class="wizard-pill ${p.is_active?'':'is-off'}">${p.is_active?'Active':'Inactive'}</span></td></tr>`).join('')||'<tr><td colspan="4">No plans found.</td></tr>'}
  function renderForms(){
    const body=$('#wizardFormsBody');if(!body)return;
    const term=($('#wizardFormSearch')?.value||'').toLowerCase(), filter=$('#wizardFormStatus')?.value||'';
    const versionById=Object.fromEntries(state.versions.map(v=>[v.id,v]));
    const rows=state.forms.filter(f=>{
      const versions=state.versions.filter(v=>v.definition_id===f.id), pub=versionById[f.published_version_id], hasDraft=versions.some(v=>v.status==='draft');
      const matches=(`${f.form_title} ${f.form_key} ${f.service_key}`.toLowerCase().includes(term));
      if(!matches)return false;
      if(filter==='published')return !!pub;
      if(filter==='draft')return hasDraft;
      if(filter==='inactive')return !f.is_active;
      return true;
    });
    body.innerHTML=rows.map(f=>{
      const versions=state.versions.filter(v=>v.definition_id===f.id), pub=versionById[f.published_version_id], draft=versions.filter(v=>v.status==='draft').sort((a,b)=>b.version_number-a.version_number)[0];
      return `<tr><td><strong>${esc(f.form_title)}</strong><small>${esc(f.form_key)}</small></td><td>${esc(f.service_key)}</td><td><strong>${versions.length}</strong><small>${draft?`Draft v${draft.version_number}`:'No draft'}</small></td><td>${pub?`v${pub.version_number}`:'Not published'}</td><td><span class="wizard-pill ${f.is_active?'':'is-off'}">${f.is_active?'Active':'Inactive'}</span></td><td><button class="wizard-mini-button" data-form-definition="${esc(f.id)}">Build form</button></td></tr>`
    }).join('')||'<tr><td colspan="6">No form definitions found.</td></tr>'
  }
  function renderBlocks(){const root=$('#wizardBlocksGrid');if(!root)return;root.innerHTML=state.blocks.map(b=>`<article class="wizard-block-card"><span>${esc(b.block_category)}${b.is_system?' · System':''}</span><h3>${esc(b.block_name)}</h3><p>${esc(b.description||b.block_key)}</p></article>`).join('')||'<div class="portal-empty-state"><p>No reusable blocks found.</p></div>'}
  function renderAddons(){const body=$('#wizardAddonsBody');if(!body)return;const counts={};state.serviceAddons.forEach(x=>counts[x.addon_key]=(counts[x.addon_key]||0)+1);body.innerHTML=state.addons.map(a=>`<tr><td><strong>${esc(a.addon_name)}</strong><small>${esc(a.addon_key)}</small></td><td>${money(a.price)}</td><td>${counts[a.addon_key]||0} services</td><td><span class="wizard-pill ${a.is_active?'':'is-off'}">${a.is_active?'Active':'Inactive'}</span></td></tr>`).join('')||'<tr><td colspan="4">No add-ons found.</td></tr>'}
  function renderSessions(){const body=$('#wizardSessionsBody');if(!body)return;const names=Object.fromEntries(state.services.map(s=>[s.service_key,s.service_title]));body.innerHTML=state.sessions.slice().reverse().map(s=>{const who=[s.first_name,s.last_name].filter(Boolean).join(' ')||s.company_name||s.email_address||'Guest';return `<tr><td><strong>${esc(who)}</strong><small>${esc(s.email_address||'')}</small></td><td>${esc(names[s.service_key]||s.service_key)}</td><td>${esc(s.plan_key)}</td><td>${esc(s.current_step_key)}</td><td><span class="wizard-pill ${s.status==='active'?'':'is-off'}">${esc(s.status)}</span></td><td>${esc(date(s.started_at))}</td></tr>`}).join('')||'<tr><td colspan="6">No sessions found.</td></tr>'}
  function renderSettingsList(){const root=$('#wizardSettingsServices');if(!root)return;root.innerHTML=state.services.map(s=>`<button type="button" data-wizard-config="${esc(s.service_key)}"><strong>${esc(s.service_title)}</strong><small>${esc(s.service_key)}</small></button>`).join(''); if(!$('#wizardConfigServiceKey')?.value&&state.services[0]) openConfig(state.services[0].service_key)}
  function openConfig(key){
    panel('settings');const service=state.services.find(s=>s.service_key===key), c=state.configs.find(x=>x.service_key===key)||{}; if(!service)return;
    $$('[data-wizard-config]').forEach(b=>b.classList.toggle('is-active',b.dataset.wizardConfig===key));
    const vals={wizardConfigServiceKey:key,wizardWelcomeTitle:c.welcome_title||`Welcome to ${service.service_title}`,wizardWelcomeMessage:c.welcome_message||'',wizardApplicationLabel:c.application_label||'Application',wizardAddonsLabel:c.addons_label||'Add-ons',wizardAuthorizationLabel:c.authorization_label||'Authorization',wizardSummaryLabel:c.summary_label||'Summary',wizardCheckoutLabel:c.checkout_label||'Payment',wizardSuccessRedirect:c.success_redirect_url||''};Object.entries(vals).forEach(([id,v])=>{const e=$('#'+id);if(e)e.value=v});
    const checks={wizardShowAddons:c.show_addons??true,wizardShowSummary:c.show_summary??true,wizardRequireContact:c.require_contact_capture??true,wizardAllowSave:c.allow_save_resume??true,wizardAllowBack:c.allow_back_navigation??true,wizardCheckoutEnabled:c.checkout_enabled??true};Object.entries(checks).forEach(([id,v])=>{const e=$('#'+id);if(e)e.checked=!!v});
  }
  async function saveConfig(e){
    e.preventDefault();const db=await resolveDb(), key=$('#wizardConfigServiceKey').value, status=$('#wizardConfigStatus');if(!key||!db?.from)return;
    const payload={service_key:key,welcome_title:$('#wizardWelcomeTitle').value.trim()||null,welcome_message:$('#wizardWelcomeMessage').value.trim()||null,application_label:$('#wizardApplicationLabel').value.trim()||'Application',addons_label:$('#wizardAddonsLabel').value.trim()||'Add-ons',authorization_label:$('#wizardAuthorizationLabel').value.trim()||'Authorization',summary_label:$('#wizardSummaryLabel').value.trim()||'Summary',checkout_label:$('#wizardCheckoutLabel').value.trim()||'Payment',show_addons:$('#wizardShowAddons').checked,show_summary:$('#wizardShowSummary').checked,require_contact_capture:$('#wizardRequireContact').checked,allow_save_resume:$('#wizardAllowSave').checked,allow_back_navigation:$('#wizardAllowBack').checked,checkout_enabled:$('#wizardCheckoutEnabled').checked,success_redirect_url:$('#wizardSuccessRedirect').value.trim()||null,updated_at:new Date().toISOString()};
    status.textContent='Saving…';const {data,error}=await db.from('catalog_wizard_configs').upsert(payload,{onConflict:'service_key'}).select().single();if(error){status.textContent='Could not save';console.error(error);return}const i=state.configs.findIndex(x=>x.service_key===key);if(i>=0)state.configs[i]=data;else state.configs.push(data);status.textContent='Saved';setTimeout(()=>status.textContent='',1800);
  }
  document.addEventListener('click',e=>{const p=e.target.closest('[data-wizard-panel]');if(p)panel(p.dataset.wizardPanel);const c=e.target.closest('[data-wizard-config]');if(c)openConfig(c.dataset.wizardConfig);const f=e.target.closest('[data-form-definition]');if(f&&typeof window.openWizardFormBuilder==='function')window.openWizardFormBuilder(f.dataset.formDefinition);const fs=e.target.closest('[data-flow-service]');if(fs)openFlow(fs.dataset.flowService);const fe=e.target.closest('[data-flow-edit]');if(fe)showFlowInspector(fe.dataset.flowEdit);});
  $('#wizardServiceSearch')?.addEventListener('input',renderServices);$('#wizardServiceCategory')?.addEventListener('change',renderServices);$('#wizardPlanSearch')?.addEventListener('input',renderPlans);$('#wizardFormSearch')?.addEventListener('input',renderForms);$('#wizardFormStatus')?.addEventListener('change',renderForms);$('#wizardConfigForm')?.addEventListener('submit',saveConfig);$('#wizardRefresh')?.addEventListener('click',load);$('#wizardFlowServiceSearch')?.addEventListener('input',renderFlowServiceList);$('#wizardFlowInspectorForm')?.addEventListener('submit',applyFlowInspector);$('#wizardFlowSave')?.addEventListener('click',saveFlow);$('#wizardFlowReset')?.addEventListener('click',resetFlow);
  try{panel(sessionStorage.getItem('filings4u-wizard-panel')||'overview')}catch(_){panel('overview')}
  load();
})();
