// ============================================================================
// 📁 MODULE CARD: INTEGRATED ACCORDION OVERLAY & SALES LEDGER SYSTEM
// ============================================================================
(function() {
  "use strict";

  // --- 1. GLOBAL WINDOW HOOK: EMPOWERS THE ACCORDION CLICKS ---
  window.toggleSidebarAccordion = function(buttonElement) {
    if (!buttonElement) return;
    
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    const chevron = buttonElement.querySelector(".chevron") || buttonElement.querySelector("span:last-child");

    if (panel && panel.style) {
      if (panel.style.maxHeight && panel.style.maxHeight !== "0px" && panel.style.maxHeight !== "") {
        panel.style.maxHeight = "0px";
        if (chevron) chevron.textContent = "▼";
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        if (chevron) chevron.textContent = "▲";
      }
    }
  };

  // --- 2. UNIFIED SERVER SYNCHRONIZER ENGINE ---
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(async () => {
      const client = window.supabaseClient || window.supabase;
      if (!client) {
        console.error("Database driver reference could not be located on mount.");
        return;
      }
      
      // Execute data streaming pipeline passes
      streamLiveOperationalLedgers(client);
      hydrateRecentActivityLogs(client);
    }, 50);
  });

  // --- 3. DYNAMIC LEDGER HYDRATION PIPELINE ---
  async function streamLiveOperationalLedgers(client) {
    const targetBox = document.getElementById("admin-global-sales-target-box");
    if (!targetBox) return;

    try {
      // Pull records down cleanly from your production orders data table
      const { data: databaseOrders, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!databaseOrders || databaseOrders.length === 0) {
        targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No corporate sales records discovered inside data layers.</td></tr>`;
        return;
      }

      targetBox.innerHTML = ""; // Wipe loading messages cleanly

      databaseOrders.forEach((rowItem) => {
        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark);";

        // Parse jsonb payload parameters safely
        const meta = rowItem.collected_payload_metadata || {};
        
        const legalCompanyName = rowItem.company_name || meta.legal_entity_name || "Unnamed Proposed Entity";
        const customerEmail = meta.email || rowItem.email || "Not Provided";
        const planTierLabel = rowItem.plan_tier || meta.selected_package_title || "Standard Tier";

        tr.innerHTML = `
          <td style="padding: 12px; font-weight: 700; color: var(--text-dark); text-align: left;">${legalCompanyName}</td>
          <td style="padding: 12px; color: var(--text-muted); font-family: monospace; text-align: left;">${customerEmail}</td>
          <td style="padding: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; text-align: left; font-size: 0.75rem;">
            ${rowItem.service_title || 'Compliance Filing'} <span style="color: var(--staff-red);">(${planTierLabel.toUpperCase()})</span>
          </td>
          <td style="padding: 12px; font-weight: 700; color: var(--emerald); text-align: left;">$${parseFloat(rowItem.total_fee || 0).toFixed(2)}</td>
          <td style="padding: 12px; text-align: right;">
            <button type="button" onclick="window.navigateToAdminProfileViewCard('${rowItem.tracking_number || ''}', '${encodeURIComponent(customerEmail)}')" style="cursor: pointer; background: var(--text-dark, #0f172a); color: #ffffff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
              View
            </button>
          </td>
        `;

        targetBox.appendChild(tr);
      });

    } catch (err) {
      console.error("Sales ledger streaming error intercept:", err);
      targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--staff-red); font-weight: 600;">✕ Failed to sync sales records.</td></tr>`;
    }
  }

  // --- 4. STREAM ACTIVITY MESSAGE TRACKERS ---
  async function hydrateRecentActivityLogs(client) {
    const staffEmailLog = document.getElementById("liveStaffEmailDisplayLog");
    const commsStreamBox = document.getElementById("admin-inbox-live-stream-box");
    
    try {
      const sessionCheck = await client.auth.getSession();
      const staffEmail = sessionCheck.data?.session?.user?.email || "internal-operator@filings4u.com";
      
      if (staffEmailLog) {
        staffEmailLog.innerHTML = `<i class="fa-solid fa-user-shield"></i> Operator Session: ${staffEmail}`;
      }

      // Query recent support messages matrix to hydrate Communications Stream panel box
      const { data: supportMessages } = await client
        .from('support_tickets')
        .select('subject, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (commsStreamBox && supportMessages && supportMessages.length > 0) {
        let streamMarkup = "";
        supportMessages.forEach(msg => {
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          streamMarkup += `<p style="margin: 0 0 8px 0; line-height: 1.4;">📬 <strong>[${time}] Ticket:</strong> ${msg.subject}</p>`;
        });
        commsStreamBox.innerHTML = streamMarkup;
      }
    } catch(e) {
      console.warn("Log environment hydration deferred.");
    }
  }

  // Global routing path redirection execution channel
  window.navigateToAdminProfileViewCard = function(trackingToken, customerEmail) {
    if (!trackingToken) return;
    window.location.href = `admin-profile-view.html?token=${encodeURIComponent(trackingToken)}&email=${customerEmail}`;
  };
})();
