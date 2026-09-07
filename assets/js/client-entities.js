const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';

let db,user,profile,entities=[],filtered=[];
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;

  ({db,user,profile}=auth);
  hydrateProfile();

  const {data,error}=await db
    .from('client_entities')
    .select('id,entity_name,filing_description,plan_tier,standing_status,state_of_formation,formation_date,registry_document_url,created_at,source_order_id,service_key,updated_at')
    .eq('user_id',user.id)
    .order('created_at',{ascending:false});

  if(error){
    $('gate').textContent='Unable to load your entities.';
    $('gate').style.color='#991b1b';
    return toast(error.message);
  }

  entities=data||[];
  $('gate').hidden=true;
  $('app').hidden=false;
  buildFilters();
  renderStats();
  applyFilters();
}

function hydrateProfile(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();

  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  if($('clientMenuName'))$('clientMenuName').textContent=name;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
}

function normalizedStatus(value){
  return String(value||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
}

function isGood(value){
  const s=String(value||'').toLowerCase();
  return ['good standing','in good standing','active','compliant'].some(x=>s.includes(x));
}

function needsAttention(value){
  const s=String(value||'').toLowerCase();
  return ['warning','revoked','inactive','not good','delinquent','attention','suspended'].some(x=>s.includes(x));
}

function buildFilters(){
  const standings=[...new Set(entities.map(e=>e.standing_status).filter(Boolean))].sort();
  const states=[...new Set(entities.map(e=>e.state_of_formation).filter(Boolean))].sort();

  $('standingFilter').innerHTML='<option value="">All standing statuses</option>'+
    standings.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');

  $('stateFilter').innerHTML='<option value="">All jurisdictions</option>'+
    states.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

function renderStats(){
  $('totalEntities').textContent=entities.length;
  $('goodStanding').textContent=entities.filter(e=>isGood(e.standing_status)).length;
  $('attentionEntities').textContent=entities.filter(e=>needsAttention(e.standing_status)).length;
  $('jurisdictionCount').textContent=new Set(entities.map(e=>e.state_of_formation).filter(Boolean)).size;
}

function applyFilters(){
  const q=$('search').value.trim().toLowerCase();
  const standing=$('standingFilter').value;
  const state=$('stateFilter').value;

  filtered=entities.filter(e=>{
    const hay=[e.entity_name,e.filing_description,e.plan_tier,e.standing_status,e.state_of_formation,e.service_key].join(' ').toLowerCase();
    return (!q||hay.includes(q)) &&
      (!standing||e.standing_status===standing) &&
      (!state||e.state_of_formation===state);
  });

  renderEntities();
}

function renderEntities(){
  $('entityList').innerHTML=filtered.length?filtered.map(e=>`
    <article class="entity-card">
      <div class="entity-card__top">
        <div>
          <h3>${esc(e.entity_name||'Business entity')}</h3>
          <p>${esc(e.filing_description||e.service_key||'Business record')}</p>
        </div>
        <span class="standing-pill ${esc(normalizedStatus(e.standing_status))}">${esc(e.standing_status||'Status pending')}</span>
      </div>

      <div class="entity-card__meta">
        <div class="entity-meta"><span>Jurisdiction</span><b>${esc(e.state_of_formation||'—')}</b></div>
        <div class="entity-meta"><span>Formation date</span><b>${dt(e.formation_date)}</b></div>
        <div class="entity-meta"><span>Plan</span><b>${esc(e.plan_tier||'—')}</b></div>
        <div class="entity-meta"><span>Service</span><b>${esc(e.service_key||'—')}</b></div>
      </div>

      <div class="entity-card__footer">
        <small>Added ${dt(e.created_at)}</small>
        <button class="open-entity" type="button" data-id="${esc(e.id)}">View entity →</button>
      </div>
    </article>
  `).join(''):'<div class="empty-state">No business entities match your current filters.</div>';

  document.querySelectorAll('.open-entity').forEach(btn=>btn.onclick=()=>openEntity(btn.dataset.id));
}

function safeHttpUrl(value){
  if(!value)return null;
  try{
    const url=new URL(String(value));
    return ['http:','https:'].includes(url.protocol)?url.href:null;
  }catch{
    return null;
  }
}

function openEntity(id){
  const e=entities.find(x=>x.id===id);
  if(!e)return;

  const registryUrl=safeHttpUrl(e.registry_document_url);

  $('drawerTitle').textContent=e.entity_name||'Business entity';
  $('drawerBody').innerHTML=`
    <section class="detail-section">
      <h3>Entity record</h3>
      <div class="detail-grid">
        ${detail('Entity name',e.entity_name)}
        ${detail('Standing',e.standing_status)}
        ${detail('State of formation',e.state_of_formation)}
        ${detail('Formation date',dt(e.formation_date))}
        ${detail('Plan',e.plan_tier)}
        ${detail('Service',e.service_key)}
        ${detail('Added',dt(e.created_at))}
        ${detail('Last updated',dt(e.updated_at))}
        ${detail('Source order ID',e.source_order_id)}
      </div>
      ${registryUrl?`<a class="registry-link" href="${esc(registryUrl)}" target="_blank" rel="noopener noreferrer">Open registry document →</a>`:''}
    </section>

    <section class="detail-section">
      <h3>Filing description</h3>
      <div class="drawer-body">
        <p>${esc(e.filing_description||'No filing description is available for this entity.')}</p>
      </div>
    </section>`;

  $('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('entity-drawer-open');
  $('closeDrawer').focus();
}

function detail(label,value){
  return `<div class="detail"><span>${esc(label)}</span><b>${esc(value===null||value===undefined||value===''?'—':value)}</b></div>`;
}

function closeDrawer(){
  $('drawer').setAttribute('aria-hidden','true');
  document.body.classList.remove('entity-drawer-open');
}

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2600);
}

$('search').addEventListener('input',applyFilters);
$('standingFilter').addEventListener('change',applyFilters);
$('stateFilter').addEventListener('change',applyFilters);
$('closeDrawer').onclick=closeDrawer;
$('drawerBackdrop').onclick=closeDrawer;
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&$('drawer').getAttribute('aria-hidden')==='false')closeDrawer();
});

boot();
