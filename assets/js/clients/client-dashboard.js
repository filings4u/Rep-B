document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchDashboardAggregateMetrics(session.user.id, session.user.email);
    fetchComplianceDeadlinesData(session.user.id);
    initializeRealtimeDashboardFeed(session.user.id);
});

// Single-Trip Multi-Aggregation Metrics Generator
async function fetchDashboardAggregateMetrics(userId, userEmail) {
    // Total Active Entities
    const { count: entitiesCount } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Total Active Orders in Execution
    const { count: filingsCount } = await supabase
        .from('user_filings')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', userEmail)
        .not('status', 'in', '("Completed","Cancelled")');

    // Total Urgent Deadlines (Matches your exact schema status flags)
    const { count: alertsCount } = await supabase
        .from('compliance_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('status', 'PENDING_ACTION');

    document.getElementById("statActiveEntities").textContent = entitiesCount || 0;
    document.getElementById("statOngoingFilings").textContent = filingsCount || 0;
    document.getElementById("statComplianceAlerts").textContent = alertsCount || 0;
}

// Populate Compliance Timelines Matrix on Home Page
async function fetchComplianceDeadlinesData(userId) {
    const target = document.getElementById("complianceTimelineTarget");
    if (!target) return;

    // Queries explicit columns: owner_id, requirement_name, state_authority
    const { data: deadlines, error } = await supabase
        .from('compliance_deadlines')
        .select('id, requirement_name, state_authority, due_date, status')
        .eq('owner_id', userId)
        .order('due_date', { ascending: true })
        .limit(5);

    if (error || !deadlines || deadlines.length === 0) {
        target.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">🎉 Excellent status! No outstanding compliance requirements detected.</p>`;
        return;
    }

    target.innerHTML = deadlines.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
            <div>
                <span style="font-weight:700; color:var(--text-dark); display:block;">${item.requirement_name}</span>
                <span style="color:var(--text-muted); font-size:0.75rem;">Jurisdiction: ${item.state_authority} | Due: ${new Date(item.due_date).toLocaleDateString()}</span>
            </div>
            <span style="padding:4px 8px; border-radius:4px; font-weight:800; font-size:0.65rem; background:${item.status === 'PENDING_ACTION' ? '#fee2e2' : '#edf2f7'}; color:${item.status === 'PENDING_ACTION' ? '#ef4444' : '#475569'}">
                ${item.status.replace('_', ' ')}
            </span>
        </div>
    `).join('');
}

function initializeRealtimeDashboardFeed(userId) {
    const feedTarget = document.getElementById("realtimeNotificationFeedTarget");
    if (!feedTarget) return;

    async function reloadFeed() {
        const { data: list } = await supabase
            .from('portal_notifications')
            .select('title, message, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(4);

        if (!list || list.length === 0) {
            feedTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">No recent alerts available.</p>`;
            return;
        }

        feedTarget.innerHTML = list.map(n => `
            <div style="background:#f8fafc; border-left:3px solid var(--emerald); padding:10px; border-radius:4px; font-size:0.8rem;">
                <strong style="display:block; color:var(--text-dark);">${n.title}</strong>
                <span style="color:var(--text-muted); display:block; margin:2px 0 4px;">${n.message}</span>
                <small style="color:#94a3b8; font-size:0.65rem;">${new Date(n.created_at).toLocaleTimeString()}</small>
            </div>
        `).join('');
    }

    reloadFeed();

    supabase
        .channel(`public:portal_notifications_home:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_notifications', filter: `user_id=eq.${userId}` }, () => {
            reloadFeed();
        })
        .subscribe();
}
