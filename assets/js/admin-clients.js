const db=window.filings4uSupabase;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleString():'—';
const date=v=>v?new Date(v).toLocaleDateString():'—';
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
const low=v=>String(v??'').trim().toLowerCase();
let customers=[],view=[],current=null;

async function invoke(body){
  const {data:{session}}=await db.auth.getSession();
  if(!session)throw new Error('Administrator session expired.');
  const {data,error}=await db.functions.invoke('admin-clients-crm',{body,headers:{Authorization:`Bearer ${session.access_token}`}});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}
async function boot(){
  const auth=await window.filings4uRequireAdmin();if(!auth)return;
  $('gate').hidden=true;$('app').hidden=false;
  await load();
}
async function load(){
  try{
    $('refresh').disabled=true;$('refresh').textContent='Refreshing…';
    const data=await invoke({action:'list'});
    customers=data.customers||[];
    filter();
  }catch(e){toast(e.message||'Unable to load client CRM.')}
  finally{$('refresh').disabled=false;$('refresh').textContent='Refresh clients';}
}
function relationship(c){
  if(Number(c.paid_orders)>0)return ['Paid customer','paid'];
  if(Number(c.total_orders)>0||c.sources?.includes('free_filing'))return ['Free / unpaid','free'];
  if(c.has_portal_account)return ['Portal account','portal'];
  return ['Customer record','record'];
}
function filter(){
  const q=low($('q').value),type=$('account').value;
  view=customers.filter(c=>{
    const hay=[c.first_name,c.last_name,c.email_address,c.company_name,c.phone_number,c.id].join(' ').toLowerCase();
    if(q&&!hay.includes(q))return false;
    if(type==='portal'&&!c.has_portal_account)return false;
    if(type==='paid'&&Number(c.paid_orders||0)<1)return false;
    if(type==='free'&&Number(c.paid_orders||0)>0)return false;
    if(type==='open'&&Number(c.open_invoices||0)<1)return false;
    return true;
  });
  render();
}
function render(){
  const paid=customers.filter(c=>Number(c.paid_orders)>0).length;
  const portal=customers.filter(c=>c.has_portal_account).length;
  const open=customers.reduce((n,c)=>n+Number(c.open_invoices||0),0);
  const revenue=customers.reduce((n,c)=>n+Number(c.total_spend||0),0);
  $('stats').innerHTML=[
    ['Total customers',customers.length],
    ['Portal accounts',portal],
    ['Paid customers',paid],
    ['Lifetime revenue',money(revenue)],
    ['Open invoices',open]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  $('rows').innerHTML=view.length?view.map(c=>{
    const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||c.company_name||c.email_address||'Customer';
    const rel=relationship(c);
    return `<tr>
      <td><b>${esc(name)}</b><small>${esc(c.email_address)}</small><small>${esc(c.phone_number||'')}</small></td>
      <td>${esc(c.company_name||'—')}</td>
      <td><span class="pill ${rel[1]}">${rel[0]}</span>${c.has_portal_account?'<small class="subpill">Portal active</small>':''}</td>
      <td><b>${Number(c.total_orders||0)}</b><small>${Number(c.paid_orders||0)} paid · ${Number(c.free_orders||0)} free</small></td>
      <td><b>${money(c.total_spend)}</b>${Number(c.open_invoices||0)?`<small class="warn">${c.open_invoices} open invoice${c.open_invoices===1?'':'s'}</small>`:''}</td>
      <td>${Number(c.applications||0)}<small>${Number(c.entities||0)} entities</small></td>
      <td>${dt(c.last_activity)}</td>
      <td><button class="open" data-id="${esc(c.id||'')}" data-email="${esc(c.email_address||'')}">Open profile</button></td>
    </tr>`;
  }).join(''):'<tr><td colspan="8" class="empty">No customers match these filters.</td></tr>';
  document.querySelectorAll('.open').forEach(b=>b.onclick=()=>openClient(b.dataset.id,b.dataset.email));
}
function section(title,body,count=''){
  return `<section class="box crm-section"><div class="section-title"><h3>${esc(title)}</h3>${count!==''?`<span>${count}</span>`:''}</div>${body}</section>`;
}
function grid(items){
  return `<div class="grid">${items.map(([k,v])=>`<div class="item"><b>${esc(k)}</b>${esc(v||'—')}</div>`).join('')}</div>`;
}
function table(heads,rows){
  return rows.length?`<div class="records-wrap"><table class="records"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:'<div class="empty">No records.</div>';
}
function activity(detail){
  const items=[];
  (detail.orders||[]).forEach(x=>items.push({at:x.updated_at||x.created_at,title:`Order ${x.tracking_number||''}`,text:`${x.service_key||x.selected_service||'Service'} · ${x.order_status||'Order'}`}));
  (detail.applications||[]).forEach(x=>items.push({at:x.updated_at||x.created_at,title:`Filing ${x.tracking_number||''}`,text:`${x.business_name||x.service_key||'Application'} · ${x.current_status||'Status update'}`}));
  (detail.invoices||[]).forEach(x=>items.push({at:x.updated_at||x.created_at,title:`Invoice ${x.invoice_number||''}`,text:`${x.payment_status||x.status||'Invoice'} · ${money(x.total_amount)}`}));
  (detail.support_tickets||[]).forEach(x=>items.push({at:x.updated_at||x.created_at,title:`Support ${x.ticket_id||''}`,text:`${x.subject||'Support request'} · ${x.status||''}`}));
  (detail.documents||[]).forEach(x=>items.push({at:x.created_at,title:'Document posted',text:x.document_title||x.file_name||x.document_type||'Document'}));
  return items.filter(x=>x.at).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,30);
}
async function openClient(id,email){
  try{
    current={id,email};$('drawerTitle').textContent='Loading customer…';$('drawerSubtitle').textContent='';$('detail').innerHTML='<div class="loading">Building complete customer record…</div>';
    $('shade').hidden=false;$('drawer').classList.add('open');document.body.classList.add('drawer-open');
    const data=await invoke({action:'detail',user_id:id||null,email_address:email||null});
    const d=data.customer||{},p=d.profile||{},a=d.auth||{};
    const name=[p.first_name,p.last_name].filter(Boolean).join(' ')||p.company_name||a.email||email||'Customer';
    $('drawerTitle').textContent=name;$('drawerSubtitle').textContent=p.email_address||a.email||email||'';
    const orders=d.orders||[],apps=d.applications||[],entities=d.entities||[],invoices=d.invoices||[],tickets=d.support_tickets||[],docs=d.documents||[],free=d.free_filings||[];
    const paidOrders=orders.filter(o=>low(o.payment_status)==='paid'||Number(o.total_paid_amount)>0);
    const spend=paidOrders.reduce((n,o)=>n+Number(o.total_paid_amount||o.total_amount||0),0);
    const timeline=activity(d);
    $('detail').innerHTML=`
      <div class="crm-summary">
        <div><span>Lifetime value</span><strong>${money(spend)}</strong></div>
        <div><span>Orders</span><strong>${orders.length}</strong></div>
        <div><span>Filings</span><strong>${apps.length+free.length}</strong></div>
        <div><span>Entities</span><strong>${entities.length}</strong></div>
        <div><span>Invoices</span><strong>${invoices.length}</strong></div>
        <div><span>Documents</span><strong>${docs.length}</strong></div>
      </div>
      ${section('Customer profile',grid([
        ['Customer ID',p.id||a.id],
        ['Email',p.email_address||a.email],
        ['Phone',p.phone_number||a.phone],
        ['Company',p.company_name],
        ['Street address',p.street_address],
        ['City / State / ZIP',[p.city,p.state,p.zip_code].filter(Boolean).join(', ')],
        ['Portal account',a.id?'Yes':'No'],
        ['Email confirmed',a.email_confirmed_at?date(a.email_confirmed_at):'No'],
        ['Account created',date(a.created_at)],
        ['Last sign in',dt(a.last_sign_in_at)],
        ['Stripe customer',p.stripe_customer_id],
        ['Profile updated',dt(p.updated_at)]
      ]))}
      ${section('Orders',table(['Date','Tracking','Service','Plan','Order status','Payment','Total'],orders.map(o=>`<tr><td>${date(o.created_at)}</td><td>${esc(o.tracking_number)}</td><td>${esc(o.service_key||o.selected_service)}</td><td>${esc(o.plan_tier||o.selected_plan)}</td><td>${esc(o.order_status)}</td><td>${esc(o.payment_status)}</td><td>${money(o.total_amount||o.total_paid_amount)}</td></tr>`)),orders.length)}
      ${section('Free / legacy filings',table(['Date','Company','Service / plan','Status','Value'],free.map(f=>`<tr><td>${date(f.created_at)}</td><td>${esc(f.company_name)}</td><td>${esc(f.plan_service_tier)}</td><td>${esc(f.status|| (f.is_completed?'Completed':'Active'))}</td><td>${money(f.price)}</td></tr>`)),free.length)}
      ${section('Applications & filings',table(['Tracking','Business','Service','State','Status'],apps.map(x=>`<tr><td>${esc(x.tracking_number)}</td><td>${esc(x.business_name)}</td><td>${esc(x.service_key)}</td><td>${esc(x.jurisdiction_state)}</td><td>${esc(x.current_status)}</td></tr>`)),apps.length)}
      ${section('Invoices & billing',table(['Invoice','Created','Status','Total','Paid','Balance','Views'],invoices.map(x=>`<tr><td>${esc(x.invoice_number)}</td><td>${date(x.created_at)}</td><td>${esc(x.payment_status||x.status)}</td><td>${money(x.total_amount)}</td><td>${money(x.amount_paid)}</td><td>${money(x.balance_due)}</td><td>${Number(x.view_count||0)}</td></tr>`)),invoices.length)}
      ${section('Business entities',table(['Entity','Service','State','Standing','Formation date'],entities.map(x=>`<tr><td>${esc(x.entity_name)}</td><td>${esc(x.service_key||x.filing_description)}</td><td>${esc(x.state_of_formation)}</td><td>${esc(x.standing_status)}</td><td>${date(x.formation_date)}</td></tr>`)),entities.length)}
      ${section('Documents',table(['Date','Document','Category','Source'],docs.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.document_title||x.file_name||x.document_type)}</td><td>${esc(x.asset_vault_category||x.document_type)}</td><td>${esc(x.document_source)}</td></tr>`)),docs.length)}
      ${section('Support history',table(['Ticket','Date','Subject','Priority','Status','Assigned'],tickets.map(x=>`<tr><td>${esc(x.ticket_id)}</td><td>${date(x.created_at)}</td><td>${esc(x.subject)}</td><td>${esc(x.priority)}</td><td>${esc(x.status)}</td><td>${esc(x.assigned_agent)}</td></tr>`)),tickets.length)}
      ${section('Design & web projects',table(['Type','Project','Status','Last update'],[
        ...(d.design_projects||[]).map(x=>`<tr><td>Design</td><td>${esc(x.title||x.project_type)}</td><td>${esc(x.status)}</td><td>${dt(x.updated_at)}</td></tr>`),
        ...(d.web_projects||[]).map(x=>`<tr><td>Website</td><td>${esc(x.project_title)}</td><td>${esc(x.status_label)}</td><td>${dt(x.updated_at)}</td></tr>`),
        ...(d.logo_projects||[]).map(x=>`<tr><td>Logo</td><td>${esc(x.project_title)}</td><td>${esc(x.status_label)}</td><td>${dt(x.updated_at)}</td></tr>`)
      ]),(d.design_projects||[]).length+(d.web_projects||[]).length+(d.logo_projects||[]).length)}
      ${section('Recent account activity',timeline.length?`<div class="timeline">${timeline.map(x=>`<div class="timeline-item"><i></i><div><b>${esc(x.title)}</b><p>${esc(x.text)}</p><small>${dt(x.at)}</small></div></div>`).join('')}</div>`:'<div class="empty">No account activity yet.</div>',timeline.length)}
    `;
  }catch(e){$('detail').innerHTML=`<div class="empty error">${esc(e.message||'Unable to load customer record.')}</div>`;}
}
function close(){ $('drawer').classList.remove('open');$('shade').hidden=true;document.body.classList.remove('drawer-open');current=null}
function toast(x){$('toast').textContent=x;$('toast').hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').hidden=true,3500)}
$('q').oninput=filter;$('account').onchange=filter;$('clear').onclick=()=>{$('q').value='';$('account').value='';filter()};$('refresh').onclick=load;$('close').onclick=close;$('shade').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('drawer').classList.contains('open'))close()});boot();
