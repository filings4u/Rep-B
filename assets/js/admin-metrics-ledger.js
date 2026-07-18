/**
 * 📁 FILE PATH: assets/js/admin-metrics-ledger.js
 * Responsibility: Query Central Master Schemas & Hydrate Top-Level Admin Statistics
 */
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        syncAdminGlobalMetrics();
    });

    async function syncAdminGlobalMetrics() {
        // 🚀 Poll safely until your core backend driver is live
        if (!window.supabaseInstance || typeof window.supabaseInstance.from !== 'function') {
            setTimeout(syncAdminGlobalMetrics, 200);
            return;
        }

        const client = window.supabaseInstance;

        try {
            // Fetch central billing metrics and total profile matrices concurrently
            const [ordersResult, entitiesResult] = await Promise.all([
                client.from('orders').select('total_fee, status'),
                client.from('entities').select('id, status')
            ]);

            if (ordersResult.error) throw ordersResult.error;
            if (entitiesResult.error) throw entitiesResult.error;

            const orders = ordersResult.data || [];
            const entities = entitiesResult.data || [];

            // 1. Calculate Administrative Metrics Parameters
            const totalRevenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.total_fee) || 0), 0);
            const activeCount = entities.filter(e => e.status === 'Active' || e.status === 'Completed').length;
            const pendingAudits = orders.filter(o => o.status === 'Fulfillment Lane' || o.status === 'In Review').length;

            // 2. Identify Layout Target UI Selectors (Targeting your exact metric pills)
            const revenueDisplay = document.getElementById('statPlatformRevenue') || document.querySelector('.card:nth-of-type(1) div');
            const entitiesDisplay = document.getElementById('statActiveEntitiesAdmin') || document.querySelector('.card:nth-of-type(2) div');
            const auditsDisplay = document.getElementById('statPendingAudits') || document.querySelector('.card:nth-of-type(3) div');
            const healthDisplay = document.getElementById('statSystemHealth') || document.querySelector('.card:nth-of-type(4) div');

            // 3. Inject calculations, clearing out your placeholder ellipses
            if (revenueDisplay) revenueDisplay.textContent = `$${totalRevenue.toFixed(2)}`;
            if (entitiesDisplay) entitiesDisplay.textContent = entities.length; // Total dynamic workspace targets
            if (auditsDisplay) auditsDisplay.textContent = pendingAudits;
            if (healthDisplay) {
                healthDisplay.textContent = "100%";
                healthDisplay.style.color = "#137333";
            }

        } catch (err) {
            console.error("[Fatal Infrastructure Metrics Handshake Fault]", err);
        }
    }
})();

