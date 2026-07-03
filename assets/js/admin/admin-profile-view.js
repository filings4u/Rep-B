// ============================================================================
// 📁 MODULE CARD: FIXED CUSTOMER DOSSIER WIRE CONTROLLER ENGINE
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // 50ms defensive delay check ensures central config completes bootstrapping
    setTimeout(() => {
      initializeLiveDossierInspector();
    }, 100);
  });

  async function initializeLiveDossierInspector() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingToken = urlParams.get('token');
    const fallbackEmail = urlParams.get('email');

    // Element Target Coordinates
    const headerNode = document.getElementById("view-company-header");
    const nameNode = document.getElementById("view-company-name");
    const accountNode = document.getElementById("view-account-number");
    const einNode = document.getElementById("view-ein");
    const emailNode = document.getElementById("view-email");
    const addressNode = document.getElementById("view-address");
    const stateNode = document.getElementById("view-state");
    const serviceNode = document.getElementById("view-service");
    const statusPill = document.getElementById("view-status-pill");

    if (!trackingToken && !fallbackEmail) {
      if (headerNode) headerNode.textContent = "Profile Link Invalid";
      return;
    }

    try {
      // Look up your failsafe central database wrapper connection
      let supabaseClient = window.supabaseClient || window.supabase || window.sb;
      if (!supabaseClient || typeof supabaseClient.from !== 'function') {
        if (headerNode) headerNode.textContent = "Database Connection Delayed";
        return;
      }

      console.log(`[Inspector Engine] Fetching rows matching token: ${trackingToken}`);

      // 1. QUERY THE ORDERS REPOSITORY DYNAMICALLY
      let orderQuery = supabaseClient.from('orders').select('*');
      
      if (trackingToken && trackingToken !== "null") {
        orderQuery = orderQuery.eq('tracking_number', trackingToken);
      } else {
        orderQuery = orderQuery.eq('email', decodeURIComponent(fallbackEmail));
      }

      const { data: recordRow, error: orderError } = await orderQuery.maybeSingle();
      if (orderError) throw orderError;

      if (!recordRow) {
        if (headerNode) headerNode.textContent = "Profile Record Vacant";
        return;
      }

      // 2. 🟢 PEEL WIZARD VALUES NATIVELY FROM THE CENTRAL JSONB METADATA CELL
      const metadata = recordRow.collected_payload_metadata || {};

      const finalCompanyName = recordRow.company_name || metadata.legal_entity_name || "Filing Under Review";
      const finalEin = metadata.taxpayer_ein || "Not Provided";
      const finalEmail = metadata.email || recordRow.email || "Not Provided";
      
      // Clean empty physical office coordinates strings
      const street = metadata.office_address_street || "";
      const city = metadata.office_address_city || "";
      const zip = metadata.office_address_zip || "";
      const combinedAddress = `${street} ${city} ${zip}`.trim().replace(/\s+/g, ' ');
      const finalAddress = combinedAddress || metadata.office_address || "Not Provided";
      
      const finalState = metadata.state_of_formation || recordRow.state_of_formation || recordRow.state || "US";
      const finalService = recordRow.service_title || metadata.selected_package_title || "Fulfillment Compliance Service";
      const finalFee = parseFloat(recordRow.total_fee) || parseFloat(metadata.financials_subtotal) || 0;

      // 3. INJECT PRODUCTION PARAMETERS DIRECTLY ONTO CELL BORDERS LAYOUT
      if (headerNode) headerNode.textContent = finalCompanyName;
      if (nameNode) nameNode.textContent = finalCompanyName;
      if (accountNode) accountNode.textContent = recordRow.tracking_number || "F4U-DIRECT";
      if (einNode) einNode.textContent = finalEin;
      if (emailNode) emailNode.textContent = finalEmail;
      if (addressNode) addressNode.textContent = finalAddress;
      if (stateNode) stateNode.textContent = finalState.toUpperCase();
      if (serviceNode) serviceNode.textContent = `${finalService} ($${finalFee.toFixed(2)})`;

      // 4. BALANCE STATUS BADGE DECORATIONS
      if (statusPill) {
        const cleanStatus = (recordRow.status || "paid_validated").toLowerCase();
        statusPill.textContent = cleanStatus.toUpperCase().replace('_', ' ');
        
        if (cleanStatus.includes("paid") || cleanStatus.includes("validated") || cleanStatus.includes("active")) {
          statusPill.style.background = "rgba(16, 185, 129, 0.1)";
          statusPill.style.color = "#10b981";
        } else {
          statusPill.style.background = "#fef3c7";
          statusPill.style.color = "#d97706";
        }
      }

    } catch (err) {
      console.error("[Fatal Profile Wire Exception Caught]", err);
      if (headerNode) headerNode.textContent = "Data Sync Timeout";
    }
  }
})();
