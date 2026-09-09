const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));const db=window.filings4uSupabase;let user,clients=[],projects=[],logoIntakes=[],webIntakes=[],activeTab='logo',current=null;
async function boot(){
  try{
    if(!db)throw new Error('Admin Supabase client missing.');
    const auth=await window.filings4uRequireAdmin();
    if(!auth)return;
    user=auth.user;
    $('gate').hidden=true;
    $('app').hidden=false;
    await load();
  }catch(err){
    console.error('Design admin boot failed',err);
    $('gate').hidden=false;
    $('gate').textContent=err?.message||'Unable to load Design Projects.';
    $('gate').style.color='#991b1b';
  }
}
async function load(){
  const [c,p,l,w]=await Promise.all([
    db.from('client_profiles').select('id,first_name,last_name,email_address,company_name').order('company_name'),
    db.from('design_projects').select('*,design_proofs(*),design_comments(*)').order('updated_at',{ascending:false}),
    db.from('logo_intakes').select('*').order('created_at',{ascending:false}).limit(30),
    db.from('web_intakes').select('*').order('created_at',{ascending:false}).limit(30)
  ]);
  const failed=[c,p,l,w].find(r=>r.error);
  if(failed)return toast(failed.error.message);
  clients=c.data||[];
  projects=p.data||[];
  logoIntakes=l.data||[];
  webIntakes=w.data||[];
  hydrateClients();
  filters();
  render();
  renderIntakes();
}
function cname(id,email){const c=clients.find(x=>x.id===id);return c?.company_name||[c?.first_name,c?.last_name].filter(Boolean).join(' ')||email||'Client'}
function hydrateClients(){$('client').innerHTML='<option value="">Select client</option>'+clients.map(c=>`<option value="${c.id}">${esc(cname(c.id,c.email_address))} — ${esc(c.email_address)}</option>`).join('')}
function filters(){const vals=[...new Set(projects.map(p=>p.status))];$('statusFilter').innerHTML='<option value="">All statuses</option>'+vals.map(v=>`<option value="${v}">${esc(v.replaceAll('_',' '))}</option>`).join('')}
function render(){const q=$('search').value.toLowerCase(),t=$('typeFilter').value,s=$('statusFilter').value;const rows=projects.filter(p=>(!q||[p.title,p.client_email,p.tracking_number,cname(p.client_profile_id)].join(' ').toLowerCase().includes(q))&&(!t||p.project_type===t)&&(!s||p.status===s));$('projects').innerHTML=rows.length?rows.map(p=>`<article class="project-card"><div class="project-top"><div><span class="project-type">${p.project_type} design</span><h3>${esc(p.title)}</h3><p>${esc(cname(p.client_profile_id,p.client_email))}</p></div><span class="badge">${esc(p.status.replaceAll('_',' '))}</span></div><div class="project-meta"><div><small>Proofs</small><strong>${p.design_proofs?.length||0}</strong></div><div><small>Comments</small><strong>${p.design_comments?.length||0}</strong></div><div><small>Tracking</small><strong>${esc(p.tracking_number||'—')}</strong></div><div><small>Review link</small><strong>${p.review_url?'Added':'Not added'}</strong></div></div><button class="open-project" data-id="${p.id}">Manage project →</button></article>`).join(''):'<div class="empty">No design projects found.</div>';document.querySelectorAll('.open-project').forEach(b=>b.onclick=()=>openProject(b.dataset.id));$('activeCount').textContent=projects.filter(p=>!['approved','completed','cancelled'].includes(p.status)).length;$('feedbackCount').textContent=projects.filter(p=>p.status==='awaiting_feedback').length;$('approvedCount').textContent=projects.filter(p=>['approved','completed'].includes(p.status)).length;$('intakeCount').textContent=allIntakes('logo').length+allIntakes('web').length}
function fmtIntakeValue(v){
  if(v===null||v===undefined||v==='')return '';
  if(Array.isArray(v))return v.join(', ');
  if(typeof v==='object')return JSON.stringify(v,null,2);
  return String(v);
}
const INTAKE_LABELS={
  tracking_number:'Tracking / reference',business_name:'Business / brand',client_name:'Client name',email_address:'Email',phone_number:'Phone',
  current_url:'Current website',has_current_site:'Current website status',website_type:'Website type',website_type_other:'Website type details',
  main_goal:'Primary website goal',target_audience:'Target audience',products_services:'Products / services to feature',
  estimated_page_count:'Estimated page count',required_features:'Required features',required_features_other:'Other functionality',
  architectural_notes:'Pages / site architecture',branding_status:'Branding status',logo_status:'Logo status',style_preference:'Design style',
  style_preference_other:'Style details',aesthetic_tone:'Aesthetic / visual tone',brand_color_notes:'Brand colors / color preferences',
  brand_assets_links:'Brand asset links',design_inspiration_links:'Websites / design inspiration',design_avoid_notes:'Styles / websites to avoid',
  asset_copy_status:'Website copy / content readiness',media_status:'Photos / media readiness',content_asset_links:'Content / asset links',
  competitors:'Competitors / similar businesses',additional_notes:'Additional notes',
  logo_asset_url:'Logo asset URL',
  logo_text:'Exact logo text',logo_tagline:'Tagline / slogan',industry:'Industry / business type',
  business_description:'Business description',brand_message:'Brand message',logo_style:'Logo style',brand_mood:'Brand mood',
  brand_colors:'Brand colors',symbol_preference:'Icon / symbol preference',typography_preference:'Typography preference',
  logo_description:'Logo direction / description',competitor_inspiration_links:'Competitors / inspiration',
  reference_asset_url:'Reference asset URL',logo_uses:'Primary logo uses',avoid_notes:'Things to avoid'
};
const INTAKE_SECTIONS={
  website:[
    ['Project & contact',['tracking_number','business_name','client_name','email_address','phone_number']],
    ['Business & website goals',['has_current_site','current_url','website_type','website_type_other','estimated_page_count','main_goal','target_audience','products_services']],
    ['Pages & functionality',['required_features','required_features_other','architectural_notes']],
    ['Brand & visual direction',['branding_status','logo_status','style_preference','style_preference_other','aesthetic_tone','brand_color_notes','brand_assets_links','design_inspiration_links','design_avoid_notes']],
    ['Content & launch',['asset_copy_status','media_status','content_asset_links','competitors','additional_notes','logo_asset_url']]
  ],
  logo:[
    ['Project & contact',['tracking_number','business_name','client_name','email_address','phone_number']],
    ['Brand foundation',['logo_text','logo_tagline','industry','target_audience','business_description','brand_message']],
    ['Logo direction',['logo_style','brand_mood','brand_colors','symbol_preference','typography_preference','logo_description','competitor_inspiration_links','reference_asset_url']],
    ['Usage & final notes',['logo_uses','avoid_notes','additional_notes']]
  ]
};
function intakeProjectMatch(kind,i){
  const projectType=kind==='web'?'website':'logo';
  const tracking=String(i?.tracking_number||'').trim().toLowerCase();
  const email=String(i?.email_address||'').trim().toLowerCase();
  return projects.find(p=>{
    if(p.project_type!==projectType)return false;
    const pt=String(p.tracking_number||'').trim().toLowerCase();
    const pe=String(p.client_email||'').trim().toLowerCase();
    return (tracking&&pt===tracking)||(email&&pe===email);
  })||null;
}
function mergedIntake(kind,i){
  const p=intakeProjectMatch(kind,i);
  const payload=p?.intake_payload&&typeof p.intake_payload==='object'&&!Array.isArray(p.intake_payload)?p.intake_payload:{};
  return {
    ...i,
    ...payload,
    id:i?.id||`project-${p?.id||crypto.randomUUID()}`,
    _project_id:p?.id||null,
    _payload_backed:Object.keys(payload).length>0,
    _project_title:p?.title||null,
    _intake_completed_at:p?.intake_completed_at||null,
    tracking_number:payload.tracking_number||i?.tracking_number||p?.tracking_number||'',
    email_address:payload.email_address||i?.email_address||p?.client_email||'',
    business_name:payload.business_name||i?.business_name||p?.title?.replace(/\s+—\s+(Website|Logo) Design$/i,'')||'',
    created_at:p?.intake_completed_at||i?.created_at||null
  };
}
function payloadOnlyIntakes(kind){
  const projectType=kind==='web'?'website':'logo';
  const legacy=kind==='web'?webIntakes:logoIntakes;
  return projects
    .filter(p=>p.project_type===projectType && p.intake_payload && typeof p.intake_payload==='object' && Object.keys(p.intake_payload).length)
    .filter(p=>!legacy.some(i=>{
      const tracking=String(i.tracking_number||'').trim().toLowerCase();
      const email=String(i.email_address||'').trim().toLowerCase();
      return (tracking&&tracking===String(p.tracking_number||'').trim().toLowerCase()) ||
             (email&&email===String(p.client_email||'').trim().toLowerCase());
    }))
    .map(p=>mergedIntake(kind,{
      id:`project-${p.id}`,
      tracking_number:p.tracking_number,
      email_address:p.client_email,
      business_name:p.title?.replace(/\s+—\s+(Website|Logo) Design$/i,''),
      created_at:p.intake_completed_at
    }));
}
function allIntakes(kind){
  const legacy=kind==='web'?webIntakes:logoIntakes;
  return [...legacy.map(i=>mergedIntake(kind,i)),...payloadOnlyIntakes(kind)]
    .sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
}
function fmtIntakeValue(v){
  if(v===null||v===undefined||v==='')return '';
  if(Array.isArray(v))return v.join(', ');
  if(typeof v==='boolean')return v?'Yes':'No';
  if(typeof v==='object')return Object.entries(v).map(([k,x])=>`${k.replaceAll('_',' ')}: ${fmtIntakeValue(x)}`).join('\n');
  return String(v);
}
function intakeSectionData(i,kind){
  const config=INTAKE_SECTIONS[kind==='web'?'website':'logo'];
  const used=new Set();
  const sections=config.map(([title,keys])=>{
    const rows=keys.map(k=>[k,fmtIntakeValue(i[k])]).filter(([,v])=>v);
    rows.forEach(([k])=>used.add(k));
    return {title,rows};
  }).filter(s=>s.rows.length);
  const skip=new Set(['id','created_at','updated_at','_project_id','_payload_backed','_project_title','_intake_completed_at']);
  const extra=Object.keys(i)
    .filter(k=>!used.has(k)&&!skip.has(k)&&fmtIntakeValue(i[k]))
    .map(k=>[k,fmtIntakeValue(i[k])]);
  if(extra.length)sections.push({title:'Additional submitted information',rows:extra});
  return sections;
}
function renderIntakes(){
  const kind=activeTab==='logo'?'logo':'web';
  const a=allIntakes(kind);
  $('intakes').className='intake-submission-list';
  $('intakes').innerHTML=a.length?a.map(i=>`<article class="intake-submission-row">
    <div class="intake-submission-type">${kind==='logo'?'LOGO DESIGN':'WEBSITE DESIGN'}</div>
    <div class="intake-submission-main">
      <h3>${esc(i.business_name||'Client design intake')}</h3>
      <p>${esc(i.client_name||'—')} · ${esc(i.email_address||'—')}</p>
      <small>${esc(i.tracking_number||'No tracking reference')} · Submitted ${i.created_at?new Date(i.created_at).toLocaleString():'—'}</small>
      ${i._payload_backed?'<span class="payload-badge">Full project intake</span>':'<span class="legacy-badge">Legacy intake</span>'}
    </div>
    <div class="intake-submission-summary">
      <span>${kind==='logo'?'Direction':'Primary goal'}</span>
      <strong>${esc(kind==='logo'?(i.logo_description||i.logo_style||'Completed'):(i.main_goal||i.website_type||'Completed'))}</strong>
    </div>
    <button class="open-intake" data-intake-id="${esc(i.id)}" data-intake-kind="${kind}">Open completed intake →</button>
  </article>`).join(''):'<div class="empty">No completed intake submissions yet.</div>';
  document.querySelectorAll('.open-intake').forEach(b=>b.onclick=()=>openIntakeRecord(b.dataset.intakeKind,b.dataset.intakeId));
}
function openIntakeRecord(kind,id){
  const i=allIntakes(kind).find(x=>String(x.id)===String(id));if(!i)return;
  const sections=intakeSectionData(i,kind);
  const answerCount=sections.reduce((n,s)=>n+s.rows.length,0);
  $('intakeDrawerTitle').textContent=`${i.business_name||i.client_name||'Client'} — ${kind==='logo'?'Logo Intake':'Website Intake'}`;
  $('intakeDrawerMeta').textContent=`${i.client_name||'Client'} · ${i.email_address||'—'} · ${i.tracking_number||'No tracking reference'}`;
  $('intakeDrawerBody').innerHTML=`<div class="completed-intake-view">
    <div class="completed-intake-head">
      <div><span>SUBMITTED</span><strong>${i.created_at?new Date(i.created_at).toLocaleString():'—'}</strong></div>
      <div><span>FORM TYPE</span><strong>${kind==='logo'?'Logo design discovery':'Website design discovery'}</strong></div>
      <div><span>ANSWERS</span><strong>${answerCount}</strong></div>
    </div>
    ${!i._payload_backed?`<div class="legacy-intake-notice"><strong>Historical intake record</strong><span>This submission predates the full project intake payload. Every field stored in the original record is shown below; answers that were never stored cannot be reconstructed.</span></div>`:''}
    ${sections.map((section,index)=>`<section class="completed-intake-section">
      <div class="box-head"><h3>${String(index+1).padStart(2,'0')} · ${esc(section.title)}</h3><span>${section.rows.length} answer${section.rows.length===1?'':'s'}</span></div>
      <div class="completed-intake-grid">${section.rows.map(([k,v])=>`<div class="completed-intake-field ${String(v).length>120?'wide':''}">
        <span>${esc(INTAKE_LABELS[k]||k.replaceAll('_',' '))}</span>
        <strong>${esc(v)}</strong>
      </div>`).join('')}</div>
    </section>`).join('')}
    <div class="completed-intake-actions">
      <button id="copyIntakeEmail" class="secondary-action">Copy client email</button>
      ${i.tracking_number?`<button id="copyIntakeTracking" class="secondary-action">Copy tracking #</button>`:''}
    </div>
  </div>`;
  show('intakeDrawer');
  $('copyIntakeEmail').onclick=()=>navigator.clipboard.writeText(i.email_address||'').then(()=>toast('Client email copied.'));
  if($('copyIntakeTracking'))$('copyIntakeTracking').onclick=()=>navigator.clipboard.writeText(i.tracking_number||'').then(()=>toast('Tracking number copied.'));
}
function show(id){
  const target=$(id);
  if(!target)return;
  $('shade').hidden=false;
  target.setAttribute('aria-hidden','false');
  document.body.classList.add('design-overlay-open');
  const closer=id==='projectDrawer'?'closeDrawer':id==='intakeDrawer'?'closeIntakeDrawer':'closeModal';
  $(closer)?.focus();
}
function close(){
  $('shade').hidden=true;
  $('projectDrawer').setAttribute('aria-hidden','true');
  $('projectModal').setAttribute('aria-hidden','true');
  $('intakeDrawer')?.setAttribute('aria-hidden','true');
  document.body.classList.remove('design-overlay-open');
}
function openProject(id){current=projects.find(p=>p.id===id);if(!current)return;$('drawerTitle').textContent=current.title;const proofs=(current.design_proofs||[]).sort((a,b)=>b.version_number-a.version_number),comments=(current.design_comments||[]).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));$('drawerBody').innerHTML=`<div class="project-detail"><section class="review-box"><div class="box-head"><h3>Website review link</h3><span class="badge">${current.project_type}</span></div><div class="box-body"><form id="reviewForm" class="review-form"><input id="reviewInput" type="url" value="${esc(current.review_url||'')}" placeholder="Paste staging or review URL"><button class="primary">Save link</button></form>${current.review_url?`<p><a href="${esc(current.review_url)}" target="_blank" rel="noopener">Open current review site →</a></p>`:''}</div></section><section class="proof-box"><div class="box-head"><h3>Logo / design proofs</h3><span>${proofs.length} uploaded</span></div><div class="box-body"><form id="proofForm" class="proof-form"><input id="proofTitle" required placeholder="Proof title / version"><input id="proofFile" required type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"><button class="primary">Upload proof</button></form><div class="proof-list">${proofs.length?proofs.map(x=>`<div class="proof-row"><div><strong>v${x.version_number} · ${esc(x.proof_title)}</strong><small>${esc(x.status.replaceAll('_',' '))}${x.client_decision_note?' · '+esc(x.client_decision_note):''}</small></div><button data-proof="${x.storage_path}">View</button></div>`).join(''):'<div class="empty">No proofs uploaded.</div>'}</div></div></section><section class="comments-box"><div class="box-head"><h3>Revision conversation</h3><span>${comments.length} comments</span></div><div class="box-body"><div>${comments.map(c=>`<div class="comment"><strong>${c.author_type==='admin'?'filings4u':'Client'}</strong><p>${esc(c.message)}</p></div>`).join('')||'<div class="empty">No comments yet.</div>'}</div><form id="commentForm" class="comment-form"><textarea id="commentText" required rows="2" placeholder="Reply to the client…"></textarea><button class="primary">Send</button></form></div></section></div>`;show('projectDrawer');$('reviewForm').onsubmit=saveReview;$('proofForm').onsubmit=uploadProof;$('commentForm').onsubmit=comment;document.querySelectorAll('[data-proof]').forEach(b=>b.onclick=()=>viewProof(b.dataset.proof))}
async function saveReview(e){
  e.preventDefault();
  const raw=$('reviewInput').value.trim();
  let url=raw||null;
  if(url){
    try{ new URL(url); }catch{ return toast('Enter a valid review URL.'); }
  }const {error}=await db.from('design_projects')
    .update({review_url:url,status:url?'awaiting_feedback':current.status,updated_at:new Date().toISOString()})
    .eq('id',current.id);
  if(error)return toast(error.message);
  toast('Review link saved.');
  const id=current.id;
  await load();
  openProject(id);
}
async function uploadProof(e){
  e.preventDefault();
  const f=$('proofFile').files[0];
  if(!f)return toast('Choose a proof file.');
  const allowed=['image/png','image/jpeg','image/webp','image/gif','application/pdf'];
  if(!allowed.includes(f.type))return toast('Proof must be PNG, JPG, WEBP, GIF or PDF.');
  if(f.size>50*1024*1024)return toast('Proof must be 50 MB or smaller.');const v=Math.max(0,...(current.design_proofs||[]).map(p=>p.version_number))+1;const ext=f.name.split('.').pop().toLowerCase();const path=`${current.client_profile_id}/${current.id}/v${v}-${crypto.randomUUID()}.${ext}`;const {error:u}=await db.storage.from('design_proofs').upload(path,f,{contentType:f.type,upsert:false});if(u)return toast(u.message);const {error}=await db.from('design_proofs').insert({project_id:current.id,version_number:v,proof_title:$('proofTitle').value.trim(),storage_path:path,mime_type:f.type,created_by:user.id});if(error)return toast(error.message);await db.from('design_projects').update({status:'awaiting_feedback',updated_at:new Date().toISOString()}).eq('id',current.id);toast('Proof uploaded for client review.');const id=current.id;await load();openProject(id)}
async function viewProof(path){const {data,error}=await db.storage.from('design_proofs').createSignedUrl(path,900);if(error)return toast(error.message);window.open(data.signedUrl,'_blank','noopener,noreferrer')}
async function comment(e){e.preventDefault();const m=$('commentText').value.trim();if(!m)return;const {error}=await db.from('design_comments').insert({project_id:current.id,author_user_id:user.id,author_type:'admin',message:m});if(error)return toast(error.message);toast('Comment sent.');const id=current.id;await load();openProject(id)}
$('projectForm').onsubmit=async e=>{e.preventDefault();const c=clients.find(x=>x.id===$('client').value);if(!c)return;const {error}=await db.from('design_projects').insert({client_profile_id:c.id,client_email:String(c.email_address||'').trim().toLowerCase(),project_type:$('projectType').value,title:$('projectTitle').value.trim(),tracking_number:$('tracking').value.trim()||null,review_url:$('reviewUrl').value.trim()||null,admin_notes:$('adminNotes').value.trim()||null,status:$('reviewUrl').value.trim()?'awaiting_feedback':'intake',created_by:user.id});if(error)return toast(error.message);close();$('projectForm').reset();toast('Design project created.');await load()}
function toast(m){$('toast').textContent=m;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2800)}
$('newProject').onclick=()=>show('projectModal');$('closeModal').onclick=close;$('cancelModal').onclick=close;$('closeDrawer').onclick=close;$('closeIntakeDrawer').onclick=close;$('shade').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!$('shade').hidden))close()});$('refresh').onclick=load;$('search').oninput=render;$('typeFilter').onchange=render;$('statusFilter').onchange=render;document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('is-active',x===b));renderIntakes()});boot().then(()=>{
  if(new URLSearchParams(location.search).get('new')==='1'){
    setTimeout(()=>show('projectModal'),0);
    history.replaceState({},'',location.pathname);
  }
});