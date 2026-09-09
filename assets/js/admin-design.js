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
function render(){const q=$('search').value.toLowerCase(),t=$('typeFilter').value,s=$('statusFilter').value;const rows=projects.filter(p=>(!q||[p.title,p.client_email,p.tracking_number,cname(p.client_profile_id)].join(' ').toLowerCase().includes(q))&&(!t||p.project_type===t)&&(!s||p.status===s));$('projects').innerHTML=rows.length?rows.map(p=>`<article class="project-card"><div class="project-top"><div><span class="project-type">${p.project_type} design</span><h3>${esc(p.title)}</h3><p>${esc(cname(p.client_profile_id,p.client_email))}</p></div><span class="badge">${esc(p.status.replaceAll('_',' '))}</span></div><div class="project-meta"><div><small>Proofs</small><strong>${p.design_proofs?.length||0}</strong></div><div><small>Comments</small><strong>${p.design_comments?.length||0}</strong></div><div><small>Tracking</small><strong>${esc(p.tracking_number||'—')}</strong></div><div><small>Review link</small><strong>${p.review_url?'Added':'Not added'}</strong></div></div><button class="open-project" data-id="${p.id}">Manage project →</button></article>`).join(''):'<div class="empty">No design projects found.</div>';document.querySelectorAll('.open-project').forEach(b=>b.onclick=()=>openProject(b.dataset.id));$('activeCount').textContent=projects.filter(p=>!['approved','completed','cancelled'].includes(p.status)).length;$('feedbackCount').textContent=projects.filter(p=>p.status==='awaiting_feedback').length;$('approvedCount').textContent=projects.filter(p=>['approved','completed'].includes(p.status)).length;$('intakeCount').textContent=logoIntakes.length+webIntakes.length}
function fmtIntakeValue(v){
  if(v===null||v===undefined||v==='')return '';
  if(Array.isArray(v))return v.join(', ');
  if(typeof v==='object')return JSON.stringify(v,null,2);
  return String(v);
}
const INTAKE_LABELS={
  tracking_number:'Tracking / reference',business_name:'Business / brand',client_name:'Client name',email_address:'Email',phone_number:'Phone',
  current_url:'Current website',website_type:'Website type',website_type_other:'Website type details',main_goal:'Primary website goal',target_audience:'Target audience',
  branding_status:'Branding status',brand_assets_links:'Brand asset links',style_preference:'Style preference',style_preference_other:'Style details',aesthetic_tone:'Aesthetic / visual tone',
  design_inspiration_links:'Design inspiration',required_features:'Required features',required_features_other:'Other required features',estimated_page_count:'Estimated page count',
  asset_copy_status:'Copy / content readiness',logo_status:'Logo status',logo_asset_url:'Logo asset',architectural_notes:'Pages / architecture / additional notes',
  logo_text:'Exact logo text',logo_tagline:'Tagline / slogan',logo_style:'Logo style',brand_mood:'Brand mood',brand_colors:'Brand colors',logo_description:'Logo direction / description',
  competitor_inspiration_links:'Competitors / inspiration',reference_asset_url:'Reference asset'
};
function intakeRows(i,kind){
  const preferred=kind==='logo'
    ?['tracking_number','business_name','client_name','email_address','phone_number','logo_text','logo_tagline','logo_style','brand_mood','brand_colors','logo_description','competitor_inspiration_links','reference_asset_url']
    :['tracking_number','business_name','client_name','email_address','phone_number','current_url','website_type','website_type_other','main_goal','target_audience','estimated_page_count','required_features','required_features_other','branding_status','brand_assets_links','style_preference','style_preference_other','aesthetic_tone','design_inspiration_links','asset_copy_status','logo_status','logo_asset_url','architectural_notes'];
  const skip=new Set(['id','created_at','updated_at']);
  const keys=[...preferred,...Object.keys(i).filter(k=>!preferred.includes(k)&&!skip.has(k))];
  return keys.filter((k,idx)=>keys.indexOf(k)===idx).map(k=>[k,fmtIntakeValue(i[k])]).filter(([,v])=>v);
}
function renderIntakes(){
  const a=activeTab==='logo'?logoIntakes:webIntakes;
  $('intakes').className='intake-submission-list';
  $('intakes').innerHTML=a.length?a.map(i=>`<article class="intake-submission-row">
    <div class="intake-submission-type">${activeTab==='logo'?'LOGO DESIGN':'WEBSITE DESIGN'}</div>
    <div class="intake-submission-main"><h3>${esc(i.business_name||'Client design intake')}</h3><p>${esc(i.client_name||'—')} · ${esc(i.email_address||'—')}</p><small>${esc(i.tracking_number||'No tracking reference')} · Submitted ${i.created_at?new Date(i.created_at).toLocaleString():'—'}</small></div>
    <div class="intake-submission-summary"><span>${activeTab==='logo'?'Direction':'Primary goal'}</span><strong>${esc(activeTab==='logo'?(i.logo_description||i.logo_style||'Completed'):(i.main_goal||i.website_type||'Completed'))}</strong></div>
    <button class="open-intake" data-intake-id="${esc(i.id)}" data-intake-kind="${activeTab}">Open completed intake →</button>
  </article>`).join(''):'<div class="empty">No completed intake submissions yet.</div>';
  document.querySelectorAll('.open-intake').forEach(b=>b.onclick=()=>openIntakeRecord(b.dataset.intakeKind,b.dataset.intakeId));
}
function openIntakeRecord(kind,id){
  const source=kind==='logo'?logoIntakes:webIntakes;
  const i=source.find(x=>String(x.id)===String(id));if(!i)return;
  $('intakeDrawerTitle').textContent=`${i.business_name||i.client_name||'Client'} — ${kind==='logo'?'Logo Intake':'Website Intake'}`;
  $('intakeDrawerMeta').textContent=`${i.client_name||'Client'} · ${i.email_address||'—'} · ${i.tracking_number||'No tracking reference'}`;
  const rows=intakeRows(i,kind);
  $('intakeDrawerBody').innerHTML=`<div class="completed-intake-view">
    <div class="completed-intake-head"><div><span>SUBMITTED</span><strong>${i.created_at?new Date(i.created_at).toLocaleString():'—'}</strong></div><div><span>FORM TYPE</span><strong>${kind==='logo'?'Logo design discovery':'Website design discovery'}</strong></div><div><span>ANSWERS</span><strong>${rows.length}</strong></div></div>
    <section class="completed-intake-section"><div class="box-head"><h3>Customer discovery form</h3><span>Read-only submission</span></div><div class="completed-intake-grid">${rows.map(([k,v])=>`<div class="completed-intake-field"><span>${esc(INTAKE_LABELS[k]||k.replaceAll('_',' '))}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section>
    <div class="completed-intake-actions"><button id="copyIntakeEmail" class="secondary-action">Copy client email</button>${i.tracking_number?`<button id="copyIntakeTracking" class="secondary-action">Copy tracking #</button>`:''}</div>
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