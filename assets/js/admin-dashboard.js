(async function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function setMetric(name,value){
  document.querySelectorAll(`[data-metric="${name}"]`).forEach(el=>el.textContent=String(value));
}

function priority(count,title,copy,target){
  return `<button class="priority-action" type="button" data-priority-target="${target}">
    <span class="action-dot"></span>
    <span><strong>${esc(count)} ${esc(title)}</strong><small>${esc(copy)}</small></span>
    <span class="priority-arrow">→</span>
  </button>`;
}

try{
  const auth=await window.filings4uRequireAdmin?.();
  if(!auth)return;
  const {db}=auth;

  // Run independently: a failure in Support or Applications must never blank the order queue.
  const [
    recentOrdersResult,
    openOrderCountResult,
    activeAppCountResult,
    openTicketsResult
  ]=await Promise.allSettled([
    db.from('orders')
      .select('id,tracking_number,company_name,email_address,selected_service,service_key,order_status,payment_status,total_amount,total_paid_amount,created_at')
      .order('created_at',{ascending:false})
      .limit(8),

    db.from('orders')
      .select('id',{count:'exact',head:true})
      .not('order_status','in','("completed","cancelled","refunded")'),

    db.from('applications')
      .select('id',{count:'exact',head:true})
      .eq('is_active',true),

    db.from('support_tickets').select('id,status')
  ]);

  let orders=[];
  if(recentOrdersResult.status==='fulfilled'&&!recentOrdersResult.value.error){
    orders=recentOrdersResult.value.data||[];
  }else{
    console.error('[filings4u dashboard] orders query failed',
      recentOrdersResult.status==='fulfilled'?recentOrdersResult.value.error:recentOrdersResult.reason);
  }

  let openOrders=0;
  if(openOrderCountResult.status==='fulfilled'&&!openOrderCountResult.value.error){
    openOrders=openOrderCountResult.value.count||0;
  }else{
    // Safe fallback from visible recent data only if exact count fails.
    openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes(String(o.order_status||'').toLowerCase())).length;
    console.error('[filings4u dashboard] order count failed',
      openOrderCountResult.status==='fulfilled'?openOrderCountResult.value.error:openOrderCountResult.reason);
  }

  let activeApps=0;
  if(activeAppCountResult.status==='fulfilled'&&!activeAppCountResult.value.error){
    activeApps=activeAppCountResult.value.count||0;
  }else{
    console.error('[filings4u dashboard] application count failed',
      activeAppCountResult.status==='fulfilled'?activeAppCountResult.value.error:activeAppCountResult.reason);
  }

  let openTickets=0;
  if(openTicketsResult.status==='fulfilled'&&!openTicketsResult.value.error){
    openTickets=(openTicketsResult.value.data||[]).filter(t=>
      !['closed','resolved','completed'].includes(String(t.status||'').toLowerCase())
    ).length;
  }else{
    console.error('[filings4u dashboard] support query failed',
      openTicketsResult.status==='fulfilled'?openTicketsResult.value.error:openTicketsResult.reason);
  }

  setMetric('orders',openOrders);
  setMetric('applications',activeApps);
  setMetric('filings',activeApps);
  setMetric('tickets',openTickets);

  const tbody=$('adminOrderRows');
  if(tbody){
    tbody.innerHTML=orders.length?orders.map(o=>`<tr>
      <td><strong>${esc(o.tracking_number||'—')}</strong></td>
      <td>${esc(o.company_name||o.email_address||'Client')}</td>
      <td>${esc(o.service_key||o.selected_service||'Service')}</td>
      <td>${esc(o.order_status||'Pending')}</td>
      <td>${esc(o.payment_status||'Pending')}</td>
      <td><button class="queue-action-button" type="button" data-open-order="${esc(o.id)}">Open →</button></td>
    </tr>`).join(''):'<tr><td colspan="6" class="empty-state">No recent orders.</td></tr>';

    tbody.querySelectorAll('[data-open-order]').forEach(button=>{
      button.addEventListener('click',()=>{
        location.href=`admin-orders.html?order=${encodeURIComponent(button.dataset.openOrder)}`;
      });
    });
  }

  const priorityList=$('adminPriorityList');
  if(priorityList){
    priorityList.innerHTML=[
      priority(openOrders,'Open orders',openOrders?'Orders still require fulfillment or review.':'No open orders require attention.','admin-orders.html'),
      priority(activeApps,'Active applications',activeApps?'Applications are currently in process.':'No active applications require attention.','admin-applications.html'),
      priority(openTickets,'Support queue',openTickets?'Support tickets are awaiting action.':'No support tickets currently require action.','admin-support.html')
    ].join('');
    priorityList.querySelectorAll('[data-priority-target]').forEach(b=>b.onclick=()=>location.href=b.dataset.priorityTarget);
  }
}catch(error){
  console.error('[filings4u admin dashboard bootstrap]',error);
  const tbody=$('adminOrderRows');
  if(tbody)tbody.innerHTML='<tr><td colspan="6" class="empty-state">Unable to initialize administration data.</td></tr>';
}

const createWorkItem=$('createWorkItem');
const workItemMenu=$('workItemMenu');
const closeWorkItemMenu=$('closeWorkItemMenu');
const viewAllOrders=$('viewAllOrders');

function closeMenu(){
  if(!workItemMenu)return;
  workItemMenu.hidden=true;
  document.body.classList.remove('work-item-open');
}
createWorkItem?.addEventListener('click',()=>{if(workItemMenu){workItemMenu.hidden=false;document.body.classList.add('work-item-open')}});
closeWorkItemMenu?.addEventListener('click',closeMenu);
workItemMenu?.addEventListener('click',e=>{if(e.target===workItemMenu)closeMenu()});
document.querySelectorAll('[data-work-target]').forEach(b=>b.addEventListener('click',()=>location.href=b.dataset.workTarget));
viewAllOrders?.addEventListener('click',()=>location.href='admin-orders.html');
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
})();
