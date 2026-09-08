const db=window.filings4uSupabase;
const OS=['draft','submitted','processing','completed','cancelled','refunded'];
const PS=['pending','processing','paid','failed','refunded','cancelled'];

let orders=[],view=[],p=1,active=null,invoices=[];
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
  await load();
}

function deny(x){$('gate').textContent=x;$('gate').style.color='#991b1b';}

async function load(){
  const rs=await Promise.all([
    db.from('orders').select('*').order('created_at',{ascending:false}),
    db.from('invoices').select('id,invoice_number,order_id,tracking_number,status,payment_status,total_amount,created_at')
      .order('created_at',{ascending:false})
  ]);
  const failed=rs.find(x=>x.error);
  if(failed)return deny(failed.error.message);
  orders=rs[0].data||[];
  invoices=rs[1].data||[];
  const serviceValues=[...new Set(orders.map(o=>o.service_key||o.selected_service).filter(Boolean))].sort();
  $('svc').innerHTML='<option value="">All services</option>'+serviceValues.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  filter();
}

function invoiceFor(orderId){return invoices.find(i=>String(i.order_id)===String(orderId))||null;}

function filter(){
  const q=$('q').value.trim().toLowerCase(),os=$('os').value,ps=$('ps').value,svc=$('svc').value;
  view=orders.filter(o=>{
    const hay=[o.tracking_number,o.first_name,o.last_name,o.email_address,o.company_name,o.service_key,o.selected_service].join(' ').toLowerCase();
    return hay.includes(q)&&(!os||o.order_status===os)&&(!ps||o.payment_status===ps)&&(!svc||(o.service_key||o.selected_service)===svc);
  });
  p=1;render();
}

function render(){
  const paid=orders.filter(o=>o.payment_status==='paid').length;
  const proc=orders.filter(o=>o.order_status==='processing').length;
  const linked=invoices.filter(i=>i.order_id).length;
  $('stats').innerHTML=[
    ['Total orders',orders.length],['Paid',paid],['In processing',proc],['Linked invoices',linked]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  const pages=Math.max(1,Math.ceil(view.length/20)); if(p>pages)p=pages;
  const pageRows=view.slice((p-1)*20,p*20);
  $('rows').innerHTML=pageRows.length?pageRows.map(o=>{
    const inv=invoiceFor(o.id);
    return `<tr>
      <td><b>${esc(o.tracking_number)}</b><small>${o.user_id?'Client linked':'Historical / unlinked'}</small></td>
      <td><b>${esc([o.first_name,o.last_name].filter(Boolean).join(' '))}</b><small>${esc(o.email_address)}</small><small>${esc(o.company_name)}</small></td>
      <td>${esc(o.service_key||o.selected_service)}<small>${esc(o.plan_tier||o.selected_plan)}${o.jurisdiction_state?' · '+esc(o.jurisdiction_state):''}</small></td>
      <td>${badge(o.order_status)}</td><td>${badge(o.payment_status)}</td>
      <td><b>${money(o.total_amount||o.total_paid_amount)}</b>${inv?`<small>Invoice ${esc(inv.invoice_number)}</small>`:'<small>No invoice</small>'}</td>
      <td>${dt(o.created_at)}</td><td><button data-id="${esc(o.id)}" class="open">Open</button></td>
    </tr>`;
  }).join(''):'<tr><td colspan="8" class="empty">No matching orders.</td></tr>';
  $('count').textContent=`${view.length} order${view.length===1?'':'s'}`;
  $('page').textContent=`Page ${p} of ${pages}`;$('prev').disabled=p===1;$('next').disabled=p===pages;
  document.querySelectorAll('.open').forEach(b=>b.onclick=()=>openOrder(b.dataset.id));
}

function box(t,a){return `<section class="box"><h3>${esc(t)}</h3><div class="grid">${a.map(x=>`<div class="item"><b>${esc(x[0])}</b>${esc(x[1])}</div>`).join('')}</div></section>`;}


function humanLabel(key){
  return String(key||'')
    .replace(/([a-z0-9])([A-Z])/g,'$1 $2')
    .replace(/[_-]+/g,' ')
    .replace(/\b\w/g,c=>c.toUpperCase())
    .trim();
}
function displayValue(value){
  if(value===true)return 'Yes';
  if(value===false)return 'No';
  if(value===null||value===undefined||value==='')return '—';
  if(Array.isArray(value))return value.length?value.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(', '):'—';
  if(typeof value==='number')return String(value);
  if(typeof value==='object')return JSON.stringify(value);
  return String(value);
}
function addonRows(payload){
  let list=payload;
  if(typeof list==='string'){try{list=JSON.parse(list)}catch{list=[]}}
  if(!Array.isArray(list)){
    if(Array.isArray(list?.items))list=list.items;
    else if(Array.isArray(list?.addons))list=list.addons;
    else list=[];
  }
  if(!list.length)return '<div class="structured-empty">No add-ons were selected for this order.</div>';
  return `<div class="addon-list">${list.map((item,index)=>{
    if(typeof item!=='object'||item===null){
      return `<div class="addon-card"><div><strong>${esc(displayValue(item))}</strong></div></div>`;
    }
    const name=item.description||item.name||item.title||item.label||humanLabel(item.item_key||item.addon_key||`Add-on ${index+1}`);
    const qty=Number(item.quantity||1);
    const unit=Number(item.unit_amount??item.price??item.amount??0);
    const line=Number(item.line_total??item.total??unit*qty);
    const code=item.item_key||item.addon_key||item.key||'';
    return `<div class="addon-card">
      <div class="addon-card__main">
        <strong>${esc(name)}</strong>
        ${code?`<small>${esc(code)}</small>`:''}
      </div>
      <div class="addon-card__meta">
        <span><b>Qty</b>${esc(qty)}</span>
        <span><b>Unit</b>${money(unit)}</span>
        <span><b>Total</b>${money(line)}</span>
      </div>
    </div>`;
  }).join('')}</div>`;
}
function primitiveEntries(obj){
  return Object.entries(obj||{}).filter(([,v])=>v===null||['string','number','boolean'].includes(typeof v));
}
function objectEntries(obj){
  return Object.entries(obj||{}).filter(([,v])=>v&&typeof v==='object'&&!Array.isArray(v));
}
function arrayEntries(obj){
  return Object.entries(obj||{}).filter(([,v])=>Array.isArray(v));
}
function fieldGrid(obj){
  const entries=primitiveEntries(obj).filter(([k])=>!['schema'].includes(k));
  if(!entries.length)return '';
  return `<div class="form-field-grid">${entries.map(([k,v])=>`
    <div class="form-field-row">
      <b>${esc(humanLabel(k))}</b>
      <span>${esc(displayValue(v))}</span>
    </div>`).join('')}</div>`;
}
function arrayBlock(key,arr){
  if(!arr?.length)return '';
  if(arr.every(v=>v===null||['string','number','boolean'].includes(typeof v))){
    return `<div class="form-subsection"><h4>${esc(humanLabel(key))}</h4><div class="form-value-list">${arr.map(v=>`<span>${esc(displayValue(v))}</span>`).join('')}</div></div>`;
  }
  return `<div class="form-subsection"><h4>${esc(humanLabel(key))}</h4>${arr.map((v,i)=>typeof v==='object'&&v!==null?`<div class="form-repeat"><strong>${esc(humanLabel(key))} ${i+1}</strong>${fieldGrid(v)}</div>`:`<div class="form-repeat">${esc(displayValue(v))}</div>`).join('')}</div>`;
}
function objectBlock(key,obj,depth=0){
  if(!obj||typeof obj!=='object')return '';
  const direct=fieldGrid(obj);
  const children=objectEntries(obj).map(([k,v])=>objectBlock(k,v,depth+1)).join('');
  const arrays=arrayEntries(obj).map(([k,v])=>arrayBlock(k,v)).join('');
  if(!direct&&!children&&!arrays)return '';
  const heading=depth===0?'h3':'h4';
  return `<section class="${depth===0?'form-section':'form-subsection'}">
    <${heading}>${esc(humanLabel(key))}</${heading}>
    ${direct}${arrays}${children}
  </section>`;
}
function serviceFormView(payload){
  let data=payload;
  if(typeof data==='string'){try{data=JSON.parse(data)}catch{return '<div class="structured-empty">The saved application payload could not be parsed.</div>'}}
  if(!data||typeof data!=='object'||Array.isArray(data))return '<div class="structured-empty">No completed service form is stored for this order.</div>';

  const metaKeys=['schema','email','phone','company_name','contact_email','contact_phone'];
  const meta={};
  for(const k of metaKeys)if(data[k]!==undefined)meta[k]=data[k];

  const sections=[];
  for(const [k,v] of Object.entries(data)){
    if(metaKeys.includes(k))continue;
    if(v&&typeof v==='object'&&!Array.isArray(v))sections.push(objectBlock(k,v,0));
    else if(Array.isArray(v))sections.push(`<section class="form-section"><h3>${esc(humanLabel(k))}</h3>${arrayBlock(k,v)}</section>`);
    else sections.push('');
  }
  const top=fieldGrid(meta);
  return `${top?`<div class="form-summary">${top}</div>`:''}${sections.filter(Boolean).join('')||'<div class="structured-empty">No application answers were saved.</div>'}`;
}


function applicationDownloadDocument(order){
  const customer=[order.first_name,order.last_name].filter(Boolean).join(' ')||'—';
  const service=order.selected_service||order.service_key||'filings4u service';
  const plan=order.plan_tier||order.selected_plan||'—';
  const jurisdiction=order.jurisdiction_state||'—';
  const applicationHtml=serviceFormView(order.form_payload??{});
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Application ${esc(order.tracking_number||'')}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:38px;font-family:Arial,sans-serif;color:#13213a;background:#fff}
  .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:4px solid #10b981;padding-bottom:20px;margin-bottom:24px}
  .brand{font-size:26px;font-weight:900;color:#0a1f44}.brand span{color:#10b981}
  .muted{color:#64748b;font-size:12px}.meta{text-align:right}
  h1{margin:0 0 4px;color:#0a1f44;font-size:27px}.summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px}
  .summary div{border:1px solid #e5eaf0;border-radius:10px;padding:12px;background:#f8fafc}
  .summary small{display:block;color:#64748b;text-transform:uppercase;font-size:9px;font-weight:700;margin-bottom:4px}
  .form-summary,.form-section{border:1px solid #dce5ed;border-radius:10px;overflow:hidden;margin:0 0 12px}
  .form-section>h3{margin:0;padding:10px 12px;background:#f2fbf7;color:#047857;font-size:12px;border-bottom:1px solid #d7eee5}
  .form-subsection{margin:10px;border:1px solid #edf1f5;border-radius:8px;overflow:hidden}
  .form-subsection>h4{margin:0;padding:8px 10px;background:#f8fafc;color:#0a1f44;font-size:11px}
  .form-field-grid{display:grid;grid-template-columns:1fr 1fr}
  .form-field-row{padding:9px 11px;border-top:1px solid #f0f2f5}
  .form-field-row b{display:block;color:#64748b;font-size:8px;text-transform:uppercase;margin-bottom:3px}
  .form-field-row span{display:block;font-size:11px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere}
  .form-value-list{padding:10px}.form-value-list span{display:inline-block;margin:2px 4px 2px 0;padding:5px 8px;background:#f1f5f9;border-radius:999px;font-size:10px}
  .form-repeat{margin:8px;padding:9px;border:1px solid #edf1f5;border-radius:8px}
  .foot{margin-top:26px;padding-top:14px;border-top:1px solid #e5eaf0;color:#64748b;font-size:11px}
  @media print{body{padding:20px}.form-field-grid{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
  <div class="top">
    <div><div class="brand">filings<span>4u</span></div><div class="muted">filings4u, LLC · A Subsidiary of Roseland Companies, LLC</div></div>
    <div class="meta"><h1>Completed Application</h1><strong>${esc(order.tracking_number||'')}</strong><div class="muted">${esc(service)}</div></div>
  </div>
  <div class="summary">
    <div><small>Customer</small><strong>${esc(customer)}</strong></div>
    <div><small>Company</small><strong>${esc(order.company_name||'—')}</strong></div>
    <div><small>Email</small><strong>${esc(order.email_address||'—')}</strong></div>
    <div><small>Phone</small><strong>${esc(order.phone_number||'—')}</strong></div>
    <div><small>Plan</small><strong>${esc(plan)}</strong></div>
    <div><small>Jurisdiction</small><strong>${esc(jurisdiction)}</strong></div>
  </div>
  ${applicationHtml}
  <div class="foot">Completed service application generated from the secure filings4u Administration system.</div>
</body>
</html>`;
}
function downloadApplication(order){
  const html=applicationDownloadDocument(order);
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`filings4u-application-${order.tracking_number||'order'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function openOrder(id){
  closeOverlays();
  active=orders.find(o=>String(o.id)===String(id)); if(!active)return toast('Order record could not be found.');
  const o=active,inv=invoiceFor(o.id);
  $('drawerTitle').textContent=o.tracking_number||'Order record';
  $('detail').innerHTML=`
    <section class="box"><h3>Operational controls</h3><div class="edit">
      <select id="eos">${OS.map(x=>`<option value="${x}" ${x===o.order_status?'selected':''}>${title(x)}</option>`).join('')}</select>
      <select id="eps">${PS.map(x=>`<option value="${x}" ${x===o.payment_status?'selected':''}>${title(x)}</option>`).join('')}</select>
      <button id="save" class="primary" type="button">Save status</button>
    </div></section>
    ${box('Customer & account',[
      ['Customer',[o.first_name,o.last_name].filter(Boolean).join(' ')],['Email',o.email_address],['Phone',o.phone_number],
      ['Company',o.company_name],['Client account',o.user_id?'Linked':'Not linked'],['Account created',o.account_created?'Yes':'No']
    ])}
    ${box('Service & filing',[
      ['Service',o.service_key||o.selected_service],['Plan',o.plan_tier||o.selected_plan],['Service type',o.service_type],
      ['Jurisdiction',o.jurisdiction_state],['Submitted',dt(o.submitted_at)],['Updated',dt(o.updated_at)]
    ])}
    ${box('Payment',[
      ['Payment status',title(o.payment_status)],['Service fee',money(o.service_fee)],['Government fee',money(o.government_fee)],
      ['Add-ons',money(o.addons_total)],['Total',money(o.total_amount||o.total_paid_amount)],['Paid at',dt(o.paid_at)],
      ['Stripe intent',o.stripe_payment_intent_id||o.stripe_payment_id],['Stripe customer',o.stripe_customer_id]
    ])}
    <section class="box"><h3>Invoice</h3>
      <div class="invoice-link-panel">
        ${inv?`
          <div><b>${esc(inv.invoice_number||'Invoice')}</b><small>${esc(title(inv.status))} · ${esc(title(inv.payment_status))} · ${money(inv.total_amount)}</small></div>
          <a class="primary intake-link" href="admin-invoices.html?invoice=${encodeURIComponent(inv.id)}">Open invoice</a>
        `:`
          <div><b>No invoice linked</b><small>Create an invoice from this order and keep both records connected.</small></div>
          <a class="primary intake-link" href="admin-invoices.html?order=${encodeURIComponent(o.id)}">Create invoice</a>
        `}
      </div>
    </section>
    <section class="box structured-box"><h3>Selected add-ons / upsells</h3>${addonRows(o.upsells_payload??o.selected_upsells??[])}</section>
    <section class="box structured-box">
      <div class="structured-box__heading">
        <h3>Completed service application</h3>
        <button id="downloadApplication" class="secondary-action" type="button">Download application</button>
      </div>
      <div class="completed-form">${serviceFormView(o.form_payload??{})}</div>
    </section>`;
  $('save').onclick=save;
  $('downloadApplication')?.addEventListener('click',()=>downloadApplication(o));
  $('shade').hidden=false;$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');$('close')?.focus();
}

async function ensureOrderCustomer(order){
  if(order.user_id)return {user_id:order.user_id,created:false,account_setup_mode:order.account_setup_mode||'returning_customer'};
  const {data,error}=await db.functions.invoke('admin-link-order-customer',{body:{
    order_id:order.id,
    user_id:null,
    email_address:String(order.email_address||'').trim().toLowerCase(),
    first_name:order.first_name||'',
    last_name:order.last_name||'',
    phone_number:order.phone_number||'',
    company_name:order.company_name||'',
    redirect_to:new URL('reset-password.html',window.location.href).href
  }});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  if(!data?.user_id)throw new Error('Customer account could not be linked.');
  return data;
}

async function save(){
  if(!active)return;
  const order_status=$('eos').value,payment_status=$('eps').value;
  const button=$('save');button.disabled=true;button.textContent='Saving…';
  try{
    let customerLink=null;
    if(payment_status==='paid'){
      customerLink=await ensureOrderCustomer(active);
    }
    const now=new Date().toISOString();
    const patch={order_status,payment_status,updated_at:now};
    if(payment_status==='paid'){
      patch.user_id=customerLink.user_id;
      patch.account_created=true;
      patch.account_setup_mode=customerLink.account_setup_mode||'returning_customer';
      patch.paid_at=active.paid_at||now;
      patch.total_paid_amount=Number(active.total_amount||active.total_paid_amount||0);
    }
    const {data,error}=await db.from('orders').update(patch).eq('id',active.id).select().single();
    if(error)throw error;
    if(payment_status==='paid'){
      const invoice=invoiceFor(active.id);
      if(invoice){
        const {error:invoiceError}=await db.from('invoices').update({
          client_profile_id:customerLink.user_id,
          status:'paid',payment_status:'paid',
          paid_at:invoice.paid_at||now,updated_at:now
        }).eq('id',invoice.id);
        if(invoiceError)throw invoiceError;
      }
    }
    const idx=orders.findIndex(o=>o.id===data.id);if(idx>=0)orders[idx]=data;
    await load();openOrder(data.id);
    toast(customerLink?.created?'Order paid, customer account created and invitation sent.':'Order status updated and customer account linked.');
  }catch(error){
    toast(error.message||'Unable to update order.');
  }finally{
    if($('save')){$('save').disabled=false;$('save').textContent='Save status';}
  }
}

function closeOverlays(){
  $('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');
  $('shade').hidden=true;document.body.classList.remove('drawer-open');
}
function toast(x){$('toast').textContent=x;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2500);}
['q','os','ps','svc'].forEach(x=>$(x).addEventListener(x==='q'?'input':'change',filter));
$('clear').onclick=()=>{$('q').value='';$('os').value='';$('ps').value='';$('svc').value='';filter();};
$('refresh').onclick=load;$('prev').onclick=()=>{if(p>1){p--;render();}};$('next').onclick=()=>{if(p<Math.ceil(view.length/20)){p++;render();}};
$('close').onclick=closeOverlays;$('shade').onclick=closeOverlays;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('shade').hidden)closeOverlays();});
boot();
