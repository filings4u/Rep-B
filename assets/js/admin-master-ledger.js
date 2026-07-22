/**
 * 📁 FILE PATH: assets/js/admin-master-ledger.js
 * Responsibility: Master Administrative Dashboard Synchronization Hub
 * Data Target: public.orders (Single Table Source)
 */
(function() {
  "use strict";

  // --- 1. GLOBAL WINDOW HOOK: CONTROL SIDEBAR PANELS ACCORDIONS ---
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

  // --- 2. STARTUP EXECUTION BLOCK LOOP ---
  document.addEventListener("DOMContentLoaded", () => {
    streamUnifiedAdministrativeDataGrid();
  });

  async function streamUnifiedAdministrativeDataGrid() {
    const salesTableBody = document.getElementById("admin-global-sales-target-box");
    const clientDropdown = document.getElementById("adminClientDropdown");
    const commsStreamBox = document.getElementById("admin-inbox-live-stream-box");
    
    // Summary Card Target Elements
    const revenueCard  = document.getElementById("stat-total-revenue");
    const activeCard   = document.getElementById("stat-active-users");
    const pendingCard  = document.getElementById("stat-pending-filings");

    if (!salesTableBody) return;

    // Gracefully check for your global database engine instance connection layout
    let client = window.supabaseInstance || window.supabaseClient;
    if (!client || typeof client.from !== 'function') {
      setTimeout(streamUnifiedAdministrativeDataGrid, 200);
      return;
    }

    try {
      // 🟢 THE RESOLUTION PIPELINE: Fetch everything directly from public.orders
      const { data: records, error } = await client
        .from('orders')
        .select('id, company_name, email, plan_tier, total_fee, status, tracking_number, created_at, service_title')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!records || records.length === 0) {
        salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 500;">No corporate transactional profiles found inside database layers.</td></tr>`;
        if (revenueCard) revenueCard.textContent = "$0.00";
        if (activeCard) activeCard.textContent = "0";
        if (pendingCard) pendingCard.textContent = "0";
        return;
      }

      // --- INITIALIZE REAL-TIME CALCULATORS ---
      let cumulativeRevenueValue = 0;
      let totalActiveEntitiesCount = 0;
      let pendingAuditsCount       = 0;
      let supportLogMarkups        = "";

      salesTableBody.innerHTML = "";

      // Hydrate selection option values dynamically to filter messaging operations
      if (dropdownSelectIsValid(clientDropdown)) {
        clientDropdown.innerHTML = `<option value="">-- Choose Target Account Profile --</option>`;
        const distinctAccountEmails = [...new Set(records.map(item => item.email).filter(Boolean))];
        distinctAccountEmails.forEach(email => {
          const opt = document.createElement("option");
          opt.value = email;
          opt.textContent = email;
          clientDropdown.appendChild(opt);
        });
      }

      // --- PROCESS RECORD SET ROWS ---
      records.forEach((rowItem) => {
        // Tabulate cumulative financial sum totals
        const rowFee = parseFloat(rowItem.total_fee || 0);
        cumulativeRevenueValue += rowFee;

        const currentStandingStatus = String(rowItem.status || '').toLowerCase().trim();
        
        // Define interface tracking count metrics categories
        if (currentStandingStatus === 'paid' || currentStandingStatus === 'fulfillment lane') {
          totalActiveEntitiesCount++;
        } else if (currentStandingStatus === 'pending' || currentStandingStatus === 'audit required') {
          pendingAuditsCount++;
        }

        // Generate matching communication data log parameters
        const logTime = new Date(rowItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        supportLogMarkups += `<p style="margin: 0 0 8px 0; line-height: 1.4; text-align: left; font-size: 0.82rem; color: #475569;">📦 <strong>[${logTime}] New Order:</strong> ${escapeCharacterMarkup(rowItem.company_name)} initialized ${rowItem.plan_tier}</p>`;

        // Render corporate ledger grid elements dynamically
        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark); background: #ffffff;";

        let pillBackground = '#e2e8f0';
        let pillTextStyleColor = '#475569';
        if (currentStandingStatus === 'paid' || currentStandingStatus === 'fulfillment lane') {
          pillBackground = '#e6f4ea';
          pillTextStyleColor = '#137333';
        } else if (currentStandingStatus === 'pending') {
          pillBackground = '#fffbe6';
          pillTextStyleColor = '#b45309';
        }

        const uniqueTrackingToken = rowItem.tracking_number || rowItem.id;
        const targetEmailString   = rowItem.email || "no-contact@email.com";

        tr.innerHTML = `
          <td style="padding: 14px 12px; font-weight: 700; color: var(--text-dark); text-align: left;">${escapeCharacterMarkup(rowItem.company_name)}</td>
          <td style="padding: 14px 12px; color: var(--text-muted); text-align: left;">${escapeCharacterMarkup(rowItem.email)}</td>
          <td style="padding: 14px 12px; text-align: left;"><span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #f1f5f9; color: #334155; text-transform: uppercase;">${escapeCharacterMarkup(rowItem.plan_tier)}</span></td>
          <td style="padding: 14px 12px; font-weight: 800; color: #0f172a; text-align: left;">$${rowFee.toFixed(2)}</td>
          <td style="padding: 14px 12px; text-align: right;">
            <button class="view-details-action" onclick="window.navigateToAdminProfileViewCard('${encodeURIComponent(uniqueTrackingToken)}', '${encodeURIComponent(targetEmailString)}')" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;">Manage</button>
          </td>
        `;
        salesTableBody.appendChild(tr);
      });

      // --- HYDRATE METRICS DISPLAY INTERFACES ---
      if (revenueCard) revenueCard.textContent = `$${cumulativeRevenueValue.toFixed(2)}`;
      if (activeCard)  activeCard.textContent  = totalActiveEntitiesCount.toString();
      if (pendingCard) pendingCard.textContent = pendingAuditsCount.toString();
      if (commsStreamBox && supportLogMarkups !== "") commsStreamBox.innerHTML = supportLogMarkups;

    } catch (err) {
      console.error("✕ Master administrative layout streaming exception:", err);
      salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--staff-red); font-weight: 600; font-size: 0.85rem;">✕ Failed to establish real-time dashboard data pipeline grid connection.</td></tr>`;
    }
  }

  // Navigation controller mapping functionality parameters
  window.navigateToAdminProfileViewCard = function(token, email) {
    if (!token) return;
    window.location.href = `admin-profile-view.html?token=${token}&email=${email}`;
  };

  function dropdownSelectIsValid(element) {
    return element !== null && element !== undefined;
  }

  function escapeCharacterMarkup(text) {
    if (!text) return "";
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

    // ============================================================================ //
  // 🚀 ATTACH ALERT SUBMISSION LISTENER DIRECTLY INTO MASTER PIPELINE            //
  // ============================================================================ //
  const alertForm = document.getElementById("adminAlertForm");
  const alertStatusDiv = document.getElementById("alertStatus");

  if (alertForm) {
    alertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!clientDropdown || !alertStatusDiv) return;

      const targetAccountEmail = clientDropdown.value;
      const notificationTitle  = document.getElementById("alertTitle")?.value || "";
      const notificationBody   = document.getElementById("alertMessage")?.value || "";

      if (!targetAccountEmail || !notificationTitle || !notificationBody) {
        alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = "✕ Validation Error: All fields are required.";
        return;
      }

      alertStatusDiv.style.cssText = "color: var(--text-dark); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
      alertStatusDiv.textContent = "Processing dispatch matrix hooks...";

      try {
        // Appends custom alerts into your notifications table
        const { error: insertError } = await client
          .from('notifications')
          .insert([
            {
              recipient_email: targetAccountEmail,
              title: notificationTitle,
              message: notificationBody,
              is_unread: true,
              created_at: new Date().toISOString()
            }
          ]);

        if (insertError) throw insertError;

        alertStatusDiv.style.cssText = "color: var(--emerald); font-size: 0.8rem; margin-top: 10px; font-weight: 700;";
        alertStatusDiv.textContent = "✓ Real-Time Alert Pushed Successfully!";
        alertForm.reset();

      } catch (postFault) {
        console.error("✕ Notification Dispatch Interruption:", postFault.message);
        alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = `✕ Dispatch Failed: ${postFault.message}`;
      }
    });
  }

  
})();
