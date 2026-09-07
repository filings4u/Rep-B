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
    <section class="box"><h3>Selected add-ons / upsells</h3><pre class="json">${esc(JSON.stringify(o.upsells_payload??o.selected_upsells??[],null,2))}</pre></section>
    <section class="box"><h3>Wizard / service form payload</h3><pre class="json">${esc(JSON.stringify(o.form_payload??{},null,2))}</pre></section>`;
  $('save').onclick=save;
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
