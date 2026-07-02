// ============================================================================
// 📁 MODULE CARD: FIXED OPERATIONAL GLOBAL SALES LEDGER MATRIX
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    console.log("[Admin Ledger Hub] Initializing synchronized sales rows...");

    try {
      let supabaseClient = window.supabase || window.supabaseClient || window.sb;
      if (!supabaseClient) throw new Error("Database initialization connection context dropped.");

      // 1. Fetch complete order sets live from the central schema orders tracking row
      const { data: globalMasterLedger, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const adminGridTableBody = document.getElementById("admin-global-sales-target-box");
      if (!adminGridTableBody) return;

      adminGridTableBody.innerHTML = ""; // Wipe loading indicators cleanly

      if (!globalMasterLedger || globalMasterLedger.length === 0) {
        adminGridTableBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No active corporate filing manifests logged to server data rows.</td></tr>`;
        return;
      }

      globalMasterLedger.forEach((rowItem) => {
        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: var(--text-dark);";

        // 🟢 DEEP NESTED DATA EXTRACTION: Pull variables from your JSONB metadata block safely
        const meta = rowItem.collected_payload_metadata || {};
        
        // COLUMN A: Filing Entity (Fallback gracefully to proposed names)
        const filingEntityName = rowItem.company_name || meta.legal_entity_name || "Unnamed Proposed Entity";
        
        // COLUMN B: Customer Email
        const customerEmailAddress = meta.email || rowItem.email || "Not Provided";
        
        // COLUMN C: Tier / Plan (Extract chosen tier or default to package description)
        const rawTierLabel = rowItem.plan_tier || meta.selected_package_title || "Standard Tier";
        const cleanTierDisplay = rawTierLabel.replace(/[^a-zA-Z0-9\s()]/g, " ").toUpperCase();

        tr.innerHTML = `
          <td style="padding: 14px 16px; font-weight: 700; color: #0a1f44; text-align: left;">
            ${filingEntityName}
          </td>
          <td style="padding: 14px 16px; font-family: monospace; color: var(--text-muted); text-align: left;">
            ${customerEmailAddress}
          </td>
          <td style="padding: 14px 16px; color: #475569; font-weight: 600; text-transform: uppercase; text-align: left; font-size: 0.75rem;">
            ${rowItem.service_title || 'Compliance Update'} <span style="color: var(--staff-red);">(${cleanTierDisplay})</span>
          </td>
          <td style="padding: 14px 16px; font-weight: 700; color: #10b981; text-align: left;">
            $${parseFloat(rowItem.total_fee || 0).toFixed(2)}
          </td>
          <td style="padding: 14px 16px; text-align: right;">
            <!-- 🟢 UPDATED ACTION ROUTING: Dispatches workers to the comprehensive customer audit card page -->
            <button type="button" class="btn-admin-action-view" onclick="window.navigateToAdminProfileViewCard('${rowItem.tracking_number || ''}', '${encodeURIComponent(customerEmailAddress)}')" style="cursor: pointer; background: #0a1f44; color: #ffffff; border: none; padding: 6px 14px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; transition: background 0.2s;">
              <i class="fa-solid fa-user-gear"></i> Inspect
            </button>
          </td>
        `;

        adminGridTableBody.appendChild(tr);
      });

    } catch (adminErr) {
      console.error("[Fatal Ledger Rendering Interception Exception]", adminErr);
    }
  });

  // ========================================================
  // 🎯 ROUTER OVERRIDE: TARGETS INDIVIDUAL CUSTOMER PROFILES
  // ========================================================
  window.navigateToAdminProfileViewCard = function(trackingToken, customerEmail) {
    if (!trackingToken) return;
    console.log(`[Admin Control] Launching profile overview dossier card for token: ${trackingToken}`);
    
    // Direct link to the brand new profile viewer interface layout
    window.location.href = `admin-profile-view.html?token=${encodeURIComponent(trackingToken)}&email=${customerEmail}`;
  };
})();
