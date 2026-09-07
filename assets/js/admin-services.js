const db=window.filings4uSupabase;
let services=[],upsells=[],stateFees=[],filingFees=[],tab='services',active=null;
const $=x=>document.getElementById(x);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(x||0));

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;
  $('gate').hidden=true;
  $('app').hidden=false;
  await load();
}
function deny(x){$('gate').textContent=x;$('gate').style.color='#991b1b'}

async function load(){
  const rs=await Promise.all([
    db.from('services').select('*').order('service_title'),
    db.from('platform_upsells').select('*').order('upsell_name'),
    db.from('state_service_fees').select('*').order('state_name'),
    db.from('state_filing_fees').select('*').order('state_name')
  ]);
  const failed=rs.find(x=>x.error);
  if(failed)return deny(failed.error.message);
  [services,upsells,stateFees,filingFees]=rs.map(x=>x.data||[]);
  const types=[...new Set(services.map(x=>x.service_type).filter(Boolean))].sort();
  $('type').innerHTML='<option value="">All service types</option>'+types.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  render();
}

function filtered(list){
  const q=$('q').value.trim().toLowerCase(),type=$('type').value;
  return list.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q)&&(!type||tab!=='services'||x.service_type===type));
}
function empty(cols){return `<tr><td colspan="${cols}" class="empty">No matching records.</td></tr>`}

function render(){
  $('stats').innerHTML=[
    ['Services',services.length],['Upsells',upsells.length],
    ['State fee schedules',stateFees.length],['Filing adjustments',filingFees.length]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
  $('type').disabled=tab!=='services';
  if(tab==='services')renderServices(filtered(services));
  if(tab==='upsells')renderUpsells(filtered(upsells));
  if(tab==='state')renderState(filtered(stateFees));
  if(tab==='filing')renderFiling(filtered(filingFees));
}

function renderServices(list){
  $('tableArea').innerHTML=`<table><thead><tr><th>Service</th><th>Type</th><th>Jurisdiction</th><th>Starter</th><th>Compliance</th><th>Enterprise</th><th></th></tr></thead><tbody>${
    list.length?list.map(s=>`<tr><td><b>${esc(s.service_title)}</b><small>${esc(s.slug)}</small></td><td><span class="pill ${s.service_type==='government'?'gov':''}">${esc(s.service_type)}</span></td><td>${s.requires_jurisdiction?'Required':'Not required'}</td><td>${money(s.base_price_starter)}</td><td>${money(s.base_price_compliance)}</td><td>${money(s.base_price_enterprise)}</td><td><button class="edit" data-id="${esc(s.id)}">Edit</button></td></tr>`).join(''):empty(7)
  }</tbody></table>`;
  document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>editService(b.dataset.id));
}
function renderUpsells(list){
  $('tableArea').innerHTML=`<table><thead><tr><th>Upsell</th><th>Slug</th><th>Price</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td><b>${esc(x.upsell_name)}</b></td><td>${esc(x.upsell_slug)}</td><td>${money(x.price)}</td></tr>`).join(''):empty(3)}</tbody></table>`;
}
function renderState(list){
  $('tableArea').innerHTML=`<table><thead><tr><th>State</th><th>Processing</th><th>LLC</th><th>Series LLC</th><th>Partnership</th><th>S Corp</th><th>C Corp</th><th>Nonprofit</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td><b>${esc(x.state_name)}</b><small>${esc(x.state_code)}</small></td><td>${esc(x.processing_time)}</td><td>${money(x.llc)}</td><td>${money(x.series_llc)}</td><td>${money(x.partnership)}</td><td>${money(x.s_corp)}</td><td>${money(x.c_corp)}</td><td>${money(x.non_profit)}</td></tr>`).join(''):empty(8)}</tbody></table>`;
}
function renderFiling(list){
  $('tableArea').innerHTML=`<table><thead><tr><th>State</th><th>Tax %</th><th>Corporate surcharge</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td><b>${esc(x.state_name)}</b><small>${esc(x.state_code)}</small></td><td>${Number(x.state_tax_percentage||0).toFixed(2)}%</td><td>${money(x.corporate_surcharge)}</td></tr>`).join(''):empty(3)}</tbody></table>`;
}

function editService(id){
  active=services.find(x=>String(x.id)===String(id));
  if(!active)return toast('Service record could not be found.');
  const s=active;
  $('drawerTitle').textContent=s.service_title||'Service pricing';
  $('detail').innerHTML=`<div class="notice">Changes here affect the service catalog used by the platform. Verify pricing before saving.</div>
  <section class="box"><h3>Service configuration</h3><div class="form">
  <label class="wide">Service title<input id="title" value="${esc(s.service_title)}"></label>
  <label>Service type<select id="stype"><option value="state" ${s.service_type==='state'?'selected':''}>state</option><option value="government" ${s.service_type==='government'?'selected':''}>government</option></select></label>
  <label>Jurisdiction<select id="jur"><option value="true" ${s.requires_jurisdiction?'selected':''}>Required</option><option value="false" ${!s.requires_jurisdiction?'selected':''}>Not required</option></select></label>
  <label>Starter price<input id="starter" type="number" step=".01" min="0" value="${Number(s.base_price_starter||0)}"></label>
  <label>Compliance price<input id="compliance" type="number" step=".01" min="0" value="${Number(s.base_price_compliance||0)}"></label>
  <label>Enterprise price<input id="enterprise" type="number" step=".01" min="0" value="${Number(s.base_price_enterprise||0)}"></label>
  </div><div class="actions"><button id="save" class="primary">Save service</button></div></section>`;
  $('save').onclick=saveService;
  $('shade').hidden=false;
  $('drawer').classList.add('open');
  $('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  $('close').focus();
}

async function saveService(){
  const patch={
    service_title:$('title').value.trim(),
    service_type:$('stype').value,
    requires_jurisdiction:$('jur').value==='true',
    base_price_starter:Number($('starter').value),
    base_price_compliance:Number($('compliance').value),
    base_price_enterprise:Number($('enterprise').value)
  };
  if(!patch.service_title)return toast('Service title is required.');
  if([patch.base_price_starter,patch.base_price_compliance,patch.base_price_enterprise].some(x=>!Number.isFinite(x)||x<0))return toast('Prices must be valid non-negative amounts.');

  const {data,error}=await db.from('services').update(patch).eq('id',active.id).select().single();
  if(error)return toast(error.message);
  const i=services.findIndex(x=>x.id===data.id);
  if(i>=0)services[i]=data;
  render();
  editService(data.id);
  toast('Service pricing updated.');
}

function close(){
  $('drawer').classList.remove('open');
  $('drawer').setAttribute('aria-hidden','true');
  $('shade').hidden=true;
  document.body.classList.remove('drawer-open');
}
function toast(x){
  $('toast').textContent=x;$('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2600);
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');tab=b.dataset.tab;
  if(tab!=='services')$('type').value='';
  render();
});
$('q').oninput=render;
$('type').onchange=render;
$('clear').onclick=()=>{$('q').value='';$('type').value='';render()};
$('refresh').onclick=load;
$('close').onclick=close;
$('shade').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('drawer').classList.contains('open'))close()});
document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);
boot();
