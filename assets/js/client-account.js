/**
 * 💼 CLIENT ACCOUNT & BILLING LEDGER UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Payload schema missing active session verification parameters.");
  }

  const session = engineEvent.detail.session;
  
  // Instantly fire the account balance hydration sequence using the verified session token
  fetchClientFinancialLedger(session.user.id);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH HISTORY LEDGERS
 * Pulls row history records and throws error states explicitly on tracking anomalies.
 */
async function fetchClientFinancialLedger(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Query parameter userId is invalid or undefined.");
  }

  const layerTarget = document.getElementById("billingLedgerOutputContainer");
  if (!layerTarget) {
    throw new Error("Viewport Structure Exception: Required DOM node #billingLedgerOutputContainer is missing from active page layout.");
  }

  // Query records directly from your billing database infrastructure
  const { data: invoices, error } = await window.supabaseInstance
    .from('billing_history')
    .select('id, description, amount, status, created_at, invoice_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // STRICT ERROR CHECKING: Throw database operational failure instantly
  if (error) {
    console.error("Database Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty account records gracefully only if query returned validly with 0 elements
  if (!invoices || invoices.length === 0) {
    layerTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">Zero transaction logs balance active under this profile ledger record loop.</p>`;
    return;
  }

  // Construct UI output safely
  layerTarget.innerHTML = invoices.map(inv => {
    if (!inv.id || !inv.description || inv.amount === undefined || !inv.status) {
      throw new Error(`Data Integrity Exception: Invoice object row parsing failed for record identity token: ${inv.id || 'Unknown ID'}`);
    }

    const isOpenBalance = inv.status.toLowerCase() === 'unpaid' || inv.status.toLowerCase() === 'pending';
    const cleanInvoiceNumber = inv.invoice_number || String(inv.id).slice(0, 8);
    const formattedAmount = parseFloat(inv.amount).toFixed(2);

    return `
      <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 16px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 0.85rem !important;">
        <div>
          <span style="font-weight: 800 !important; color: var(--text-dark) !important; display: block !important;">${inv.description}</span>
          <small style="color: var(--text-muted) !important; font-size: 0.72rem !important;">Invoice ID Token: <code>${cleanInvoiceNumber}</code> | Date: ${new Date(inv.created_at).toLocaleDateString()}</small>
        </div>
        <div style="display: flex !important; align-items: center !important; gap: 15px !important;">
          <strong style="font-size: 1rem !important; color: var(--text-dark) !important;">$${formattedAmount}</strong>
          <span style="padding: 4px 10px !important; border-radius: 4px !important; font-size: 0.68rem !important; font-weight: 800 !important; text-transform: uppercase !important; background: ${isOpenBalance ? '#fee2e2' : 'rgba(16, 185, 129, 0.1)'} !important; color: ${isOpenBalance ? '#ef4444' : 'var(--emerald)'} !important;">
            ${inv.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
