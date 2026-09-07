(async function(){
'use strict';

try{
  const auth=await window.filings4uRequireAdmin?.();
  if(!auth)return;

  const {db}=auth;

  const [ordersResult,appsResult,ticketsResult]=await Promise.all([
    db.from('orders')
      .select('id,tracking_number,company_name,email_address,selected_service,service_key,order_status,payment_status,total_amount,total_paid_amount,created_at')
      .order('created_at',{ascending:false})
      .limit(8),
    db.from('applications').select('id,current_status,is_active'),
    db.from('support_tickets').select('id,status')
  ]);

  const firstError=[ordersResult,appsResult,ticketsResult].find(result=>result.error)?.error;
  if(firstError)throw firstError;

  const orders=ordersResult.data||[];
  const apps=appsResult.data||[];
  const tickets=ticketsResult.data||[];

  const openOrders=orders.filter(o=>!['completed','cancelled','refunded'].includes(String(o.order_status||'').toLowerCase())).length;
  const activeApps=apps.filter(a=>a.is_active!==false).length;
  const openTickets=tickets.filter(t=>!['closed','resolved','completed'].includes(String(t.status||'').toLowerCase())).length;

  document.querySelectorAll('[data-metric="orders"]').forEach(el=>el.textContent=openOrders);
  document.querySelectorAll('[data-metric="applications"]').forEach(el=>el.textContent=activeApps);
  document.querySelectorAll('[data-metric="filings"]').forEach(el=>el.textContent=activeApps);
  document.querySelectorAll('[data-metric="tickets"]').forEach(el=>el.textContent=openTickets);

  const tbody=document.getElementById('adminOrderRows');
  if(tbody){
    tbody.innerHTML=orders.length
      ?orders.map(o=>`<tr>
        <td><strong>${escapeHtml(o.tracking_number||'—')}</strong></td>
        <td>${escapeHtml(o.company_name||o.email_address||'Client')}</td>
        <td>${escapeHtml(o.service_key||o.selected_service||'Service')}</td>
        <td>${escapeHtml(o.order_status||'Pending')}</td>
        <td>${escapeHtml(o.payment_status||'Pending')}</td>
        <td><button class="queue-action-button" type="button" data-open-order="${escapeHtml(o.id)}">Open →</button></td>
      </tr>`).join('')
      :'<tr><td colspan="6" class="empty-state">No recent orders.</td></tr>';

    tbody.querySelectorAll('[data-open-order]').forEach(button=>{
      button.addEventListener('click',()=>{
        location.href=`admin-orders.html?order=${encodeURIComponent(button.dataset.openOrder)}`;
      });
    });
  }

  const priority=document.getElementById('adminPriorityList');
  if(priority){
    const items=[
      [openOrders,'Open orders',openOrders?'Orders still require fulfillment or review.':'No open orders require attention.','admin-orders.html'],
      [activeApps,'Active applications',activeApps?'Applications are currently in process.':'No active applications require attention.','admin-applications.html'],
      [openTickets,'Support queue',openTickets?'Support tickets are awaiting action.':'No support tickets currently require action.','admin-support.html']
    ];

    priority.innerHTML=items.map(([count,title,copy,target])=>`
      <button class="priority-action" type="button" data-priority-target="${target}">
        <span class="action-dot"></span>
        <span><strong>${escapeHtml(String(count))} ${escapeHtml(title)}</strong><small>${escapeHtml(copy)}</small></span>
        <span class="priority-arrow">→</span>
      </button>`).join('');

    priority.querySelectorAll('[data-priority-target]').forEach(button=>{
      button.addEventListener('click',()=>{location.href=button.dataset.priorityTarget});
    });
  }

}catch(error){
  console.error('[filings4u admin dashboard]',error);
  const tbody=document.getElementById('adminOrderRows');
  if(tbody)tbody.innerHTML='<tr><td colspan="6" class="empty-state">Unable to load current operations.</td></tr>';
}

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
})();

const createWorkItem=document.getElementById('createWorkItem');
const workItemMenu=document.getElementById('workItemMenu');
const closeWorkItemMenu=document.getElementById('closeWorkItemMenu');
const viewAllOrders=document.getElementById('viewAllOrders');

function openWorkItemMenu(){
  if(!workItemMenu)return;
  workItemMenu.hidden=false;
  document.body.classList.add('work-item-open');
  closeWorkItemMenu?.focus();
}

function closeWorkItem(){
  if(!workItemMenu)return;
  workItemMenu.hidden=true;
  document.body.classList.remove('work-item-open');
  createWorkItem?.focus();
}

createWorkItem?.addEventListener('click',openWorkItemMenu);
closeWorkItemMenu?.addEventListener('click',closeWorkItem);
workItemMenu?.addEventListener('click',e=>{
  if(e.target===workItemMenu)closeWorkItem();
});

document.querySelectorAll('[data-work-target]').forEach(button=>{
  button.addEventListener('click',()=>{
    location.href=button.dataset.workTarget;
  });
});

viewAllOrders?.addEventListener('click',()=>{
  location.href='admin-orders.html';
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!workItemMenu?.hidden)closeWorkItem();
});
