
(function () {
  "use strict";
  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const rawSessionJson = localStorage.getItem(sessionTokenKey);
  let isAuthenticated = false;
  let userRole = null;

  if (rawSessionJson) {
    try {
      const sessionData = JSON.parse(rawSessionJson);
      if (sessionData && sessionData.access_token) {
        isAuthenticated = true;
        if (sessionData.user && sessionData.user.user_metadata) {
          userRole = sessionData.user.user_metadata.role;
        }
        if (sessionData.user && !userRole && sessionData.user.email) {
          if (String(sessionData.user.email).toLowerCase().endsWith("@filings4u.com")) {
            userRole = "admin";
          }
        }
      }
    } catch (error) {
      console.error("Security parsing failure:", error);
    }
  }

  const pagePathString = window.location.pathname.toLowerCase();
  const isAdminViewPage = pagePathString.includes("/admin-");

  if (!isAuthenticated) {
    document.documentElement.style.display = "none";
    window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
    throw new Error("Authentication required.");
  }

  if (isAdminViewPage && userRole !== "admin") {
    document.documentElement.style.display = "none";
    window.location.replace("client-dashboard.html");
    throw new Error("Administrator role required.");
  }
})();


/**
 * filings4u Platform Architecture
 * Module: admin-notifications-hub.js (Global Operational Activity Stream Engine)
 */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const recipientSelect = document.getElementById("notificationRecipientEmail");
  const notificationForm = document.getElementById("directNotificationForm");
  const formStatus = document.getElementById("dispatch-form-status");
  const submitBtn = document.getElementById("dispatchSubmitBtn");
  const historyBox = document.getElementById("admin-notifications-history-box");

  let liveAlertsChannel = null;

  // Establish Supabase Connection Handshake
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }
  if (!client) return;

  // 🌍 GLOBAL OPERATIONAL HELPER FUNCTION: Call this from ANY page to trigger automated real-time notifications
  window.dispatchGlobalSystemNotification = async function(clientEmail, sourceAction, title, message) {
    try {
      const { error } = await client
        .from('system_notifications')
        .insert([{
          client_email: String(clientEmail).trim().toLowerCase(),
          source_action: sourceAction, // e.g., 'Support Ticket Created', 'Package Signed'
          alert_title: title,
          alert_message: message,
          is_read_by_admin: false,
          created_at: new Date().toISOString()
        }]);
      if (error) throw error;
      console.log(`✓ [Global Alert Engine] Dispatched real-time operational notification for action: [${sourceAction}]`);
    } catch (e) {
      console.error("✕ Global notification dispatcher exception caught:", e.message);
    }
  };

  // 1. POPULATE UNIQUE CLIENT RECIPIENT EMAILS BY MULTI-TABLE AGGREGATION
  async function populateClientDropdown() {
    try {
      const [ordersRes, dashOrdersRes] = await Promise.all([
        client.from('orders').select('client_email, client_name'),
        client.from('dashboard_orders').select('email_address, first_name, last_name')
      ]);

      const emailMatrixMap = new Map();

      if (ordersRes.data) {
        ordersRes.data.forEach(row => {
          const email = (row.client_email || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com') {
            emailMatrixMap.set(email, row.client_name || 'Valued Client');
          }
        });
      }

      if (dashOrdersRes.data) {
        dashOrdersRes.data.forEach(row => {
          const email = (row.email_address || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com' && !emailMatrixMap.has(email)) {
            const compiledName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            emailMatrixMap.set(email, compiledName || 'Valued Client');
          }
        });
      }

      if (recipientSelect) {
        recipientSelect.innerHTML = '<option value="">-- Choose Target Customer Account --</option>';
        Array.from(emailMatrixMap.keys()).sort().forEach(email => {
          const name = emailMatrixMap.get(email);
          const opt = document.createElement('option');
          opt.value = email;
          opt.textContent = `${email} (${name})`;
          recipientSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("✕ Dropdown list aggregation crashed:", e);
    }
  }

  // 2. FETCH AND LIVE-RENDER THE NEW PORTAL_NOTIFICATIONS DISPATCH HISTORY STREAM
  async function reloadSystemNotificationsFeed() {
    try {
      console.log("📡 [Admin Dashboard] Rehydrating data stream from public.portal_notifications...");
      const { data: alerts, error } = await client
        .from('portal_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!alerts || alerts.length === 0) {
        historyBox.innerHTML = `
          <div style="text-align:center; color:#94a3b8; font-size:0.875rem; padding:48px 12px; font-style:italic;">
            No portal notifications or dispatch history logged currently.
          </div>`;
        return;
      }

      historyBox.innerHTML = "";
      alerts.forEach(alert => {
        const itemRow = document.createElement("div");
        const isRead = alert.is_read === true;
        
        // Contextual styling badges matching operational tracks
        let badgeBg = "#fef3c7"; let badgeColor = "#92400e";
        if (alert.ticket_id) { badgeBg = "#fee2e2"; badgeColor = "#b91c1c"; }
        else if (isRead) { badgeBg = "#e2e8f0"; badgeColor = "#475569"; }

        itemRow.style.cssText = `padding: 16px; border: 1px solid ${isRead ? "#e2e8f0" : "#cbd5e1"}; background: ${isRead ? "#ffffff" : "rgba(10,31,68,0.02)"}; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.01); border-left: 4px solid ${isRead ? "#94a3b8" : "#0a1f44"}; position: relative; transition: all 0.2s;`;
        
        const displayEmail = alert.recipient_email || alert.email_address || 'Unspecified Client';

        itemRow.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; width:100%;">
            <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; background:${badgeBg}; color:${badgeColor}; padding:3px 8px; border-radius:4px; letter-spacing:0.3px;">${isRead ? 'Opened' : 'Pushed Live'}</span>
                <span style="font-size:11px; font-family:monospace; color:#64748b; font-weight:700;">${displayEmail}</span>
              </div>
              <strong style="font-size:0.9rem; color:#0f172a; margin-top:2px;">${escapeAlertHtml(alert.title)}</strong>
              <p style="margin:0; font-size:0.825rem; color:#475569; line-height:1.4; white-space:pre-wrap;">${escapeAlertHtml(alert.message)}</p>
            </div>
            
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; justify-content:space-between; height:100%;">
              <span style="font-size:10px; color:#94a3b8; font-family:monospace;">${new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        `;
        historyBox.appendChild(itemRow);
      });
    } catch (fault) {
      console.error("✕ Failed to render portal notifications ledger:", fault);
    }
  }

  // 6. SETUP REAL-TIME REPLICATION CHANNELS DISPATCH LOGS BROADCAST LISTENERS
  async function bindLiveNotificationsRealtimeFeed() {
    if (liveAlertsChannel) liveAlertsChannel.unsubscribe();

    liveAlertsChannel = client
      .channel('admin-global-platform-portal-notifications-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_notifications' }, async payload => {
        console.log("✓ [Alert Hub Stream] Intercepted portal notification table change:", payload);
        await reloadSystemNotificationsFeed();
      })
      .subscribe();
  }


    // ========================================================================
  // 3. ENTERPRISE NOTIFICATION ROUTER FORM SUBMISSION CONTROLLER
  // ========================================================================
  if (notificationForm) {
    notificationForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!recipientSelect || !formStatus || !submitBtn) return;
      formStatus.style.display = "none";

      const targetCustomerEmail = recipientSelect.value;
      const alertTitle = document.getElementById("notificationTitle").value.trim();
      const alertMessage = document.getElementById("notificationMessage").value.trim();

      if (!targetCustomerEmail) {
        showHubFeedback("✕ Operational Error: You must select a valid target customer account from the dropdown matrix.", true);
        return;
      }
      if (!alertTitle || !alertMessage) {
        showHubFeedback("✕ Operational Error: Notification Title and Message parameters cannot be left blank.", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Dispatched Live Stream Triggers... 📡";

      try {
        console.log(`📡 [Notification Engine] Commencing account lookup for target recipient: [${targetCustomerEmail}]`);

        // 🟢 FIXED ROUTING HANDSHAKE: Resolves the customer's true auth user_id matching the selected email
        const { data: matchedClient, error: lookupError } = await client
          .from('client_profiles') 
          .select('id')
          .eq('email_address', targetCustomerEmail)
          .maybeSingle();

        if (lookupError) throw lookupError;
        
        let targetedUuid = matchedClient ? matchedClient.id : null;
        
        // Safety Fallback Check: If account is not in client_profiles, alert the operator immediately
        if (!targetedUuid) {
          throw new Error(`Target profile record could not be resolved inside client_profiles for ${targetCustomerEmail}. Account tracking aborted.`);
        }

        console.log(`✓ [Notification Engine] Resolved Target User ID: [${targetedUuid}]. Committing ledger rows...`);

        // STEP 2: Insert data row exactly matching your PostgreSQL schema constraints
        // This instantly fires off the background webhook to 'send-notification-email'
        const { error: insertError } = await client
          .from('portal_notifications')
          .insert([{
            user_id: targetedUuid,                // 🟢 Connects notification directly to selected customer account id
            title: alertTitle,
            message: alertMessage,
            is_read: false,
            is_archived: false,
            recipient_email: targetCustomerEmail, // Matches your schema metadata track
            email_address: targetCustomerEmail,   // Matches your alternative tracking cell
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;

        showHubFeedback("✓ Notification successfully pushed live! Secure mail transmission queued over active webhook channel.", false);
        notificationForm.reset();
        
        // Re-calculate the admin dashboard history log stream view instantly
        await reloadSystemNotificationsFeed();

      } catch (fault) {
        console.error("✕ Notification hub execution failed:", fault);
        showHubFeedback(`✕ Dispatch Failed: ${fault.message || "Pipeline interception aborted."}`, true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Authorize Live Push & Dispatch Notification ➔";
      }
    });
  }



   // ========================================================================
  // 4. OPERATIONAL INTERFACE FEEDBACK & ESCAPING UTILITIES
  // ========================================================================
  function showHubFeedback(text, isError) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.style.display = "block";
    formStatus.style.background = isError ? "#fef2f2" : "#ecfdf5";
    formStatus.style.color = isError ? "#991b1b" : "#047857";
    formStatus.style.border = `1px solid ${isError ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`;
  }

  function escapeAlertHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ========================================================================
  // 5. REAL-TIME OVER-THE-AIR WEBSOCKET CHANNEL LISTENERS
  // ========================================================================
  async function bindLiveNotificationsRealtimeFeed() {
    if (liveAlertsChannel) liveAlertsChannel.unsubscribe();
    
    // Listen for database changes to display background pushes instantly
    liveAlertsChannel = client
      .channel('admin-portal-notifications-live-stream')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'portal_notifications' 
      }, async () => {
        await reloadSystemNotificationsFeed();
      })
      .subscribe();
  }

  // ========================================================================
  // 6. IMMEDIATE COMPONENT INITIALIZATION SWEETS
  // ========================================================================
  await populateClientDropdown();
  await reloadSystemNotificationsFeed();
  await bindLiveNotificationsRealtimeFeed();
});
