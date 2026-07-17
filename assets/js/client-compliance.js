/**
 * 🛡️ CLIENT COMPLIANCE MATRIX UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Compliance tracker matrix loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  
  // Instantly dispatch data loading algorithms using the verified token parameters
  fetchComprehensiveComplianceMatrix(session.user.id);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH REGISTRY DEADLINES
 * Pulls row arrays matching compliance parameters and throws error states explicitly.
 */
async function fetchComprehensiveComplianceMatrix(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Operation aborted due to unverified profile identity token metrics.");
  }

  const targetElement = document.getElementById("complianceMasterTargetStack");
  if (!targetElement) {
    throw new Error("Viewport Structure Exception: Required DOM insertion container #complianceMasterTargetStack missing from layout.");
  }

  // Query state requirements directly from your production data layer
  const { data: deadlines, error } = await window.supabaseInstance
    .from('compliance_deadlines')
    .select('id, requirement_name, state_authority, due_date, status')
    .eq('owner_id', userId)
    .order('due_date', { ascending: true });

  // STRICT ERROR CHECKING: Throw raw exception states instantly to block silent failures
  if (error) {
    console.error("Database Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty database records securely with zero-state UI layout feedback
  if (!deadlines || deadlines.length === 0) {
    targetElement.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">All registered corporate structures match current state parameters accurately.</p>`;
    return;
  }

  // Map database elements to structural layouts safely
  targetElement.innerHTML = deadlines.map(item => {
    // Explicit value verification boundary checks
    if (!item.id || !item.requirement_name || !item.state_authority || !item.due_date || !item.status) {
      throw new Error(`Data Integrity Exception: Column processing fault inside row signature identity: ${item.id || 'Unknown ID'}`);
    }

    const isUrgentState = item.status === 'PENDING_ACTION';
    const formattedDate = new Date(item.due_date).toLocaleDateString();
    const presentationStatusText = String(item.status).replace('_', ' ');

    return `
      <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 18px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; flex-wrap: wrap !important; gap: 15px !important;">
        <div style="flex: 1 !important; min-width: 250px !important;">
          <div style="display: flex !important; align-items: center !important; gap: 10px !important;">
            <span style="font-size: 1.1rem !important;">${isUrgentState ? '⚠️' : '✅'}</span>
            <strong style="font-size: 0.9rem !important; color: var(--text-dark) !important;">${item.requirement_name}</strong>
          </div>
          <p style="margin: 6px 0 0 26px !important; font-size: 0.8rem !important; color: var(--text-muted) !important;">
            Filing Authority: <strong>${item.state_authority}</strong> State Department Registry.
          </p>
        </div>
        <div style="display: flex !important; align-items: center !important; gap: 20px !important;">
          <div style="text-align: right !important;">
            <small style="display: block !important; font-size: 0.68rem !important; color: #94a3b8 !important; text-transform: uppercase !important; font-weight: 700 !important;">Target Due Date</small>
            <strong style="font-size: 0.85rem !important; color: ${isUrgentState ? '#ef4444' : 'var(--text-dark)'} !important;">${formattedDate}</strong>
          </div>
          <span style="padding: 6px 12px !important; border-radius: 6px !important; font-weight: 800 !important; font-size: 0.65rem !important; text-transform: uppercase !important; background: ${isUrgentState ? '#fee2e2' : '#e2f0e9'} !important; color: ${isUrgentState ? '#ef4444' : 'var(--emerald)'} !important;">
            ${presentationStatusText}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
