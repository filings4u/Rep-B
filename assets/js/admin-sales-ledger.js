/**
 * 📁 FILE PATH: assets/js/admin-sales-ledger.js
 * Responsibility: Dynamic orders processing, sorting data matrices, and cross-tab token layout routing
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    streamDynamicSalesLedgerMatrix();
  });

  async function streamDynamicSalesLedgerMatrix() {
    const targetTableBox = document.getElementById("admin-global-sales-target-box");
    if (!targetTableBox) return;

    // Await core initialization properties gracefully from the shared script pipeline wrapper
    let clientInstance = window.supabaseInstance || window.supabaseClient;
    
    if (!clientInstance || typeof clientInstance.from !== 'function') {
      setTimeout(streamDynamicSalesLedgerMatrix, 200);
      return;
    }

    try {
      // Connect to your exact SQL table structure definition
      const { data: salesRecords, error } = await clientInstance
        .from('orders')
        .select('id, company_name, email, plan_tier, total_fee, tracking_number')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!salesRecords || salesRecords.length === 0) {
        targetTableBox.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 500;">No transactional history matrices detected inside storage systems.</td></tr>`;
        return;
      }

      targetTableBox.innerHTML = "";

      salesRecords.forEach((orderRow) => {
        const trElement = document.createElement("tr");
        trElement.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark); background: #ffffff;";

        const companyName = orderRow.company_name || "Unnamed Corporate Entity";
        const customerEmail = orderRow.email || "no-contact@email.com";
        const activePlanTier = String(orderRow.plan_tier || 'Starter').toUpperCase();
        const absoluteFeeValue = Number(orderRow.total_fee || 0).toFixed(2);
        const uniqueTrackingToken = orderRow.tracking_number || orderRow.id;

        // Render standard structured components matching your exact dashboard data cells
        trElement.innerHTML = `
          <td style="padding: 14px 12px; font-weight: 700; text-align: left; color: #0f172a;">${escapeInputStringCharacters(companyName)}</td>
          <td style="padding: 14px 12px; color: var(--text-muted); text-align: left;">${escapeInputStringCharacters(customerEmail)}</td>
          <td style="padding: 14px 12px; text-align: left;"><span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #f1f5f9; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">${escapeInputStringCharacters(activePlanTier)}</span></td>
          <td style="padding: 14px 12px; font-weight: 800; color: #0f172a; text-align: left;">$${absoluteFeeValue}</td>
          <td style="padding: 14px 12px; text-align: right;">
            <button class="view-details-action" onclick="window.navigateToAdminProfileViewCard('${encodeURIComponent(uniqueTrackingToken)}', '${encodeURIComponent(customerEmail)}')" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;">Manage Row</button>
          </td>
        `;
        targetTableBox.appendChild(trElement);
      });

    } catch (queryFault) {
      console.error("✕ Sales Ledger Extraction Exception:", queryFault);
      targetTableBox.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--staff-red); font-weight: 600; font-size: 0.85rem;">✕ Failed to establish real-time connection to your transaction database records.</td></tr>`;
    }
  }

  function escapeInputStringCharacters(rawTextString) {
    if (!rawTextString) return "";
    return String(rawTextString)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
