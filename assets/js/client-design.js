const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let db,user,profile,projects=[],orders=[],current;
async function boot(){const a=await window.filings4uRequireClient();if(!a)return;({db,user,profile}=a);const name=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ')||'My Account',company=profile?.company_name||'filings4u client',initial=(profile?.first_name||user.email||'C')[0].toUpperCase();['clientName','clientMenuName'].forEach(id=>{if($(id))$(id).textContent=name});$('clientMenuCompany').textContent=company;['clientAvatar','clientMenuAvatar'].forEach(id=>$(id).textContent=initial);await load()}
async function load(){
  const [projectResult,orderResult]=await Promise.all([
    db.from('design_projects')
      .select('id,order_id,client_profile_id,client_email,project_type,title,status,tracking_number,review_url,intake_status,intake_payload,intake_completed_at,created_at,updated_at')
      .eq('client_profile_id',user.id)
      .order('updated_at',{ascending:false}),
    db.from('orders')
      .select('id,user_id,service_key,selected_service,tracking_number,order_status,payment_status,company_name,created_at')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false})
  ]);
  if(projectResult.error)throw projectResult.error;
  if(orderResult.error)console.warn('Design purchase lookup failed',orderResult.error);

  projects=projectResult.data||[];
  orders=orderResult.data||[];
  const ids=projects.map(p=>p.id);
  if(!ids.length){render();return;}

  const [proofResult,commentResult]=await Promise.all([
    db.from('design_proofs').select('id,project_id,version_number,proof_title,storage_path,mime_type,status,client_decision_note,decided_at,created_at').in('project_id',ids),
    db.from('design_comments').select('id,project_id,proof_id,author_user_id,author_type,message,created_at').in('project_id',ids)
  ]);

  if(proofResult.error)console.warn('Design proofs load failed',proofResult.error);
  if(commentResult.error)console.warn('Design comments load failed',commentResult.error);
  const proofs=proofResult.data||[],comments=commentResult.data||[];
  projects=projects.map(p=>({
    ...p,
    design_proofs:proofs.filter(x=>x.project_id===p.id),
    design_comments:comments.filter(x=>x.project_id===p.id)
  }));
  render();
}
function render(){
  $('projects').innerHTML=projects.length?projects.map(p=>{
    const needsIntake=String(p.intake_status||'').toLowerCase()==='required';
    const proofCount=p.design_proofs?.length||0;
    const hasReview=proofCount>0 || !!safeHttpUrl(p.review_url);
    const pendingProof=(p.design_proofs||[]).some(x=>String(x.status||'').toLowerCase()==='pending');
    return `<article class="project ${hasReview?'review-ready':''}">
      <small>${esc(p.project_type)} design</small>
      <h2>${esc(p.title)}</h2>
      <p>${hasReview?(p.project_type==='website'?'A website review is ready. View the current proof, leave comments, approve it, or request changes.':'A design proof is ready for your review.'):(needsIntake?'Complete the project discovery form so our design team can begin.':(p.project_type==='website'?'Your website project is in progress.':'Your design project is in progress.'))}</p>
      <div class="project-meta">
        <span>${esc(hasReview?(pendingProof?'review required':'proof posted'):(needsIntake?'intake required':String(p.status||'').replaceAll('_',' ')))}</span>
        <span>${proofCount} proof${proofCount===1?'':'s'}</span>
        <span>${p.design_comments?.length||0} comment${p.design_comments?.length===1?'':'s'}</span>
      </div>
      <div class="project-actions">
        ${hasReview?`<button class="review-project" data-project="${esc(p.id)}">Review ${p.project_type==='website'?'website':'proof'} →</button>`:''}
        ${needsIntake?`<button class="${hasReview?'secondary-project-action':''}" data-project-intake="${esc(p.id)}">Complete ${p.project_type==='website'?'website':'logo'} intake →</button>`:''}
        ${!hasReview&&!needsIntake?`<button data-project="${esc(p.id)}">Open design workspace →</button>`:''}
      </div>
    </article>`;
  }).join(''):'<div class="empty">Your active logo and website design projects will appear here.</div>';
  document.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>openProject(b.dataset.project));
  document.querySelectorAll('[data-project-intake]').forEach(b=>b.onclick=()=>openProjectIntake(b.dataset.projectIntake));
}
function show(id){$('shade').hidden=false;$(id).setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}function close(){$('shade').hidden=true;$('workspace').setAttribute('aria-hidden','true');$('intakeModal').setAttribute('aria-hidden','true');document.body.style.overflow=''}

function safeHttpUrl(value){try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function ownsDesignService(type){
  const projectType=type==='web'?'website':type;
  if(projects.some(p=>p.project_type===projectType))return true;
  const keys=type==='logo'?['logo-design-packages','logo-design']:['web-design-packages','website-design-packages','web-design','website-design'];
  return orders.some(o=>{
    const key=String(o.service_key||o.selected_service||'').toLowerCase();
    const paid=String(o.payment_status||'').toLowerCase()==='paid';
    return paid&&keys.some(k=>key.includes(k));
  });
}
function showPurchaseOffer(type){
  const logo=type==='logo';
  $('purchaseTitle').textContent=logo?'Would you like to add logo design?':'Would you like to add website design?';
  $('purchaseMessage').textContent=logo
    ?'Logo design is not included in your current purchases. You can review our logo design packages and add one to your account.'
    :'Website design is not included in your current purchases. You can review our website design packages and add one to your account.';
  $('purchaseContinue').textContent=logo?'View logo packages':'View website packages';
  $('purchaseContinue').dataset.url=logo?'https://filings4u.com/logo-design-packages':'https://filings4u.com/web-design-packages';
  $('shade').hidden=false;
  $('purchaseModal').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closePurchaseOffer(){
  $('purchaseModal').setAttribute('aria-hidden','true');
  if($('workspace').getAttribute('aria-hidden')==='true'&&$('intakeModal').getAttribute('aria-hidden')==='true')$('shade').hidden=true;
  document.body.style.overflow='';
}
function setPreviewMode(mode){
  const shell=document.querySelector('.portal-browser');
  if(!shell)return;
  shell.dataset.viewport=mode;
  document.querySelectorAll('[data-preview-mode]').forEach(b=>b.classList.toggle('active',b.dataset.previewMode===mode));
}

async function openProject(id){
  current=projects.find(p=>p.id===id);if(!current)return;
  const proofs=[...(current.design_proofs||[])].sort((a,b)=>b.version_number-a.version_number);
  const comments=[...(current.design_comments||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  const reviewUrl=safeHttpUrl(current.review_url);
  const hasReview=proofs.length>0||!!reviewUrl;

  if(String(current.intake_status||'').toLowerCase()==='required'&&!hasReview){
    return openProjectIntake(id);
  }

  $('workspaceTitle').textContent=current.title;

  const previewPanel=reviewUrl?`
    <section class="secure-preview-panel">
      <div class="secure-preview-head">
        <div>
          <small>PRIVATE WEBSITE REVIEW</small>
          <h3>${esc(current.preview_label||'Current website build')}</h3>
          <p>Review the current build inside your filings4u account. The preview address is not presented as your final website URL.</p>
        </div>
        <span class="secure-badge">Private preview</span>
      </div>

      <div class="preview-toolbar">
        <div class="preview-device-switch" role="group" aria-label="Website preview size">
          <button type="button" class="preview-mode active" data-preview-mode="desktop">Desktop</button>
          <button type="button" class="preview-mode" data-preview-mode="mobile">Mobile</button>
        </div>
        <span>Preview only · your final URL stays private until launch</span>
      </div>
      <div class="portal-browser" data-viewport="desktop">
        <div class="portal-browser-bar">
          <div class="browser-dots"><i></i><i></i><i></i></div>
          <div class="portal-address">filings4u secure website review</div>
          <span>Portal only</span>
        </div>
        <iframe
          src="${esc(reviewUrl)}"
          title="Private website review"
          referrerpolicy="no-referrer"
          sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        ></iframe>
      </div>
    </section>`:'';

  const proofsPanel=`
    <section class="proofs">
      <div class="box-title">${current.project_type==='website'?'Website proofs':'Design proofs'}</div>
      <div class="box-content">
        <div class="proof-grid">
          ${proofs.length?proofs.map(p=>`
            <article class="proof">
              <div class="proof-copy">
                <strong>v${p.version_number} · ${esc(p.proof_title)}</strong>
                <span>${esc(String(p.status||'').replaceAll('_',' '))}</span>
              </div>
              <div class="proof-actions">
                ${!reviewUrl?`<button class="btn btn-secondary" data-view="${esc(p.storage_path)}">View proof</button>`:''}
                ${String(p.status||'').toLowerCase()==='pending'?`
                  <button class="btn btn-success" data-approve-proof="${p.id}">Approve</button>
                  <button class="btn btn-danger-soft" data-request-proof="${p.id}">Request changes</button>`:''}
              </div>
            </article>`).join(''):'<div class="empty">No proofs have been posted yet.</div>'}
        </div>
      </div>
    </section>`;

  const reviewActions=hasReview?`
    <section class="review-response-panel">
      <div class="review-response-copy">
        <small>YOUR REVIEW</small>
        <h3>Ready to respond?</h3>
        <p>Approve the current version or send the exact changes you want our design team to make.</p>
      </div>
      <div class="review-response-actions">
        <button id="openRevisionComposer" class="btn btn-danger-soft">Request changes</button>
        <button id="openApprovalPanel" class="btn btn-success">Approve current version</button>
      </div>

      <div id="revisionComposer" class="inline-action-panel" hidden>
        <div class="inline-action-head">
          <div><small>REVISION REQUEST</small><strong>Describe the changes you want</strong></div>
          <button type="button" class="icon-close" data-close-inline="revisionComposer" aria-label="Close revision form">×</button>
        </div>
        <textarea id="revisionText" rows="5" placeholder="Example: On the home page, move the quote button higher, change the hero image, and make the services section more compact."></textarea>
        <div class="inline-action-buttons">
          <button type="button" class="btn btn-secondary" data-close-inline="revisionComposer">Cancel</button>
          <button type="button" id="submitRevision" class="btn btn-primary">Send revision request</button>
        </div>
      </div>

      <div id="approvalPanel" class="inline-action-panel approval-panel" hidden>
        <div class="inline-action-head">
          <div><small>APPROVAL</small><strong>Approve this version?</strong></div>
          <button type="button" class="icon-close" data-close-inline="approvalPanel" aria-label="Close approval">×</button>
        </div>
        <p>Approval tells the filings4u design team that the current version is approved for finalization.</p>
        <div class="inline-action-buttons">
          <button type="button" class="btn btn-secondary" data-close-inline="approvalPanel">Not yet</button>
          <button type="button" id="confirmApproval" class="btn btn-success">Approve version</button>
        </div>
      </div>
    </section>`:'';

  const intakeIsComplete=String(current.intake_status||'').toLowerCase()==='completed'||!!current.intake_completed_at||Object.keys(current.intake_payload||{}).length>0;
  const intakeReminder=!intakeIsComplete&&String(current.intake_status||'').toLowerCase()==='required'?`
    <section class="intake-reminder">
      <div>
        <strong>${current.project_type==='website'?'Website':'Logo'} intake is still incomplete.</strong>
        <p>You can review the posted work now and complete the discovery form separately.</p>
      </div>
      <button class="btn btn-secondary" data-project-intake="${esc(current.id)}">Complete intake</button>
    </section>`:'';

  $('workspaceBody').innerHTML=`
    <div class="workspace-content secure-review-workspace">
      ${hasReview?`<section class="review-task-banner"><div><small>DESIGN REVIEW READY</small><h3>Your design team posted a new review.</h3><p>Review the work below, then approve it or request changes without leaving your portal.</p></div></section>`:''}
      ${previewPanel}
      ${proofsPanel}
      ${reviewActions}
      ${intakeReminder}
      <section class="conversation">
        <div class="box-title">Comments & revision requests</div>
        <div class="box-content">
          <div id="commentThread">
            ${comments.map(c=>`<div class="comment ${c.author_type==='client'?'mine':''}">
              <strong>${c.author_type==='client'?'You':'filings4u design team'}</strong>
              <p>${esc(c.message)}</p>
            </div>`).join('')||'<div class="empty">No comments yet.</div>'}
          </div>
          <form id="commentForm" class="comment-form">
            <textarea id="message" required rows="3" placeholder="Send a project comment or question…"></textarea>
            <button class="btn btn-primary" type="submit">Send comment</button>
          </form>
        </div>
      </section>
    </div>`;

  show('workspace');

  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewProofInline(b.dataset.view));
  document.querySelectorAll('[data-preview-mode]').forEach(b=>b.onclick=()=>setPreviewMode(b.dataset.previewMode));
  document.querySelectorAll('[data-project-intake]').forEach(b=>b.onclick=()=>openProjectIntake(b.dataset.projectIntake));
  document.querySelectorAll('[data-close-inline]').forEach(b=>b.onclick=()=>$(b.dataset.closeInline).hidden=true);

  if($('openRevisionComposer')){
    $('openRevisionComposer').onclick=()=>{
      $('revisionComposer').hidden=false;
      $('approvalPanel').hidden=true;
      setTimeout(()=>$('revisionText')?.focus(),0);
    };
  }
  if($('openApprovalPanel')){
    $('openApprovalPanel').onclick=()=>{
      $('approvalPanel').hidden=false;
      $('revisionComposer').hidden=true;
    };
  }
  if($('submitRevision')){
    $('submitRevision').onclick=()=>submitWebsiteRevision();
  }
  if($('confirmApproval')){
    $('confirmApproval').onclick=()=>approveCurrentReview();
  }

  document.querySelectorAll('[data-request-proof]').forEach(b=>b.onclick=()=>{
    $('revisionComposer').hidden=false;
    $('approvalPanel').hidden=true;
    $('revisionComposer').dataset.proofId=b.dataset.requestProof;
    setTimeout(()=>$('revisionText')?.focus(),0);
  });
  document.querySelectorAll('[data-approve-proof]').forEach(b=>b.onclick=()=>{
    $('approvalPanel').hidden=false;
    $('revisionComposer').hidden=true;
    $('approvalPanel').dataset.proofId=b.dataset.approveProof;
  });

  $('commentForm').onsubmit=comment;
}

async function viewProofInline(path){
  const {data,error}=await db.storage.from('design_proofs').createSignedUrl(path,900);
  if(error)return toast(error.message);

  const url=safeHttpUrl(data?.signedUrl);
  if(!url)return toast('Unable to open this proof.');

  const existing=$('proofViewer');
  if(existing)existing.remove();

  const panel=document.createElement('section');
  panel.id='proofViewer';
  panel.className='inline-proof-viewer';
  panel.innerHTML=`
    <div class="inline-proof-head">
      <div><small>SECURE PROOF VIEWER</small><strong>Design proof</strong></div>
      <button type="button" class="icon-close" id="closeProofViewer" aria-label="Close proof viewer">×</button>
    </div>
    <iframe src="${esc(url)}" title="Design proof" referrerpolicy="no-referrer"></iframe>`;
  $('workspaceBody').prepend(panel);
  $('closeProofViewer').onclick=()=>panel.remove();
}

async function submitWebsiteRevision(){
  const text=$('revisionText')?.value.trim()||'';
  if(!text)return toast('Describe the changes you want.');

  const proofId=$('revisionComposer')?.dataset.proofId||null;
  $('submitRevision').disabled=true;
  $('submitRevision').textContent='Sending…';

  try{
    if(proofId){
      const {error}=await db.rpc('decide_design_proof',{
        p_proof_id:proofId,
        p_decision:'changes_requested',
        p_note:text
      });
      if(error)throw error;
    }else{
      const {error}=await db.from('design_comments').insert({
        project_id:current.id,
        author_user_id:user.id,
        author_type:'client',
        message:`Revision requested: ${text}`
      });
      if(error)throw error;

      if(current.project_type==='website'&&safeHttpUrl(current.review_url)){
        const {error:reviewError}=await db.rpc('review_website_design_project',{
          p_project_id:current.id,
          p_decision:'changes_requested',
          p_note:text
        });
        if(reviewError)console.warn('Website review status update:',reviewError.message);
      }
    }

    toast('Revision request sent.');
    await load();
    await openProject(current.id);
  }catch(error){
    toast(error.message||'Unable to send revision request.');
  }finally{
    if($('submitRevision')){
      $('submitRevision').disabled=false;
      $('submitRevision').textContent='Send revision request';
    }
  }
}

async function approveCurrentReview(){
  const proofId=$('approvalPanel')?.dataset.proofId||null;
  $('confirmApproval').disabled=true;
  $('confirmApproval').textContent='Approving…';

  try{
    if(proofId){
      const {error}=await db.rpc('decide_design_proof',{
        p_proof_id:proofId,
        p_decision:'approved',
        p_note:null
      });
      if(error)throw error;
    }else if(current.project_type==='website'&&safeHttpUrl(current.review_url)){
      const {error}=await db.rpc('review_website_design_project',{
        p_project_id:current.id,
        p_decision:'approved',
        p_note:null
      });
      if(error)throw error;
    }else{
      const pending=(current.design_proofs||[]).find(p=>String(p.status||'').toLowerCase()==='pending');
      if(!pending)throw new Error('There is no pending review to approve.');
      const {error}=await db.rpc('decide_design_proof',{
        p_proof_id:pending.id,
        p_decision:'approved',
        p_note:null
      });
      if(error)throw error;
    }

    toast('Current version approved.');
    await load();
    await openProject(current.id);
  }catch(error){
    toast(error.message||'Unable to approve this version.');
  }finally{
    if($('confirmApproval')){
      $('confirmApproval').disabled=false;
      $('confirmApproval').textContent='Approve version';
    }
  }
}

async function comment(e){
  e.preventDefault();
  const m=$('message').value.trim();if(!m)return;
  const button=e.currentTarget.querySelector('button[type="submit"]');
  button.disabled=true;button.textContent='Sending…';

  const {error}=await db.from('design_comments').insert({
    project_id:current.id,
    author_user_id:user.id,
    author_type:'client',
    message:m
  });

  button.disabled=false;button.textContent='Send comment';
  if(error)return toast(error.message);

  toast('Comment sent.');
  await load();
  await openProject(current.id);
}

const logoFields=`<div class="intake-section-title full"><span>01</span><div><strong>Brand basics</strong><small>Tell us what the logo needs to represent.</small></div></div>
<label>Tracking number<input name="tracking_number" required></label><label>Business name<input name="business_name" required></label><label>Client name<input name="client_name" required></label><label>Email<input name="email_address" type="email" required></label><label>Phone<input name="phone_number" required></label><label>Industry / business type<input name="industry" placeholder="Freight brokerage, consulting, retail…"></label>
<label>Exact logo text<input name="logo_text" required></label><label>Tagline / slogan<input name="logo_tagline"></label>
<label class="full">What does your business do?<textarea name="business_description" rows="3"></textarea></label>
<label class="full">Who is your target audience?<textarea name="target_audience" rows="3"></textarea></label>
<div class="intake-section-title full"><span>02</span><div><strong>Creative direction</strong><small>Give our designers a clear visual direction.</small></div></div>
<label>Logo style<select name="logo_style" required><option>Modern</option><option>Classic</option><option>Minimal</option><option>Bold</option><option>Luxury</option><option>Playful</option><option>Emblem / badge</option><option>Wordmark</option></select></label>
<label>Brand mood<input name="brand_mood" required placeholder="Professional, energetic, trustworthy…"></label>
<label>Brand colors<input name="brand_colors" required></label><label>Typography preference<input name="typography_preference" placeholder="Bold, elegant, clean sans-serif…"></label>
<label class="full">Describe the logo you envision<textarea name="logo_description" rows="4" required></textarea></label>
<label class="full">Competitors / inspiration<textarea name="competitor_inspiration_links" rows="3" placeholder="Names or links"></textarea></label>
<label class="full">Things to avoid<textarea name="avoid_notes" rows="3" placeholder="Colors, symbols, styles, or concepts you do not want"></textarea></label>
<div class="intake-section-title full"><span>03</span><div><strong>Reference files</strong><small>Upload samples, sketches, existing branding, or inspiration.</small></div></div>
<label class="full upload-field"><span>Upload logo samples or inspiration</span><input name="reference_files" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple><small>PNG, JPG, WEBP, GIF or PDF · up to 15 MB each</small></label>
<label class="full">Additional notes<textarea name="additional_notes" rows="4"></textarea></label>
<button class="submit btn btn-success" type="submit">Submit logo intake</button>`;

const webFields=`<div class="intake-section-title full"><span>01</span><div><strong>Business & website goals</strong><small>Tell us what the website needs to accomplish.</small></div></div>
<label>Tracking number<input name="tracking_number" required></label><label>Business name<input name="business_name" required></label><label>Client name<input name="client_name" required></label><label>Email<input name="email_address" type="email" required></label><label>Phone<input name="phone_number" required></label><label>Current website<input name="current_url" type="url" placeholder="If you have one"></label>
<label>Website type<select name="website_type" required><option>Business website</option><option>E-commerce</option><option>Landing page</option><option>Portfolio</option><option>Booking / service site</option><option>Membership / client portal</option><option>Other</option></select></label>
<label>Estimated page count<select name="estimated_page_count" required><option>1-3</option><option>4-6</option><option>7-10</option><option>11-20</option><option>20+</option></select></label>
<label class="full">Primary website goal<textarea name="main_goal" rows="3" required></textarea></label><label class="full">Target audience<textarea name="target_audience" rows="3" required></textarea></label>
<label class="full">Products or services to feature<textarea name="products_services" rows="3"></textarea></label>
<div class="intake-section-title full"><span>02</span><div><strong>Pages & functionality</strong><small>Describe the customer experience and tools you need.</small></div></div>
<label class="full">Required features<input name="required_features" required placeholder="Contact form, booking, payments, blog, portal, live chat"></label>
<label class="full">Pages / site architecture<textarea name="architectural_notes" rows="4" placeholder="Home, About, Services, Contact, individual service pages…"></textarea></label>
<div class="intake-section-title full"><span>03</span><div><strong>Brand & visual direction</strong><small>Show us how the site should look and feel.</small></div></div>
<label>Branding status<select name="branding_status" required><option>Complete</option><option>Partial</option><option>Need branding</option></select></label>
<label>Design style<select name="style_preference" required><option>Modern</option><option>Corporate</option><option>Minimal</option><option>Luxury</option><option>Bold</option><option>Editorial</option><option>Other</option></select></label>
<label>Aesthetic tone<input name="aesthetic_tone" required placeholder="Clean, premium, friendly…"></label><label>Brand colors<input name="brand_color_notes" placeholder="Colors to use or avoid"></label>
<label class="full">Websites you like<textarea name="design_inspiration_links" rows="3" placeholder="Paste links and tell us what you like about them"></textarea></label>
<label class="full">Styles or websites to avoid<textarea name="design_avoid_notes" rows="3"></textarea></label>
<div class="intake-section-title full"><span>04</span><div><strong>Content & reference uploads</strong><small>Upload your logo, sample sites, screenshots, sketches, or brand assets.</small></div></div>
<label>Copy/content status<select name="asset_copy_status" required><option>Ready</option><option>Partial</option><option>Need help</option></select></label>
<label>Logo status<select name="logo_status" required><option>Ready</option><option>In progress</option><option>Need a logo</option></select></label>
<label class="full upload-field"><span>Upload your existing logo</span><input name="logo_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"><small>PNG, JPG, WEBP, GIF or PDF · up to 15 MB</small></label>
<label class="full upload-field"><span>Upload website samples / inspiration</span><input name="reference_files" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple><small>Screenshots, sketches, sample layouts or PDFs · up to 15 MB each</small></label>
<label class="full">Additional notes<textarea name="additional_notes" rows="4"></textarea></label>
<button class="submit btn btn-success" type="submit">Submit website intake</button>`;

function openProjectIntake(id){
  current=projects.find(p=>p.id===id);
  if(!current)return;
  openIntake(current.project_type,current);
}
function openIntake(type,project=null){
  const normalized=type==='website'?'web':type;
  if(!ownsDesignService(normalized)){showPurchaseOffer(normalized);return;}
  $('intakeTitle').textContent=normalized==='logo'?'Logo creation intake':'Website design intake';
  $('intakeForm').innerHTML=normalized==='logo'?logoFields:webFields;
  $('intakeForm').dataset.type=normalized;
  $('intakeForm').dataset.projectId=project?.id||'';
  const f=$('intakeForm');
  f.elements.client_name.value=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ');
  f.elements.email_address.value=profile?.email_address||user.email||'';
  f.elements.phone_number.value=profile?.phone_number||'';
  f.elements.business_name.value=project?.title?.replace(/\s+—\s+(Website|Logo) Design$/i,'')||profile?.company_name||'';
  if(f.elements.tracking_number)f.elements.tracking_number.value=project?.tracking_number||'';
  const payload=project?.intake_payload||{};
  Object.entries(payload).forEach(([k,v])=>{if(f.elements[k]&&typeof v!=='object')f.elements[k].value=v??''});
  f.onsubmit=submitIntake;
  show('intakeModal');
}
async function uploadIntakeFiles(form,type,projectId){
  const files=[...form.querySelectorAll('input[type="file"]')].flatMap(input=>
    [...input.files].map(file=>({field:input.name,file}))
  );
  if(!files.length)return {};
  const result={};
  for(const item of files){
    if(item.file.size>15*1024*1024)throw new Error(`${item.file.name} is larger than 15 MB.`);
    const safeName=item.file.name.replace(/[^a-zA-Z0-9._-]+/g,'-');
    const path=`${user.id}/${projectId||type}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const {error}=await db.storage.from('design_intake_assets').upload(path,item.file,{upsert:false,contentType:item.file.type});
    if(error)throw error;
    if(!result[item.field])result[item.field]=[];
    result[item.field].push({bucket:'design_intake_assets',path,name:item.file.name,mime_type:item.file.type,size:item.file.size});
  }
  return result;
}
async function submitIntake(e){
  e.preventDefault();
  const form=e.currentTarget,type=form.dataset.type,projectId=form.dataset.projectId;
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;submit.textContent='Uploading & saving…';
  try{
    const fd=new FormData(form),obj={};
    for(const [key,value] of fd.entries())if(!(value instanceof File))obj[key]=value;
    if(type==='web')obj.required_features=String(obj.required_features||'').split(',').map(x=>x.trim()).filter(Boolean);
    const uploads=await uploadIntakeFiles(form,type,projectId);
    if(uploads.logo_file?.length)obj.logo_assets=uploads.logo_file;
    if(uploads.reference_files?.length)obj.reference_assets=uploads.reference_files;

    if(projectId){
      const {error}=await db.rpc('submit_design_project_intake',{p_project_id:projectId,p_payload:obj});
      if(error)throw error;
    }else{
      // Purchased design services should normally have a project. Keep legacy storage as fallback.
      const legacy={...obj};
      ['logo_assets','reference_assets','industry','target_audience','business_description','typography_preference','avoid_notes','additional_notes','products_services','brand_color_notes','design_avoid_notes'].forEach(k=>delete legacy[k]);
      if(type==='web'){
        const {error}=await db.from('web_intakes').insert(legacy);if(error)throw error;
      }else{
        const {error}=await db.from('logo_intakes').insert(legacy);if(error)throw error;
      }
    }
    toast('Design intake submitted.');
    close();
    await load();
  }catch(error){
    toast(error.message||'Unable to submit intake.');
  }finally{
    submit.disabled=false;
    submit.textContent=type==='logo'?'Submit logo intake':'Submit website intake';
  }
}
function toast(m){$('toast').textContent=m;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2800)}
function wireDesignActions(){
  document.addEventListener('click',e=>{
    const intakeButton=e.target.closest('[data-open-intake]');
    if(intakeButton){e.preventDefault();const raw=intakeButton.dataset.openIntake;const type=raw==='web'?'website':'logo';if(!ownsDesignService(raw)){showPurchaseOffer(raw);return;}const pending=projects.find(p=>p.project_type===type&&String(p.intake_status||'').toLowerCase()==='required');if(pending)openProjectIntake(pending.id);else{const owned=projects.find(p=>p.project_type===type);openIntake(raw,owned||null);}return;}
    const projectIntake=e.target.closest('[data-project-intake]');
    if(projectIntake){e.preventDefault();openProjectIntake(projectIntake.dataset.projectIntake);return;}
    const projectButton=e.target.closest('[data-project]');
    if(projectButton){e.preventDefault();openProject(projectButton.dataset.project);return;}
  });
  $('closeWorkspace')?.addEventListener('click',close);
  $('closeIntake')?.addEventListener('click',close);
  $('purchaseCancel')?.addEventListener('click',closePurchaseOffer);
  $('purchaseContinue')?.addEventListener('click',()=>{const url=$('purchaseContinue').dataset.url;if(url)location.href=url;});
  $('shade')?.addEventListener('click',()=>{if($('purchaseModal')?.getAttribute('aria-hidden')==='false')closePurchaseOffer();else close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('shade')?.hidden)close()});
}
async function startDesignCenter(){
  wireDesignActions();
  try{
    if(!window.filings4uSupabase)throw new Error('Client database connection did not initialize.');
    const auth=await window.filings4uRequireClient();
    if(!auth)return;
    ({db,user,profile}=auth);
    const name=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ')||'My Account';
    const company=profile?.company_name||'filings4u client';
    const initial=(profile?.first_name||profile?.company_name||user?.email||'C')[0].toUpperCase();
    ['clientName','clientMenuName'].forEach(id=>{if($(id))$(id).textContent=name});
    if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
    ['clientAvatar','clientMenuAvatar'].forEach(id=>{if($(id))$(id).textContent=initial});
    await load();
  }catch(err){
    console.error('Design Center failed to load',err);
    toast(err?.message||'Unable to load your Design Center.');
  }
}
startDesignCenter();