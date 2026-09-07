const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';

let db,user,profile;
let orders=[],applications=[],entities=[],notifications=[],documents=[],tickets=[];
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;

  ({db,user,profile}=auth);
  hydrateProfile();

  const results=await Promise.all([
    db.from('orders')
      .select('id,tracking_number,selected_service,service_key,company_name,order_status,payment_status,created_at,updated_at')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false})
      .limit(20),

    db.from('applications')
      .select('id,business_name,current_status,is_active,tracking_number,service_key,created_at,updated_at')
      .eq('user_id',user.id)
      .order('updated_at',{ascending:false})
      .limit(20),

    db.from('client_entities')
      .select('id,entity_name,standing_status,state_of_formation,created_at')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false})
      .limit(20),

    db.from('portal_notifications')
      .select('id,title,message,is_read,is_archived,created_at')
      .eq('user_id',user.id)
      .eq('is_archived',false)
      .order('created_at',{ascending:false})
      .limit(20),

    db.from('user_documents')
      .select('id,file_name,created_at')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false})
      .limit(20),

    db.from('support_tickets')
      .select('id,ticket_id,subject,status,priority,created_at,updated_at')
      .eq('client_id',user.id)
      .order('updated_at',{ascending:false})
      .limit(20)
  ]);

  const failed=results.find(r=>r.error);
  if(failed){
    showGateError(failed.error.message);
    return;
  }

  [orders,applications,entities,notifications,documents,tickets]=results.map(r=>r.data||[]);

  $('gate').hidden=true;
  $('app').hidden=false;
  render();
}

function showGateError(message){
  $('gate').textContent=message||'Unable to load your secure workspace.';
  $('gate').style.color='#991b1b';
}

function hydrateProfile(){
  const full=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();

  $('clientName').textContent=full;
  $('clientAvatar').textContent=initial;

  if($('clientMenuName'))$('clientMenuName').textContent=full;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
}

function render(){
  const openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes((o.order_status||'').toLowerCase())).length;
  const activeFilings=applications.filter(a=>a.is_active!==false&&!['completed','cancelled'].includes((a.current_status||'').toLowerCase())).length;
  const unread=notifications.filter(n=>!n.is_read).length;
  const openTickets=tickets.filter(t=>!['closed','resolved'].includes((t.status||'').toLowerCase())).length;

  $('openOrders').textContent=openOrders;
  $('activeFilings').textContent=activeFilings;
  $('unreadCount').textContent=unread;
  $('ticketCount').textContent=openTickets;

  $('entitySummary').textContent=`${entities.length} linked ${entities.length===1?'entity':'entities'}`;
  $('filingSummary').textContent=`${activeFilings} active ${activeFilings===1?'filing':'filings'}`;
  $('documentSummary').textContent=`${documents.length} secure ${documents.length===1?'record':'records'}`;

  const health=Math.max(0,Math.min(100,100-(openOrders*4)-(openTickets*6)));
  $('healthScore').textContent=health;

  const activity=[
    ...orders.slice(0,5).map(o=>({
      title:o.selected_service||o.service_key||'Service order',
      sub:o.tracking_number||o.company_name||'',
      status:o.order_status,
      date:o.updated_at||o.created_at
    })),
    ...applications.slice(0,5).map(a=>({
      title:a.business_name||a.service_key||'Filing',
      sub:a.tracking_number||'',
      status:a.current_status,
      date:a.updated_at||a.created_at
    }))
  ]
  .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))
  .slice(0,7);

  $('clientActivity').innerHTML=activity.length
    ?activity.map(x=>`<div class="activity-row">
        <div>
          <b>${esc(x.title)}</b>
          <small>${esc(x.sub)}${x.sub?' · ':''}${dt(x.date)}</small>
        </div>
        <span class="status-tag">${esc(x.status||'Pending')}</span>
      </div>`).join('')
    :'<div class="empty-state">No orders or filings are linked to this account yet.</div>';

  $('notificationList').innerHTML=notifications.length
    ?notifications.slice(0,6).map(n=>`<div class="notice-row ${n.is_read?'':'unread'}">
        <b>${esc(n.title||'Portal update')}</b>
        <small>${esc(n.message||'')} · ${dt(n.created_at)}</small>
      </div>`).join('')
    :'<div class="empty-state">You have no portal updates.</div>';
}

$('markRead').onclick=async()=>{
  const ids=notifications.filter(n=>!n.is_read).map(n=>n.id);
  if(!ids.length)return toast('All updates are already read.');

  $('markRead').disabled=true;
  const {error}=await db.from('portal_notifications')
    .update({is_read:true})
    .in('id',ids)
    .eq('user_id',user.id);

  $('markRead').disabled=false;

  if(error)return toast(error.message);

  notifications=notifications.map(n=>({...n,is_read:true}));
  render();
  toast('Updates marked as read.');
};

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2500);
}

boot();
