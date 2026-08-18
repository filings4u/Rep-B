
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


document.addEventListener("DOMContentLoaded", () => {
  if (!enforceAdminAccess()) return;
  "use strict";

  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
  
  const client = getAdminSupabaseClient();
  
  const adminForm = document.getElementById("statusControlForm");
  const adminLookupBtn = document.getElementById("adminLookupBtn");
  const adminSearchToken = document.getElementById("adminSearchToken");
  const adminSubmitBtn = document.getElementById("adminSubmitBtn");
  const statusMsg = document.getElementById("status-msg");
  
  let activeRecordId = null;
  populateMilestoneDropdown("Corporate Filing Engine");

  // --- STAGE 1: INTELLIGENT CLIENT_PROFILES SELF-HEALING LOOKUP ---
  const serviceTypeSelect = document.getElementById("statusServiceType");
  if (serviceTypeSelect) serviceTypeSelect.addEventListener("change", () => window.populateMilestoneDropdown(serviceTypeSelect.value));

  if (adminLookupBtn) {
    adminLookupBtn.addEventListener("click", async () => {
      const lookupToken = adminSearchToken.value.trim();
      if (!lookupToken) return;

      statusMsg.style.display = "none";
      statusMsg.textContent = "";

      try {
        console.log(`📡 [Status Engine] Performing workspace lookup for token: [${lookupToken}]`);
        
        // Step A: Search within public.client_statuses table database logs
        const { data: statusData, error: statusErr } = await client
          .from("client_statuses")
          .select("*")
          .eq("tracking_number", lookupToken)
          .maybeSingle();

        if (statusErr) throw statusErr;

        if (statusData) {
          // Profile exists: Hydrate all existing milestone inputs cleanly
          activeRecordId = statusData.id;
          document.getElementById("statusTrackingNumber").value = statusData.tracking_number || "";
          document.getElementById("statusCompanyName").value = statusData.company_name || "";
          document.getElementById("statusClientName").value = statusData.client_name || "";
          document.getElementById("statusClientEmail").value = statusData.client_email || "";
          document.getElementById("statusProgressPercentage").value = statusData.progress_percentage ?? 10;
          document.getElementById("statusNotesText").value = statusData.status_notes || "";
          
          if (document.getElementById("statusServiceType")) {
            document.getElementById("statusServiceType").value = statusData.service_type || "";
            if (typeof window.populateMilestoneDropdown === 'function') {
              window.populateMilestoneDropdown(statusData.service_type, statusData.current_status);
            }
          }

          statusMsg.style.cssText = "display:block; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;";
          statusMsg.textContent = "✓ Record Loaded! Syncing existing active fulfillment file layout cell components.";
          return;
        }

        // Step B: SELF-HEALING FALLBACK - Query directly from your public.client_profiles table instead!
        console.log(`📡 [Status Engine] Token absent from statuses. Querying registry records from public.client_profiles...`);
        const { data: profileData, error: profileErr } = await client
          .from("orders")
          .select("first_name, last_name, email_address")
          .eq("tracking_number", lookupToken)
          .maybeSingle();

        if (profileErr) throw profileErr;

        if (profileData) {
          // Account located in client_profiles: Pre-fill baseline info to establish tracking row
          activeRecordId = null; // Prepares an INSERT transaction layout matrix row
          document.getElementById("statusTrackingNumber").value = lookupToken;
          document.getElementById("statusCompanyName").value = "Initializing Enterprise..."; // Default fallback value
          document.getElementById("statusClientName").value = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || "Registered Client";
          document.getElementById("statusClientEmail").value = profileData.email_address || "";
          document.getElementById("statusProgressPercentage").value = 10; // Default baseline entry marker status
          document.getElementById("statusNotesText").value = "";

          // Focus default operational dropdown categories
          const typeSelector = document.getElementById("statusServiceType");
          if (typeSelector) {
            typeSelector.value = "Corporate Filing Engine";
            if (typeof window.populateMilestoneDropdown === 'function') {
              window.populateMilestoneDropdown("Corporate Filing Engine", "Intake Specifications Logged");
            }
          }

          statusMsg.style.cssText = "display:block; background:#fff9db; color:#92400e; border:1px solid #ffe066;";
          statusMsg.textContent = "ℹ️ Sync Profile Found: Pulled structural user details from client_profiles ledger. Ready to establish milestone baseline tracker row.";
        } else {
          // Token is absent across both operational tracking databases
          statusMsg.style.cssText = "display:block; background:#fef2f2; color:#991b1b; border:1px solid #fee2e2;";
          statusMsg.textContent = "✕ Operational Error: Token reference unrecognized across registered client profiles and tracking records.";
        }

      } catch (err) {
        console.error("✕ Core status sync engine lookup crash:", err);
        statusMsg.style.cssText = "display:block; background:#fef2f2; color:#991b1b; border:1px solid #fee2e2;";
        statusMsg.textContent = `✕ Lookup Failed: ${err.message}`;
      }
    });
  }

  // --- STAGE 2: SUBMISSION UPSERT DISPATCH PIPELINE ---
  if (adminForm) {
    adminForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      statusMsg.style.display = "none";

      const originalBtnText = adminSubmitBtn.textContent;
      adminSubmitBtn.textContent = "Syncing Pipeline Metrics Matrix...";
      adminSubmitBtn.disabled = true;

      const trackingNumber = document.getElementById("statusTrackingNumber").value.trim();
      const companyName = document.getElementById("statusCompanyName").value.trim();
      const clientName = document.getElementById("statusClientName").value.trim();
      const clientEmail = document.getElementById("statusClientEmail").value.trim();
      const serviceType = document.getElementById("statusServiceType").value;
      const currentStatus = document.getElementById("statusCurrentMilestone").value;
      const progressPercentage = parseInt(document.getElementById("statusProgressPercentage").value, 10);
      const statusNotes = document.getElementById("statusNotesText").value.trim();

      const statusPayload = {
        tracking_number: trackingNumber,
        company_name: companyName,
        client_name: clientName,
        client_email: clientEmail,
        service_type: serviceType,
        current_status: currentStatus,
        progress_percentage: progressPercentage,
        status_notes: statusNotes,
        updated_at: new Date().toISOString()
      };

      if (activeRecordId) statusPayload.id = activeRecordId;

      try {
        const { error: upsertError } = await client
          .from("client_statuses")
          .upsert([statusPayload]);

        if (upsertError) throw upsertError;

        statusMsg.style.cssText = "display:block; background:#ecfdf5; color:#047857; border:1px solid #d1fae5;";
        statusMsg.textContent = "✓ Operational metrics synced cleanly! Live dashboards updated instantly.";
        adminForm.reset();
        activeRecordId = null;

      } catch (postFault) {
        console.error(postFault);
        statusMsg.style.cssText = "display:block; background:#fef2f2; color:#991b1b; border:1px solid #fee2e2;";
        statusMsg.textContent = `✕ Sync Execution Failed: ${postFault.message}`;
      } finally {
        adminSubmitBtn.textContent = originalBtnText;
        adminSubmitBtn.disabled = false;
      }
    });
  }
});
