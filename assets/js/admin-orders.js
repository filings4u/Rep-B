const db=window.filings4uSupabase;
const OS=['draft','submitted','processing','completed','cancelled','refunded'];
const PS=['pending','processing','paid','failed','refunded','cancelled'];

let orders=[],view=[],p=1,active=null,services=[],clients=[];

const $=x=>document.getElementById(x);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=x=>String(x||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(x||0));
const dt=x=>x?new Date(x).toLocaleString():'—';
const badge=x=>`<span class="badge ${esc(x)}">${esc(title(x))}</span>`;

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;

  $('gate').hidden=true;
  $('app').hidden=false;

  $('os').innerHTML='<option value="">All order statuses</option>'+OS.map(x=>`<option value="${x}">${title(x)}</option>`).join('');
  $('ps').innerHTML='<option value="">All payment statuses</option>'+PS.map(x=>`<option value="${x}">${title(x)}</option>`).join('');

  await loadReferenceData();
  await load();
}

function deny(x){
  $('gate').textContent=x;
  $('gate').style.color='#991b1b';
}

async function loadReferenceData(){
  const rs=await Promise.all([
    db.from('services')
      .select('id,slug,service_title,service_type,requires_jurisdiction,base_price_starter,base_price_compliance,base_price_enterprise')
      .order('service_title'),
    db.from('client_profiles')
      .select('id,email_address,first_name,last_name,phone_number,company_name')
      .order('first_name')
  ]);

  const failed=rs.find(x=>x.error);
  if(failed){
    toast(failed.error.message);
    return;
  }

  services=rs[0].data||[];
  clients=rs[1].data||[];

  $('manualService').innerHTML='<option value="">Choose a service</option>'+
    services.map(s=>`<option value="${esc(s.slug)}">${esc(s.service_title)} · ${esc(title(s.service_type))}</option>`).join('');

  $('manualClient').innerHTML='<option value="">Unlinked / new customer</option>'+
    clients.map(c=>{
      const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||c.company_name||c.email_address;
      return `<option value="${esc(c.id)}">${esc(name)} · ${esc(c.email_address)}</option>`;
    }).join('');
}

async function load(){
  const {data,error}=await db.from('orders').select('*').order('created_at',{ascending:false});
  if(error)return deny(error.message);

  orders=data||[];

  const serviceValues=[...new Set(orders.map(o=>o.service_key||o.selected_service).filter(Boolean))].sort();
  $('svc').innerHTML='<option value="">All services</option>'+
    serviceValues.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');

  filter();
}

function filter(){
  const q=$('q').value.trim().toLowerCase();
  const os=$('os').value;
  const ps=$('ps').value;
  const svc=$('svc').value;

  view=orders.filter(o=>{
    const hay=[
      o.tracking_number,o.first_name,o.last_name,o.email_address,
      o.company_name,o.service_key,o.selected_service
    ].join(' ').toLowerCase();

    return hay.includes(q)&&
      (!os||o.order_status===os)&&
      (!ps||o.payment_status===ps)&&
      (!svc||(o.service_key||o.selected_service)===svc);
  });

  p=1;
  render();
}

function render(){
  const paid=orders.filter(o=>o.payment_status==='paid').length;
  const proc=orders.filter(o=>o.order_status==='processing').length;
  const done=orders.filter(o=>o.order_status==='completed').length;

  $('stats').innerHTML=[
    ['Total orders',orders.length],
    ['Paid',paid],
    ['In processing',proc],
    ['Completed',done]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  const pages=Math.max(1,Math.ceil(view.length/20));
  if(p>pages)p=pages;
  const rows=view.slice((p-1)*20,p*20);

  $('rows').innerHTML=rows.length?rows.map(o=>`<tr>
    <td>
      <b>${esc(o.tracking_number)}</b>
      <small>${o.user_id?'Client linked':'Historical / unlinked'}</small>
    </td>
    <td>
      <b>${esc([o.first_name,o.last_name].filter(Boolean).join(' '))}</b>
      <small>${esc(o.email_address)}</small>
      <small>${esc(o.company_name)}</small>
    </td>
    <td>
      ${esc(o.service_key||o.selected_service)}
      <small>${esc(o.plan_tier||o.selected_plan)}${o.jurisdiction_state?' · '+esc(o.jurisdiction_state):''}</small>
    </td>
    <td>${badge(o.order_status)}</td>
    <td>${badge(o.payment_status)}</td>
    <td><b>${money(o.total_amount||o.total_paid_amount)}</b></td>
    <td>${dt(o.created_at)}</td>
    <td><button data-id="${esc(o.id)}" class="open">Open</button></td>
  </tr>`).join('')
  :'<tr><td colspan="8" class="empty">No matching orders.</td></tr>';

  $('count').textContent=`${view.length} order${view.length===1?'':'s'}`;
  $('page').textContent=`Page ${p} of ${pages}`;
  $('prev').disabled=p===1;
  $('next').disabled=p===pages;

  document.querySelectorAll('.open').forEach(b=>{
    b.onclick=()=>openOrder(b.dataset.id);
  });
}

function box(t,a){
  return `<section class="box">
    <h3>${esc(t)}</h3>
    <div class="grid">
      ${a.map(x=>`<div class="item"><b>${esc(x[0])}</b>${esc(x[1])}</div>`).join('')}
    </div>
  </section>`;
}

function openOrder(id){
  closeOverlays();
  active=orders.find(o=>String(o.id)===String(id));
  if(!active)return toast('Order record could not be found.');

  const o=active;
  $('drawerTitle').textContent=o.tracking_number||'Order record';
  $('detail').innerHTML=`
    <section class="box">
      <h3>Operational controls</h3>
      <div class="edit">
        <select id="eos" aria-label="Order status">
          ${OS.map(x=>`<option value="${x}" ${x===o.order_status?'selected':''}>${title(x)}</option>`).join('')}
        </select>
        <select id="eps" aria-label="Payment status">
          ${PS.map(x=>`<option value="${x}" ${x===o.payment_status?'selected':''}>${title(x)}</option>`).join('')}
        </select>
        <button id="save" class="primary" type="button">Save status</button>
      </div>
    </section>

    ${box('Customer & account',[
      ['Customer',[o.first_name,o.last_name].filter(Boolean).join(' ')],
      ['Email',o.email_address],
      ['Phone',o.phone_number],
      ['Company',o.company_name],
      ['Client account',o.user_id?'Linked':'Not linked'],
      ['Account created',o.account_created?'Yes':'No']
    ])}

    ${box('Service & filing',[
      ['Service',o.service_key||o.selected_service],
      ['Plan',o.plan_tier||o.selected_plan],
      ['Service type',o.service_type],
      ['Jurisdiction',o.jurisdiction_state],
      ['Submitted',dt(o.submitted_at)],
      ['Updated',dt(o.updated_at)]
    ])}

    ${box('Payment',[
      ['Payment status',title(o.payment_status)],
      ['Service fee',money(o.service_fee)],
      ['Government fee',money(o.government_fee)],
      ['Add-ons',money(o.addons_total)],
      ['Total',money(o.total_amount||o.total_paid_amount)],
      ['Paid at',dt(o.paid_at)],
      ['Stripe intent',o.stripe_payment_intent_id||o.stripe_payment_id],
      ['Stripe customer',o.stripe_customer_id]
    ])}

    ${box('Power of Attorney',[
      ['Signature',o.poa_signature],
      ['Execution stamp',dt(o.poa_execution_stamp)]
    ])}

    <section class="box">
      <h3>Selected add-ons / upsells</h3>
      <pre class="json">${esc(JSON.stringify(o.upsells_payload??o.selected_upsells??[],null,2))}</pre>
    </section>

    <section class="box">
      <h3>Wizard / service form payload</h3>
      <pre class="json">${esc(JSON.stringify(o.form_payload??{},null,2))}</pre>
    </section>`;

  $('save').onclick=save;
  $('shade').hidden=false;
  $('drawer').classList.add('open');
  $('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  $('close')?.focus();
}

async function save(){
  if(!active)return;

  const order_status=$('eos').value;
  const payment_status=$('eps').value;

  const {data,error}=await db.from('orders')
    .update({order_status,payment_status,updated_at:new Date().toISOString()})
    .eq('id',active.id)
    .select()
    .single();

  if(error)return toast(error.message);

  const idx=orders.findIndex(o=>o.id===data.id);
  if(idx>=0)orders[idx]=data;

  filter();
  openOrder(data.id);
  toast('Order status updated.');
}

function openManualOrder(){
  closeOverlays();
  $('manualForm').reset();
  $('manualClient').value='';
  $('manualPlan').value='starter';
  $('manualStatus').value='processing';
  document.querySelector('input[name="manualPaymentMode"][value="paid"]').checked=true;
  $('manualServiceFee').value='0';
  $('manualGovernmentFee').value='0';
  $('manualAddons').value='0';
  updateManualPricingState();
  $('shade').hidden=false;
  $('manualComposer').classList.add('open');
  $('manualComposer').setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  $('manualFirst').focus();
}

function populateClient(){
  const client=clients.find(c=>String(c.id)===String($('manualClient').value));
  if(!client)return;

  $('manualFirst').value=client.first_name||'';
  $('manualLast').value=client.last_name||'';
  $('manualEmail').value=client.email_address||'';
  $('manualPhone').value=client.phone_number||'';
  $('manualCompany').value=client.company_name||'';
}

function selectedService(){
  return services.find(s=>s.slug===$('manualService').value)||null;
}

function applyServiceDefaults(){
  const s=selectedService();
  if(!s)return;

  const plan=$('manualPlan').value;
  const priceMap={
    starter:Number(s.base_price_starter||0),
    compliance:Number(s.base_price_compliance||0),
    enterprise:Number(s.base_price_enterprise||0)
  };

  if(plan!=='custom')$('manualServiceFee').value=(priceMap[plan]||0).toFixed(2);
  if(!s.requires_jurisdiction)$('manualState').value='';
  updateManualTotal();
}

function paymentMode(){
  return document.querySelector('input[name="manualPaymentMode"]:checked')?.value||'paid';
}

function updateManualPricingState(){
  const free=paymentMode()==='free';
  ['manualServiceFee','manualGovernmentFee','manualAddons'].forEach(id=>{
    $(id).disabled=free;
  });
  $('manualPaymentSummary').textContent=free?'Free / no-charge manual order':'Manual paid order';
  updateManualTotal();
}

function updateManualTotal(){
  const free=paymentMode()==='free';
  const total=free?0:
    Number($('manualServiceFee').value||0)+
    Number($('manualGovernmentFee').value||0)+
    Number($('manualAddons').value||0);

  $('manualTotal').textContent=money(total);
}

function makeTrackingNumber(){
  const date=new Date().toISOString().slice(0,10).replaceAll('-','');
  const rand=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
  return `M-${date}-${rand}`;
}

async function createManualOrder(event){
  event.preventDefault();

  const service=selectedService();
  if(!service)return toast('Choose a service.');

  const first=$('manualFirst').value.trim();
  const last=$('manualLast').value.trim();
  const email=$('manualEmail').value.trim().toLowerCase();
  if(!first||!last||!email)return toast('First name, last name and email are required.');

  const linkedClient=clients.find(c=>String(c.id)===String($('manualClient').value))||null;
  const mode=paymentMode();
  const free=mode==='free';

  const serviceFee=free?0:Number($('manualServiceFee').value||0);
  const governmentFee=free?0:Number($('manualGovernmentFee').value||0);
  const addons=free?0:Number($('manualAddons').value||0);

  if([serviceFee,governmentFee,addons].some(x=>!Number.isFinite(x)||x<0)){
    return toast('Fees must be valid non-negative amounts.');
  }

  const total=serviceFee+governmentFee+addons;
  const now=new Date().toISOString();
  const plan=$('manualPlan').value;
  const note=$('manualNote').value.trim()||null;

  const payload={
    tracking_number:makeTrackingNumber(),
    first_name:first,
    last_name:last,
    email_address:email,
    phone_number:$('manualPhone').value.trim()||'Not Provided',
    company_name:$('manualCompany').value.trim()||'Not Specified',
    selected_plan:plan,
    selected_service:service.slug,
    user_id:linkedClient?.id||null,
    service_key:service.slug,
    plan_tier:plan,
    service_type:service.service_type,
    jurisdiction_state:$('manualState').value.trim()||null,
    order_status:$('manualStatus').value,
    payment_status:'paid',
    currency:'USD',
    service_fee:serviceFee,
    government_fee:governmentFee,
    addons_total:addons,
    subtotal_amount:total,
    total_amount:total,
    total_paid_amount:total,
    account_created:!!linkedClient,
    account_setup_mode:linkedClient?'returning_customer':null,
    submitted_at:now,
    paid_at:now,
    updated_at:now,
    upsells_payload:[],
    form_payload:{
      source:'admin_manual_order',
      payment_mode:mode,
      complimentary:free,
      internal_note:note,
      pricing_reference:free?{
        plan,
        listed_service_price:plan==='starter'?Number(service.base_price_starter||0):
          plan==='compliance'?Number(service.base_price_compliance||0):
          plan==='enterprise'?Number(service.base_price_enterprise||0):null
      }:null
    }
  };

  const button=$('createManual');
  button.disabled=true;
  button.textContent='Creating…';

  try{
    const {data,error}=await db.from('orders').insert(payload).select().single();
    if(error)throw error;

    orders.unshift(data);
    closeOverlays();
    filter();
    openOrder(data.id);
    toast(free?'Free manual order created.':'Paid manual order created.');
  }catch(error){
    toast(error.message||'Unable to create manual order.');
  }finally{
    button.disabled=false;
    button.textContent='Create order';
  }
}

function closeOverlays(){
  $('drawer').classList.remove('open');
  $('drawer').setAttribute('aria-hidden','true');
  $('manualComposer').classList.remove('open');
  $('manualComposer').setAttribute('aria-hidden','true');
  $('shade').hidden=true;
  document.body.classList.remove('drawer-open');
}

function toast(x){
  $('toast').textContent=x;
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2500);
}

['q','os','ps','svc'].forEach(x=>{
  $(x).addEventListener(x==='q'?'input':'change',filter);
});

$('clear').onclick=()=>{
  $('q').value='';
  $('os').value='';
  $('ps').value='';
  $('svc').value='';
  filter();
};

$('refresh').onclick=async()=>{
  await loadReferenceData();
  await load();
};

$('prev').onclick=()=>{if(p>1){p--;render();}};
$('next').onclick=()=>{if(p<Math.ceil(view.length/20)){p++;render();}};

$('close').onclick=closeOverlays;
$('closeManual').onclick=closeOverlays;
$('cancelManual').onclick=closeOverlays;
$('shade').onclick=closeOverlays;
$('manualOrder').onclick=openManualOrder;
$('manualClient').onchange=populateClient;
$('manualService').onchange=applyServiceDefaults;
$('manualPlan').onchange=applyServiceDefaults;
['manualServiceFee','manualGovernmentFee','manualAddons'].forEach(id=>$(id).addEventListener('input',updateManualTotal));
document.querySelectorAll('input[name="manualPaymentMode"]').forEach(x=>x.addEventListener('change',updateManualPricingState));
$('manualForm').addEventListener('submit',createManualOrder);

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('shade').hidden)closeOverlays();
});

document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);

boot();
