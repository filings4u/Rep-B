/**
 * 📊 CLIENT HOME DASHBOARD METRICS & FEED DRIVER
 * Isolated from core routing layers. Runs when client-core validation passes.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Dashboard metrics loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  const currentUserId = session.user.id;

  // Hydrate metric panels and live activity records
  fetchDashboardNumericalMetricPills(currentUserId);
  window.refreshDashboardLiveActionLog(currentUserId);

  // Bind an explicit real-time channel to sync the notification feed layout on changes
  window.supabaseInstance
    .channel(`realtime:dashboard_feed_stream:${currentUserId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'portal_notifications', 
      filter: `user_id=eq.${currentUserId}` 
    }, function () {
      window.refreshDashboardLiveActionLog(currentUserId);
    })
    .subscribe();
});

/**
 * 📡 DATABASE ACCESS DISPATCH: NUMERICAL ACCOUNT METRICS
 * Gathers aggregate counts across entities, filings, and compliance tracking loops.
 */
/**
 * 📡 DATABASE ACCESS DISPATCH: NUMERICAL ACCOUNT METRICS
 * Gathers aggregate counts across entities, filings, and compliance tracking loops.
 */
async function fetchDashboardNumericalMetricPills(userId) {
    "use strict";

    const statEntities = document.getElementById("statActiveEntities");
    const statFilings = document.getElementById("statOngoingFilings");
    const statAlerts = document.getElementById("statComplianceAlerts");

    if (!statEntities || !statFilings || !statAlerts) return;

    try {
        // 1. Count Active Registered Corporate Entities (Using owner_id relational constraint)
        const { count: entityCount, error: entityErr } = await window.supabaseInstance
            .from('entities')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId)
            .eq('status', 'active');

        if (entityErr) throw entityErr;
        statEntities.textContent = entityCount !== null ? entityCount : 0;

        // 2. Fetch User Email to Query Orders from user_filings
        const { data: { user } } = await window.supabaseInstance.auth.getUser();
        if (user && user.email) {
            const { count: filingCount, error: filingErr } = await window.supabaseInstance
                .from('user_filings')
                .select('*', { count: 'exact', head: true })
                .eq('customer_email', user.email)
                .eq('status', 'processing');

            if (filingErr) throw filingErr;
            statFilings.textContent = filingCount !== null ? filingCount : 0;
        } else {
            statFilings.textContent = 0;
        }

        // 3. Count Urgent Compliance Alerts (Table: compliance_deadlines, Column: owner_id, Status: urgent)
        const { count: alertCount, error: alertErr } = await window.supabaseInstance
            .from('compliance_deadlines')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId)
            .eq('status', 'urgent');

        if (alertErr) throw alertErr;
        statAlerts.textContent = alertCount !== null ? alertCount : 0;

    } catch (dbMetricException) {
        console.error("💥 Dashboard Metrics Database Failure:", dbMetricException);
    }
}


/**
 * 📝 DATA INTERFACE RENDERER: LIVE FEED HISTORY TIMELINE
 * Flushes layout strings dynamically based on rows returned. Exposed to global scope hooks.
 */
window.refreshDashboardLiveActionLog = async function (userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Notification feed mapping failed due to invalid userId parameters.");
  }

  const feedTarget = document.getElementById("realtimeNotificationFeedTarget");
  if (!feedTarget) return;

  const { data: list, error } = await window.supabaseInstance
    .from('portal_notifications')
    .select('id, title, message, ticket_id, is_read, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Feed Query Transaction Failure:", error);
    throw new Error(`Database Feed Exception: [${error.code}] ${error.message}`);
  }

  if (!list || list.length === 0) {
    feedTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); padding:10px 0;">No active notification logging history found.</p>`;
    return;
  }

  feedTarget.innerHTML = list.map(n => {
    if (!n.id || !n.title || !n.message || !n.created_at) {
      throw new Error(`Data Integrity Exception: Failed parsing corrupted log row parameter matching identity: ${n.id || 'Unknown'}`);
    }

    const applicationRouteURI = n.ticket_id ? `client-ticket.html?id=${encodeURIComponent(n.ticket_id)}` : `javascript:void(0);`;
    const actionLabelTag = n.ticket_id ? `<span style="display:inline-block; margin-top:6px; font-weight:800; color:var(--emerald); font-size:0.7rem; text-transform:uppercase;">View Ticket Operations ➔</span>` : '';
    const formattedTime = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <a href="${applicationRouteURI}" onclick="markNotificationRecordAsRead('${n.id}')" style="text-decoration:none !important; display:block !important; width:100%;">
        <div style="background:${n.is_read ? '#f8fafc' : '#ffffff'} !important; border-left:3px solid ${n.is_read ? '#cbd5e1' : 'var(--emerald)'} !important; border: 1px solid var(--border-color); padding:12px; border-radius:6px; font-size:0.8rem; box-shadow:0 1px 2px rgba(0,0,0,0.01); box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <strong style="flex:1; color:var(--text-dark);">${n.title}</strong>
            ${!n.is_read ? `<span style="width:6px; height:6px; background:#ef4444; border-radius:50%; margin-left:8px; flex-shrink:0;"></span>` : ''}
          </div>
          <span style="color:var(--text-muted); display:block; margin-top:4px; font-size:0.75rem; line-height:1.3; word-break:break-word;">${n.message}</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; width:100%;">
            ${actionLabelTag}
            <small style="color:#94a3b8; font-size:0.65rem; margin-left:auto;">${formattedTime}</small>
          </div>
        </div>
      </a>
    `;
  }).join('');
};

/**
 * ⚡ INSTANT ROW MUTATION: SET READ MARKERS
 * Dispatches a specific record status transformation explicitly.
 */
window.markNotificationRecordAsRead = async function (notificationId) {
  "use strict";

  if (!notificationId) {
    throw new Error("Interaction Exception: Target notificationId parameter missing.");
  }

  const { error } = await window.supabaseInstance
    .from('portal_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error("Marker Transaction Failure:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }
};


/**
 * ⚡ REAL-TIME STATE SYNC UI HANDLER
 * Runs automatically when a real-time broadcast message hits the client pipeline.
 * Forces the metric panels to update and flash an alert indicator.
 */
window.handleIncomingStateSync = function (payload) {
    "use strict";
    console.log("🎬 Initiating UI state transition sequence for payload:", payload);

    // 1. Instantly pull fresh numbers from the database
    if (window.supabaseInstance && window.supabaseInstance.auth) {
        window.supabaseInstance.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                fetchDashboardNumericalMetricPills(session.user.id);
            }
        });
    }

    // 2. Visual Animation Trigger: Find metric panel text containers
    const cards = [
        document.getElementById("statActiveEntities"),
        document.getElementById("statOngoingFilings"),
        document.getElementById("statComplianceAlerts")
    ];

    cards.forEach(card => {
        if (!card) return;

        // Apply a smooth flash transition effect using CSS inline styles
        card.style.transition = "all 0.3s ease";
        card.style.transform = "scale(1.15)";
        card.style.color = "#10b981"; // Emerald green highlight flash

        // Reset the layout element cleanly back to normal styles after 600ms
        setTimeout(() => {
            card.style.transform = "scale(1.0)";
            card.style.color = card.id === "statComplianceAlerts" ? "#ef4444" : "#0f172a";
        }, 600);
    });
};
