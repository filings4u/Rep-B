/**
 * Filings4U Enterprise Admin Dashboard
 * Page controller: admin-dashboard.js
 *
 * Existing database behavior is preserved. The dashboard visual layer is
 * redesigned through the shared admin-css.css.
 */

/* ==========================================================================
   SYNCHRONOUS SECURITY / ROLE GUARD
   ========================================================================== */

(function() {
    "use strict";
    // Define the exact project storage lookup path signature
    const projectUrlHash = "lrbimrlbskjweynxlgas"; 
    const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
    
    // Synchronously check local storage cache arrays before browser can paint any HTML elements
    const rawSessionJson = localStorage.getItem(sessionTokenKey);
    let isAuthenticated = false;
    let userRole = null;

    if (rawSessionJson) {
      try {
        const sessionData = JSON.parse(rawSessionJson);
        if (sessionData && sessionData.access_token) {
          isAuthenticated = true;
          // Extract nested metadata flags out of JWT payload context securely
          if (sessionData.user && sessionData.user.user_metadata) {
            userRole = sessionData.user.user_metadata.role;
          }
          if (sessionData.user && !userRole && sessionData.user.email) {
            if (sessionData.user.email.toLowerCase().endsWith('@filings4u.com')) {
              userRole = 'admin';
            }
          }
        }
      } catch (e) {
        console.error("Security parsing failure:", e);
      }
    }

    // Determine current view file track rules path parameters
    const pagePathString = window.location.pathname.toLowerCase();
    const isAdminViewPage = pagePathString.includes('/admin-');

    if (!isAuthenticated) {
      // 🚨 CRITICAL REDIRECT: Halt thread and eject out-of-bounds requests immediately
      alert("🔒 Access Denied: Authentication required. Redirecting to secure login desk portal...");
      window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
      
      // Inject CSS rule to hide everything in case browser delays routing
      document.documentElement.style.display = "none";
      throw new Error("🔒 Execution Halted: Unauthorized navigation attempt terminated.");
    }

    // Role Enforcement Shield: Blocks non-admins from hitting administrative paths
    if (isAdminViewPage && userRole !== 'admin') {
      alert("🛡️ Security Exception: Restricted Administrative Territory. Access Refused.");
      window.location.replace("client-dashboard.html");
      document.documentElement.style.display = "none";
      throw new Error("🛡️ Execution Halted: Insufficient role permissions clearance.");
    }
  })();

/* ==========================================================================
   DASHBOARD DATA + INTERACTION CONTROLLER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
      "use strict";

      const salesTargetBox = document.getElementById("admin-global-sales-target-box");
      const clientDropdown = document.getElementById("adminClientDropdown");
      const inboxStreamBox = document.getElementById("admin-inbox-live-stream-box");
      const alertForm = document.getElementById("adminAlertForm");

      // Self-healing Supabase alignment hook
      let client = window.supabaseInstance || window.supabaseClient;
      if (!client || typeof client.from !== 'function') {
        const fallbackLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (fallbackLib && typeof fallbackLib.createClient === 'function') {
          client = fallbackLib.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU", {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
          });
          window.supabaseInstance = client; window.supabaseClient = client; window.supabase = client;
        }
      }

      if (!client || typeof client.from !== 'function') {
        salesTargetBox.innerHTML = `<tr><td colspan='5' style='padding:20px; text-align:center; color:var(--staff-red); font-weight:700;'>✕ Database Connection Error.</td></tr>`;
        return;
      }

      // Session verification layer
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) {
        const logLabel = document.getElementById("liveStaffEmailDisplayLog");
        if (logLabel) logLabel.textContent = `● Operator: ${session.user.email}`;
      }

      // 🟢 1. METRICS ENGINE: Loop over tables and aggregate overview counters
      async function computePlatformMetricsMatrix() {
        try {
          const { data: revenueData } = await client.from("orders").select("total_paid_amount");
          const grossRevenue = revenueData ? revenueData.reduce((acc, curr) => acc + (parseFloat(curr.total_paid_amount) || 0), 0) : 0;
          document.getElementById("stat-total-revenue").textContent = `$${grossRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

          const { count: companyCount } = await client.from("orders").select("company_name", { count: "exact", head: true });
          document.getElementById("stat-active-users").textContent = companyCount || 0;

          const { count: auditCount } = await client.from("orders").select("id", { count: "exact", head: true }).eq("account_created", false);
          document.getElementById("stat-pending-filings").textContent = auditCount || 0;

          const { count: unpaidInvoiceCount } = await client
            .from("client_invoices")
            .select("invoice_id", { count: "exact", head: true })
            .eq("payment_status", "Unpaid");

          const unpaidInvoicesBadge = document.getElementById("adminDashboardUnpaidInvoiceCounterBadge");
          if (unpaidInvoicesBadge) {
            unpaidInvoicesBadge.textContent = `${unpaidInvoiceCount || 0} Outstanding`;
          }
        } catch (err) {
          console.warn("Analytics calculation bypass state triggered:", err);
        }
      }

      // 🟢 2. CRM DROPDOWN POPULATOR: Load unique customer email options into notification selector fields
      async function hydrateClientNotificationSelector() {
        try {
          const { data: profiles } = await client.from("orders").select("email_address, first_name, last_name, company_name");
          if (!profiles || profiles.length === 0) return;
          clientDropdown.innerHTML = `<option value="">-- Choose Target Account Destination Vector --</option>`;

          const uniqueEmails = [...new Set(profiles.map(item => String(item.email_address).trim().toLowerCase()))];
          uniqueEmails.forEach(email => {
            const matchingProfile = profiles.find(p => String(p.email_address).toLowerCase() === email);
            const labelName = matchingProfile ? `${matchingProfile.first_name} ${matchingProfile.last_name} (${matchingProfile.company_name})` : email;
            const option = document.createElement("option");
            option.value = email;
            option.textContent = `${labelName} [${email}]`;
            clientDropdown.appendChild(option);
          });
        } catch(e) {}
      }

      // 🟢 3. PRICING LEDGER FEED: Hydrate full chronological data list
      async function renderSalesLedgerMatrix() {
        try {
          const { data: sales, error } = await client
            .from("orders")
            .select("company_name, email_address, selected_plan, total_paid_amount, tracking_number")
            .order("created_at", { ascending: false })
            .limit(10);

          if (error) throw error;
          if (!sales || sales.length === 0) {
            salesTargetBox.innerHTML = `<tr><td colspan='5' style='padding:20px; text-align:center;'>No transactional profiles recorded inside orders schema blocks.</td></tr>`;
            return;
          }

          salesTargetBox.innerHTML = "";
          sales.forEach(row => {
            const tr = document.createElement("tr");
            tr.style.cssText = "border-bottom:1px solid var(--border-color); background:#ffffff;";
            tr.innerHTML = `
              <td style="padding:12px; font-weight:700;">${escapeAdminHtml(row.company_name || 'Standalone Asset')}</td>
              <td style="padding:12px; font-family:monospace; color:var(--text-muted);">${escapeAdminHtml(row.email_address)}</td>
              <td style="padding:12px;"><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase;">${escapeAdminHtml(row.selected_plan || 'Direct')}</span></td>
              <td style="padding:12px; color:var(--emerald); font-weight:800;">$${parseFloat(row.total_paid_amount || 0).toFixed(2)}</td>
              <td style="padding:12px; text-align:right;"><a href="admin-customer-profile.html?email=${encodeURIComponent(row.email_address)}" style="color:var(--staff-red); text-decoration:none; font-weight:700; font-size:12px;">Inspect Profile ➔</a></td>
            `;
            salesTargetBox.appendChild(tr);
          });
        } catch (err) {
          salesTargetBox.innerHTML = `<tr><td colspan='5' style='padding:20px; text-align:center; color:var(--staff-red); font-weight:700;'>✕ Database Reconciliation Error.</td></tr>`;
        }
      }

      // 🟢 4. COMM-STREAM REALTIME TELEMETRY: Stream live messages out of chat_messages
      async function initializeLiveCommunicationStream() {
        try {
          const { data: messages } = await client.from("chat_messages").select("sender_email, message_body").order("created_at", { ascending: false }).limit(5);
          if (messages && messages.length > 0) {
            inboxStreamBox.innerHTML = "";
            messages.forEach(msg => {
              const div = document.createElement("div");
              div.style.cssText = "padding:6px 0; border-bottom:1px dashed #e2e8f0; line-height:1.4;";
              div.innerHTML = `<strong style="color:var(--text-dark); font-size:11px;">[${escapeAdminHtml(msg.sender_email)}]:</strong> ${escapeAdminHtml(msg.message_body)}`;
              inboxStreamBox.appendChild(div);
            });
          }
        } catch(e) {}
      }

      // 🟢 5. WRITE DISPATCH ROUTINES: Write notifications straight to portal_notifications table rows
      if (alertForm) {
        alertForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const statusLabel = document.getElementById("alertStatus");
          const targetUser = clientDropdown.value;
          const titleText = document.getElementById("alertTitle").value.trim();
          const bodyText = document.getElementById("alertMessage").value.trim();

          if (!targetUser || !titleText || !bodyText) {
            statusLabel.style.display = "block";
            statusLabel.style.background = "#fff1f2";
            statusLabel.style.color = "var(--admin-red)";
            statusLabel.textContent = "Please complete the target account, notification title, and message.";
            return;
          }

          statusLabel.innerHTML = `<span style="color:var(--text-muted); font-weight:700; font-size:12px;">Pushing real-time encryption packet...</span>`;

          try {
            const { error } = await client.from("portal_notifications").insert([{
              user_email: targetUser,
              title: titleText,
              message_body: bodyText,
              is_unread: true
            }]);

            if (error) throw error;
            statusLabel.innerHTML = `<span style="color:var(--emerald); font-weight:700; font-size:12px;">✅ Notification recorded completely. Client counter badge updated real-time.</span>`;
            alertForm.reset();
          } catch (insertError) {
            statusLabel.innerHTML = `<span style="color:var(--staff-red); font-weight:700; font-size:12px;">✕ Pipeline Error: ${insertError.message}</span>`;
          }
        });
      }

      function escapeAdminHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      }

      await computePlatformMetricsMatrix();
      await hydrateClientNotificationSelector();
      await renderSalesLedgerMatrix();
      await initializeLiveCommunicationStream();

      // Keep the unpaid-invoice dashboard badge synchronized.
      try {
        const { count: invoicesCount } = await client
          .from("client_invoices")
          .select("invoice_id", { count: "exact", head: true })
          .eq("payment_status", "Unpaid");

        const unpaidInvoicesBadge = document.getElementById(
          "adminDashboardUnpaidInvoiceCounterBadge"
        );

        if (unpaidInvoicesBadge) {
          unpaidInvoicesBadge.textContent =
            `${invoicesCount || 0} Outstanding`;
        }
      } catch (invoiceError) {
        console.warn(
          "Unable to refresh unpaid invoice counter:",
          invoiceError
        );
      }
    });
