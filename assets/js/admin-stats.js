// assets/js/admin-stats.js
(async function runDashboardMetricsEngine() {
    "use strict";

    function waitForSupabase() {
        return new Promise(res => {
            if (window.supabaseClient) return res(window.supabaseClient);
            const idx = setInterval(() => { if (window.supabaseClient) { clearInterval(idx); res(window.supabaseClient); } }, 30);
        });
    }
    const client = await waitForSupabase();

    async function hydrateStatsCards() {
        try {
            // 💰 Metric A: Calculate Platform Revenue from Sales Ledger
            const { data: sales } = await client.from('sales_ledger').select('amount_paid');
            const totalRevenue = sales ? sales.reduce((acc, row) => acc + (parseFloat(row.amount_paid) || 0), 0) : 0;
            document.getElementById('stat-total-revenue').innerText = `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            // 👥 Metric B: Count Active Entities/Profiles
            const { count: profileCount } = await client.from('profiles').select('*', { count: 'exact', head: true });
            document.getElementById('stat-active-users').innerText = profileCount || 0;

            // ⚠️ Metric C: Count Pending Audits/Filings
            const { count: pendingCount } = await client.from('compliance_alerts').select('*', { count: 'exact', head: true }).eq('status', 'Overdue');
            document.getElementById('stat-pending-filings').innerText = pendingCount || 0;

            //  Metric D: System Health / Completed Filings
            const { count: completedCount } = await client.from('compliance_alerts').select('*', { count: 'exact', head: true }).eq('status', 'Completed');
            document.getElementById('stat-completed-filings').innerText = completedCount || 0;

        } catch (err) {
            console.error("Metrics engine failed to synchronize:", err.message);
        }
    }

    await hydrateStatsCards();
    // Refresh stats automatically every 60 seconds
    setInterval(hydrateStatsCards, 60000);
})();
