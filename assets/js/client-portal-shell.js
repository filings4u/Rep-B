(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let db,user,profile;
  function activate(name){$$('[data-panel]').forEach(x=>x.classList.toggle('is-active',x.dataset.panel===name));$$('[data-view]').forEach(x=>x.classList.toggle('is-active',x.dataset.view===name));if(location.hash!==`#${name}`)history.replaceState(null,'',`#${name}`)}
  async function metric(table,configure){let q=db.from(table).select('*',{count:'exact',head:true});q=configure?q&&configure(q):q;const {count,error}=await q;if(error)throw error;return count||0}
  async function boot(){
    const auth=await window.filings4uRequireClient?.();if(!auth)return;({db,user,profile}=auth);
    $('#clientName').textContent=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';$('#clientCompany').textContent=profile.company_name||'filings4u client';$('.avatar').textContent=(profile.first_name||profile.company_name||profile.email_address||'C')[0].toUpperCase();
    $$('[data-view]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();activate(x.dataset.view)}));
    const initial=(location.hash||'#home').slice(1);activate(['home','orders','filings','documents','support'].includes(initial)?initial:'home');
    const results=await Promise.allSettled([
      metric('orders',q=>q.eq('user_id',user.id)),metric('applications',q=>q.eq('user_id',user.id)),metric('portal_notifications',q=>q.eq('user_id',user.id).eq('is_read',false).eq('is_archived',false)),metric('support_tickets',q=>q.eq('client_id',user.id))
    ]);
    ['orders','filings','notifications','tickets'].forEach((k,i)=>{const el=$(`[data-metric="${k}"]`);if(el)el.textContent=results[i].status==='fulfilled'?results[i].value:'—'});
    const {data}=await db.from('orders').select('id,tracking_number,order_status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5);
    const activity=$('#clientActivity');if(activity)activity.innerHTML=(data||[]).length?(data||[]).map(x=>`<div class="activity-row"><strong>${x.tracking_number||'Order'}</strong><span>${x.order_status||'Processing'}</span></div>`).join(''):'<div class="empty-state">No recent customer activity yet.</div>';
  }
  boot().catch(error=>console.error('[client portal shell]',error));
})();
