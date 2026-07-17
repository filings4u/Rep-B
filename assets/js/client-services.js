/**
 * 🛠️ CLIENT SERVICES PROCUREMENT CATALOG UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Service catalog loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  
  // Dispatch dynamic table compilation parameters using the confirmed ID token
  fetchGlobalServicesPricingMatrix(session.user.id);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH PROCUREMENT ENTRIES
 * Gathers matrix entries from the system catalog tables and handles errors explicitly.
 */
async function fetchGlobalServicesPricingMatrix(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Operation aborted due to unverified context user identifiers.");
  }

  const gridTarget = document.getElementById("servicesProcurementCatalogGrid");
  if (!gridTarget) return; // Exit cleanly if this layout module is omitted from active view template structures

  // Pull operational items directly from your production services directory configuration
  const { data: catalogItems, error } = await window.supabaseInstance
    .from('services')
    .select('id, name, description, price')
    .order('price', { ascending: true });

  // STRICT ERROR CHECKING: Crash script execution loop immediately if operations throw failures
  if (error) {
    console.error("Catalog Table Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty catalog status layout requirements cleanly via feedback placeholders
  if (!catalogItems || catalogItems.length === 0) {
    gridTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No corporate procurement items currently deployment active inside operational system catalogs.</p>`;
    return;
  }

  // Build secure visual output layouts with absolute typecasting configurations
  gridTarget.innerHTML = catalogItems.map(item => {
    if (!item.id || !item.name || item.price === undefined) {
      throw new Error(`Data Integrity Exception: Failed mapping corrupted catalog index row parameter matching target ID: ${item.id || 'Unknown'}`);
    }

    const cleanDescription = item.description || 'Statutory legal filing provision matrix configuration task workflow execution.';
    const formattedPriceValue = parseFloat(item.price).toFixed(2);

    return `
      <div style="background: white !important; border: 1px solid var(--border-color) !important; border-radius: 10px !important; padding: 24px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 220px !important; box-sizing: border-box !important;">
        <div>
          <h3 style="margin: 0 0 8px 0 !important; font-size: 1.05rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">${item.name}</h3>
          <p style="margin: 0 !important; font-size: 0.8rem !important; color: var(--text-muted) !important; line-height: 1.4 !important; word-break: break-word;">${cleanDescription}</p>
        </div>
        <div style="margin-top: 24px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; padding-top: 14px !important; border-top: 1px solid #f1f5f9 !important; box-sizing: border-box !important;">
          <span style="font-size: 1.3rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">$${formattedPriceValue}</span>
          <button onclick="triggerServicePurchasePipeline('${encodeURIComponent(item.id)}', '${encodeURIComponent(item.name)}', ${parseFloat(item.price)}, '${encodeURIComponent(userId)}')" style="background: var(--emerald) !important; color: white !important; border: none !important; padding: 8px 16px !important; border-radius: 6px !important; font-weight: 700 !important; font-size: 0.78rem !important; cursor: pointer !important; transition: background 0.15s !important; display: inline-block;">
            Order Service
          </button>
        </div>
      </div>
    `;
  }).join('');
}
/**
 * ⚡ TRANSACTION PROCESSING PIPELINE
 * Dispatches aggregate mutations across sequential staging database layers.
 */
window.triggerServicePurchasePipeline = async function (serviceId, serviceName, price, userId) {
  "use strict";

  // Decode URI component parameters safely passed from the string templates
  const cleanServiceId = decodeURIComponent(serviceId);
  const cleanServiceName = decodeURIComponent(serviceName);
  const cleanUserId = decodeURIComponent(userId);
  const rawPriceNumber = parseFloat(price);

  if (!cleanServiceId || !cleanServiceName || isNaN(rawPriceNumber) || !cleanUserId) {
    throw new Error("Interaction Exception: Malformed transaction parameters submitted to pipeline dispatcher.");
  }

  const trackingVerifyCheck = confirm(`Confirm structural placement transaction generation for: "${cleanServiceName}" at $${rawPriceNumber.toFixed(2)}?`);
  if (!trackingVerifyCheck) return;

  // 1. Provision dynamic placement metadata entry inside core order system tables
  const { data: newOrderNode, error: orderErr } = await window.supabaseInstance
    .from('orders')
    .insert([{ 
      user_id: cleanUserId, 
      service_id: cleanServiceId, 
      total_amount: rawPriceNumber, 
      status: "Pending Payment" 
    }])
    .select()
    .single();

  if (orderErr) {
    console.error("Orders Table Insert Failure Context:", orderErr);
    throw new Error(`Database Transaction Failure [orders]: [${orderErr.code}] ${orderErr.message}`);
  }

  // 2. Provision companion layout accounting rows inside historical billing databases
  const { error: billingErr } = await window.supabaseInstance
    .from('billing_history')
    .insert([{ 
      user_id: cleanUserId, 
      description: `Procurement Invoice for ${cleanServiceName}`, 
      amount: rawPriceNumber, 
      status: "Unpaid" 
    }]);

  if (billingErr) {
    console.error("Billing History Ledger Write Failure Context:", billingErr);
    throw new Error(`Database Transaction Failure [billing_history]: [${billingErr.code}] ${billingErr.message}`);
  }

  alert("Operational procurement ledger lines recorded safely! Redirecting to structural billing panel...");
  window.location.href = "client-account.html";
};
