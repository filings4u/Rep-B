const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
let db,user,profile,tickets=[],orders=[],filtered=[];

async function boot(){
 const auth=await window.filings4uRequireClient(); if(!auth)return;
 ({db,user,profile}=auth); hydrateProfile();
 const [ticketResult,orderResult]=await Promise.all([
   db.from('support_tickets').select('*').eq('client_id',user.id).order('updated_at',{ascending:false}),
   db.from('orders').select('id,tracking_number,selected_service,company_name,order_status').eq('user_id',user.id).order('created_at',{ascending:false})
 ]);
 if(ticketResult.error)toast(ticketResult.error.message);
 tickets=ticketResult.data||[]; orders=orderResult.data||[];
 $('gate').hidden=true;$('app').hidden=false;
 populateOrders();buildStatuses();stats();filter();
}
function hydrateProfile(){
 const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account',company=profile.company_name||'filings4u client',initial=(profile.first_name||profile.company_name||profile.email_address||'C')[0].toUpperCase();
 $('clientName').textContent=name;$('clientAvatar').textContent=initial;
 if($('clientMenuName'))$('clientMenuName').textContent=name;if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
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
 $('statusFilter').innerHTML='<option value="">All statuses</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}
function populateOrders(){
 $('orderSelect').innerHTML='<option value="">Not order-specific</option>'+orders.map(o=>`<option value="${esc(o.id)}">${esc(o.tracking_number||o.selected_service||o.company_name||o.id)}</option>`).join('');
}
function filter(){
 const q=$('search').value.trim().toLowerCase(),s=$('statusFilter').value;
 filtered=tickets.filter(t=>(!q||[t.ticket_id,t.company_name,t.subject,t.description,t.status,t.priority,t.tracking_number].join(' ').toLowerCase().includes(q))&&(!s||t.status===s));
 render();
}
function render(){
 $('ticketList').innerHTML=filtered.length?filtered.map(t=>`<div class="ticket-row">
 <div class="ticket-title"><b>${esc(t.subject||'Support request')}</b><small>${esc(t.ticket_id||'Ticket')} · ${dt(t.created_at)}</small></div>
 <div><span class="status-pill-page ${esc(String(t.status||'').toLowerCase())}">${esc(t.status||'Open')}</span></div>
 <div><span class="priority ${esc(String(t.priority||'').toLowerCase())}">${esc(t.priority||'Normal')}</span></div>
 <div class="ticket-meta"><span>${esc(t.assigned_agent||'Support team')}</span><small>Assigned</small></div>
 <button class="open-ticket" data-id="${esc(t.id)}">View →</button></div>`).join(''):'<div class="empty-state">No support requests match your current filters.</div>';
 document.querySelectorAll('.open-ticket').forEach(b=>b.onclick=()=>openTicket(b.dataset.id));
}
function openTicket(id){
 const t=tickets.find(x=>x.id===id);if(!t)return;
 $('drawerTitle').textContent=t.subject||'Support request';
 $('drawerBody').innerHTML=`<section class="detail-card"><h3>Ticket details</h3><div class="detail-grid">${detail('Ticket',t.ticket_id)}${detail('Status',t.status)}${detail('Priority',t.priority)}${detail('Assigned to',t.assigned_agent||'Support team')}${detail('Tracking number',t.tracking_number)}${detail('Updated',dt(t.updated_at))}</div></section><section class="detail-card"><h3>Your request</h3><p>${esc(t.description||'No description provided.')}</p></section>`;
 $('ticketDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function detail(l,v){return `<div class="detail"><span>${esc(l)}</span><b>${esc(v||'—')}</b></div>`}
function closeDrawer(){$('ticketDrawer').setAttribute('aria-hidden','true');document.body.style.overflow=''}
function openModal(){$('ticketModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>$('subject').focus(),100)}
function closeModal(){$('ticketModal').setAttribute('aria-hidden','true');document.body.style.overflow=''}
async function submitTicket(e){
 e.preventDefault();const btn=$('submitTicket');btn.disabled=true;btn.textContent='Submitting…';
 try{
  const order=orders.find(o=>o.id===$('orderSelect').value);
  const ticketId='F4U-'+Date.now().toString().slice(-8);
  const payload={
    ticket_id:ticketId,client_id:user.id,company_name:profile.company_name||order?.company_name||null,
    subject:$('subject').value.trim(),description:$('description').value.trim(),priority:$('priority').value,status:'open',
    assigned_agent:null,client_email:profile.email_address||user.email||null,
    client_first_name:profile.first_name||null,client_last_name:profile.last_name||null,
    tracking_number:order?.tracking_number||null
  };
  const {data,error}=await db.from('support_tickets').insert(payload).select().single();if(error)throw error;
  tickets.unshift(data);$('ticketForm').reset();closeModal();buildStatuses();stats();filter();toast('Support request submitted.');
 }catch(err){toast(err.message||'Unable to submit support request.')}
 finally{btn.disabled=false;btn.textContent='Submit request'}
}
$('newTicketButton').onclick=openModal;
document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);
document.querySelectorAll('[data-close-drawer]').forEach(x=>x.onclick=closeDrawer);
$('ticketForm').addEventListener('submit',submitTicket);$('search').addEventListener('input',filter);$('statusFilter').addEventListener('change',filter);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer()}});
function toast(m){$('toast').textContent=m;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2800)}
boot();