const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db,user,profile,projects=[],current;

async function boot(){
  const a=await window.filings4uRequireClient();if(!a)return;
  ({db,user,profile}=a);
  const name=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile?.company_name||'filings4u client';
  const initial=(profile?.first_name||user.email||'C')[0].toUpperCase();
  ['clientName','clientMenuName'].forEach(id=>{if($(id))$(id).textContent=name});
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  ['clientAvatar','clientMenuAvatar'].forEach(id=>{if($(id))$(id).textContent=initial});
  await load();
}
async function load(){
  const {data,error}=await db.from('design_projects').select(
    'id,order_id,client_profile_id,client_email,project_type,title,status,tracking_number,review_url,preview_label,preview_published_at,intake_status,intake_payload,intake_completed_at,client_approved_at,final_url,finalized_at,created_at,updated_at,design_proofs(id,project_id,version_number,proof_title,storage_path,mime_type,status,client_decision_note,decided_at,created_at),design_comments(id,project_id,proof_id,author_user_id,author_type,message,created_at)'
  ).eq('client_profile_id',user.id).order('updated_at',{ascending:false});
  if(error)return toast(error.message);
  projects=data||[];
  render();
}
function statusLabel(p){
  if(p.intake_status==='required')return 'Intake required';
  const map={intake:'Discovery',in_production:'In production',awaiting_feedback:'Ready for review',changes_requested:'Revisions requested',approved:'Approved',completed:'Completed'};
  return map[p.status]||String(p.status||'In progress').replaceAll('_',' ');
}
function stage(p){
  if(p.intake_status==='required')return 1;
  if(p.status==='in_production'||p.status==='intake')return 2;
  if(['awaiting_feedback','changes_requested'].includes(p.status))return 3;
  if(p.status==='approved')return 4;
  if(p.status==='completed'||p.finalized_at)return 5;
  return 2;
}
function render(){
  const need=projects.filter(p=>p.intake_status==='required').length;
  const review=projects.filter(p=>p.status==='awaiting_feedback').length;
  const complete=projects.filter(p=>p.status==='completed'||p.finalized_at).length;
  if($('designSummary'))$('designSummary').innerHTML=`
    <article><span>Active projects</span><strong>${projects.filter(p=>!p.finalized_at&&p.status!=='completed').length}</strong><small>Logo + website work</small></article>
    <article class="${need?'attention':''}"><span>Action required</span><strong>${need}</strong><small>Intakes waiting for you</small></article>
    <article><span>Ready for review</span><strong>${review}</strong><small>Preview or proofs posted</small></article>
    <article><span>Completed</span><strong>${complete}</strong><small>Finalized creative work</small></article>`;
  $('projects').innerHTML=projects.length?projects.map(p=>{
    const st=stage(p),proofs=p.design_proofs?.length||0,comments=p.design_comments?.length||0;
    const action=p.intake_status==='required'
      ?`<button class="project-primary" data-intake-project="${esc(p.id)}">Complete ${p.project_type==='website'?'website':'logo'} intake →</button>`
      :`<button class="project-primary ${p.status==='awaiting_feedback'?'review-ready':''}" data-project="${esc(p.id)}">${p.status==='awaiting_feedback'?'Review project':'Open project workspace'} →</button>`;
    return `<article class="project project-v2 ${p.intake_status==='required'?'needs-intake':''}">
      <div class="project-card-top"><span class="project-type">${p.project_type==='website'?'WEBSITE DESIGN':'LOGO DESIGN'}</span><span class="project-status">${esc(statusLabel(p))}</span></div>
      <h2>${esc(p.title)}</h2>
      <p>${p.intake_status==='required'
        ?'Before our design team begins, complete the project discovery form so we have the information needed to build your project.'
        :p.project_type==='website'?'Follow the website build, review private previews, and send revision notes.':'Review concepts, approve proofs, and request revisions.'}</p>
      <div class="stage-track">${[1,2,3,4,5].map((n,i)=>`<div class="${n<=st?'done':''}"><i>${n<st?'✓':n}</i><span>${['Discovery','Production','Review','Approval','Final'][i]}</span></div>`).join('')}</div>
      <div class="project-meta"><span>${esc(p.tracking_number||'Project')}</span><span>${proofs} proof${proofs===1?'':'s'}</span><span>${comments} message${comments===1?'':'s'}</span></div>
      ${action}
    </article>`;
  }).join(''):'<div class="empty">Your logo and website design projects will appear here after an order is created.</div>';
  document.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>openProject(b.dataset.project));
  document.querySelectorAll('[data-intake-project]').forEach(b=>b.onclick=()=>openProjectIntake(b.dataset.intakeProject));
}
function show(id){$('shade').hidden=false;$(id).setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function close(){
  $('shade').hidden=true;
  $('workspace').setAttribute('aria-hidden','true');
  $('intakeModal').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function safeHttpUrl(value){try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function commentsHtml(comments){
  return comments.length?comments.map(c=>`<div class="comment ${c.author_type==='client'?'mine':''}"><strong>${c.author_type==='client'?'You':'filings4u design team'}</strong><p>${esc(c.message)}</p><small>${new Date(c.created_at).toLocaleString()}</small></div>`).join(''):'<div class="empty compact">No project messages yet.</div>';
}
async function openProject(id){
  current=projects.find(p=>p.id===id);if(!current)return;
  if(current.intake_status==='required')return openProjectIntake(id);
  $('workspaceTitle').textContent=current.title;
  const proofs=[...(current.design_proofs||[])].sort((a,b)=>b.version_number-a.version_number);
  const comments=[...(current.design_comments||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  const preview=safeHttpUrl(current.review_url),finalUrl=safeHttpUrl(current.final_url);
  let main='';
  if(current.project_type==='website'){
    main=preview?`<section class="website-review-stage">
      <div class="website-review-head">
        <div><span>PRIVATE WEBSITE PREVIEW</span><h3>${esc(current.preview_label||'Current website build')}</h3><p>This preview is available only through your design workspace. Review the site below and send page-specific changes to our team.</p></div>
        <span class="live-pill"><i></i> Ready for review</span>
      </div>
      <div class="browser-shell">
        <div class="browser-bar"><div><i></i><i></i><i></i></div><span>filings4u secure design preview</span><b>Private</b></div>
        <iframe src="${esc(preview)}" title="Private website preview" referrerpolicy="no-referrer" sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"></iframe>
      </div>
      <div class="website-decision">
        <div><strong>Ready to respond?</strong><span>Approve this version or describe the changes you would like us to make.</span></div>
        <button class="request-change" id="requestWebsiteChanges">Request changes</button>
        <button class="approve-site" id="approveWebsite">Approve website</button>
      </div>
    </section>`:`<section class="waiting-stage"><div class="waiting-icon">◫</div><h3>Your website is in production.</h3><p>There is no preview ready yet. When the filings4u design team publishes a review version, it will appear directly inside this workspace.</p></section>`;
  }else{
    main=`<section class="proofs"><div class="box-title">Logo concepts & proofs</div><div class="box-content"><div class="proof-grid">${proofs.length?proofs.map(p=>`<article class="proof"><strong>v${p.version_number} · ${esc(p.proof_title)}</strong><span>${esc(String(p.status||'').replaceAll('_',' '))}</span><div class="proof-actions"><button data-view="${esc(p.storage_path)}">View proof</button>${p.status==='pending'?`<button class="approve" data-decide="${p.id}" data-value="approved">Approve</button><button class="changes" data-decide="${p.id}" data-value="changes_requested">Request changes</button>`:''}</div></article>`).join(''):'<div class="empty">Your first logo concepts have not been posted yet.</div>'}</div></div></section>`;
  }
  $('workspaceBody').innerHTML=`<div class="workspace-content workspace-v2">
    <div class="workspace-progress"><span class="status-dot"></span><div><small>CURRENT STATUS</small><strong>${esc(statusLabel(current))}</strong></div>${current.intake_completed_at?`<div><small>INTAKE COMPLETED</small><strong>${new Date(current.intake_completed_at).toLocaleDateString()}</strong></div>`:''}</div>
    ${main}
    ${finalUrl&&current.finalized_at?`<section class="final-site-card"><span>PROJECT COMPLETE</span><h3>Your website is live.</h3><p>Your finalized production website is now available.</p><a href="${esc(finalUrl)}" target="_blank" rel="noopener noreferrer">Visit final website →</a></section>`:''}
    <section class="conversation conversation-v2"><div class="box-title">Project conversation</div><div class="box-content"><div id="commentThread">${commentsHtml(comments)}</div><form id="commentForm" class="comment-form"><textarea id="message" required rows="3" placeholder="Send a note or describe a revision…"></textarea><button>Send message</button></form></div></section>
  </div>`;
  show('workspace');
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewProof(b.dataset.view));
  document.querySelectorAll('[data-decide]').forEach(b=>b.onclick=()=>decide(b.dataset.decide,b.dataset.value));
  $('commentForm').onsubmit=comment;
  if($('approveWebsite'))$('approveWebsite').onclick=()=>websiteDecision('approved');
  if($('requestWebsiteChanges'))$('requestWebsiteChanges').onclick=()=>websiteDecision('changes_requested');
}
async function websiteDecision(decision){
  let note=null;
  if(decision==='changes_requested'){
    note=prompt('Describe the changes you would like us to make:')||'';
    if(!note.trim())return;
  }else if(!confirm('Approve this website preview? This tells our team the design is approved for finalization.'))return;
  const {error}=await db.rpc('review_website_design_project',{p_project_id:current.id,p_decision:decision,p_note:note});
  if(error)return toast(error.message);
  toast(decision==='approved'?'Website approved. Our team can now finalize it.':'Revision request sent.');
  close();await load();
}
async function viewProof(path){
  const {data,error}=await db.storage.from('design_proofs').createSignedUrl(path,900);
  if(error)return toast(error.message);
  window.open(data.signedUrl,'_blank','noopener,noreferrer');
}
async function decide(id,value){
  let note='';
  if(value==='changes_requested'){note=prompt('Describe the changes you want:')||'';if(!note.trim())return}
  if(value==='approved'&&!confirm('Approve this design proof?'))return;
  const {error}=await db.rpc('decide_design_proof',{p_proof_id:id,p_decision:value,p_note:note||null});
  if(error)return toast(error.message);
  toast(value==='approved'?'Proof approved.':'Revision request sent.');
  close();await load();
}
async function comment(e){
  e.preventDefault();
  const m=$('message').value.trim();if(!m)return;
  const {error}=await db.from('design_comments').insert({project_id:current.id,author_user_id:user.id,author_type:'client',message:m});
  if(error)return toast(error.message);
  toast('Message sent.');await load();openProject(current.id);
}
function commonFields(p){return `
  <div class="form-section-head full"><span>01</span><div><h3>Project & contact</h3><p>Confirm who we should contact about this design project.</p></div></div>
  <label>Tracking number<input name="tracking_number" value="${esc(p.tracking_number||'')}" readonly></label>
  <label>Business / brand name<input name="business_name" required value="${esc(profile?.company_name||'')}"></label>
  <label>Your name<input name="client_name" required value="${esc([profile?.first_name,profile?.last_name].filter(Boolean).join(' '))}"></label>
  <label>Email<input name="email_address" type="email" required value="${esc(profile?.email_address||user.email||'')}" readonly></label>
  <label>Phone<input name="phone_number" required value="${esc(profile?.phone_number||'')}"></label>`}
function websiteFields(p){return `${commonFields(p)}
  <div class="form-section-head full"><span>02</span><div><h3>Business & website goals</h3><p>Tell us what the website needs to accomplish.</p></div></div>
  <label>Do you have a current website?<select name="has_current_site" required><option value="no">No</option><option value="yes">Yes</option></select></label>
  <label>Current website URL<input name="current_url" type="url" placeholder="Optional"></label>
  <label>Website type<select name="website_type" required><option>Business website</option><option>E-commerce</option><option>Landing page</option><option>Portfolio</option><option>Booking / service site</option><option>Membership / portal</option><option>Nonprofit</option><option>Other</option></select></label>
  <label>Estimated pages<select name="estimated_page_count" required><option>1-3</option><option>4-6</option><option>7-10</option><option>11-20</option><option>20+</option></select></label>
  <label class="full">Primary goal<textarea name="main_goal" rows="4" required placeholder="What should visitors do or understand when they visit your website?"></textarea></label>
  <label class="full">Target audience<textarea name="target_audience" rows="3" required placeholder="Who are your ideal customers or visitors?"></textarea></label>
  <label class="full">Products / services to feature<textarea name="products_services" rows="4" required placeholder="List the main products, services, programs, or offers that need to be featured."></textarea></label>

  <div class="form-section-head full"><span>03</span><div><h3>Pages & functionality</h3><p>Select everything your website needs. You can add details below.</p></div></div>
  <fieldset class="feature-field full"><legend>Required features</legend><div class="check-grid">
    ${['Contact form','Quote / lead form','Appointment booking','Online payments','E-commerce / store','Blog / news','Photo gallery','Video','Customer login / portal','Email signup','Maps / locations','Social media links','FAQ','Testimonials','Careers / applications','File downloads'].map(x=>`<label><input type="checkbox" name="required_features" value="${x}"><span>${x}</span></label>`).join('')}
  </div></fieldset>
  <label class="full">Other functionality<textarea name="required_features_other" rows="3" placeholder="Anything not listed above?"></textarea></label>
  <label class="full">Pages you know you need<textarea name="architectural_notes" rows="4" placeholder="Example: Home, About, Services, Pricing, Contact, FAQ…"></textarea></label>

  <div class="form-section-head full"><span>04</span><div><h3>Brand & visual direction</h3><p>Help us understand how the site should look and feel.</p></div></div>
  <label>Branding status<select name="branding_status" required><option>Complete</option><option>Partial</option><option>Need branding</option></select></label>
  <label>Logo status<select name="logo_status" required><option>Ready</option><option>In progress</option><option>Need a logo</option></select></label>
  <label>Design style<select name="style_preference" required><option>Modern</option><option>Corporate</option><option>Minimal</option><option>Luxury</option><option>Bold</option><option>Friendly</option><option>Editorial</option><option>Other</option></select></label>
  <label>Aesthetic tone<input name="aesthetic_tone" required placeholder="Clean, premium, trustworthy, energetic…"></label>
  <label class="full">Brand colors / color preferences<textarea name="brand_color_notes" rows="3" placeholder="Include colors to use or avoid."></textarea></label>
  <label class="full">Brand asset links<input name="brand_assets_links" placeholder="Drive, Dropbox, Canva, existing brand kit, etc."></label>
  <label class="full">Websites you like<textarea name="design_inspiration_links" rows="4" placeholder="Paste links and tell us what you like about each one."></textarea></label>
  <label class="full">Websites / styles to avoid<textarea name="design_avoid_notes" rows="3" placeholder="Tell us what you do not want the site to look like."></textarea></label>

  <div class="form-section-head full"><span>05</span><div><h3>Content & launch</h3><p>Tell us what is ready and what you need help preparing.</p></div></div>
  <label>Website copy/content<select name="asset_copy_status" required><option>Ready</option><option>Partially ready</option><option>Need help writing content</option></select></label>
  <label>Photos / media<select name="media_status" required><option>Ready</option><option>Partially ready</option><option>Need stock images / help</option></select></label>
  <label class="full">Content / asset links<textarea name="content_asset_links" rows="3" placeholder="Drive folders, Dropbox, photos, documents, menus, brochures, etc."></textarea></label>
  <label class="full">Competitors / similar businesses<textarea name="competitors" rows="3" placeholder="Names or links to competitors we should understand."></textarea></label>
  <label class="full">Anything else we should know?<textarea name="additional_notes" rows="5" placeholder="Special requirements, compliance needs, deadlines, integrations, or other instructions."></textarea></label>
  <button class="submit full" type="submit">Submit website design intake →</button>`}
function logoFields(p){return `${commonFields(p)}
  <div class="form-section-head full"><span>02</span><div><h3>Brand foundation</h3><p>Tell us what the logo should communicate about your business.</p></div></div>
  <label>Exact logo text<input name="logo_text" required placeholder="Exact spelling and capitalization"></label>
  <label>Tagline / slogan<input name="logo_tagline" placeholder="Optional"></label>
  <label>Industry / business type<input name="industry" required></label>
  <label>Target audience<input name="target_audience" required></label>
  <label class="full">What does your business do?<textarea name="business_description" rows="4" required></textarea></label>
  <label class="full">What should the brand communicate?<textarea name="brand_message" rows="3" required placeholder="Trust, speed, luxury, innovation, strength, warmth…"></textarea></label>

  <div class="form-section-head full"><span>03</span><div><h3>Logo direction</h3><p>Choose a direction and give our designers room to create.</p></div></div>
  <label>Preferred logo style<select name="logo_style" required><option>Modern</option><option>Classic</option><option>Minimal</option><option>Bold</option><option>Luxury</option><option>Playful</option><option>Emblem / badge</option><option>Wordmark</option><option>Monogram</option><option>No preference</option></select></label>
  <label>Brand mood<input name="brand_mood" required placeholder="Professional, energetic, trustworthy…"></label>
  <label class="full">Preferred colors<textarea name="brand_colors" rows="3" required placeholder="List preferred colors, existing brand colors, and colors to avoid."></textarea></label>
  <label>Icon / symbol preference<input name="symbol_preference" placeholder="Initials, abstract mark, truck, building, no icon…"></label>
  <label>Typography preference<input name="typography_preference" placeholder="Bold, elegant, clean sans serif, script…"></label>
  <label class="full">Describe the logo you envision<textarea name="logo_description" rows="5" required></textarea></label>
  <label class="full">Competitors / inspiration<textarea name="competitor_inspiration_links" rows="4" placeholder="Links or brand names, plus what you like or dislike."></textarea></label>
  <label class="full">Reference asset URL<input name="reference_asset_url" type="url" placeholder="Optional Drive, Dropbox, Canva, or image link"></label>

  <div class="form-section-head full"><span>04</span><div><h3>Usage & final notes</h3><p>Tell us where the logo will be used most often.</p></div></div>
  <fieldset class="feature-field full"><legend>Primary uses</legend><div class="check-grid">
    ${['Website','Social media','Business cards','Letterhead','Vehicle / truck','Uniforms','Signage','Packaging','Print advertising','Digital advertising'].map(x=>`<label><input type="checkbox" name="logo_uses" value="${x}"><span>${x}</span></label>`).join('')}
  </div></fieldset>
  <label class="full">Anything to avoid?<textarea name="avoid_notes" rows="3" placeholder="Symbols, styles, colors, fonts, or concepts you do not want."></textarea></label>
  <label class="full">Additional notes<textarea name="additional_notes" rows="4"></textarea></label>
  <button class="submit full" type="submit">Submit logo design intake →</button>`}
function openProjectIntake(id){
  current=projects.find(p=>p.id===id);if(!current)return;
  $('intakeTitle').textContent=current.project_type==='website'?'Website design discovery':'Logo design discovery';
  $('intakeForm').innerHTML=current.project_type==='website'?websiteFields(current):logoFields(current);
  $('intakeForm').dataset.projectId=current.id;
  $('intakeForm').dataset.type=current.project_type;
  $('intakeForm').onsubmit=submitProjectIntake;
  show('intakeModal');
}
async function submitProjectIntake(e){
  e.preventDefault();
  const form=e.currentTarget,fd=new FormData(form),obj={};
  for(const [k,v] of fd.entries()){
    if(k==='required_features'||k==='logo_uses'){
      if(!obj[k])obj[k]=[];
      obj[k].push(v);
    }else obj[k]=v;
  }
  if(form.dataset.type==='website'&&(!obj.required_features||!obj.required_features.length)){
    return toast('Select at least one website feature.');
  }
  const btn=form.querySelector('.submit');btn.disabled=true;btn.textContent='Submitting intake…';
  const {error}=await db.rpc('submit_design_project_intake',{p_project_id:form.dataset.projectId,p_payload:obj});
  btn.disabled=false;btn.textContent=form.dataset.type==='website'?'Submit website design intake →':'Submit logo design intake →';
  if(error)return toast(error.message);
  toast('Your design intake has been submitted.');
  close();await load();
}
function toast(m){$('toast').textContent=m;$('toast').hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').hidden=true,3200)}
$('closeWorkspace').onclick=close;$('closeIntake').onclick=close;$('shade').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('shade').hidden)close()});
boot();