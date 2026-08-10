// BLOCK 1: Global Window Controls and Administrative Authentication Handshake
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

// --- 2. PIPELINE SYSTEM RUNTIME STARTER LOOP --- (CORRECTED)
document.addEventListener("DOMContentLoaded", () => {
  verifyAndStreamStrictAdminGrid();
});

async function verifyAndStreamStrictAdminGrid() {
  console.log("📊 [Strict Engine] Commencing structural interface element validations...");

  // Catch UI target anchors strictly
  const salesTableBody = document.getElementById("admin-global-sales-target-box");
  const clientDropdown = document.getElementById("adminClientDropdown");
  const commsStreamBox = document.getElementById("admin-inbox-live-stream-box");
  const staffEmailLog = document.getElementById("liveStaffEmailDisplayLog");
  const revenueCard = document.getElementById("stat-total-revenue");
  const activeCard = document.getElementById("stat-active-users");
  const pendingCard = document.getElementById("stat-pending-filings");

  // 🟢 FIXED PERIMETER SAFETY: Warn instead of crashing to prevent breaking client-side pages
  if (!salesTableBody) {
    console.log("ℹ️ [Strict Engine] Target anchor 'admin-global-sales-target-box' absent. Skipping admin-specific ledger hydration on this portal view.");
    return; 
  }

  if (!clientDropdown) console.error("✕ UI Verification Alert: Dropdown target element ID 'adminClientDropdown' is missing.");
  if (!commsStreamBox) console.error("✕ UI Verification Alert: Inbox logging element ID 'admin-inbox-live-stream-box' is missing.");
  if (!staffEmailLog) console.error("✕ UI Verification Alert: Staff tracking display label element ID 'liveStaffEmailDisplayLog' is missing.");
  if (!revenueCard || !activeCard || !pendingCard) {
    console.warn("⚠ UI Verification Alert: One or more score status cards element targets evaluate to absent.");
  }

  // Fetch master client initialization instances cleanly
  let client = window.supabaseInstance || window.supabaseClient;
  
  // 🟢 FIXED SAFETY TIMEOUT: Gracefully handles script loading races instead of throwing an error
  if (!client || typeof client.from !== 'function') {
    console.log("📡 [Strict Engine] Connection loading. Scheduling re-verification handshakes...");
    setTimeout(verifyAndStreamStrictAdminGrid, 200);
    return;
  }

  // --- ENFORCE ABSOLUTE USER VALIDITY CONTROL CHANNELS ---
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
  if (staffEmailLog) {
    staffEmailLog.innerHTML = `<span><i class="fa-solid fa-user-shield"></i> Operator Session: ${currentStaffEmail}</span>`;
  }

    // --- EXECUTE DIRECT PRODUCTION DATA QUERY MATRIX --- 
    try { 
        console.log(`📡 [Strict Engine] Dispatching database request payload out to table space for user: [${currentStaffEmail}]`); 
        
        // 🟢 RAW DB SOURCE HANDSHAKE: Request explicit columns from your actual orders schema
        const { data: records, error: queryError } = await client 
            .from('orders') .select('id, company_name, email_address, selected_plan, total_paid_amount, account_created, tracking_number, created_at') 
            .order('created_at', { ascending: false }); 

        if (queryError) { 
            throw new Error(`Postgres Database Operational Exception [Code ${queryError.code || 'UNKNOWN'}]: ${queryError.message}`); 
        } 

        if (!records || records.length === 0) { 
            console.warn("ℹ️ [Strict Engine] System connected successfully, but no rows match query properties inside table: [public.orders]."); 
            salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">The platform database table is currently empty.</td></tr>`; 
            return; 
        } 

        // Initialize calculation registers 
        let totalRevenueCounter = 0; 
        let totalActiveCounter = 0; 
        let pendingAuditsCounter = 0; 
        let logStreamMarkup = ""; 
        salesTableBody.innerHTML = ""; 

        // Hydrate search target selectors dropdown options cleanly 
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

            // Calculate active formations vs pending accounts via account_created boolean flag
            if (rowItem.account_created === true) { 
                totalActiveCounter++; 
            } else { 
                pendingAuditsCounter++; 
            } 

            const logTime = new Date(rowItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
            logStreamMarkup += `<p style="margin: 0 0 8px 0; line-height: 1.4; text-align: left; font-size: 0.82rem; color: #475569;">📬 <strong>[${logTime}] Order Sync:</strong> ${escapeHtml(rowItem.company_name)} placed ${rowItem.selected_plan}</p>`; 

            const tr = document.createElement("tr"); 
            tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-dark); background: #ffffff;"; 

            let pillStyle = "background: #fffbe6; color: #b45309;"; 
            if (rowItem.account_created === true) { 
                pillStyle = "background: #e6f4ea; color: #137333;"; 
            } 

            const trackingToken = rowItem.tracking_number || rowItem.id; 
            const targetEmail = rowItem.email_address || ""; 

            tr.innerHTML = ` 
                <td style="padding: 14px 12px; font-weight: 700; color: var(--text-dark); text-align: left;">${escapeHtml(rowItem.company_name)}</td> 
                <td style="padding: 14px 12px; color: var(--text-muted); text-align: left;">${escapeHtml(rowItem.email_address)}</td> 
                <td style="padding: 14px 12px; text-align: left;"><span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #f1f5f9; color: #334155; text-transform: uppercase;">${escapeHtml(rowItem.selected_plan)}</span></td> 
                <td style="padding: 14px 12px; font-weight: 800; color: #0f172a; text-align: left;">$${feeValue.toFixed(2)}</td> 
                <td style="padding: 14px 12px; text-align: right;"> 
                    <button class="view-details-action" onclick="window.navigateToAdminProfileViewCard('${encodeURIComponent(trackingToken)}', '${encodeURIComponent(targetEmail)}')" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;">Manage</button> 
                </td> 
            `; 
            salesTableBody.appendChild(tr); 
        }); 

        // Commit metrics calculations up to display view elements 
        if (revenueCard) revenueCard.textContent = `$${totalRevenueCounter.toFixed(2)}`; 
        if (activeCard) activeCard.textContent = totalActiveCounter.toString(); 
        if (pendingCard) pendingCard.textContent = pendingAuditsCounter.toString(); 
        if (commsStreamBox && logStreamMarkup !== "") commsStreamBox.innerHTML = logStreamMarkup; 

    } catch (queryFault) { 
        salesTableBody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--staff-red); font-weight: 600; font-size: 0.85rem;">✕ Execution Halted: Check system console logs.</td></tr>`; 
        throw queryFault; 
    } 
}
window.navigateToAdminProfileViewCard = function(token, email) { 
    if (!token) return; 
    window.location.href = `admin-profile-view.html?token=${token}&email=${email}`; 
}; 

function escapeHtml(str) { 
    if (!str) return ""; 
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"); 
} 

// ============================================================================
// --- 3. ATTACH NOTIFICATION PUSH LOGIC STRICTLY TO SUBMIT ACTIONS (CORRECTED) ---
// ============================================================================
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
        alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = "✕ Validation Error: All form fields are required.";
        return;
      }

      alertStatusDiv.style.cssText = "color: var(--text-dark); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
      alertStatusDiv.textContent = "Processing dispatch matrix hooks...";

      try {
        // 🟢 FIXED: Normalizing string natively in JavaScript using .toLowerCase() 
        const cleanTargetEmail = String(targetAccountEmail).trim().toLowerCase();

        // 🟢 FIXED COLUMN SCHEMA: Querying your exact 'email_address' table column matching client_profiles
        const { data: profileData, error: profileErr } = await clientInstance
          .from('client_profiles')
          .select('id')
          .eq('email_address', cleanTargetEmail)
          .maybeSingle();

        if (profileErr || !profileData) {
          throw new Error("Target client account profile id tracking lookups returned unassigned.");
        }

        // Maps directly into your public.portal_notifications table properties
        const { error: insertError } = await clientInstance
          .from('portal_notifications')
          .insert([
            {
              user_id: profileData.id,
              recipient_email: cleanTargetEmail,
              email_address: cleanTargetEmail, // Aligns with alternative schema validation cells safely
              title: notificationTitle,
              message: notificationBody,
              is_read: false,
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
