// BLOCK 1: Global Administrative Initialization and Session Verification
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

  // 1. Core Supabase Instance Checks
  const client = window.supabaseInstance || window.supabaseClient;
  if (!client || typeof client.from !== 'function') {
    throw new Error("✕ Critical System Error: The global Supabase client connection has not been initialized on the window scope namespace layout.");
  }

  // 2. Resolve document layout targets across multi-view layers
  const salesTableBody = document.getElementById("admin-global-sales-target-box");
  const clientDropdown = document.getElementById("adminClientDropdown");
  const commsStreamBox = document.getElementById("admin-inbox-live-stream-box");
  const staffEmailLog = document.getElementById("liveStaffEmailDisplayLog");
  const revenueCard = document.getElementById("stat-total-revenue");
  const activeCard = document.getElementById("stat-active-users");
  const pendingCard = document.getElementById("stat-pending-filings");

  // 3. GLOBAL SECURITY PASSTHROUGH: Validate session metrics first so ALL pages remain securely authenticated
  console.log("🔒 [Strict Engine] Running session authentication layer check...");
  const { data: sessionData, error: authError } = await client.auth.getSession();
  
  if (authError) {
    throw new Error(`✕ Cryptographic Session Authorization Rejected: ${authError.message}`);
  }

  if (!sessionData || !sessionData.session || !sessionData.session.user) {
    if (staffEmailLog) {
      staffEmailLog.innerHTML = `<span style="color:var(--staff-red); font-weight:700;">✕ Administrative Session Invalid</span>`;
    }
    throw new Error("✕ Unauthenticated Command Error: No active administrative user session token detected. Access to database rows has been halted safely.");
  }

  const currentStaffEmail = sessionData.session.user.email;
  
  // Hydrate the universal shield operator layout element on both chat and analytics pages smoothly
  if (staffEmailLog) {
    staffEmailLog.innerHTML = `<span><i class="fa-solid fa-user-shield"></i> Operator Session: ${currentStaffEmail}</span>`;
  }

  // 4. TARGETED CONDITIONAL EXIT: Safely step out now if we are on the Chat view window
  if (!salesTableBody) {
    console.log("ℹ️ [Strict Engine] View validation complete: Chat canvas detected. Handing thread control over to roster synchronizers.");
    return; 
  }

  // 5. Ledger-Specific Interface Alerts (Only processed if on the dashboard grid page)
  if (!clientDropdown) console.error("✕ UI Verification Alert: Dropdown target element ID 'adminClientDropdown' is missing.");
  if (!commsStreamBox) console.error("✕ UI Verification Alert: Inbox logging element ID 'admin-inbox-live-stream-box' is missing.");
  if (!revenueCard || !activeCard || !pendingCard) {
    console.warn("⚠ UI Verification Alert: One or more score status cards element targets evaluate to absent.");
  }

  // --- 6. EXECUTE DIRECT PRODUCTION DATA QUERY MATRIX ---
  try {
    console.log(`📡 [Strict Engine] Dispatching database request payload out to table space for user: [${currentStaffEmail}]`);

    // 🟢 PARALLEL FETCH CONTEXT: Pull active sales orders and pending ticket counts simultaneously
    const [ordersResponse, ticketsCountResponse] = await Promise.all([
      client.from('orders').select('id, company_name, email_address, selected_plan, total_paid_amount, account_created, tracking_number, created_at').order('created_at', { ascending: false }),
      client.from('after_hours_tickets').select('ticket_id', { count: 'exact', head: true }).eq('status', 'Pending')
    ]);

    if (ordersResponse.error) {
      throw new Error(`Postgres Database Operational Exception [Code ${ordersResponse.error.code || 'UNKNOWN'}]: ${ordersResponse.error.message}`);
    }

    const records = ordersResponse.data || [];
    
    // 🟢 DYNAMIC COUNT CONVERSION: Pull the exact count matching pending parameters safely
    const totalPendingTicketsCount = ticketsCountResponse.count || 0;

    if (records.length === 0) {
      console.warn("ℹ️ [Strict Engine] System connected successfully, but no rows match inside table: [public.orders].");
      salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">The platform database table is currently empty.</td></tr>`;
      
      // Still display the pending after-hours count card even if sales rows are zero
      if (pendingCard) pendingCard.textContent = totalPendingTicketsCount.toString();
      return;
    }

    // Initialize calculation registers
    let totalRevenueCounter = 0;
    let totalActiveCounter = 0;
    let logStreamMarkup = "";

    salesTableBody.innerHTML = "";

    if (clientDropdown) {
      clientDropdown.innerHTML = `<option value="">-- Choose Target Account Profile --</option>`;
      const uniqueEmails = [...new Set(records.map(row => row.email_address).filter(Boolean))];
      uniqueEmails.forEach(email => {
        const opt = document.createElement("option");
        opt.value = email;
        opt.textContent = email;
        clientDropdown.appendChild(opt);
      });
    }

    // Run record sets rendering loops
    records.forEach((rowItem) => {
      const feeValue = parseFloat(rowItem.total_paid_amount || 0);
      totalRevenueCounter += feeValue;

      // Calculate active accounts using your account_created boolean flag
      if (rowItem.account_created === true) {
        totalActiveCounter++;
      }

      const logTime = new Date(rowItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Resolve escape text safely before generating template literals strings
      const escapedCompany = (typeof escapeHtml === "function") ? escapeHtml(rowItem.company_name) : String(rowItem.company_name);
      const escapedPlan = (typeof escapeHtml === "function") ? escapeHtml(rowItem.selected_plan) : String(rowItem.selected_plan);
      const escapedEmail = (typeof escapeHtml === "function") ? escapeHtml(rowItem.email_address) : String(rowItem.email_address);

      logStreamMarkup += `<p style="margin: 0 0 8px 0; line-height: 1.4; text-align: left; font-size: 0.82rem; color: #475569;">📬 <strong>[${logTime}] Order Sync:</strong> ${escapedCompany} placed ${escapedPlan}</p>`;

      const tr = document.createElement("tr");
      tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark); background: #ffffff;";
      
      const trackingToken = rowItem.tracking_number || rowItem.id;

      tr.innerHTML = `
        <td style="padding: 14px 12px; font-weight: 700; color: var(--text-dark); text-align: left;">${escapedCompany}</td>
        <td style="padding: 14px 12px; color: var(--text-muted); text-align: left;">${escapedEmail}</td>
        <td style="padding: 14px 12px; text-align: left;"><span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #f1f5f9; color: #334155; text-transform: uppercase;">${escapedPlan}</span></td>
        <td style="padding: 14px 12px; font-weight: 800; color: #0f172a; text-align: left;">$${feeValue.toFixed(2)}</td>
        <td style="padding: 14px 12px; text-align: right;">
          <button class="view-details-action" onclick="window.navigateToAdminProfileViewCard('${encodeURIComponent(trackingToken)}', '${encodeURIComponent(escapedEmail)}')" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;">Manage</button>
        </td>
      `;
      salesTableBody.appendChild(tr);
    });

    // Commit metrics calculations up to display view elements
    if (revenueCard) revenueCard.textContent = `$${totalRevenueCounter.toFixed(2)}`;
    if (activeCard) activeCard.textContent = totalActiveCounter.toString();
    
    // 🟢 FIXED VISUAL ELEMENT: Populates card count metric accurately out of your actual after-hours table records
    if (pendingCard) pendingCard.textContent = totalPendingTicketsCount.toString();
    
    if (commsStreamBox && logStreamMarkup !== "") commsStreamBox.innerHTML = logStreamMarkup;

  } catch (queryFault) {
    console.error("✕ Strict Engine crash caught:", queryFault.message);
    if (salesTableBody) {
      salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--staff-red); font-weight: 600; font-size: 0.85rem;">✕ Execution Halted: Check system console logs.</td></tr>`;
    }
    throw queryFault;
  }
}

window.navigateToAdminProfileViewCard = function(token, email) {
  if (!token) return;
  window.location.href = `admin-profile-view.html?token=${token}&email=${email}`;
};

  // Universal safe visual text string markup loader utility
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
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
        const notificationTitle = document.getElementById("alertTitle")?.value || "";
        const notificationBody = document.getElementById("alertMessage")?.value || "";

        let clientInstance = window.supabaseInstance || window.supabaseClient;
        if (!clientInstance) {
          throw new Error("✕ Messaging Request Dropped: Active database connection reference unavailable.");
        }

        if (!targetAccountEmail || !notificationTitle || !notificationBody) {
          if (alertStatusDiv) {
            alertStatusDiv.style.cssText = "display: block; color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(193,82,84,0.1);";
            alertStatusDiv.textContent = "✕ Validation Error: All form fields are required.";
          }
          return;
        }

        if (alertStatusDiv) {
          alertStatusDiv.style.cssText = "display: block; color: var(--text-dark); font-size: 0.8rem; margin-top: 10px; font-weight: 600; background: #f1f5f9; padding: 8px 12px; border-radius: 6px;";
          alertStatusDiv.textContent = "Processing dispatch matrix hooks...";
        }

        try {
          console.log(`📡 [Notification Engine] Querying client metadata registry for: [${targetAccountEmail}]`);
          
          // 🟢 FIXED: Adjusted matching column string to query email_address from public table
          const { data: profile, error: profileError } = await clientInstance
            .from('client_profiles')
            .select('id')
            .eq('email_address', String(targetAccountEmail).toLowerCase().trim())
            .maybeSingle();

          if (profileError || !profile) {
            throw new Error("Target account lookup failed: Corresponding client_profiles record missing.");
          }

          console.log("💾 [Notification Engine] Inserting transaction row into public.portal_notifications...");

          // 🟢 TARGETS PORTAL_NOTIFICATIONS: Maps variables directly to your exact table structure
          const { error: insertError } = await clientInstance
            .from('portal_notifications')
            .insert([
              {
                user_id: profile.id, // Must match an existing token reference key in auth.users(id)
                title: notificationTitle.trim(),
                message: notificationBody.trim(),
                recipient_email: String(targetAccountEmail).toLowerCase().trim(),
                email_address: String(targetAccountEmail).toLowerCase().trim(),
                is_read: false,
                is_archived: false,
                created_at: new Date().toISOString()
              }
            ]);

          if (insertError) throw insertError;

          if (alertStatusDiv) {
            alertStatusDiv.style.cssText = "display: block; color: var(--emerald); font-size: 0.8rem; margin-top: 10px; font-weight: 700; background: #ecfdf5; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.1);";
            alertStatusDiv.textContent = "✓ Real-Time Alert & Email Trigger Dispatched Successfully!";
          }
          
          alertForm.reset();

        } catch (postFault) {
          console.error("✕ Notification insertion failed:", postFault.message);
          if (alertStatusDiv) {
            alertStatusDiv.style.cssText = "display: block; color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(193,82,84,0.1);";
            alertStatusDiv.textContent = `✕ Dispatch Failed: ${postFault.message}`;
          }
        }
      });
    }
  });

})(); // ✅ CLOSES ROOT MODULE SCOPE SAFELY
