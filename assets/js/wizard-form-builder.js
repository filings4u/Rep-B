(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||`field_${Date.now()}`;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const state={db:null,user:null,definitions:[],versions:[],blocks:[],services:[],definition:null,version:null,schema:null,selected:null,dirty:false,drag:null};

  async function resolveDb(){
    if(state.db)return state.db;
    if(typeof window.filings4uRequireAdmin==='function'){
      try{const auth=await window.filings4uRequireAdmin();state.db=auth?.db||auth?.supabase||null;state.user=auth?.user||auth?.session?.user||null;}catch(e){console.error('[form builder] admin guard failed',e)}
    }
    state.db=state.db||window.filings4uSupabase||window.supabaseClient||window.filings4uDb||null;
    return state.db;
  }
  async function fetchData(){
    const db=await resolveDb(); if(!db?.from)throw new Error('Supabase client unavailable');
    const [defs,vers,blocks,services]=await Promise.all([
      db.from('wizard_form_definitions').select('id,service_key,form_key,form_title,description,is_active,published_version_id').order('form_title'),
      db.from('wizard_form_versions').select('id,definition_id,version_number,status,schema,change_note,created_at,published_at').order('version_number'),
      db.from('wizard_form_blocks').select('id,block_key,block_name,block_category,description,is_system,is_active,schema').eq('is_active',true).order('block_name'),
      db.from('wizard_v2_services').select('service_key,service_title,category,form_key,is_active').order('sort_order')
    ]);
    for(const r of [defs,vers,blocks,services])if(r.error)throw r.error;
    state.definitions=defs.data||[];state.versions=vers.data||[];state.blocks=blocks.data||[];state.services=services.data||[];
  }
  function setDirty(v=true){state.dirty=v;const el=$('#wizardBuilderSaveState');if(el)el.textContent=v?'Unsaved changes':'';}
  function normalizeSchema(schema,def){
    const s=clone(schema||{});s.schema_version=s.schema_version||1;s.service_key=s.service_key||def.service_key;s.form_key=s.form_key||def.form_key;s.title=s.title||def.form_title;s.sections=Array.isArray(s.sections)?s.sections:[];
    s.sections=s.sections.map((sec,i)=>({id:sec.id||crypto.randomUUID(),key:sec.key||`section_${i+1}`,title:sec.title||sec.label||`Section ${i+1}`,description:sec.description||'',visible:sec.visible!==false,conditions:sec.conditions||null,fields:Array.isArray(sec.fields)?sec.fields:[]}));
    return s;
  }
  function getVersions(defId){return state.versions.filter(v=>v.definition_id===defId).sort((a,b)=>b.version_number-a.version_number)}
  async function openBuilder(defId){
    try{await fetchData();}catch(e){console.error(e);await window.filings4uDialog.alert('The form builder could not load from Supabase.',{title:'Form builder unavailable'});return}
    const def=state.definitions.find(x=>x.id===defId);if(!def)return;
    const versions=getVersions(def.id), draft=versions.find(v=>v.status==='draft'), published=versions.find(v=>v.id===def.published_version_id)||versions.find(v=>v.status==='published');
    state.definition=def;state.version=draft||published||versions[0]||null;state.schema=normalizeSchema(state.version?.schema,def);state.selected=null;state.dirty=false;
    const box=$('#wizardFormBuilder');box.hidden=false;document.body.classList.add('management-modal-open');
    $('#wizardBuilderTitle').textContent=def.form_title;
    const service=state.services.find(s=>s.service_key===def.service_key);$('#wizardBuilderService').textContent=service?.service_title||def.service_key;$('#wizardBuilderCanvasTitle').textContent=def.form_title;$('#wizardBuilderCanvasDescription').textContent=def.description||'';
    updateVersionMeta();renderBlocks();renderCanvas();showInspector(null);
  }
  window.openWizardFormBuilder=openBuilder;

  function updateVersionMeta(){
    const v=state.version;const published=state.definition?.published_version_id===v?.id||v?.status==='published';
    $('#wizardBuilderMeta').textContent=v?`Version ${v.version_number} · ${published?'Published':v.status}`:'New draft';
    $('#wizardBuilderPublish').disabled=!state.schema?.sections?.length;
  }
  async function closeBuilder(){if(state.dirty&&!(await window.filings4uDialog.confirm('Close the form builder and discard unsaved changes?',{title:'Discard unsaved changes',confirmText:'Discard changes'})))return;$('#wizardFormBuilder').hidden=true;document.body.classList.remove('management-modal-open');state.definition=state.version=state.schema=state.selected=null;}

  function renderBlocks(){
    const root=$('#wizardBuilderBlockLibrary');if(!root)return;const term=($('#wizardBuilderBlockSearch')?.value||'').toLowerCase();
    root.innerHTML=state.blocks.filter(b=>`${b.block_name} ${b.block_category} ${b.block_key}`.toLowerCase().includes(term)).map(b=>`<button type="button" draggable="true" data-add-block="${esc(b.id)}"><span>${esc(b.block_category)}</span><strong>${esc(b.block_name)}</strong><small>${esc(b.description||b.block_key)}</small></button>`).join('')||'<p class="wizard-builder-muted">No blocks match your search.</p>';
  }
  function renderCanvas(){
    const root=$('#wizardBuilderSections'),empty=$('#wizardBuilderEmpty');if(!root||!state.schema)return;
    empty.hidden=state.schema.sections.length>0;
    root.innerHTML=state.schema.sections.map((sec,si)=>`<section class="wizard-builder-section ${state.selected?.kind==='section'&&state.selected.sectionId===sec.id?'is-selected':''}" draggable="true" data-section-id="${esc(sec.id)}">
      <header><div class="wizard-builder-drag">⋮⋮</div><div><span>Section ${si+1}</span><h3>${esc(sec.title)}</h3>${sec.description?`<p>${esc(sec.description)}</p>`:''}</div><div class="wizard-builder-section-actions"><button type="button" data-add-field-to="${esc(sec.id)}">+ Question</button><button type="button" data-edit-section="${esc(sec.id)}">⚙</button></div></header>
      <div class="wizard-builder-field-grid" data-field-dropzone="${esc(sec.id)}">
        ${sec.fields.length?sec.fields.map((f,fi)=>fieldCard(f,sec,fi)).join(''):`<div class="wizard-builder-drop-hint">Drop questions or reusable blocks here</div>`}
      </div>
    </section>`).join('');
    bindDragEvents();
  }
  function fieldCard(f,sec,fi){
    const opts=Array.isArray(f.options)?f.options.length:0;const condition=f.show_if||f.condition;
    return `<article class="wizard-builder-field ${state.selected?.kind==='field'&&state.selected.fieldId===(f.id||f.key)?'is-selected':''}" draggable="true" data-field-id="${esc(f.id||f.key)}" data-section-id="${esc(sec.id)}">
      <div class="wizard-builder-drag">⋮⋮</div><div class="wizard-builder-field-main"><span>${esc(typeLabel(f.type))}${f.required?' · Required':''}${condition?' · Conditional':''}</span><strong>${esc(f.label||f.key||`Question ${fi+1}`)}</strong><small>${esc(f.key||f.id||'')}</small>${opts?`<em>${opts} options</em>`:''}</div><button type="button" data-edit-field="${esc(f.id||f.key)}" data-section-id="${esc(sec.id)}">⚙</button>
    </article>`;
  }
  function typeLabel(t){return ({text:'Short text',textarea:'Long text',email:'Email',phone:'Phone',number:'Number',select:'Dropdown',radio:'Radio',checkbox:'Checkbox',date:'Date',state:'State',address:'Address',file:'File upload',repeater:'Repeater'}[t]||t||'Field')}
  function sectionById(id){return state.schema?.sections.find(s=>s.id===id)}
  function fieldById(section,id){return section?.fields.find(f=>(f.id||f.key)===id)}
  function uniqueKey(base,section){let key=slug(base),n=2;const used=new Set(section.fields.map(f=>f.key||f.id));while(used.has(key))key=`${slug(base)}_${n++}`;return key}
  function addSection(){
    const n=state.schema.sections.length+1;const sec={id:crypto.randomUUID(),key:`section_${n}`,title:`Section ${n}`,description:'',visible:true,fields:[]};state.schema.sections.push(sec);setDirty();renderCanvas();selectSection(sec.id);
  }
  function makeField(type,section){
    const names={text:'Question',textarea:'Long answer',email:'Email address',phone:'Phone number',number:'Number',select:'Select an option',radio:'Choose an option',checkbox:'Confirmation',date:'Date',state:'State',address:'Address',file:'Supporting document'};
    const label=names[type]||'Question',key=uniqueKey(label,section);const f={id:crypto.randomUUID(),key,type,label,required:false,span:type==='textarea'||type==='address'||type==='file'?'full':'half'};
    if(['select','radio'].includes(type))f.options=[['option_1','Option 1'],['option_2','Option 2']];return f;
  }
  function addField(type,sectionId){const sec=sectionById(sectionId||state.selected?.sectionId||state.schema.sections[0]?.id);if(!sec){addSection();return addField(type,state.schema.sections[0].id)}const f=makeField(type,sec);sec.fields.push(f);setDirty();renderCanvas();selectField(sec.id,f.id)}
  function addBlock(blockId,sectionId){
    const sec=sectionById(sectionId||state.selected?.sectionId||state.schema.sections[0]?.id);if(!sec){addSection();return addBlock(blockId,state.schema.sections[0].id)}const b=state.blocks.find(x=>x.id===blockId);if(!b)return;const schema=clone(b.schema||{});let fields=[];
    if(schema.kind==='fields')fields=schema.fields||[];else if(schema.kind==='repeater'&&schema.field)fields=[schema.field];else if(Array.isArray(schema.fields))fields=schema.fields;
    fields.forEach((raw,i)=>{const f=clone(raw);f.id=crypto.randomUUID();f.key=uniqueKey(f.key||f.id||`${b.block_key}_${i+1}`,sec);if(f.type==='repeater'&&Array.isArray(f.fields))f.fields=f.fields.map(x=>({...x,id:x.id||x.key||crypto.randomUUID()}));f.source_block_key=b.block_key;sec.fields.push(f)});setDirty();renderCanvas();if(fields.length)selectField(sec.id,sec.fields.at(-1).id)
  }

  function showInspector(kind){$('#wizardInspectorEmpty').hidden=!!kind;$('#wizardSectionInspector').hidden=kind!=='section';$('#wizardFieldInspector').hidden=kind!=='field'}
  function selectSection(id){const sec=sectionById(id);if(!sec)return;state.selected={kind:'section',sectionId:id};showInspector('section');$('#wizardInspectorSectionTitle').value=sec.title||'';$('#wizardInspectorSectionDescription').value=sec.description||'';$('#wizardInspectorSectionKey').value=sec.key||'';$('#wizardInspectorSectionVisible').checked=sec.visible!==false;renderCanvas()}
  function selectField(sectionId,fieldId){const sec=sectionById(sectionId),f=fieldById(sec,fieldId);if(!f)return;state.selected={kind:'field',sectionId,fieldId};showInspector('field');$('#wizardInspectorFieldHeading').textContent=f.label||'Edit question';$('#wizardInspectorFieldLabel').value=f.label||'';$('#wizardInspectorFieldKey').value=f.key||'';$('#wizardInspectorFieldType').value=f.type||'text';$('#wizardInspectorFieldSpan').value=f.span||'full';$('#wizardInspectorFieldPlaceholder').value=f.placeholder||'';$('#wizardInspectorFieldHelp').value=f.help_text||f.help||'';$('#wizardInspectorFieldRequired').checked=!!f.required;
    $('#wizardInspectorFieldOptions').value=(f.options||[]).map(o=>Array.isArray(o)?`${o[0]} | ${o[1]}`:(typeof o==='object'?`${o.value??o.label} | ${o.label??o.value}`:String(o))).join('\n');
    $('#wizardInspectorFieldMin').value=f.validation?.min??'';$('#wizardInspectorFieldMax').value=f.validation?.max??'';const c=f.show_if||f.condition||{};$('#wizardInspectorConditionField').value=c.field||c.field_key||'';$('#wizardInspectorConditionOperator').value=c.operator||'equals';$('#wizardInspectorConditionValue').value=c.value??'';updateOptionsVisibility();renderCanvas()}
  function updateOptionsVisibility(){const type=$('#wizardInspectorFieldType')?.value;$('#wizardInspectorOptionsWrap').hidden=!['select','radio'].includes(type)}
  function applySection(e){e.preventDefault();const sec=sectionById(state.selected?.sectionId);if(!sec)return;sec.title=$('#wizardInspectorSectionTitle').value.trim()||'Untitled section';sec.description=$('#wizardInspectorSectionDescription').value.trim();sec.key=slug($('#wizardInspectorSectionKey').value||sec.title);sec.visible=$('#wizardInspectorSectionVisible').checked;setDirty();renderCanvas()}
  function parseOptions(text){return text.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{const [v,...rest]=line.split('|');const value=v.trim(),label=(rest.join('|').trim()||value);return [slug(value),label]})}
  function applyField(e){e.preventDefault();const sec=sectionById(state.selected?.sectionId),f=fieldById(sec,state.selected?.fieldId);if(!f)return;const oldId=f.id||f.key;f.label=$('#wizardInspectorFieldLabel').value.trim()||'Untitled question';f.key=slug($('#wizardInspectorFieldKey').value||f.label);f.type=$('#wizardInspectorFieldType').value;f.span=$('#wizardInspectorFieldSpan').value;f.placeholder=$('#wizardInspectorFieldPlaceholder').value.trim()||undefined;f.help_text=$('#wizardInspectorFieldHelp').value.trim()||undefined;f.required=$('#wizardInspectorFieldRequired').checked;
    if(['select','radio'].includes(f.type))f.options=parseOptions($('#wizardInspectorFieldOptions').value);else delete f.options;
    const min=$('#wizardInspectorFieldMin').value,max=$('#wizardInspectorFieldMax').value;if(min!==''||max!=='')f.validation={...(f.validation||{}),...(min!==''?{min:Number(min)}:{}),...(max!==''?{max:Number(max)}:{})};else if(f.validation){delete f.validation.min;delete f.validation.max;if(!Object.keys(f.validation).length)delete f.validation}
    const cf=$('#wizardInspectorConditionField').value.trim();if(cf)f.show_if={field:cf,operator:$('#wizardInspectorConditionOperator').value,value:$('#wizardInspectorConditionValue').value};else delete f.show_if;
    state.selected.fieldId=f.id||f.key||oldId;setDirty();renderCanvas();selectField(sec.id,state.selected.fieldId)}
  async function deleteSelected(){if(!state.selected)return;if(state.selected.kind==='section'){const sec=sectionById(state.selected.sectionId);if(!(await window.filings4uDialog.confirm(`Delete section "${sec?.title||''}" and all of its questions?`,{title:'Delete section',confirmText:'Delete section'})))return;state.schema.sections=state.schema.sections.filter(s=>s.id!==state.selected.sectionId)}else{const sec=sectionById(state.selected.sectionId),f=fieldById(sec,state.selected.fieldId);if(!(await window.filings4uDialog.confirm(`Delete question "${f?.label||''}"?`,{title:'Delete question',confirmText:'Delete question'})))return;sec.fields=sec.fields.filter(x=>(x.id||x.key)!==state.selected.fieldId)}state.selected=null;showInspector(null);setDirty();renderCanvas()}

  async function ensureDraft(){
    const db=await resolveDb(),def=state.definition;if(!db||!def)throw new Error('Builder unavailable');
    if(state.version?.status==='draft')return state.version;
    const max=Math.max(0,...getVersions(def.id).map(v=>Number(v.version_number||0)));const payload={definition_id:def.id,version_number:max+1,status:'draft',schema:state.schema,change_note:'Created from visual form builder'};
    const {data,error}=await db.from('wizard_form_versions').insert(payload).select('id,definition_id,version_number,status,schema,change_note,created_at,published_at').single();if(error)throw error;state.version=data;state.versions.push(data);return data;
  }
  async function saveDraft(){
    if(!state.definition||!state.schema)return;const status=$('#wizardBuilderSaveState');status.textContent='Saving…';
    try{const db=await resolveDb();await ensureDraft();state.schema.title=state.definition.form_title;state.schema.form_key=state.definition.form_key;state.schema.service_key=state.definition.service_key;const {data,error}=await db.from('wizard_form_versions').update({schema:state.schema,change_note:'Edited in visual form builder',updated_at:new Date().toISOString()}).eq('id',state.version.id).select('id,definition_id,version_number,status,schema,change_note,created_at,published_at').single();if(error)throw error;state.version=data;const i=state.versions.findIndex(v=>v.id===data.id);if(i>=0)state.versions[i]=data;state.dirty=false;status.textContent='Draft saved';updateVersionMeta();setTimeout(()=>{if(!state.dirty)status.textContent=''},1600);return true}catch(e){console.error(e);status.textContent='Save failed';return false}
  }
  async function publish(){
    if(!state.schema?.sections?.length){await window.filings4uDialog.alert('Add at least one section before publishing.',{title:'Form needs a section'});return}if(!(await window.filings4uDialog.confirm('Publish this form version for customer use?',{title:'Publish form',confirmText:'Publish version'})))return;
    const ok=await saveDraft();if(!ok)return;const db=await resolveDb(),status=$('#wizardBuilderSaveState');status.textContent='Publishing…';
    try{const now=new Date().toISOString();const userId=state.user?.id||null;const u=await db.from('wizard_form_versions').update({status:'published',published_at:now,published_by:userId,updated_at:now}).eq('id',state.version.id).select('id,definition_id,version_number,status,schema,change_note,created_at,published_at').single();if(u.error)throw u.error;const d=await db.from('wizard_form_definitions').update({published_version_id:state.version.id,updated_at:now}).eq('id',state.definition.id).select('id,service_key,form_key,form_title,description,is_active,published_version_id').single();if(d.error)throw d.error;state.version=u.data;state.definition=d.data;state.dirty=false;status.textContent=`Published v${state.version.version_number}`;updateVersionMeta();setTimeout(()=>status.textContent='',2000)}catch(e){console.error(e);status.textContent='Publish failed'}
  }

  function renderPreview(){
    const root=$('#wizardPreviewBody');$('#wizardPreviewTitle').textContent=state.definition?.form_title||'Application';root.innerHTML=state.schema.sections.filter(s=>s.visible!==false).map(sec=>`<section class="wizard-preview-section"><div><span class="management-kicker">${esc(sec.key)}</span><h3>${esc(sec.title)}</h3>${sec.description?`<p>${esc(sec.description)}</p>`:''}</div><div class="wizard-preview-grid">${sec.fields.map(previewField).join('')}</div></section>`).join('')||'<p>No visible sections yet.</p>';$('#wizardFormPreview').hidden=false
  }
  function previewField(f){const required=f.required?' <b>*</b>':'';let input='';if(f.type==='textarea')input='<textarea rows="3" disabled></textarea>';else if(['select','state'].includes(f.type))input=`<select disabled><option>${esc(f.placeholder||'Select…')}</option>${(f.options||[]).map(o=>`<option>${esc(Array.isArray(o)?o[1]:o.label||o)}</option>`).join('')}</select>`;else if(f.type==='radio')input=(f.options||[]).map(o=>`<label class="wizard-preview-choice"><input type="radio" disabled> ${esc(Array.isArray(o)?o[1]:o.label||o)}</label>`).join('');else if(f.type==='checkbox')input='<label class="wizard-preview-choice"><input type="checkbox" disabled> Yes</label>';else if(f.type==='file')input='<div class="wizard-preview-file">Choose file</div>';else if(f.type==='repeater')input=`<div class="wizard-preview-repeater">Repeatable ${esc(f.item_label||'item')} group · ${f.fields?.length||0} fields</div>`;else input=`<input type="${['email','number','date'].includes(f.type)?f.type:'text'}" placeholder="${esc(f.placeholder||'')}" disabled>`;return `<label class="wizard-preview-field ${f.span==='half'?'is-half':''}"><span>${esc(f.label||f.key)}${required}</span>${input}${f.help_text?`<small>${esc(f.help_text)}</small>`:''}</label>`}

  function bindDragEvents(){
    $$('.wizard-builder-section').forEach(el=>{el.addEventListener('dragstart',e=>{if(e.target.closest('.wizard-builder-field'))return;state.drag={kind:'section',id:el.dataset.sectionId};e.dataTransfer.effectAllowed='move'});el.addEventListener('dragover',e=>{if(state.drag?.kind==='section'){e.preventDefault();el.classList.add('is-dragover')}});el.addEventListener('dragleave',()=>el.classList.remove('is-dragover'));el.addEventListener('drop',e=>{if(state.drag?.kind!=='section')return;e.preventDefault();el.classList.remove('is-dragover');const from=state.schema.sections.findIndex(s=>s.id===state.drag.id),to=state.schema.sections.findIndex(s=>s.id===el.dataset.sectionId);if(from<0||to<0||from===to)return;const [m]=state.schema.sections.splice(from,1);state.schema.sections.splice(to,0,m);state.drag=null;setDirty();renderCanvas()})});
    $$('.wizard-builder-field').forEach(el=>{el.addEventListener('dragstart',e=>{e.stopPropagation();state.drag={kind:'field',sectionId:el.dataset.sectionId,id:el.dataset.fieldId};e.dataTransfer.effectAllowed='move'})});
    $$('[data-field-dropzone]').forEach(zone=>{zone.addEventListener('dragover',e=>{if(['field','palette','block'].includes(state.drag?.kind)){e.preventDefault();zone.classList.add('is-dragover')}});zone.addEventListener('dragleave',()=>zone.classList.remove('is-dragover'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('is-dragover');const targetSec=sectionById(zone.dataset.fieldDropzone);if(!targetSec||!state.drag)return;if(state.drag.kind==='palette')addField(state.drag.type,targetSec.id);else if(state.drag.kind==='block')addBlock(state.drag.id,targetSec.id);else if(state.drag.kind==='field'){const fromSec=sectionById(state.drag.sectionId),idx=fromSec.fields.findIndex(f=>(f.id||f.key)===state.drag.id);if(idx>=0){const [f]=fromSec.fields.splice(idx,1);targetSec.fields.push(f);setDirty();renderCanvas()}}state.drag=null})});
  }

  async function createForm(){
    try{await fetchData()}catch(e){console.error(e);await window.filings4uDialog.alert('Could not load wizard services.',{title:'Unable to create form'});return}
    const options=state.services.filter(s=>s.is_active&&!state.definitions.some(f=>f.service_key===s.service_key)).map(s=>({value:s.service_key,label:`${s.service_title} — ${s.service_key}`}));
    if(!options.length){await window.filings4uDialog.alert('Every active wizard service already has a form definition.',{title:'No services available'});return}
    const key=await window.filings4uDialog.prompt('Choose the wizard service that should use this new application form.',{title:'Create application form',label:'Wizard service',options,confirmText:'Create form'});if(!key)return;
    const service=state.services.find(s=>s.service_key===key);if(!service)return;
    const db=await resolveDb(),formKey=service.form_key||service.service_key,title=`${service.service_title} Application`;const {data,error}=await db.from('wizard_form_definitions').insert({service_key:service.service_key,form_key:formKey,form_title:title,is_active:true}).select('id,service_key,form_key,form_title,description,is_active,published_version_id').single();if(error){console.error(error);await window.filings4uDialog.alert('Could not create the form definition.',{title:'Creation failed'});return}const v=await db.from('wizard_form_versions').insert({definition_id:data.id,version_number:1,status:'draft',schema:{schema_version:1,service_key:data.service_key,form_key:data.form_key,title:data.form_title,sections:[]}}).select().single();if(v.error){console.error(v.error);await window.filings4uDialog.alert('The form definition was created, but its draft version could not be created.',{title:'Draft creation failed'});return}openBuilder(data.id)
  }

  document.addEventListener('click',e=>{
    const lib=e.target.closest('[data-builder-library]');if(lib){$$('[data-builder-library]').forEach(x=>x.classList.toggle('is-active',x===lib));$$('[data-builder-library-panel]').forEach(x=>x.classList.toggle('is-active',x.dataset.builderLibraryPanel===lib.dataset.builderLibrary));return}
    const af=e.target.closest('[data-add-field]');if(af){addField(af.dataset.addField);return}
    const ab=e.target.closest('[data-add-block]');if(ab){addBlock(ab.dataset.addBlock);return}
    const esf=e.target.closest('[data-edit-section]');if(esf){selectSection(esf.dataset.editSection);return}
    const eff=e.target.closest('[data-edit-field]');if(eff){selectField(eff.dataset.sectionId,eff.dataset.editField);return}
    const aq=e.target.closest('[data-add-field-to]');if(aq){addField('text',aq.dataset.addFieldTo);return}
    if(e.target.closest('[data-add-first-section]'))addSection();
    if(e.target.closest('[data-delete-builder-item]'))deleteSelected();
  });
  document.addEventListener('dragstart',e=>{const p=e.target.closest('[data-add-field]');if(p){state.drag={kind:'palette',type:p.dataset.addField};e.dataTransfer.effectAllowed='copy'}const b=e.target.closest('[data-add-block]');if(b){state.drag={kind:'block',id:b.dataset.addBlock};e.dataTransfer.effectAllowed='copy'}});
  $('#wizardBuilderClose')?.addEventListener('click',closeBuilder);$('#wizardAddSection')?.addEventListener('click',addSection);$('#wizardBuilderSave')?.addEventListener('click',saveDraft);$('#wizardBuilderPublish')?.addEventListener('click',publish);$('#wizardBuilderPreview')?.addEventListener('click',renderPreview);$('#wizardPreviewClose')?.addEventListener('click',()=>$('#wizardFormPreview').hidden=true);$('#wizardSectionInspector')?.addEventListener('submit',applySection);$('#wizardFieldInspector')?.addEventListener('submit',applyField);$('#wizardInspectorFieldType')?.addEventListener('change',updateOptionsVisibility);$('#wizardBuilderBlockSearch')?.addEventListener('input',renderBlocks);$('#wizardCreateFormButton')?.addEventListener('click',createForm);
})();
