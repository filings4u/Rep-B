// ============================================================================
// 📁 MODULE CARD: COMPREHENSIVE CUSTOMER dossier PROFILE INSPECTOR ENGINE
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeDossierInspectorEngine();
  });

  async function initializeDossierInspectorEngine() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingToken = urlParams.get('token');
    const fallbackEmail = urlParams.get('email');

    if (!trackingToken && !fallbackEmail) {
      alert("System Redirect: No authentic profile coordinates specified in active navigation links.");
      window.location.href = "admin-dashboard.html";
      return;
    }

    try {
      let supabaseClient = window.supabase || window.supabaseClient || window.sb;
      if (!supabaseClient) throw new Error("Supabase integration reference offline.");

      console.log(`[Inspector Engine] Retrieving dossier record payload for token: ${trackingToken}`);

      // 1. DYNAMIC DATABASE FETCH: Scans your live orders table using the tracking key
      let query = supabaseClient.from('orders').select('*');
      
      if (trackingToken) {
        query = query.eq('tracking_number', trackingToken);
      } else {
        query = query.eq('email', fallbackEmail);
      }

      const { data: recordRow, error } = await query.maybeSingle();
      if (error) throw error;

      if (!recordRow) {
        document.getElementById("view-company-header").textContent = "Account Not Discovered";
        return;
      }

      // 2. PARSE THE COMPREHENSIVE NESTED METADATA FIELDS SECURELY
      const metadata = recordRow.collected_payload_metadata || {};

      const derivedCompanyName = recordRow.company_name || metadata.legal_entity_name || "Unnamed Corporate Entity";
      const derivedEin = metadata.taxpayer_ein || "Not Provided";
      const derivedEmail = metadata.email || recordRow.email || "Not Provided";
      const derivedAddress = metadata.office_address_street || metadata.office_address || "Not Provided";
      const derivedState = metadata.state_of_formation || recordRow.state || "US";

      // 3. INJECT THE REAL WIZARD VALUES LIVE ONTO THE SCREEN CANVAS
      document.getElementById("view-company-header").textContent = derivedCompanyName;
      document.getElementById("view-company-name").textContent = derivedCompanyName;
      document.getElementById("view-account-number").textContent = recordRow.tracking_number || "F4U-DIRECT";
      document.getElementById("view-ein").textContent = derivedEin;
      document.getElementById("view-email").textContent = derivedEmail;
      document.getElementById("view-address").textContent = derivedAddress;
      document.getElementById("view-state").textContent = derivedState.toUpperCase();
      document.getElementById("view-service").textContent = `${recordRow.service_title} ($${parseFloat(recordRow.total_fee).toFixed(2)})`;

      // Status Pill Pill Rendering Controls
      const statusPill = document.getElementById("view-status-pill");
      if (statusPill) {
        statusPill.textContent = (recordRow.status || "paid_validated").replace('_', ' ');
        if (String(recordRow.status).toLowerCase().includes("paid") || String(recordRow.status).toLowerCase().includes("validated")) {
          statusPill.style.background = "rgba(16, 185, 129, 0.1)";
          statusPill.style.color = "#10b981";
        } else {
          statusPill.style.background = "#fef3c7";
          statusPill.style.color = "#d97706";
        }
      }

      // 4. RENDER A RAW CLEAN DATA LOG FOR ADMIN ASSISTANCE OPERATIONS
      const dumpNode = document.getElementById("view-raw-json-dump");
      if (dumpNode) {
        dumpNode.textContent = JSON.stringify({ record_table_row: recordRow, collected_metadata: metadata }, null, 2);
      }

    } catch (err) {
      console.error("[Inspector Error Callback Block Exception Triggered]", err);
      document.getElementById("view-company-header").textContent = "Connection Interrupted";
    }
  }
})();
