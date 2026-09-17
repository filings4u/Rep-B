(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>v?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v)):'—';
  let db=null, clients=[], announcements=[];

  async function resolveDb(){
    if(db)return db;
    try{
      if(typeof window.filings4uRequireAdmin==='function'){
        const auth=await window.filings4uRequireAdmin();
        db=auth?.db||auth?.supabase||null;
      }
    }catch(error){console.error('[portal managers] admin guard failed',error)}
    db=db||window.filings4uSupabase||window.supabaseClient||window.filings4uDb||null;
    return db;
  }

  function activatePanel(kind,name){
    const attr=kind==='client'?'client':'admin';
    $$(`[data-${attr}-panel]`).forEach(btn=>btn.classList.toggle('is-active',btn.dataset[`${attr}Panel`]===name));
    $$(`[data-${attr}-view]`).forEach(panel=>panel.classList.toggle('is-active',panel.dataset[`${attr}View`]===name));
    try{sessionStorage.setItem(`filings4u-${attr}-portal-panel`,name)}catch(_){}
    if(kind==='client'&&name==='messages')loadClientMessages();
  }

  function wirePanels(){
    document.addEventListener('click',event=>{
      const client=event.target.closest('[data-client-panel]');
      if(client){activatePanel('client',client.dataset.clientPanel);return}
      const admin=event.target.closest('[data-admin-panel]');
      if(admin)activatePanel('admin',admin.dataset.adminPanel);
    });
    try{
      activatePanel('client',sessionStorage.getItem('filings4u-client-portal-panel')||'overview');
      activatePanel('admin',sessionStorage.getItem('filings4u-admin-portal-panel')||'overview');
    }catch(_){activatePanel('client','overview');activatePanel('admin','overview')}
  }

  async function count(table){const c=await resolveDb();if(!c?.from)return null;const {count,error}=await c.from(table).select('*',{count:'exact',head:true});if(error)throw error;return count??0}
  function setText(ids,value){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=value==null?'—':Number(value).toLocaleString()})}
  async function loadCounts(){
    const specs=[
      ['client_profiles',['clientPortalCustomerCount']],['orders',['clientPortalOrderCount','adminPortalOrderCount']],['applications',['clientPortalApplicationCount','adminPortalApplicationCount']],['portal_notifications',['clientPortalNotificationCount','clientPortalNotificationCount2','adminPortalNotificationCount']],['portal_email_events',['clientPortalEmailEventCount','adminEmailEventCount']],['admin_profiles',['adminPortalAccountCount','adminPortalAccountCount2']],['support_tickets',['adminPortalSupportCount']],['system_notifications',['adminSystemNotificationCount']]
    ];
    const results=await Promise.allSettled(specs.map(async([table,ids])=>[ids,await count(table)]));
    results.forEach(result=>{if(result.status==='fulfilled')setText(result.value[0],result.value[1]);else console.warn('[portal managers] count unavailable',result.reason)})
  }

  async function loadClients(){
    const c=await resolveDb();if(!c?.from)return[];
    const {data,error}=await c.from('client_profiles').select('id,email_address,first_name,last_name,company_name').order('email_address');
    if(error)throw error;
    clients=data||[];
    const select=$('#clientPortalMessageClient');
    if(select){
      select.innerHTML='<option value="">Select a client</option>'+clients.map(x=>{const name=[x.first_name,x.last_name].filter(Boolean).join(' ')||x.company_name||x.email_address;return `<option value="${esc(x.id)}">${esc(name)} — ${esc(x.email_address)}</option>`}).join('');
    }
    return clients;
  }

  function groupedAnnouncements(){
    const map=new Map();
    announcements.forEach(row=>{
      const key=row.source_id||row.id;
      if(!map.has(key))map.set(key,{key,title:row.title,message:row.message,created_at:row.created_at,action_url:row.action_url,action_label:row.action_label,rows:[]});
      map.get(key).rows.push(row);
    });
    return [...map.values()].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }

  function renderClientMessages(){
    const list=$('#clientPortalMessageList');if(!list)return;
    const groups=groupedAnnouncements();
    setText(['clientPortalMessageCampaignCount'],groups.length);
    setText(['clientPortalMessageDeliveryCount'],announcements.filter(x=>!x.is_archived).length);
    setText(['clientPortalMessageUnreadCount'],announcements.filter(x=>!x.is_archived&&!x.is_read).length);
    if(!groups.length){list.innerHTML='<div class="portal-empty-state"><span>!</span><h3>No portal announcements yet</h3><p>Create a message for all clients or target one customer.</p></div>';return}
    list.innerHTML=groups.map(g=>{
      const active=g.rows.filter(x=>!x.is_archived), unread=active.filter(x=>!x.is_read), recipients=new Set(active.map(x=>x.recipient_email||x.email_address||x.user_id).filter(Boolean));
      const archived=!active.length;
      return `<article class="portal-message-row"><div><h3>${esc(g.title||'Portal announcement')}</h3><p>${esc(g.message||'')}</p><small>${fmtDate(g.created_at)} · ${recipients.size} recipient${recipients.size===1?'':'s'}${g.action_label?` · ${esc(g.action_label)}`:''}</small></div><div class="portal-message-row__meta"><span class="portal-message-pill${archived?' muted':''}">${archived?'Archived':'Active'}</span><span class="portal-message-pill muted">${unread.length} unread</span>${archived?'':`<button class="management-secondary-button" type="button" data-archive-client-message="${esc(g.key)}">Archive</button>`}</div></article>`;
    }).join('');
  }

  async function loadClientMessages(){
    const c=await resolveDb();if(!c?.from)return;
    const list=$('#clientPortalMessageList');
    if(list)list.innerHTML='<div class="portal-empty-state"><span>…</span><h3>Loading announcements</h3><p>Retrieving portal message history.</p></div>';
    const {data,error}=await c.from('portal_notifications').select('id,source_id,user_id,recipient_email,email_address,title,message,is_read,is_archived,created_at,notification_type,action_url,action_label').eq('notification_type','announcement').order('created_at',{ascending:false}).limit(1000);
    if(error){if(list)list.innerHTML=`<div class="portal-empty-state"><span>!</span><h3>Could not load announcements</h3><p>${esc(error.message)}</p></div>`;return}
    announcements=data||[];renderClientMessages();
  }

  function openMessageModal(){
    const modal=$('#clientPortalMessageModal');if(!modal)return;
    $('#clientPortalMessageForm')?.reset();
    $('#clientPortalMessageClientField').hidden=true;
    const status=$('#clientPortalMessageStatus');if(status){status.textContent='';status.className='portal-message-form-status'}
    modal.hidden=false;document.body.classList.add('is-locked');
    loadClients().catch(error=>{if(status){status.textContent=error.message;status.className='portal-message-form-status is-error'}});
    setTimeout(()=>$('#clientPortalMessageTitle')?.focus(),30);
  }
  function closeMessageModal(){const modal=$('#clientPortalMessageModal');if(modal)modal.hidden=true;document.body.classList.remove('is-locked')}

  async function submitMessage(event){
    event.preventDefault();
    const c=await resolveDb(), status=$('#clientPortalMessageStatus'), submit=$('#clientPortalMessageSubmit');if(!c?.from)return;
    const audience=$('#clientPortalMessageAudience').value, title=$('#clientPortalMessageTitle').value.trim(), message=$('#clientPortalMessageBody').value.trim(), actionLabel=$('#clientPortalMessageActionLabel').value.trim()||null, actionUrl=$('#clientPortalMessageActionUrl').value.trim()||null;
    if(!title||!message)return;
    if(!clients.length)await loadClients();
    let recipients=audience==='all'?clients:clients.filter(x=>x.id===$('#clientPortalMessageClient').value);
    if(!recipients.length){status.textContent='Select a client before sending.';status.className='portal-message-form-status is-error';return}
    const sourceId=crypto.randomUUID();
    const rows=recipients.map(x=>({source_id:sourceId,user_id:x.id,recipient_email:x.email_address,email_address:x.email_address,title,message,notification_type:'announcement',action_url:actionUrl,action_label:actionLabel,is_read:false,is_archived:false}));
    submit.disabled=true;status.textContent=`Sending to ${recipients.length} client${recipients.length===1?'':'s'}…`;status.className='portal-message-form-status';
    const {error}=await c.from('portal_notifications').insert(rows);
    submit.disabled=false;
    if(error){status.textContent=error.message;status.className='portal-message-form-status is-error';return}
    status.textContent='Portal message sent.';status.className='portal-message-form-status is-success';
    await Promise.all([loadClientMessages(),loadCounts()]);
    setTimeout(closeMessageModal,450);
  }

  async function archiveCampaign(sourceId){
    if(!sourceId)return;
    const ok=await window.filings4uDialog?.confirm?.('Archive this portal announcement for its recipients? It will no longer appear in their active notification list.',{title:'Archive portal message',confirmText:'Archive'});
    if(ok===false||ok==null)return;
    const c=await resolveDb();
    let q=c.from('portal_notifications').update({is_archived:true});
    q=announcements.some(x=>x.source_id===sourceId)?q.eq('source_id',sourceId):q.eq('id',sourceId);
    const {error}=await q;
    if(error){await window.filings4uDialog?.alert?.(error.message,{title:'Archive failed'});return}
    await loadClientMessages();
  }

  $('#clientPortalNewMessage')?.addEventListener('click',openMessageModal);
  $('#clientPortalRefreshMessages')?.addEventListener('click',loadClientMessages);
  $('#clientPortalMessageAudience')?.addEventListener('change',e=>{$('#clientPortalMessageClientField').hidden=e.target.value!=='client'});
  $('#clientPortalMessageForm')?.addEventListener('submit',submitMessage);
  $$('[data-close-client-message]').forEach(x=>x.addEventListener('click',closeMessageModal));
  $('#clientPortalMessageModal')?.addEventListener('click',e=>{if(e.target.matches('.portal-message-modal__backdrop'))closeMessageModal()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-archive-client-message]');if(b)archiveCampaign(b.dataset.archiveClientMessage)});

  wirePanels();loadCounts();
})();
