
/* ========================================================================== 
   FILINGS4U ADMIN PAGE BOOTSTRAP
   Shared shell behavior; page functionality remains below.
   ========================================================================== */
(function adminPageBootstrap() {
  "use strict";
  document.documentElement.classList.add("admin-page-loading");

  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const path = window.location.pathname.toLowerCase();
  const isAdminPage = path.includes("/admin-") || /admin-[^/]+$/.test(path);

  let authenticated = false;
  let role = null;

  try {
    const raw = localStorage.getItem(sessionTokenKey);
    if (raw) {
      const session = JSON.parse(raw);
      if (session && session.access_token) {
        authenticated = true;
        role = session.user?.user_metadata?.role || null;
        if (!role && session.user?.email?.toLowerCase().endsWith("@filings4u.com")) {
          role = "admin";
        }
      }
    }
  } catch (error) {
    console.error("Admin session parsing failed:", error);
  }

  if (!authenticated) {
    window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
    return;
  }

  if (isAdminPage && role !== "admin") {
    window.location.replace("client-dashboard.html");
    return;
  }

  document.documentElement.classList.remove("admin-page-loading");
})();

function initializeAdminPageClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  const render = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    clock.textContent = `${date} | ${time}`;
  };
  render();
  window.setInterval(render, 1000);
}

document.addEventListener("DOMContentLoaded", initializeAdminPageClock);


/**
 * Filings4U Enterprise Admin
 * Appointments page controller
 *
 * Database behavior is preserved from the supplied admin-appointments.html.
 */

/* ==========================================================================
   SYNCHRONOUS SECURITY / ROLE GUARD
   ========================================================================== */



/* ==========================================================================
   APPOINTMENTS DATA + INTERACTION CONTROLLER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // 1. Resolve Strict DOM Target Selectors
  const bookingForm = document.getElementById("phoneBookingIntakeForm");
  const recipientSelect = document.getElementById("bookingRecipientEmail");
  const bookingTitleIn = document.getElementById("bookingTitle");
  const bookingTimestampIn = document.getElementById("bookingTimestamp");
  const bookingPrioritySel = document.getElementById("bookingPriority");
  const formStatusDiv = document.getElementById("booking-form-status");
  const submitButton = document.getElementById("bookingSubmitBtn");
  const ledgerTableBody = document.getElementById("admin-appointments-ledger-target-box");

  if (!bookingForm || !recipientSelect || !ledgerTableBody || !formStatusDiv || !submitButton) {
    console.error("✕ Critical UI Error: Core layout structural elements are missing from the current DOM.");
    return;
  }

  // 2. Fetch Master Client Initialization Instances Cleanly
  const client = window.supabaseInstance || window.supabaseClient;
  if (!client || typeof client.from !== 'function') {
    ledgerTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:#ef4444; font-weight:700;">✕ System Error: Supabase connection could not be verified.</td></tr>`;
    return;
  }

  // Helper utility to prevent Cross-Site Scripting (XSS)
  function escapeApptHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- STAGE 1: DYNAMICALLY EXTRACT LIVE CUSTOMER LIST FROM ORDERS ---
  async function synchronizeCustomerDropdown() {
    try {
      console.log("📡 [Appointments Engine] Syncing target email_address columns from public.orders...");
      const { data: records, error: syncError } = await client
        .from('orders')
        .select('email_address')
        .not('email_address', 'is', null);

      if (syncError) throw syncError;

      const distinctEmails = [...new Set(records.map(row => row.email_address).filter(Boolean))];
      recipientSelect.innerHTML = `<option value="">-- Choose Customer Profile --</option>`;

      if (distinctEmails.length === 0) {
        recipientSelect.innerHTML = `<option value="">-- No Active Profiles Located --</option>`;
        return;
      }

      distinctEmails.forEach(emailStr => {
        const opt = document.createElement("option");
        opt.value = emailStr.trim();
        opt.textContent = emailStr.trim();
        recipientSelect.appendChild(opt);
      });
    } catch (fault) {
      console.error("✕ Customer Menu Sync Halted:", fault.message);
      recipientSelect.innerHTML = `<option value="">✕ Failed to sync profile logs</option>`;
    }
  }

  // --- STAGE 2: FETCH AND STREAM ACTIVE APPOINTMENTS FROM CALENDAR_EVENTS ---
  async function streamConsultationScheduleLedger() {
    try {
      console.log("📡 [Appointments Engine] Querying live entries from public.calendar_events...");
      const { data: appts, error: fetchError } = await client
        .from('calendar_events')
        .select('id, email_address, title, appointment_date, priority_level')
        .order('appointment_date', { ascending: true });

      if (fetchError) {
        throw new Error(`Postgres Retrieval Failure [Code ${fetchError.code}]: ${fetchError.message}`);
      }

      // Update Top Dashboard Performance Metrics Counters
      const totalCountTarget = document.getElementById("metric-total-slots");
      const highPriorityTarget = document.getElementById("metric-high-priority-slots");
      if (totalCountTarget) totalCountTarget.textContent = appts ? appts.length : 0;
      if (highPriorityTarget) {
        const highCount = appts ? appts.filter(a => String(a.priority_level).toUpperCase() === 'HIGH').length : 0;
        highPriorityTarget.textContent = highCount;
      }

      if (!appts || appts.length === 0) {
        ledgerTableBody.innerHTML = `<tr><td colspan="5" class="table-initialization-loader">No active consultation records tracked in calendar assets.</td></tr>`;
        return;
      }

      ledgerTableBody.innerHTML = "";

      appts.forEach(apptItem => {
        const trNode = document.createElement("tr");
        trNode.className = "ledger-row-entry";
        
        const customerEmail = apptItem.email_address || "manual-entry@email.com";
        const agendaTopic = apptItem.title || "Strategy Review Session";
        const urgencyRank = String(apptItem.priority_level || 'standard').toUpperCase();

        const formattedDateTime = new Date(apptItem.appointment_date).toLocaleString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        });

        let priorityBadgeClass = "badge-priority-standard";
        if (urgencyRank === 'HIGH' || urgencyRank === 'HIGH PRIORITY') {
          priorityBadgeClass = "badge-priority-high";
        }

        trNode.innerHTML = `
          <td style="padding:16px 16px; font-weight:600; color:#0f172a;">${escapeApptHtml(customerEmail)}</td>
          <td style="padding:16px 16px; color:#475569; font-weight:500;">${escapeApptHtml(agendaTopic)}</td>
          <td style="padding:16px 16px; font-family:monospace; color:#334155; font-weight:600;">${formattedDateTime}</td>
          <td style="padding:16px 16px;"><span class="badge-base ${priorityBadgeClass}">${escapeApptHtml(urgencyRank)}</span></td>
          <td style="padding:16px 16px; text-align:right;">
            <button class="booking-action-btn delete-trigger" data-id="${apptItem.id}">Cancel Slot</button>
          </td>
        `;

        // Bind delete action engine listeners dynamically
        trNode.querySelector(".delete-trigger").addEventListener("click", async function() {
          if (!confirm("Are you sure you want to cancel and delete this reserved consultation slot?")) return;

          const targetApptId = this.getAttribute("data-id");
          this.disabled = true;
          this.textContent = "Canceling...";

          try {
            const { error: deleteError } = await client
              .from('calendar_events')
              .delete()
              .eq('id', targetApptId);

            if (deleteError) throw deleteError;
            await streamConsultationScheduleLedger();
          } catch (delFault) {
            console.error("✕ Database row deletion request refused:", delFault.message);
            alert(`✕ Cancellation Interrupted: ${delFault.message}`);
            this.disabled = false;
            this.textContent = "Cancel Slot";
          }
        });

        ledgerTableBody.appendChild(trNode);
      });
    } catch (queryFault) {
      console.error("✕ Appointments Ledger Synchronization Aborted:", queryFault.message);
      ledgerTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:#ef4444; font-weight:700;">✕ Synchronization Failure: Check system console logs.</td></tr>`;
    }
  }

  // --- STAGE 3: WRITE REAL-TIME ENTRIES TO CALENDAR_EVENTS ---
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatusDiv.style.display = "none";
    formStatusDiv.textContent = "";

    const customerEmail = recipientSelect.value;
    const title = bookingTitleIn.value.trim();
    const dateTimestamp = bookingTimestampIn.value;
    const priorityLevel = bookingPrioritySel.value;

    if (!customerEmail || !title || !dateTimestamp || !priorityLevel) {
      formStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b; border:1px solid #fee2e2;";
      formStatusDiv.textContent = "✕ Validation Error: All reservation form fields are required.";
      return;
    }

    const originalBtnLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Reserving Calendar Space...";

    try {
      const { error: insertError } = await client
        .from('calendar_events')
        .insert([
          {
            email_address: customerEmail,
            title: title,
            appointment_date: new Date(dateTimestamp).toISOString(),
            priority_level: priorityLevel
          }
        ]);

      if (insertError) throw insertError;

      formStatusDiv.style.cssText = "display:block; background:#ecfdf5; color:#047857; border:1px solid #d1fae5;";
      formStatusDiv.textContent = "✓ Consultation slot successfully reserved and logged completely!";
      bookingForm.reset();
      await streamConsultationScheduleLedger();
    } catch (postFault) {
      console.error("✕ Appointment reservation loop disrupted:", postFault.message);
      formStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b; border:1px solid #fee2e2;";
      formStatusDiv.textContent = `✕ Reservation Aborted: ${postFault.message}`;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalBtnLabel;
    }
  });

  // Run initialization routines
  await synchronizeCustomerDropdown();
  await streamConsultationScheduleLedger();
});
