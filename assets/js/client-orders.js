const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
const date=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
const dateTime=v=>v?new Date(v).toLocaleString():'—';
let db,user,profile,orders=[],filtered=[];

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;
  ({db,user,profile}=auth);

  document.querySelectorAll('.client-nav a').forEach(a=>a.classList.toggle('is-active',a.dataset.page===document.body.dataset.page));
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();
  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  if($('clientMenuName')) $('clientMenuName').textContent=name;
  if($('clientMenuCompany')) $('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar')) $('clientMenuAvatar').textContent=initial;

  const {data,error}=await db.from('orders').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error){
    $('gate').textContent='Unable to load your orders.';
    return toast(error.message);
  }

  orders=data||[];
  $('gate').hidden=true;
  $('app').hidden=false;
  renderStats();
  applyFilters();
}

function renderStats(){
  $('totalOrders').textContent=orders.length;
  $('openOrders').textContent=orders.filter(o=>!['completed','cancelled','refunded'].includes((o.order_status||'').toLowerCase())).length;
  $('completedOrders').textContent=orders.filter(o=>(o.order_status||'').toLowerCase()==='completed').length;
  $('totalPaid').textContent=money(orders.reduce((sum,o)=>sum+Number(o.total_paid_amount||0),0));
}

function applyFilters(){
  const q=$('search').value.trim().toLowerCase();
  const status=$('statusFilter').value;
  const payment=$('paymentFilter').value;

  filtered=orders.filter(o=>{
    const hay=[o.tracking_number,o.selected_service,o.service_key,o.company_name,o.plan_tier,o.jurisdiction_state].join(' ').toLowerCase();
    return (!q||hay.includes(q)) &&
      (!status||o.order_status===status) &&
      (!payment||o.payment_status===payment);
  });
  renderList();
}

function renderList(){
  $('ordersList').innerHTML=filtered.length?filtered.map(o=>`
    <div class="order-row">
      <div>
        <b>${esc(o.selected_service||o.service_key||'filings4u service')}</b>
        <small>${esc(o.company_name||'')} ${o.plan_tier?'· '+esc(o.plan_tier):''}</small>
      </div>
      <div><b>${esc(o.tracking_number||'—')}</b></div>
      <div><span class="pill ${esc((o.order_status||'').toLowerCase())}">${esc(o.order_status||'Pending')}</span></div>
      <div><span class="pill ${esc((o.payment_status||'').toLowerCase())}">${esc(o.payment_status||'Pending')}</span></div>
      <div><b>${money(o.total_amount||o.total_paid_amount)}</b></div>
      <div><small>${date(o.created_at)}</small></div>
      <div><button class="view-btn" data-id="${esc(o.id)}" aria-label="View order">›</button></div>
    </div>
  `).join(''):'<div class="empty">No orders match your current filters.</div>';

  document.querySelectorAll('.view-btn').forEach(btn=>btn.onclick=()=>openOrder(btn.dataset.id));
}

function openOrder(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return;
  $('drawerTitle').textContent=o.selected_service||o.service_key||'Order';

  const upsells=Array.isArray(o.upsells_payload)?o.upsells_payload:o.upsells_payload||[];
  const formPayload=o.form_payload&&typeof o.form_payload==='object'?o.form_payload:{};

  $('drawerBody').innerHTML=`
    <section class="detail-section">
      <h3>Order summary</h3>
      <div class="detail-grid">
        ${detail('Tracking number',o.tracking_number)}
        ${detail('Order status',o.order_status)}
        ${detail('Payment status',o.payment_status)}
        ${detail('Service',o.selected_service||o.service_key)}
        ${detail('Plan',o.plan_tier||o.selected_plan)}
        ${detail('Jurisdiction',o.jurisdiction_state)}
        ${detail('Service type',o.service_type)}
        ${detail('Created',dateTime(o.created_at))}
        ${detail('Submitted',dateTime(o.submitted_at))}
        ${detail('Paid',dateTime(o.paid_at))}
      </div>
    </section>

    <section class="detail-section">
      <h3>Business & contact</h3>
      <div class="detail-grid">
        ${detail('Company',o.company_name)}
        ${detail('Client',[o.first_name,o.last_name].filter(Boolean).join(' '))}
        ${detail('Email',o.email_address)}
        ${detail('Phone',o.phone_number)}
      </div>
    </section>

    <section class="detail-section">
      <h3>Charges</h3>
      <div class="detail-grid">
        ${detail('Service fee',money(o.service_fee))}
        ${detail('Government fee',money(o.government_fee))}
        ${detail('Add-ons',money(o.addons_total))}
        ${detail('Subtotal',money(o.subtotal_amount))}
        ${detail('Order total',money(o.total_amount))}
        ${detail('Amount paid',money(o.total_paid_amount))}
      </div>
    </section>

    ${upsells && (Array.isArray(upsells)?upsells.length:Object.keys(upsells).length)?`
    <section class="detail-section">
      <h3>Add-ons</h3>
      <div class="drawer-body"><div class="json-box">${esc(JSON.stringify(upsells,null,2))}</div></div>
    </section>`:''}

    ${Object.keys(formPayload).length?`
    <section class="detail-section">
      <h3>Submitted information</h3>
      <div class="drawer-body"><div class="json-box">${esc(JSON.stringify(formPayload,null,2))}</div></div>
    </section>`:''}
  `;

  $('drawer').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function detail(label,value){
  return `<div class="detail"><span>${esc(label)}</span><b>${esc(value===null||value===undefined||value===''?'—':value)}</b></div>`;
}

function closeDrawer(){
  $('drawer').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

$('search').addEventListener('input',applyFilters);
$('statusFilter').addEventListener('change',applyFilters);
$('paymentFilter').addEventListener('change',applyFilters);
$('closeDrawer').onclick=closeDrawer;
$('drawerBackdrop').onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});

function toast(msg){
  $('toast').textContent=msg;
  $('toast').hidden=false;
  setTimeout(()=>$('toast').hidden=true,2800);
}

boot();