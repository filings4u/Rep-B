/**
 * ⚙️ CLIENT FILINGS & PIPELINE UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Unified filings pipeline loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  const userUuidContext = session.user.id;
  const customerEmailContext = session.user.email;

  const routingParameters = new URLSearchParams(window.location.search);
  const filterQueryToken = routingParameters.get("search");

  // Dispatch initial database pipeline compilation
  fetchUnifiedClientOrdersAndFilings(userUuidContext, customerEmailContext, filterQueryToken);
  initializeRealtimeFilingPipelineListeners(userUuidContext, customerEmailContext);
});


/**
 * 📡 DATABASE ACCESS DISPATCH: COMPILE DUAL REGISTRY LEDGERS
 * Pulls row history data matching cross-identities and throws errors on anomalies.
 */
async function fetchUnifiedClientOrdersAndFilings(userUuid, customerEmail, searchToken = null) {
  "use strict";

  if (!userUuid || !customerEmail) {
    throw new Error("Data Integrity Exception: Query execution aborted due to unverified user credentials data.");
  }

  const target = document.getElementById("activeOrdersListTarget");
  if (!target) {
    throw new Error("Viewport Structure Exception: Required DOM insertion container #activeOrdersListTarget missing from layout.");
  }

  // Define database query builders targeting different data infrastructure tracks
  let userFilingsQuery = window.supabaseInstance
    .from('user_filings')
    .select('id, company_name, plan_service_tier, price, is_completed, status, created_at, schedule_1_url')
    .eq('customer_email', customerEmail);

  let trueOrdersQuery = window.supabaseInstance
    .from('orders')
    .select('id, company_name, service_title, plan_tier, total_fee, status, tracking_number, created_at')
    .or(`user_id.eq.${userUuid},email.eq.${customerEmail}`);

  // Apply string filtering modifications across both queries safely if present
  if (searchToken) {
    const cleanSearchToken = `%${searchToken}%`;
    userFilingsQuery = userFilingsQuery.ilike('company_name', cleanSearchToken);
    trueOrdersQuery = trueOrdersQuery.ilike('company_name', cleanSearchToken);
  }

  // Execute async operations concurrently to reduce latency overhead
  const [userFilingsRes, trueOrdersRes] = await Promise.all([userFilingsQuery, trueOrdersQuery]);

  // STRICT ERROR CHECKING: Throw operational failure instantly to clear silent exceptions
  if (userFilingsRes.error) {
    throw new Error(`Database Operation Exception [user_filings]: [${userFilingsRes.error.code}] ${userFilingsRes.error.message}`);
  }
  if (trueOrdersRes.error) {
    throw new Error(`Database Operation Exception [orders]: [${trueOrdersRes.error.code}] ${trueOrdersRes.error.message}`);
  }

  const normalizedRecordsList = [];

  // Parse Tax Document Engine rows
  if (userFilingsRes.data) {
    userFilingsRes.data.forEach(f => {
      if (!f.id || !f.company_name) {
        throw new Error(`Data Integrity Exception: Malformed user_filings record layout payload entry ID: ${f.id || 'Unknown'}`);
      }
      let pct = f.is_completed ? 100 : 25;
      if (!f.is_completed && f.status === 'Processing') pct = 60;
      if (!f.is_completed && f.status === 'IRS Review') pct = 85;

      normalizedRecordsList.push({
        id: f.id,
        origin: 'user_filings',
        title: f.company_name,
        subtitle: f.plan_service_tier || 'Filing Update',
        price: parseFloat(f.price || 0),
        status: f.status || (f.is_completed ? 'Completed' : 'Draft'),
        progress: pct,
        metaLabel: `Ref ID: ${String(f.id).slice(0, 8)}`,
        actionUrl: f.schedule_1_url,
        date: new Date(f.created_at)
      });
    });
  }

  // Parse Core Operations Lane rows
  if (trueOrdersRes.data) {
    trueOrdersRes.data.forEach(o => {
      if (!o.id || !o.company_name) {
        throw new Error(`Data Integrity Exception: Malformed orders record layout payload entry ID: ${o.id || 'Unknown'}`);
      }
      let pct = 20;
      if (o.status === 'Processing' || o.status === 'In Review') pct = 65;
      if (o.status === 'Completed' || o.status === 'Delivered') pct = 100;

      normalizedRecordsList.push({
        id: o.id,
        origin: 'orders',
        title: o.company_name,
        subtitle: `${o.service_title} (${o.plan_tier || 'Standard'})`,
        price: parseFloat(o.total_fee || 0),
        status: o.status || 'Fulfillment Lane',
        progress: pct,
        metaLabel: o.tracking_number ? `Track ID: ${o.tracking_number}` : `Order Token: ${String(o.id).slice(0, 8)}`,
        actionUrl: null,
        date: o.created_at ? new Date(o.created_at) : new Date()
      });
    });
  }

  // Chronologically sort data timeline array metrics
  normalizedRecordsList.sort((alpha, beta) => beta.date - alpha.date);

  // Render zero-state element if aggregate outputs remain empty
  if (normalizedRecordsList.length === 0) {
    target.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:30px;">No registered filings located.</p>`;
    return;
  }


    // Map consolidated array structures to the active presentation view frame safely
  target.innerHTML = normalizedRecordsList.map(item => {
    const formattedPrice = item.price.toFixed(2);
    const formattedDate = item.date.toLocaleDateString();
    
    // Ensure all critical structural variables evaluate perfectly inside the mapping context
    if (item.progress === undefined || !item.status || !item.title) {
      throw new Error(`Data Integrity Exception: Unified template row rendering failed for record: ${item.id}`);
    }

    const actionControlElement = item.actionUrl 
      ? `<a href="${encodeURI(item.actionUrl)}" target="_blank" style="background: var(--text-dark); color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 0.68rem; display: inline-block;">📥 Download Document</a>` 
      : `<a href="client-chat.html" style="color: var(--emerald); text-decoration: none; font-weight: 700; display: inline-block;">Query Specialist ➔</a>`;

    const progressIsMaxed = item.progress === 100;

    return `
      <div style="border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 20px !important; background: #ffffff !important; box-shadow: 0 1px 2px rgba(0,0,0,0.01); margin-bottom: 16px; box-sizing: border-box !important;">
        <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; flex-wrap: wrap !important; gap: 10px !important; margin-bottom: 12px !important;">
          <div>
            <h3 style="margin: 0 !important; font-size: 1rem !important; font-weight: 800; color: var(--text-dark);">${item.title}</h3>
            <small style="color: var(--text-muted); font-size: 0.72rem;">${item.subtitle} | <code style="background:#f1f5f9; padding:2px 4px; border-radius:3px;">${item.metaLabel}</code></small>
          </div>
          <span style="background: ${progressIsMaxed ? 'rgba(16, 185, 129, 0.08)' : '#edf2f7'}; color: ${progressIsMaxed ? 'var(--emerald)' : 'var(--text-muted)'}; padding: 6px 12px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">${item.status}</span>
        </div>
        <div style="margin: 15px 0 !important;">
          <div style="display: flex !important; justify-content: space-between !important; font-size: 0.75rem !important; color: var(--text-muted) !important; margin-bottom: 6px !important;">
            <span>Destination Pipeline: <strong>${item.origin === 'user_filings' ? 'Tax Document Engine' : 'Operations Fulfillment Lane'}</strong></span>
            <span style="font-weight: 800; color: var(--text-dark);">${item.progress}%</span>
          </div>
          <div style="width: 100% !important; background: #f1f5f9 !important; height: 8px !important; border-radius: 4px !important; overflow: hidden !important;">
            <div style="width: ${item.progress}% !important; background: var(--emerald) !important; height: 100% !important; transition: width 0.4s ease;"></div>
          </div>
        </div>
        <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 0.72rem !important; color: #94a3b8 !important; padding-top: 10px !important; border-top: 1px solid #f1f5f9 !important; box-sizing: border-box !important;">
          <span>Logged: ${formattedDate} | Fee Line: $${formattedPrice}</span>
          ${actionControlElement}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * ⚡ REAL-TIME MULTI-CHANNEL LISTENER ENGINE
 * Attaches split table monitoring subscriptions and flushes pipelines natively.
 */
function initializeRealtimeFilingPipelineListeners(userUuid, customerEmail) {
  "use strict";

  // Channel 1: Track tax operations table modifications
  window.supabaseInstance
    .channel(`realtime:user_filings_pipeline:${customerEmail}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_filings', filter: `customer_email=eq.${customerEmail}` }, function () {
      const tokens = new URLSearchParams(window.location.search);
      fetchUnifiedClientOrdersAndFilings(userUuid, customerEmail, tokens.get("search"));
    })
    .subscribe(function (status) {
      if (status === 'CHANNEL_ERROR') {
        throw new Error("Realtime Connection Exception: User filings subscription channel broke down.");
      }
    });

  // Channel 2: Track global workflow orders table modifications
  window.supabaseInstance
    .channel(`realtime:orders_core_pipeline:${userUuid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userUuid}` }, function () {
      const tokens = new URLSearchParams(window.location.search);
      fetchUnifiedClientOrdersAndFilings(userUuid, customerEmail, tokens.get("search"));
    })
    .subscribe(function (status) {
      if (status === 'CHANNEL_ERROR') {
        throw new Error("Realtime Connection Exception: Core orders subscription channel broke down.");
      }
    });
}
