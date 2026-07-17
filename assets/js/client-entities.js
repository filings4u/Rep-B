/**
 * 🏢 CLIENT ENTITIES COMPONENT UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Entities portfolio loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  const currentUserId = session.user.id;

  // Instantly dispatch data queries and establish background synchronization
  fetchClientRegisteredEntities(currentUserId);
  initializeRealtimeEntitySync(currentUserId);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH REGISTERED ENTITIES
 * Gathers aggregate corporate structure profiles and explicitly handles layout logic.
 */
async function fetchClientRegisteredEntities(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Operation aborted due to unverified user identification variables.");
  }

  const displayGridTarget = document.getElementById("entitiesDisplayGridTarget");
  if (!displayGridTarget) {
    throw new Error("Viewport Structure Exception: Required DOM insertion container #entitiesDisplayGridTarget missing from layout.");
  }

  // Query entity ledger entries from your database tier
  const { data: records, error } = await window.supabaseInstance
    .from('entities')
    .select('id, entity_name, entity_type, state_of_formation, registration_date, status, file_number')
    .eq('user_id', userId)
    .order('entity_name', { ascending: true });

  // STRICT ERROR CHECKING: Intercept database faults instantly to prevent screen masking
  if (error) {
    console.error("Database Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty portfolio status explicitly with zero-state UI layout actions
  if (!records || records.length === 0) {
    displayGridTarget.innerHTML = `
      <div style="grid-column: 1 / -1; background: white; border: 1px solid var(--border-color); padding: 40px; text-align: center; border-radius: 8px;">
        <span style="font-size: 2rem;">🏢</span>
        <h3 style="margin: 10px 0 5px 0; font-size: 1rem; font-weight: 800;">No Entities Registered</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">You haven't formed a business entity under this profile yet.</p>
        <a href="client-services.html" style="background: var(--emerald); color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.8rem; display: inline-block;">Start Formation Order</a>
      </div>
    `;
    return;
  }

  // Construct interface modules safely
  displayGridTarget.innerHTML = records.map(ent => {
    if (!ent.id || !ent.entity_name) {
      throw new Error(`Data Integrity Exception: Entity row mapping fault encountered on profile token identity: ${ent.id || 'Unknown ID'}`);
    }

    const isProfileActive = ent.status?.toLowerCase() === 'active';
    const cleanTypeLabel = ent.entity_type || 'LLC';
    const cleanStatusLabel = ent.status || 'Unknown';
    const cleanStateLabel = ent.state_of_formation || 'N/A';
    const cleanFileNumber = ent.file_number || 'Processing';
    const formattedDate = ent.registration_date ? new Date(ent.registration_date).toLocaleDateString() : 'Pending';

    // REPAIRED: Resolved raw broken trailing anchors by outputting valid corporate operational anchors
    return `
      <div style="background: white !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 20px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 200px !important; box-sizing: border-box !important;">
        <div>
          <div style="display: flex !important; justify-content: space-between !important; align-items: flex-start !important; margin-bottom: 12px !important;">
            <span style="font-size: 0.65rem !important; background: #f1f5f9 !important; padding: 4px 8px !important; border-radius: 4px !important; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
              ${cleanTypeLabel}
            </span>
            <span style="padding: 4px 8px !important; border-radius: 4px !important; font-weight: 800; font-size: 0.65rem !important; text-transform: uppercase; background: ${isProfileActive ? 'rgba(16, 185, 129, 0.1)' : '#fee2e2'} !important; color: ${isProfileActive ? 'var(--emerald)' : '#ef4444'} !important;">
              ${cleanStatusLabel}
            </span>
          </div>
          <h3 style="margin: 0 0 6px 0 !important; font-size: 1.05rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">
            ${ent.entity_name}
          </h3>
          <div style="display: flex !important; flex-direction: column !important; gap: 4px !important; margin-top: 12px !important; font-size: 0.8rem !important; color: var(--text-muted) !important;">
            <div>📍 Jurisdiction: <strong>${cleanStateLabel}</strong></div>
            <div>📄 File ID Number: <code>${cleanFileNumber}</code></div>
            <div>📅 Formation Timestamp: <strong>${formattedDate}</strong></div>
          </div>
        </div>
        <div style="margin-top: 20px !important; padding-top: 12px !important; border-top: 1px solid #f1f5f9 !important; display: flex !important; justify-content: space-between !important; gap: 10px !important;">
          🛡️ Compliance Tracker</a>
          📂 View Documents</a>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * ⚡ REAL-TIME REFRESH DISPATCH
 * Listens directly on Postgres rows and updates metrics instantly without full reloads.
 */
function initializeRealtimeEntitySync(userId) {
  "use strict";

  const realTimeChannelInstance = window.supabaseInstance
    .channel(`public:entities:user=${userId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'entities', 
      filter: `user_id=eq.${userId}` 
    }, function () {
      fetchClientRegisteredEntities(userId);
    })
    .subscribe(function (status) {
      if (status === 'CHANNEL_ERROR') {
        throw new Error("Realtime Connection Exception: Corporate entity background channel disconnected.");
      }
    });
}
