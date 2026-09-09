const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';

let db,user,profile,tickets=[],orders=[],filtered=[];
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;

  ({db,user,profile}=auth);
  hydrateProfile();

  const [ticketResult,orderResult]=await Promise.all([
    db.from('support_tickets')
      .select('id,ticket_id,client_id,company_name,subject,description,priority,status,assigned_agent,created_at,updated_at,tracking_number')
      .eq('client_id',user.id)
      .order('updated_at',{ascending:false}),

    db.from('orders')
      .select('id,tracking_number,selected_service,company_name,order_status')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false})
  ]);

  if(ticketResult.error){
    $('gate').textContent='Unable to load your support requests.';
    $('gate').style.color='#991b1b';
    return toast(ticketResult.error.message);
  }

  if(orderResult.error){
    console.warn('Related orders could not be loaded.',orderResult.error.message);
    toast('Support loaded. Related-order selection is temporarily unavailable.');
  }

  tickets=ticketResult.data||[];
  orders=orderResult.data||[];

  $('gate').hidden=true;
  $('app').hidden=false;

  populateOrders();
  buildStatuses();
  stats();
  filter();
}

function hydrateProfile(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C')[0].toUpperCase();

  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  if($('clientMenuName'))$('clientMenuName').textContent=name;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
}

function statusClass(value){
  return String(value||'')
    .trim().toLowerCase()
    .replace(/\s+/g,'-')
    .replace(/_/g,'-')
    .replace(/[^a-z0-9-]/g,'');
}

function stats(){
  const status=t=>String(t.status||'').toLowerCase();

  $('totalCount').textContent=tickets.length;
  $('resolvedCount').textContent=tickets.filter(t=>['resolved','closed','completed'].includes(status(t))).length;
  $('pendingCount').textContent=tickets.filter(t=>['pending','waiting','awaiting response','awaiting client'].includes(status(t))).length;
  $('openCount').textContent=tickets.filter(t=>!['resolved','closed','completed'].includes(status(t))).length;
}

function buildStatuses(){
  const vals=[...new Set(tickets.map(t=>t.status).filter(Boolean))].sort();
  $('statusFilter').innerHTML='<option value="">All statuses</option>'+
    vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

function populateOrders(){
  $('orderSelect').innerHTML='<option value="">Not order-specific</option>'+
    orders.map(o=>`<option value="${esc(o.id)}">${esc(o.tracking_number||o.selected_service||o.company_name||o.id)}</option>`).join('');
}

function filter(){
  const q=$('search').value.trim().toLowerCase();
  const s=$('statusFilter').value;

  filtered=tickets.filter(t=>{
    const hay=[t.ticket_id,t.company_name,t.subject,t.description,t.status,t.priority,t.tracking_number].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!s||t.status===s);
  });

  render();
}

function render(){
  $('ticketList').innerHTML=filtered.length?filtered.map(t=>`
    <div class="ticket-row">
      <div class="ticket-title">
        <b>${esc(t.subject||'Support request')}</b>
        <small>${esc(t.ticket_id||'Ticket')} · ${dt(t.created_at)}</small>
      </div>
      <div><span class="status-pill-page ${esc(statusClass(t.status))}">${esc(t.status||'Open')}</span></div>
      <div><span class="priority ${esc(statusClass(t.priority))}">${esc(t.priority||'Normal')}</span></div>
      <div class="ticket-meta"><span>${esc(t.assigned_agent||'Support team')}</span><small>Assigned</small></div>
      <button class="open-ticket" type="button" data-id="${esc(t.id)}">View →</button>
    </div>`).join('')
    :'<div class="empty-state">No support requests match your current filters.</div>';

  document.querySelectorAll('.open-ticket[data-id]').forEach(button=>{
    button.onclick=()=>openTicket(button.dataset.id);
  });
}

function openTicket(id){
  const t=tickets.find(x=>String(x.id)===String(id));
  if(!t)return;

  $('drawerTitle').textContent=t.subject||'Support request';
  $('drawerBody').innerHTML=`
    <section class="detail-card">
      <h3>Ticket details</h3>
      <div class="detail-grid">
        ${detail('Ticket',t.ticket_id)}
        ${detail('Status',t.status)}
        ${detail('Priority',t.priority)}
        ${detail('Assigned to',t.assigned_agent||'Support team')}
        ${detail('Tracking number',t.tracking_number)}
        ${detail('Updated',dt(t.updated_at))}
      </div>
    </section>
    <section class="detail-card">
      <h3>Your request</h3>
      <p>${esc(t.description||'No description provided.')}</p>
    </section>`;

  $('ticketDrawer').setAttribute('aria-hidden','false');
  syncOverlayLock();
  document.querySelector('[data-close-drawer]')?.focus();
}

function detail(label,value){
  return `<div class="detail"><span>${esc(label)}</span><b>${esc(value||'—')}</b></div>`;
}

function closeDrawer(){
  $('ticketDrawer').setAttribute('aria-hidden','true');
  syncOverlayLock();
}

function openModal(){
  $('ticketModal').setAttribute('aria-hidden','false');
  syncOverlayLock();
  setTimeout(()=>$('subject').focus(),100);
}

function closeModal(){
  $('ticketModal').setAttribute('aria-hidden','true');
  syncOverlayLock();
}

function syncOverlayLock(){
  const anyOpen=
    $('ticketDrawer').getAttribute('aria-hidden')==='false' ||
    $('ticketModal').getAttribute('aria-hidden')==='false';

  document.body.classList.toggle('support-overlay-open',anyOpen);
}

async function submitTicket(event){
  event.preventDefault();

  const btn=$('submitTicket');
  btn.disabled=true;
  const old=btn.textContent;
  btn.textContent='Submitting…';

  try{
    const order=orders.find(o=>String(o.id)===String($('orderSelect').value));
    const subject=$('subject').value.trim();
    const description=$('description').value.trim();

    if(!subject||!description)throw new Error('Please complete the subject and description.');

    const payload={
      ticket_id:'F4U-'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),
      client_id:user.id,
      company_name:profile.company_name||order?.company_name||null,
      subject,
      description,
      priority:$('priority').value,
      status:'open',
      assigned_agent:'Unassigned',
      email_address:(profile.email_address||user.email||'').trim().toLowerCase()||null,
      first_name:profile.first_name||null,
      last_name:profile.last_name||null,
      tracking_number:order?.tracking_number||null
    };

    const {data,error}=await db.from('support_tickets')
      .insert(payload)
      .select('id,ticket_id,client_id,company_name,subject,description,priority,status,assigned_agent,created_at,updated_at,tracking_number')
      .single();

    if(error)throw error;

    tickets.unshift(data);
    $('ticketForm').reset();
    closeModal();
    buildStatuses();
    stats();
    filter();
    toast('Support request submitted.');
  }catch(error){
    toast(error.message||'Unable to submit support request.');
  }finally{
    btn.disabled=false;
    btn.textContent=old;
  }
}

$('newTicketButton').onclick=openModal;
document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);
document.querySelectorAll('[data-close-drawer]').forEach(x=>x.onclick=closeDrawer);

$('ticketForm').addEventListener('submit',submitTicket);
$('search').addEventListener('input',filter);
$('statusFilter').addEventListener('change',filter);

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    if($('ticketModal').getAttribute('aria-hidden')==='false')closeModal();
    else if($('ticketDrawer').getAttribute('aria-hidden')==='false')closeDrawer();
  }
});

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2800);
}

boot();
