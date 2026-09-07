const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
const dtm=v=>v?new Date(v).toLocaleString():'—';

let db,user,profile,applications=[],tracking=[],legacy=[],filtered=[];

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;
  ({db,user,profile}=auth);
  hydrateProfile();

  const [appsResult, trackingResult, legacyResult] = await Promise.all([
    db.from('applications')
      .select('id,business_name,current_status,is_active,created_at,order_id,tracking_number,service_key,plan_tier,jurisdiction_state,updated_at')
      .eq('user_id',user.id)
      .order('updated_at',{ascending:false}),
    db.from('application_tracking')
      .select('id,application_id,step_order,title,is_completed,completed_at,created_at')
      .order('step_order',{ascending:true}),
    profile.email_address
      ? db.from('user_filings')
          .select('id,customer_email,company_name,plan_service_tier,price,is_completed,created_at,status,irs_submission_id,schedule_1_url')
          .eq('customer_email',profile.email_address)
          .order('created_at',{ascending:false})
      : Promise.resolve({data:[],error:null})
  ]);

  const error=appsResult.error||trackingResult.error||legacyResult.error;
  if(error) toast(error.message);

  applications=appsResult.data||[];
  tracking=trackingResult.data||[];
  legacy=legacyResult.data||[];

  $('gate').hidden=true;
  $('app').hidden=false;
  buildStatusFilter();
  renderStats();
  applyFilters();
  renderLegacy();
}

function hydrateProfile(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();
  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  if($('clientMenuName')) $('clientMenuName').textContent=name;
  if($('clientMenuCompany')) $('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar')) $('clientMenuAvatar').textContent=initial;
}

function stepsFor(appId){
  return tracking.filter(t=>t.application_id===appId).sort((a,b)=>(a.step_order||0)-(b.step_order||0));
}

function progressFor(app){
  const steps=stepsFor(app.id);
  if(!steps.length){
    if((app.current_status||'').toLowerCase()==='completed') return 100;
    return app.is_active===false ? 100 : 15;
  }
  return Math.round((steps.filter(s=>s.is_completed).length/steps.length)*100);
}

function renderStats(){
  const active=applications.filter(a=>a.is_active!==false&&!['completed','cancelled'].includes((a.current_status||'').toLowerCase()));
  const completed=applications.filter(a=>(a.current_status||'').toLowerCase()==='completed'||a.is_active===false);
  const attention=applications.filter(a=>['waiting','pending','error','failed','needs attention'].includes((a.current_status||'').toLowerCase()));
  $('totalFilings').textContent=applications.length;
  $('activeFilings').textContent=active.length;
  $('completedFilings').textContent=completed.length;
  $('attentionFilings').textContent=attention.length;
}

function buildStatusFilter(){
  const statuses=[...new Set(applications.map(a=>a.current_status).filter(Boolean))].sort();
  $('statusFilter').innerHTML='<option value="">All statuses</option>'+statuses.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

function applyFilters(){
  const q=$('search').value.trim().toLowerCase();
  const status=$('statusFilter').value;
  filtered=applications.filter(a=>{
    const hay=[a.business_name,a.service_key,a.tracking_number,a.plan_tier,a.jurisdiction_state,a.current_status].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!status||a.current_status===status);
  });
  renderFilings();
}

function renderFilings(){
  $('filingsList').innerHTML=filtered.length?filtered.map(app=>{
    const progress=progressFor(app);
    const steps=stepsFor(app.id);
    return `<article class="filing-card">
      <div class="filing-main">
        <h3>${esc(app.business_name||app.service_key||'Filing application')}</h3>
        <div class="filing-meta">
          <span>${esc(app.service_key||'Service')}</span>
          <span>${esc(app.plan_tier||'Plan not specified')}</span>
          <span>${esc(app.jurisdiction_state||'Jurisdiction not specified')}</span>
          <span>${esc(app.tracking_number||'No tracking number')}</span>
        </div>
        <div class="progress-block">
          <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="progress-label"><span>${steps.length?`${steps.filter(s=>s.is_completed).length} of ${steps.length} steps complete`:'Status tracking'}</span><strong>${progress}%</strong></div>
        </div>
      </div>
      <div class="filing-status">
        <span class="status-pill-page ${esc((app.current_status||'').toLowerCase())}">${esc(app.current_status||'Pending')}</span>
        <button class="open-filing" data-id="${esc(app.id)}">View →</button>
      </div>
    </article>`;
  }).join(''):'<div class="empty-state">No filings match your current filters.</div>';

  document.querySelectorAll('.open-filing').forEach(btn=>btn.onclick=()=>openFiling(btn.dataset.id));
}

function openFiling(id){
  const app=applications.find(a=>a.id===id);
  if(!app)return;
  const steps=stepsFor(id);
  $('drawerTitle').textContent=app.business_name||app.service_key||'Application';

  $('drawerBody').innerHTML=`
    <section class="detail-section">
      <h3>Application summary</h3>
      <div class="detail-grid">
        ${detail('Status',app.current_status)}
        ${detail('Tracking number',app.tracking_number)}
        ${detail('Service',app.service_key)}
        ${detail('Plan',app.plan_tier)}
        ${detail('Jurisdiction',app.jurisdiction_state)}
        ${detail('Active',app.is_active===false?'No':'Yes')}
        ${detail('Created',dtm(app.created_at))}
        ${detail('Last updated',dtm(app.updated_at))}
      </div>
    </section>
    <section class="detail-section">
      <h3>Processing timeline</h3>
      ${steps.length?`<div class="timeline">${steps.map(step=>`
        <div class="timeline-step ${step.is_completed?'done':''}">
          <span class="timeline-dot">${step.is_completed?'✓':esc(step.step_order||'•')}</span>
          <div><b>${esc(step.title||'Processing step')}</b><small>${step.is_completed?`Completed ${dtm(step.completed_at)}`:'Pending'}</small></div>
        </div>`).join('')}</div>`:'<div class="empty-state">No detailed processing milestones have been added yet.</div>'}
    </section>`;

  $('drawer').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function detail(label,value){
  return `<div class="detail"><span>${esc(label)}</span><b>${esc(value===null||value===undefined||value===''?'—':value)}</b></div>`;
}

function renderLegacy(){
  if(!legacy.length)return;
  $('legacySection').hidden=false;
  $('legacyList').innerHTML=legacy.map(f=>`
    <div class="legacy-row">
      <div><b>${esc(f.company_name||'Previous filing')}</b><small>${esc(f.plan_service_tier||'')} · ${dt(f.created_at)}</small></div>
      <div><span class="status-pill-page ${esc((f.status||'').toLowerCase())}">${esc(f.status||'Pending')}</span></div>
      <div><small>${f.irs_submission_id?'IRS submission '+esc(f.irs_submission_id):'Legacy record'}</small></div>
      <div>${f.schedule_1_url?`<a class="open-filing" href="${esc(f.schedule_1_url)}" target="_blank" rel="noopener">Document</a>`:''}</div>
    </div>`).join('');
}

function closeDrawer(){
  $('drawer').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

$('search').addEventListener('input',applyFilters);
$('statusFilter').addEventListener('change',applyFilters);
$('closeDrawer').onclick=closeDrawer;
$('drawerBackdrop').onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});

function toast(msg){
  $('toast').textContent=msg;
  $('toast').hidden=false;
  setTimeout(()=>$('toast').hidden=true,2600);
}

boot();