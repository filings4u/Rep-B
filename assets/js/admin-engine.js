/**
 * ==========================================================================
 * 🛡️ FILINGS4U HARMONIZED ADMINISTRATIVE DATA ENGINE (STELLAR INTEGRATED)
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initSystemClockTick();
  initAdminDashboardManager();
});

// 🔐 ANTI-COLLISION ENGINE: Binds variables to window properties to prevent duplicate let/const crashes
if (!window.adminStorage) {
  window.adminStorage = {
    globalAdminApplicationsCache: [],
    localRegisteredUsersCache: []
  };
}

/**
 * 1. REAL-TIME HUD STATUS SYSTEM CLOCK
 */
function initSystemClockTick() {
  const clockEl = document.getElementById("portal-clock");
  if (!clockEl) return;
  setInterval(() => {
    const d = new Date();
    clockEl.innerText = `${d.toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'})} | ${d.toLocaleTimeString('en-US',{hour12:false})}`;
  }, 1000);
}

/**
 * 2. MASTER SERVER CONTROL HOOK INITIALIZER
 */
function initAdminDashboardManager() {
  const searchField = document.getElementById("adminGlobalSearchField");
  const alertForm = document.getElementById("adminAlertForm");

  // Safe polling loop validates database readiness prior to triggering calls
  const infrastructurePoll = setInterval(async () => {
    if (window.supabase && typeof window.supabase.auth !== 'undefined') {
      clearInterval(infrastructurePoll);
      
      try {
        // Enforce zero-trust session token confirmation
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();
        const isAdmin = user?.app_metadata?.is_admin === true || user?.app_metadata?.role === 'admin';

        if (authError || !user || !isAdmin) {
          console.warn("🔐 Unauthorized administrative access intercepted. Evicting session.");
          window.location.href = "https://filings4u.com/get-started.html";
          return;
        }

        const displayLogEl = document.getElementById("liveStaffEmailDisplayLog");
        if (displayLogEl) displayLogEl.innerText = `OPERATOR SESSION: ${user.email.toLowerCase()}`;

        // Fire table synchronization channels
        await synchronizeAdminLedgerTables();
        await fetchRegisteredSystemProfiles();
        
        if (searchField) searchField.addEventListener("input", executeGlobalLedgerSearchFilter);
        // Note: Form submit interactions for alerts are native to your html script blocks
      } catch (authFault) {
        console.error("Zero-Trust Security Verification Exception:", authFault);
        window.location.href = "index.html";
      }
    }
  }, 150);

  setTimeout(() => clearInterval(infrastructurePoll), 5000);
}

/**
 * 3. LIVE DATA SYNCHRONIZER & METRICS AGGREGATION AGENT
 */
async function synchronizeAdminLedgerTables() {
  const tableBody = document.getElementById("admin-global-sales-target-box");
  if (!tableBody) return;

  try {
    const { data: records, error } = await window.supabase
      .from("user_filings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    window.adminStorage.globalAdminApplicationsCache = records || [];

    // Process analytics numbers
    calculateAndRenderOperationalMetrics(window.adminStorage.globalAdminApplicationsCache);
    renderGlobalSalesPricingLedger(window.adminStorage.globalAdminApplicationsCache, tableBody);

  } catch (err) {
    console.error("Database connection failure:", err);
    tableBody.innerHTML = `<tr><td colspan="5" style="padding:20px; color:#ef4444; text-align:center;">Sync Fault: ${err.message}</td></tr>`;
  }
}

/**
 * 4. SYSTEM OVERVIEW ANALYTICS CONVERTERS
 */
function calculateAndRenderOperationalMetrics(records) {
  const revenueEl = document.getElementById("stat-total-revenue");
  const usersEl = document.getElementById("stat-active-users");
  const pendingEl = document.getElementById("stat-pending-filings");

  let revenueSum = 0;
  let pendingCount = 0;
  const uniqueEmails = new Set();

  records.forEach((record) => {
    uniqueEmails.add(record.customer_email.toLowerCase().trim());
    if (!record.is_completed) pendingCount++;

    let val = parseFloat(record.price);
    if (isNaN(val) && record.metadata) {
      const p = typeof record.metadata === "string" ? JSON.parse(record.metadata) : record.metadata;
      val = parseFloat(p?.price);
    }
    if (!isNaN(val)) revenueSum += val;
  });

  if (revenueEl) revenueEl.innerText = `$${revenueSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (usersEl) usersEl.innerText = uniqueEmails.size;
  if (pendingEl) pendingEl.innerText = pendingCount;
}

/**
 * 5. HYDRATE GLOBAL SALES PRICING LEDGER TABLE
 */
function renderGlobalSalesPricingLedger(records, container) {
  container.innerHTML = "";

  if (records.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#64748b;">No sales records found.</td></tr>`;
    return;
  }

  records.forEach((record) => {
    let priceValue = parseFloat(record.price);
    if (isNaN(priceValue) && record.metadata) {
      const p = typeof record.metadata === "string" ? JSON.parse(record.metadata) : record.metadata;
      priceValue = parseFloat(p?.price);
    }
    const displayPrice = !isNaN(priceValue) ? `$${priceValue.toFixed(2)}` : "$0.00";

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--border-color, #e2e8f0)";
    tr.innerHTML = `
      <td style="padding:12px; font-weight:700; color:#0a1f44;">${record.company_name || "New Filing Data"}</td>
      <td style="padding:12px; color:#4a5568;">${record.customer_email}</td>
      <td style="padding:12px;"><span style="font-size:0.72rem; text-transform:uppercase; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${record.plan_service_tier || "Standard"}</span></td>
      <td style="padding:12px; font-weight:800; color:#10b981;">${displayPrice}</td>
      <td style="padding:12px; text-align:right;"><button class="admin-inspect-action-btn" onclick="openFilingInspectionDrawer('${record.id}')">Inspect</button></td>
    `;
    container.appendChild(tr);
  });
}

/**
 * 6. REAL-TIME SEARCH KEYWORD FILTER ACTUATOR
 */
function executeGlobalLedgerSearchFilter(event) {
  const query = event.target.value.toLowerCase().trim();
  const tableBody = document.getElementById("admin-global-sales-target-box");
  if (!tableBody) return;

  const filtered = window.adminStorage.globalAdminApplicationsCache.filter(item => {
    return (
      item.company_name?.toLowerCase().includes(query) ||
      item.customer_email?.toLowerCase().includes(query) ||
      item.plan_service_tier?.toLowerCase().includes(query)
    );
  });

  renderGlobalSalesPricingLedger(filtered, tableBody);
}

/**
 * 7. DYNAMICALLY HYDRATE TARGET USER ACCOUNTS DROPDOWN
 */
async function fetchRegisteredSystemProfiles() {
  const dropdown = document.getElementById("adminClientDropdown");
  if (!dropdown) return;
  try {
    const { data, error } = await window.supabase.from("user_filings").select("customer_email");
    if (error) throw error;
    const emails = [...new Set(data.map(p => p.customer_email.toLowerCase().trim()))];
    dropdown.innerHTML = `<option value="">-- Choose Target Profile --</option>`;
    emails.forEach(e => {
      dropdown.innerHTML += `<option value="${e}">${e}</option>`;
    });
  } catch (err) { console.error(err); }
}

/**
 * 8. PUSH REAL-TIME ALERT NOTICE MESSAGES
 */
async function processAdminNotificationPush(event) {
  event.preventDefault();
  const email = document.getElementById("adminClientDropdown").value;
  const title = document.getElementById("alertTitle").value.trim();
  const message = document.getElementById("alertMessage").value.trim();
  const statusLog = document.getElementById("alertStatus");

  if (!email || !title || !message) return;

  try {
    const { error } = await window.supabase.from("client_notifications").insert([{
      recipient_email: email, title: title, message: message
    }]);
    if (error) throw error;

    const stream = document.getElementById("admin-inbox-live-stream-box");
    if (stream) stream.innerHTML = `<p style="margin-bottom:8px; color:#10b981;"><strong>[${new Date().toLocaleTimeString()}] Sent:</strong> To ${email} - "${title}"</p>` + stream.innerHTML;
    
    if (statusLog) { statusLog.textContent = "Broadcast Live!"; statusLog.style.color = "#10b981"; }
    document.getElementById("adminAlertForm").reset();
  } catch (err) { console.error(err); }
}

/**
 * 9. MODAL DETAILS EXTRACTION EXPANDER (COPY-PASTE DESK ENGINE)
 */
function openFilingInspectionDrawer(recordId) {
  const record = window.adminStorage.globalAdminApplicationsCache.find(item => String(item.id) === String(recordId));
  if (!record) return;

  const modal = document.getElementById("filingDetailModal");
  const display = document.getElementById("modalMetadataDisplayTarget");
  const title = document.getElementById("modalHeaderFilingTitle");
  const downloadBtn = document.getElementById("modalDownloadPayloadBtn");

  title.innerText = record.company_name || "Application Form Payload";
  
  let html = `
    <div class="modal-data-group-box"><label>User Account Email</label><div>${record.customer_email}</div></div>
    <div class="modal-data-group-box"><label>Service Specification Tier</label><div>${record.plan_service_tier}</div></div>
    <div class="modal-data-group-box"><label>Filing Timestamp</label><div>${new Date(record.created_at).toLocaleString()}</div></div>
  `;

  const parsed = typeof record.metadata === "string" ? JSON.parse(record.metadata) : record.metadata;
  if (parsed && Object.keys(parsed).length > 0) {
    html += `<h4 style="margin:20px 0 10px 0; color:#0a1f44; font-weight:800; border-bottom:1px solid #e2e8f0; padding-bottom:4px; font-size:0.8rem;">USER SUBMITTED VARIABLES</h4>`;
    for (const key in parsed) {
      if (parsed.hasOwnProperty(key)) {
        html += `<div class="modal-data-group-box"><label>${key.replace(/_/g," ")}</label><div>${parsed[key]}</div></div>`;
      }
    }
  }

  display.innerHTML = html;

  downloadBtn.onclick = () => {
    const f = `${record.company_name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-record.json`;
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = f;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (modal) modal.style.display = "flex";
}

function closeFilingDetailModal() {
  const modal = document.getElementById("filingDetailModal");
  if (modal) modal.style.display = "none";
}
