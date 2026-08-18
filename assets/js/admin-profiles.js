
function enforceAdminAccess() {
  const hash = "lrbimrlbskjweynxlgas";
  const key = `sb-${hash}-auth-token`;
  try {
    const raw = localStorage.getItem(key);
    const session = raw ? JSON.parse(raw) : null;
    const email = String(session?.user?.email || "").toLowerCase();
    const role = session?.user?.user_metadata?.role;
    if (!session?.access_token) {
      document.documentElement.style.display = "none";
      window.location.replace("admin-login.html");
      return false;
    }
    if (role !== "admin" && !email.endsWith("@filings4u.com")) {
      document.documentElement.style.display = "none";
      window.location.replace("client-dashboard.html");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Admin access verification failed:", error);
    document.documentElement.style.display = "none";
    window.location.replace("admin-login.html");
    return false;
  }
}

function getAdminSupabaseClient() {
  if (window.supabaseInstance && typeof window.supabaseInstance.from === "function") return window.supabaseInstance;
  if (window.supabaseClient && typeof window.supabaseClient.from === "function") return window.supabaseClient;
  if (window.supabase && typeof window.supabase.createClient === "function") {
    const client = window.supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsdWJpbXJsYnNramV5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU", {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.supabaseInstance = client;
    window.supabaseClient = client;
    return client;
  }
  return null;
}

function updateAdminClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function escapeAdminHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


function showAdminMessage(message, title = "Admin Console") {
  const modal = document.getElementById("admin-page-modal");
  if (!modal) { console.error(message); return; }
  modal.querySelector("[data-modal-title]").textContent = title;
  modal.querySelector("[data-modal-message]").textContent = message;
  modal.hidden = false;
}
function confirmAdminAction(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("admin-page-confirm-modal");
    if (!modal) return resolve(window.confirm(message));
    modal.querySelector("[data-modal-message]").textContent = message;
    modal.hidden = false;
    const yes = modal.querySelector("[data-confirm-yes]");
    const no = modal.querySelector("[data-confirm-no]");
    const finish = value => { modal.hidden = true; yes.onclick = null; no.onclick = null; resolve(value); };
    yes.onclick = () => finish(true); no.onclick = () => finish(false);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const rosterBox = document.getElementById("admin-roster-target-box");
  const addForm = document.getElementById("addAdminForm");
  const feedback = document.getElementById("form-feedback-msg");
  const submitBtn = document.getElementById("submitFormBtn");
  const hiredDateInput = document.getElementById("addHiredDate");

  if (hiredDateInput) {
    hiredDateInput.value = new Date().toISOString().split('T')[0];
  }

  // 1. Core Self-Healing Database Handshake Initialization
  let client = getAdminSupabaseClient();
  if (!client || typeof client.from !== 'function') {
    const lib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (lib && typeof lib.createClient === 'function') {
      client = lib.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU", { 
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } 
      });
      window.supabaseInstance = client; window.supabaseClient = client; window.supabase = client;
    }
  }

  // 2. Real-Time Stream Operator Roster Ledger Data Grid Table
  async function refreshOperatorRosterGrid() {
    try {
      if (!client || typeof client.from !== 'function') return;
      if (!rosterBox) return;

      const { data: admins, error } = await client
        .from('admin_profiles')
        .select('*')
        .order('hired_date', { ascending: false });

      if (error) throw error;

      if (!admins || admins.length === 0) {
        rosterBox.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted);">No administrators registered on the corporate tracking matrix.</td></tr>`;
        return;
      }

      rosterBox.innerHTML = "";
      admins.forEach((admin) => {
        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom:1px solid var(--border-color); background:#ffffff;";

        const name = `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "Active Operator";
        const email = admin.email_address;
        const hired = admin.hired_date ? new Date(admin.hired_date).toLocaleDateString() : "Not Tracked";
        const isTerminated = admin.terminated_date !== null;
        
        const statusCell = isTerminated 
          ? `<span style="color:#dc2626; font-weight:700;">Terminated</span>` 
          : `<span style="color:#10b981; font-weight:700;">Active Duty</span>`;

        const isProtectedMaster = email === "aerving@filings4u.com";
        const actionBtnHtml = isTerminated 
          ? `<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Deactivated</span>`
          : isProtectedMaster
            ? `<span style="font-size:0.72rem; color:#10b981; font-weight:800; text-transform:uppercase;">👑 Master Owner</span>`
            : `<button onclick="window.terminateAdminOperator('${admin.id}', '${escapeHtml(name)}')" class="terminate-btn">✕ Terminate</button>`;

        tr.innerHTML = `
          <td style="padding:12px; font-weight:700; color:#0a1f44;">${escapeHtml(name)}</td>
          <td style="padding:12px; font-family:monospace; color:#475569;">${escapeHtml(email)}</td>
          <td style="padding:12px; color:#475569; font-weight:600;">${hired}</td>
          <td style="padding:12px;">${statusCell}</td>
          <td style="padding:12px; text-align:right;">${actionBtnHtml}</td>
        `;
        rosterBox.appendChild(tr);
      });
    } catch (err) {
      console.error("✕ Roster lookup network error:", err);
    }
  }

  // Helper safely gathering existing element values to protect against runtime null exceptions
  function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // ========================================================================
  // 4. LIFECYCLE ACTION FORM INTERCEPTION ONBOARDING TRIGGER
  // ========================================================================
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!feedback || !submitBtn) return;

      feedback.style.display = "none";
      const targetEmail = getInputValue("addEmailAddress").toLowerCase();

      // Enforce internal staff clearing security checks
      if (!targetEmail.endsWith("@filings4u.com") && !targetEmail.endsWith("@roselandcompanies.com")) {
        showFeedback("✕ Access Denied: Onboarding limited to @filings4u.com or @roselandcompanies.com domains.", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Transmitting Team Credentials...";

      const payload = {
        email_address: targetEmail,
        first_name: getInputValue("addFirstName"),
        last_name: getInputValue("addLastName"),
        phone_number: getInputValue("addPhoneNumber"),
        street_address: getInputValue("addStreetAddress"),
        city: getInputValue("addCity"),
        state: getInputValue("addState"),
        zip_code: getInputValue("addZipCode"),
        hired_date: getInputValue("addHiredDate"),
        role: getInputValue("addRole")
      };

      try {
        console.log("📡 [Auth Engine] Bypassing active session tokens via clean native fetch tunnel...");

        const response = await fetch("https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/manage-admin-staff", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || "Edge routine submission rejected by server infrastructure.");
        }

        showFeedback("✓ Operator account provisioned! Secure training onboarding invitation email transmitted successfully.", false);
        addForm.reset();
        
        if (hiredDateInput) hiredDateInput.value = new Date().toISOString().split('T')[0];
        await refreshOperatorRosterGrid();

      } catch (err) {
        console.error("✕ Production Tunnel invocation failure exception caught:", err);
        showFeedback(`✕ Onboarding Failed: ${err.message || "Network pre-flight clearance dropped."}`, true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Transmit Staff Invitation ➔";
      }
    });
  }

  // ========================================================================
  // 5. TERMINATE OPERATOR UPDATE ACTION LOOP
  // ========================================================================
  window.terminateAdminOperator = async function(adminId, adminName) {
    if (!client || typeof client.from !== 'function') {
      showAdminMessage("Supabase client connection is unavailable.", "Connection Error");
      return;
    }
    if (!await confirmAdminAction(`Are you sure you want to terminate operator [${adminName}]? This will set their terminated date and deactivate the operator record.`)) return;

    try {
      const todayIsoDate = new Date().toISOString().split('T')[0];
      const { error } = await client
        .from('admin_profiles')
        .update({ terminated_date: todayIsoDate })
        .eq('id', adminId);

      if (error) throw error;
      await refreshOperatorRosterGrid();
    } catch (err) {
      showAdminMessage(err.message || "Failed to commit record mutation.", "Action Blocked");
    }
  };

  function showFeedback(text, isError) {
    feedback.textContent = text;
    feedback.style.display = "block";
    feedback.style.background = isError ? "#fef2f2" : "#ecfdf5";
    feedback.style.color = isError ? "#991b1b" : "#047857";
    feedback.style.border = `1px solid ${isError ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)"}`;
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Initialize grid layout table parameters instantly upon page entry
  await refreshOperatorRosterGrid();
});
