/**
 * 📁 FILE PATH: assets/js/admin-master-ledger.js
 * Responsibility: Strict Production Administrative Control Center
 * Data Target: public.orders (Single Table Source Data-Grid)
 */
(function() {
  "use strict";

  // --- 1. GLOBAL WINDOW ACCORDION LAYOUT FRAMEWORKS ---
  window.toggleSidebarAccordion = function(buttonElement) {
    if (!buttonElement) {
      console.error("✕ Accordion Error: Trigger button element is missing.");
      return;
    }
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    const chevron = buttonElement.querySelector(".chevron") || buttonElement.querySelector("span:last-child");
    
    if (!panel) {
      console.error("✕ Accordion Error: Matching layout sub-panel element not found.");
      return;
    }
    
    if (panel.style) {
      if (panel.style.maxHeight && panel.style.maxHeight !== "0px" && panel.style.maxHeight !== "") {
        panel.style.maxHeight = "0px";
        if (chevron) chevron.textContent = "▼";
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        if (chevron) chevron.textContent = "▲";
      }
    }
  };

  // --- 2. PIPELINE SYSTEM RUNTIME STARTER LOOP ---
  document.addEventListener("DOMContentLoaded", () => {
    verifyAndStreamStrictAdminGrid();
  });
  async function verifyAndStreamStrictAdminGrid() {
    console.log("📊 [Strict Engine] Commencing structural interface element validations...");

    // Catch UI target anchors strictly
    const salesTableBody = document.getElementById("admin-global-sales-target-box");
    const clientDropdown = document.getElementById("adminClientDropdown");
    const commsStreamBox = document.getElementById("admin-inbox-live-stream-box");
    const staffEmailLog  = document.getElementById("liveStaffEmailDisplayLog");
    
    const revenueCard  = document.getElementById("stat-total-revenue");
    const activeCard   = document.getElementById("stat-active-users");
    const pendingCard  = document.getElementById("stat-pending-filings");

    // Enforce element tracking validation checks
    if (!salesTableBody) { throw new Error("✕ Critical UI Target Element Missing: 'admin-global-sales-target-box' tbody anchor is absent from the HTML layout."); }
    if (!clientDropdown) { console.error("✕ UI Verification Alert: Dropdown target element ID 'adminClientDropdown' is missing."); }
    if (!commsStreamBox) { console.error("✕ UI Verification Alert: Inbox logging element ID 'admin-inbox-live-stream-box' is missing."); }
    if (!staffEmailLog)  { console.error("✕ UI Verification Alert: Staff tracking display label element ID 'liveStaffEmailDisplayLog' is missing."); }
    if (!revenueCard || !activeCard || !pendingCard) { console.warn("⚠ UI Verification Alert: One or more score status cards element targets evaluate to absent."); }

    // Fetch master client initialization instances cleanly
    const client = window.supabaseInstance || window.supabaseClient;
    if (!client || typeof client.from !== 'function') {
      throw new Error("✕ Critical System Error: The global Supabase client connection has not been initialized on the window scope namespace layout.");
    }

    // --- ENFORCE ABSOLUTE USER VALIDITY CONTROL CHANNELS ---
    console.log("🔒 [Strict Engine] Running session authentication layer check...");
    const { data: sessionData, error: authError } = await client.auth.getSession();
    
    if (authError) {
      throw new Error(`✕ Cryptographic Session Authorization Rejected: ${authError.message}`);
    }
    
    if (!sessionData || !sessionData.session || !sessionData.session.user) {
      if (staffEmailLog) { staffEmailLog.innerHTML = `<span style="color:var(--staff-red); font-weight:700;">✕ Administrative Session Invalid</span>`; }
      throw new Error("✕ Unauthenticated Command Error: No active administrative user session token detected. Access to database rows has been halted safely.");
    }

    const currentStaffEmail = sessionData.session.user.email;
    if (staffEmailLog) {
      staffEmailLog.innerHTML = `<span><i class="fa-solid fa-user-shield"></i> Operator Session: ${currentStaffEmail}</span>`;
    }
    // --- EXECUTE DIRECT PRODUCTION DATA QUERY MATRIX ---
    try {
      console.log(`📡 [Strict Engine] Dispatching database request payload out to table space for user: [${currentStaffEmail}]`);

      // 🟢 RAW DB SOURCE HANDSHAKE: Request data columns matching your explicit orders schema table parameters
      const { data: records, error: queryError } = await client
        .from('orders')
        .select('id, company_name, email, plan_tier, total_fee, status, tracking_number, created_at, service_title')
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(`Postgres Database Operational Exception [Code ${queryError.code || 'UNKNOWN'}]: ${queryError.message}`);
      }

      // Check for valid array configurations
      if (!records || records.length === 0) {
        console.warn("ℹ️ [Strict Engine] System connected successfully, but no rows match query properties inside table: [public.orders].");
        salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">The platform database table is currently empty.</td></tr>`;
        return;
      }

      // Initialize calculation registers
      let totalRevenueCounter = 0;
      let totalActiveCounter  = 0;
      let pendingAuditsCounter = 0;
      let logStreamMarkup     = "";

      salesTableBody.innerHTML = "";

      // Hydrate search target selectors dropdown options cleanly
      if (clientDropdown) {
        clientDropdown.innerHTML = `<option value="">-- Choose Target Account Profile --</option>`;
        const uniqueEmails = [...new Set(records.map(row => row.email).filter(Boolean))];
        uniqueEmails.forEach(email => {
          const opt = document.createElement("option");
          opt.value = email;
          opt.textContent = email;
          clientDropdown.appendChild(opt);
        });
      }
      // Run record sets rendering loops
      records.forEach((rowItem) => {
        const feeValue = parseFloat(rowItem.total_fee || 0);
        totalRevenueCounter += feeValue;

        const currentStatus = String(rowItem.status || '').toLowerCase().trim();
        if (currentStatus === 'paid' || currentStatus === 'fulfillment lane') {
          totalActiveCounter++;
        } else if (currentStatus === 'pending' || currentStatus === 'audit required') {
          pendingAuditsCounter++;
        }

        const logTime = new Date(rowItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        logStreamMarkup += `<p style="margin: 0 0 8px 0; line-height: 1.4; text-align: left; font-size: 0.82rem; color: #475569;">📬 <strong>[${logTime}] Order Sync:</strong> ${escapeHtml(rowItem.company_name)} placed ${rowItem.plan_tier}</p>`;

        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark); background: #ffffff;";

        let pillStyle = "background: #fffbe6; color: #b45309;"; 
        if (currentStatus === 'paid' || currentStatus === 'fulfillment lane') {
          pillStyle = "background: #e6f4ea; color: #137333;";
        }

        const trackingToken = rowItem.tracking_number || rowItem.id;
        const targetEmail   = rowItem.email || "";

        tr.innerHTML = `
          <td style="padding: 14px 12px; font-weight: 700; color: var(--text-dark); text-align: left;">${escapeHtml(rowItem.company_name)}</td>
          <td style="padding: 14px 12px; color: var(--text-muted); text-align: left;">${escapeHtml(rowItem.email)}</td>
          <td style="padding: 14px 12px; text-align: left;"><span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #f1f5f9; color: #334155; text-transform: uppercase;">${escapeHtml(rowItem.plan_tier)}</span></td>
          <td style="padding: 14px 12px; font-weight: 800; color: #0f172a; text-align: left;">$${feeValue.toFixed(2)}</td>
          <td style="padding: 14px 12px; text-align: right;">
            <button class="view-details-action" onclick="window.navigateToAdminProfileViewCard('${encodeURIComponent(trackingToken)}', '${encodeURIComponent(targetEmail)}')" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;">Manage</button>
          </td>
        `;
        salesTableBody.appendChild(tr);
      });

      // Commit metrics calculations up to display view elements
      if (revenueCard) revenueCard.textContent = `$${totalRevenueCounter.toFixed(2)}`;
      if (activeCard)  activeCard.textContent  = totalActiveCounter.toString();
      if (pendingCard) pendingCard.textContent = pendingAuditsCounter.toString();
      if (commsStreamBox && logStreamMarkup !== "") commsStreamBox.innerHTML = logStreamMarkup;

    } catch (queryFault) {
      salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--staff-red); font-weight: 600; font-size: 0.85rem;">✕ Execution Halted: Check system console logs.</td></tr>`;
      throw queryFault; // Throw up to window space un-bypassed
    }
  }

  window.navigateToAdminProfileViewCard = function(token, email) {
    if (!token) return;
    window.location.href = `admin-profile-view.html?token=${token}&email=${email}`;
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  // --- 3. ATTACH NOTIFICATION PUSH LOGIC STRICTLY TO SUBMIT ACTIONS ---
  document.addEventListener("DOMContentLoaded", () => {
    const alertForm = document.getElementById("adminAlertForm");
    const alertStatusDiv = document.getElementById("alertStatus");
    const dropdownSelect = document.getElementById("adminClientDropdown");

    if (alertForm) {
      alertForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!dropdownSelect || !alertStatusDiv) return;

        const targetAccountEmail = dropdownSelect.value;
        const notificationTitle  = document.getElementById("alertTitle")?.value || "";
        const notificationBody   = document.getElementById("alertMessage")?.value || "";

        let clientInstance = window.supabaseInstance || window.supabaseClient;
        if (!clientInstance) { 
          throw new Error("✕ Messaging Request Dropped: Active database connection reference unavailable."); 
        }

        if (!targetAccountEmail || !notificationTitle || !notificationBody) {
          alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
          alertStatusDiv.textContent = "✕ Validation Error: All form fields are required.";
          return;
        }

        alertStatusDiv.style.cssText = "color: var(--text-dark); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = "Processing dispatch matrix hooks...";

        try {
          const { error: insertError } = await clientInstance
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
          alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
          alertStatusDiv.textContent = `✕ Dispatch Failed: Check system console logs.`;
          throw new Error(`✕ Notification Entry Injection Failure: ${postFault.message}`);
        }
      });
    }
  });

})(); // ✅ CLOSES ROOT MODULE SCOPE CORRECTLY HERE
