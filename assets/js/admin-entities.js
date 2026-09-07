const db=window.filings4uSupabase;

let entities=[],profiles=[],orders=[],compliance=[],deadlines=[],vault=[],view=[],active=null;

const $=x=>document.getElementById(x);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const dt=x=>x?new Date(x).toLocaleDateString():'—';
const badge=x=>`<span class="badge ${esc(String(x||'').replace(/ /g,'-'))}">${esc(x)}</span>`;

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;
  $('gate').hidden=true;
  $('app').hidden=false;
  await load();
}

function deny(x){
  $('gate').textContent=x;
  $('gate').style.color='#991b1b';
}

async function load(){
  const rs=await Promise.all([
    db.from('client_entities').select('*').order('updated_at',{ascending:false}),
    db.from('client_profiles').select('*'),
    db.from('orders').select('id,tracking_number,email_address,company_name,service_key,selected_service,plan_tier,selected_plan,jurisdiction_state,order_status,payment_status,user_id,created_at'),
    db.from('client_compliance').select('*'),
    db.from('compliance_deadlines').select('*'),
    db.from('client_vault').select('*').order('created_at',{ascending:false})
  ]);

  const err=rs.find(x=>x.error);
  if(err)return toast(err.error.message);

  [entities,profiles,orders,compliance,deadlines,vault]=rs.map(x=>x.data||[]);
  buildFilters();
  filter();
}

function buildFilters(){
  const stands=[...new Set(entities.map(x=>x.standing_status).filter(Boolean))].sort();
  const states=[...new Set(entities.map(x=>x.state_of_formation).filter(Boolean))].sort();
  const services=[...new Set(entities.map(x=>x.service_key||x.filing_description).filter(Boolean))].sort();

  $('standing').innerHTML='<option value="">All standing</option>'+stands.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('state').innerHTML='<option value="">All states</option>'+states.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('service').innerHTML='<option value="">All services</option>'+services.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
}

function norm(v){return String(v||'').trim().toLowerCase()}
function profileFor(e){
  if(!e)return null;
  return profiles.find(p=>p.id===e.user_id)||
    profiles.find(p=>norm(p.email_address)===norm(e.client_email));
}
function orderFor(e){
  return e?.source_order_id?orders.find(o=>o.id===e.source_order_id):null;
}
function compFor(e){
  if(!e)return [];
  return compliance.filter(c=>
    norm(c.entity_name)===norm(e.entity_name)||
    (!!norm(e.client_email)&&norm(c.user_email)===norm(e.client_email))
  );
}
function deadlineFor(e){
  if(!e)return [];
  return deadlines.filter(d=>
    norm(d.company_name)===norm(e.entity_name)||
    (!!norm(e.client_email)&&norm(d.client_email)===norm(e.client_email))
  );
}
function docsFor(e){
  if(!e)return [];
  return vault.filter(v=>norm(v.target_client_email||v.email_address)===norm(e.client_email));
}

function filter(){
  const q=$('q').value.trim().toLowerCase();
  const st=$('standing').value;
  const state=$('state').value;
  const svc=$('service').value;

  view=entities.filter(e=>{
    const hay=[e.entity_name,e.client_email,e.service_key,e.filing_description,e.state_of_formation,e.plan_tier].join(' ').toLowerCase();
    return hay.includes(q)&&
      (!st||e.standing_status===st)&&
      (!state||e.state_of_formation===state)&&
      (!svc||(e.service_key||e.filing_description)===svc);
  });

  render();
}

function render(){
  const activeCount=entities.filter(e=>String(e.standing_status||'').toUpperCase()==='ACTIVE').length;
  const withCompliance=entities.filter(e=>compFor(e).length||deadlineFor(e).length).length;
  const linkedOrders=entities.filter(e=>e.source_order_id).length;

  $('stats').innerHTML=[
    ['Entity records',entities.length],
    ['Active standing',activeCount],
    ['With compliance records',withCompliance],
    ['Linked to source order',linkedOrders]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  $('rows').innerHTML=view.length?view.map(e=>{
    const p=profileFor(e);
    const c=compFor(e).length+deadlineFor(e).length;
    const clientName=p?[p.first_name,p.last_name].filter(Boolean).join(' '):'Not matched';
    return `<tr>
      <td><b>${esc(e.entity_name)}</b><small>${esc(e.plan_tier||e.filing_description)}</small></td>
      <td>${esc(clientName)}<small>${esc(e.client_email)}</small></td>
      <td>${esc(e.service_key||e.filing_description)}</td>
      <td>${esc(e.state_of_formation)}</td>
      <td>${badge(e.standing_status)}</td>
      <td>${c} record${c===1?'':'s'}</td>
      <td>${dt(e.formation_date)}</td>
      <td><button class="open" data-id="${esc(e.id)}">Open</button></td>
    </tr>`;
  }).join(''):'<tr><td colspan="8" class="empty">No entities match these filters.</td></tr>';

  document.querySelectorAll('.open').forEach(b=>b.onclick=()=>openEntity(b.dataset.id));
}

function box(t,a){
  return `<section class="box"><h3>${esc(t)}</h3><div class="grid">${
    a.map(x=>`<div class="item"><b>${esc(x[0])}</b>${esc(x[1])}</div>`).join('')
  }</div></section>`;
}

function table(t,heads,rows){
  return `<section class="box"><h3>${esc(t)}</h3>${
    rows.length
      ?`<div class="recordsWrap"><table class="records"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
      :'<div class="empty">No records.</div>'
  }</section>`;
}

function safeRegistryLink(url){
  if(!url)return 'No registry document on file.';
  try{
    const parsed=new URL(url,location.href);
    return `<a class="doclink" href="${esc(parsed.href)}" target="_blank" rel="noopener noreferrer">Open registry document</a>`;
  }catch{
    return 'Registry document link is invalid.';
  }
}

function openEntity(id){
  active=entities.find(x=>String(x.id)===String(id));
  if(!active)return toast('Entity record could not be found.');

  const e=active;
  const p=profileFor(e);
  const o=orderFor(e);
  const cs=compFor(e);
  const ds=deadlineFor(e);
  const docs=docsFor(e);

  $('drawerTitle').textContent=e.entity_name||'Entity record';
  $('detail').innerHTML=`
    <section class="box">
      <h3>Entity controls</h3>
      <div class="editor">
        <input id="entityName" value="${esc(e.entity_name)}" aria-label="Entity name">
        <select id="standingEdit" aria-label="Standing status">
          ${['ACTIVE','GOOD STANDING','INACTIVE','DELINQUENT','DISSOLVED','REVOKED']
            .map(x=>`<option value="${x}" ${x===e.standing_status?'selected':''}>${x}</option>`).join('')}
        </select>
        <button id="saveEntity" class="primary">Save changes</button>
      </div>
    </section>

    ${box('Entity profile',[
      ['Entity name',e.entity_name],
      ['Client email',e.client_email],
      ['Client',p?[p.first_name,p.last_name].filter(Boolean).join(' '):'Not matched'],
      ['State of formation',e.state_of_formation],
      ['Formation date',dt(e.formation_date)],
      ['Standing',e.standing_status],
      ['Service',e.service_key||e.filing_description],
      ['Plan',e.plan_tier],
      ['Created',dt(e.created_at)],
      ['Updated',dt(e.updated_at)]
    ])}

    ${box('Originating order',[
      ['Tracking',o?.tracking_number],
      ['Company',o?.company_name],
      ['Service',o?.service_key||o?.selected_service],
      ['Plan',o?.plan_tier||o?.selected_plan],
      ['Order status',o?.order_status],
      ['Payment status',o?.payment_status]
    ])}

    ${table('Compliance obligations',['Filing','State','Renewal','Source'],
      cs.map(c=>`<tr><td>${esc(c.filing_type)}</td><td>${esc(c.state_jurisdiction)}</td><td>${dt(c.renewal_date)}</td><td>Client compliance</td></tr>`)
        .concat(ds.map(d=>`<tr><td>${esc(d.filing_name)}</td><td>—</td><td>${dt(d.expiration_date)}</td><td>${esc(d.status)}</td></tr>`))
    )}

    ${table('Client vault documents',['File','Category','Created'],
      docs.map(d=>`<tr><td>${esc(d.file_name)}</td><td>${esc(d.asset_vault_category)}</td><td>${dt(d.created_at)}</td></tr>`)
    )}

    <section class="box">
      <h3>Registry document</h3>
      <div class="item">${safeRegistryLink(e.registry_document_url)}</div>
    </section>`;

  $('saveEntity').onclick=saveEntity;
  $('shade').hidden=false;
  $('drawer').classList.add('open');
  document.body.classList.add('drawer-open');
  $('close')?.focus();
}

async function saveEntity(){
  if(!active)return;

  const entity_name=$('entityName').value.trim();
  const standing_status=$('standingEdit').value;

  if(!entity_name)return toast('Entity name is required.');

  const {data,error}=await db.from('client_entities')
    .update({entity_name,standing_status,updated_at:new Date().toISOString()})
    .eq('id',active.id)
    .select()
    .single();

  if(error)return toast(error.message);

  const idx=entities.findIndex(x=>x.id===data.id);
  if(idx>=0)entities[idx]=data;
  active=data;
  buildFilters();
  filter();
  openEntity(data.id);
  toast('Entity record updated.');
}

function close(){
  $('drawer').classList.remove('open');
  $('shade').hidden=true;
  document.body.classList.remove('drawer-open');
}

function toast(x){
  $('toast').textContent=x;
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2500);
}

['q','standing','state','service'].forEach(x=>{
  $(x).addEventListener(x==='q'?'input':'change',filter);
});

$('clear').onclick=()=>{
  $('q').value='';
  $('standing').value='';
  $('state').value='';
  $('service').value='';
  filter();
};

$('refresh').onclick=load;
$('close').onclick=close;
$('shade').onclick=close;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('drawer').classList.contains('open'))close();
});
document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);

boot();
