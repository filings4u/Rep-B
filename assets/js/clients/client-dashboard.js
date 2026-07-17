/**
 * 📊 CLIENT HOME DASHBOARD METRICS & FEED DRIVER
 * Standardized Production Module with Supabase Realtime Broadcast Routing
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
    "use strict";
    
    if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
        console.error("💥 Handshake Exception: Missing valid session data.");
        return;
    }

    const session = engineEvent.detail.session;
    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    console.log("📡 Core Handshake Verified. Initializing data-grid pipelines for:", currentUserEmail);

    // 1. Initial Data Grid Hydration
    fetchDashboardNumericalMetricPills(currentUserId, currentUserEmail);
    syncAccountTelemetryGrid(currentUserId, currentUserEmail);
    window.refreshDashboardLiveActionLog(currentUserId);
    
    // 2. Automated Document Vault Realtime Stream Initialization
    if (typeof initializeAutomatedVaultSyncEngine === 'function') {
        initializeAutomatedVaultSyncEngine(window.supabaseInstance, currentUserId);
    }

    // 3. PostgreSQL Realtime listener for the Live Action Log notification stream
    // 🎯 CRITICAL LIVE FIX: Changed table name to user_notifications and filter rule to owner_id
    window.supabaseInstance
        .channel(`realtime:dashboard_feed_stream:${currentUserId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'user_notifications', // Fixed from portal_notifications
            filter: `owner_id=eq.${currentUserId}` // Fixed from user_id
        }, function () {
            window.refreshDashboardLiveActionLog(currentUserId);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("📡 Realtime action log stream connected to production user_notifications schema.");
            }
        });

});

/**
 * 📡 DATABASE ACCESS DISPATCH: NUMERICAL ACCOUNT METRICS
 */
async function fetchDashboardNumericalMetricPills(userId, userEmail) {
    "use strict";
    const statEntities = document.getElementById("statActiveEntities");
    const statFilings = document.getElementById("statOngoingFilings");
    const statAlerts = document.getElementById("statComplianceAlerts");

    if (!statEntities || !statFilings || !statAlerts) return;

    try {
        // Pill 1: Active Entities (Reading root metrics straight from your true orders schema)
        const { count: entityCount, error: entityErr } = await window.supabaseInstance
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'Fulfillment Lane');
        if (entityErr) throw entityErr;
        statEntities.textContent = entityCount !== null ? entityCount : 0;

        // Pill 2: Ongoing Filings (Reading root metrics straight from your true orders schema)
        const { count: filingCount, error: filingErr } = await window.supabaseInstance
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('email', userEmail)
            .eq('tax_id_status', 'Fulfillment Lane');
        if (filingErr) throw filingErr;
        statFilings.textContent = filingCount !== null ? filingCount : 0;

        // Pill 3: Urgent Deadlines / Tracking counters fallback loop
        const { count: alertCount, error: alertErr } = await window.supabaseInstance
            .from('compliance_deadlines')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId);
        if (alertErr) throw alertErr;
        statAlerts.textContent = alertCount !== null ? alertCount : 0;

    } catch (dbMetricException) {
        console.error("💥 Dashboard Metrics Database Failure:", dbMetricException);
        statEntities.textContent = 0;
        statFilings.textContent = 0;
        statAlerts.textContent = 0;
    }
}

/**
 * 📝 LIVE FEED HISTORY TIMELINE
 */
window.refreshDashboardLiveActionLog = async function (userId) {
    "use strict";
    const feedTarget = document.getElementById("realtimeNotificationFeedTarget");
    if (!feedTarget) return;

    // 🎯 LIVE ALIGNMENT FIXED: Reads from portal_notifications using user_id filtering constraints
    const { data: list, error } = await window.supabaseInstance
        .from('portal_notifications') 
        .select('id, title, message, is_read, created_at')
        .eq('user_id', userId) 
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Feed Query Transaction Failure:", error);
        return;
    }

    if (!list || list.length === 0) {
        feedTarget.innerHTML = `<p style="font-size:0.85rem; color:#64748b; padding:10px 0;">No active logging history found.</p>`;
        return;
    }

    feedTarget.innerHTML = list.map(n => {
        const formattedTime = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div style="background:${n.is_read ? '#f8fafc' : '#ffffff'}; border-left:3px solid ${n.is_read ? '#cbd5e1' : '#10b981'}; border: 1px solid #e2e8f0; padding:12px; border-radius:6px; font-size:0.8rem; box-sizing:border-box; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <strong style="flex:1; color:#0f172a;">${n.title}</strong>
                </div>
                <span style="color:#64748b; display:block; margin-top:4px; font-size:0.75rem; line-height:1.3; word-break:break-word;">${n.message}</span>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; width:100%;">
                    <small style="color:#94a3b8; font-size:0.65rem; margin-left:auto;">${formattedTime}</small>
                </div>
            </div>
        `;
    }).join('');
};



function renderFilingsTimelineWidget(dataset) {
    const timeline = document.getElementById("filingTimeline");
    if (!timeline) return;
    timeline.innerHTML = dataset.map(item => `
        <div class="timeline-item" style="border-left: 2px solid #10b981; padding-left: 14px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 4px 0; font-size: 0.9rem; color: #0f172a;">${item.company_name || 'Company Incorporation'}</h4>
            <p style="margin: 0; font-size: 0.8rem; color: #64748b; text-transform: capitalize;">${item.status || 'Processing'}</p>
        </div>
    `).join('');
}

function loadClientTelemetryMocks() {
    const tableBody = document.getElementById("entitiesTableBody");
    if (!tableBody || (tableBody.children.length > 0 && !tableBody.innerHTML.includes('No active'))) return;
    renderEntitiesPreviewTable([
        { entity_name: "Apex Venture Operations LLC", state_jurisdiction: "DE", structure_type: "LLC", status: "Active" }
    ]);
}

/**
 * 📝 LIVE FEED HISTORY TIMELINE
 */
window.refreshDashboardLiveActionLog = async function (userId) {
    "use strict";
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
        return;
    }

    if (!list || list.length === 0) {
        feedTarget.innerHTML = `<p style="font-size:0.85rem; color:#64748b; padding:10px 0;">No active notification logging history found.</p>`;
        return;
    }

    feedTarget.innerHTML = list.map(n => {
        const applicationRouteURI = n.ticket_id ? `client-ticket.html?id=${encodeURIComponent(n.ticket_id)}` : `javascript:void(0);`;
        const actionLabelTag = n.ticket_id ? `<span style="display:inline-block; margin-top:6px; font-weight:800; color:#10b981; font-size:0.7rem; text-transform:uppercase;">View Ticket Operations ➔</span>` : '';
        const formattedTime = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <a href="${applicationRouteURI}" onclick="markNotificationRecordAsRead('${n.id}')" style="text-decoration:none !important; display:block !important; width:100%;">
                <div style="background:${n.is_read ? '#f8fafc' : '#ffffff'}; border-left:3px solid ${n.is_read ? '#cbd5e1' : '#10b981'}; border: 1px solid #e2e8f0; padding:12px; border-radius:6px; font-size:0.8rem; box-sizing:border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <strong style="flex:1; color:#0f172a;">${n.title}</strong>
                        ${!n.is_read ? `<span style="width:6px; height:6px; background:#ef4444; border-radius:50%; margin-left:8px; flex-shrink:0;"></span>` : ''}
                    </div>
                    <span style="color:#64748b; display:block; margin-top:4px; font-size:0.75rem; line-height:1.3; word-break:break-word;">${n.message}</span>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; width:100%;">
                        ${actionLabelTag}
                        <small style="color:#94a3b8; font-size:0.65rem; margin-left:auto;">${formattedTime}</small>
                    </div>
                </div>
            </a>
        `;
    }).join('');
};

window.markNotificationRecordAsRead = async function (notificationId) {
    "use strict";
    if (!notificationId) return;
    await window.supabaseInstance.from('portal_notifications').update({ is_read: true }).eq('id', notificationId);
};
