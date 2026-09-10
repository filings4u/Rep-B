(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  let db = null;

  async function resolveDb(){
    if(db) return db;
    try{
      if(typeof window.filings4uRequireAdmin === 'function'){
        const auth = await window.filings4uRequireAdmin();
        db = auth?.db || auth?.supabase || null;
      }
    }catch(error){ console.error('[portal managers] admin guard failed', error); }
    db = db || window.filings4uSupabase || window.supabaseClient || window.filings4uDb || null;
    return db;
  }

  function activatePanel(kind, name){
    const attr = kind === 'client' ? 'client' : 'admin';
    $$(`[data-${attr}-panel]`).forEach(btn => btn.classList.toggle('is-active', btn.dataset[`${attr}Panel`] === name));
    $$(`[data-${attr}-view]`).forEach(panel => panel.classList.toggle('is-active', panel.dataset[`${attr}View`] === name));
    try{ sessionStorage.setItem(`filings4u-${attr}-portal-panel`, name); }catch(_){}
  }

  function wirePanels(){
    document.addEventListener('click', event => {
      const client = event.target.closest('[data-client-panel]');
      if(client){ activatePanel('client', client.dataset.clientPanel); return; }
      const admin = event.target.closest('[data-admin-panel]');
      if(admin){ activatePanel('admin', admin.dataset.adminPanel); }
    });
    try{
      activatePanel('client', sessionStorage.getItem('filings4u-client-portal-panel') || 'overview');
      activatePanel('admin', sessionStorage.getItem('filings4u-admin-portal-panel') || 'overview');
    }catch(_){ activatePanel('client','overview'); activatePanel('admin','overview'); }
  }

  async function count(table){
    const client = await resolveDb();
    if(!client?.from) return null;
    const { count, error } = await client.from(table).select('*', { count:'exact', head:true });
    if(error) throw error;
    return count ?? 0;
  }

  function setText(ids, value){
    ids.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = value == null ? '—' : Number(value).toLocaleString(); });
  }

  async function loadCounts(){
    const specs = [
      ['client_profiles',['clientPortalCustomerCount']],
      ['orders',['clientPortalOrderCount','adminPortalOrderCount']],
      ['applications',['clientPortalApplicationCount','adminPortalApplicationCount']],
      ['portal_notifications',['clientPortalNotificationCount','clientPortalNotificationCount2','adminPortalNotificationCount']],
      ['portal_email_events',['clientPortalEmailEventCount','adminEmailEventCount']],
      ['admin_profiles',['adminPortalAccountCount','adminPortalAccountCount2']],
      ['support_tickets',['adminPortalSupportCount']],
      ['system_notifications',['adminSystemNotificationCount']]
    ];
    const results = await Promise.allSettled(specs.map(async ([table, ids]) => [ids, await count(table)]));
    results.forEach(result => {
      if(result.status === 'fulfilled') setText(result.value[0], result.value[1]);
      else console.warn('[portal managers] count unavailable', result.reason);
    });
  }

  wirePanels();
  loadCounts();
})();
