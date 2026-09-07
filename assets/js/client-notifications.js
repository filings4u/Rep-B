const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';

let db,user,profile,items=[],filtered=[];
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;

  ({db,user,profile}=auth);
  hydrateProfile();

  const {data,error}=await db
    .from('portal_notifications')
    .select('id,title,message,is_read,is_archived,ticket_id,created_at,user_id,order_id,notification_type')
    .eq('user_id',user.id)
    .eq('is_archived',false)
    .order('created_at',{ascending:false});

  if(error){
    $('gate').textContent='Unable to load your notifications.';
    $('gate').style.color='#991b1b';
    return toast(error.message);
  }

  items=data||[];
  $('gate').hidden=true;
  $('app').hidden=false;
  buildTypes();
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

function stats(){
  $('totalCount').textContent=items.length;
  $('unreadCount').textContent=items.filter(n=>!n.is_read).length;
  $('orderCount').textContent=items.filter(n=>n.order_id).length;

  const cutoff=Date.now()-30*86400000;
  $('recentCount').textContent=items.filter(n=>n.created_at&&new Date(n.created_at).getTime()>=cutoff).length;

  $('markAllRead').disabled=!items.some(n=>!n.is_read);
}

function buildTypes(){
  const vals=[...new Set(items.map(n=>n.notification_type).filter(Boolean))].sort();
  $('typeFilter').innerHTML='<option value="">All types</option>'+
    vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

function filter(){
  const q=$('search').value.trim().toLowerCase();
  const read=$('readFilter').value;
  const type=$('typeFilter').value;

  filtered=items.filter(n=>{
    const matchRead=!read||(read==='read'?n.is_read:!n.is_read);
    const hay=[n.title,n.message,n.notification_type,n.ticket_id].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&matchRead&&(!type||n.notification_type===type);
  });

  render();
}

function render(){
  $('notificationList').innerHTML=filtered.length?filtered.map(n=>`
    <article class="notification-row ${n.is_read?'':'unread'}" data-id="${esc(n.id)}" tabindex="0" role="button">
      <div class="notification-icon">${esc(icon(n.notification_type))}</div>
      <div class="notification-copy">
        <h3>${esc(n.title||'Portal update')}</h3>
        <p>${esc(n.message||'')}</p>
        <small>${dt(n.created_at)}</small>
      </div>
      <div class="notification-side">
        <span class="type-pill">${esc(n.notification_type||'Update')}</span>
        ${n.is_read?'':'<span class="unread-dot" title="Unread"></span>'}
      </div>
    </article>`).join('')
    :'<div class="empty-state">No notifications match your current filters.</div>';

  document.querySelectorAll('.notification-row[data-id]').forEach(row=>{
    row.onclick=()=>openNotification(row.dataset.id);
    row.onkeydown=event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        openNotification(row.dataset.id);
      }
    };
  });
}

function icon(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('order'))return '#';
  if(t.includes('filing'))return '↗';
  if(t.includes('support'))return '?';
  if(t.includes('document'))return '▤';
  return '•';
}

async function openNotification(id){
  const n=items.find(x=>x.id===id);
  if(!n)return;

  $('drawerTitle').textContent=n.title||'Portal update';
  $('drawerBody').innerHTML=`
    <section class="message-card">
      <div class="message-meta">
        <span class="type-pill">${esc(n.notification_type||'Update')}</span>
        <span class="type-pill">${dt(n.created_at)}</span>
        ${n.ticket_id?`<span class="type-pill">Ticket ${esc(n.ticket_id)}</span>`:''}
      </div>
      <p>${esc(n.message||'No additional message was provided.')}</p>
      ${n.order_id?`<a class="linked-order" href="client-orders.html?order=${encodeURIComponent(n.order_id)}">View linked order →</a>`:''}
    </section>`;

  $('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('notification-drawer-open');

  if(!n.is_read){
    const {error}=await db
      .from('portal_notifications')
      .update({is_read:true})
      .eq('id',n.id)
      .eq('user_id',user.id);

    if(error){
      toast('Notification opened, but its read status could not be updated.');
    }else{
      n.is_read=true;
      stats();
      filter();
    }
  }

  document.querySelector('[data-close-drawer]')?.focus();
}

async function markAll(){
  const ids=items.filter(n=>!n.is_read).map(n=>n.id);
  if(!ids.length)return;

  const button=$('markAllRead');
  button.disabled=true;
  const old=button.textContent;
  button.textContent='Updating…';

  const {error}=await db
    .from('portal_notifications')
    .update({is_read:true})
    .eq('user_id',user.id)
    .in('id',ids);

  if(error){
    toast(error.message);
  }else{
    items.forEach(n=>{
      if(ids.includes(n.id))n.is_read=true;
    });
    stats();
    filter();
    toast('All notifications marked as read.');
  }

  button.textContent=old;
  button.disabled=!items.some(n=>!n.is_read);
}

function closeDrawer(){
  $('drawer').setAttribute('aria-hidden','true');
  document.body.classList.remove('notification-drawer-open');
}

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2800);
}

$('search').addEventListener('input',filter);
$('readFilter').addEventListener('change',filter);
$('typeFilter').addEventListener('change',filter);
$('markAllRead').onclick=markAll;
document.querySelectorAll('[data-close-drawer]').forEach(x=>x.onclick=closeDrawer);

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&$('drawer').getAttribute('aria-hidden')==='false')closeDrawer();
});

boot();
