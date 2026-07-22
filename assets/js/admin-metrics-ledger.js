/**
 * 📁 FILE PATH: assets/js/admin-metrics-ledger.js
 * Responsibility: Mathematical tabulation of platform revenue metrics from database fields
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeMetricsHandshake();
  });

  async function initializeMetricsHandshake() {
    const revenueEl = document.getElementById("stat-total-revenue");
    const activeEl  = document.getElementById("stat-active-users");
    const pendingEl = document.getElementById("stat-pending-filings");

    let client = window.supabaseInstance || window.supabaseClient;
    if (!client || typeof client.from !== 'function') {
      setTimeout(initializeMetricsHandshake, 200);
      return;
    }

    try {
      // Query the specific table target columns cleanly
      const { data: metricsGrid, error } = await client
        .from('orders')
        .select('total_fee, status');

      if (error) throw error;

      let runtimeRevenueSum = 0;
      let activeEntitiesCount = 0;
      let pendingAuditsCount  = 0;

      if (metricsGrid && metricsGrid.length > 0) {
        metricsGrid.forEach(orderRow => {
          const rowFee = parseFloat(orderRow.total_fee || 0);
          runtimeRevenueSum += rowFee;

          const rawStatus = String(orderRow.status || '').toLowerCase().trim();
          
          if (rawStatus === 'paid' || rawStatus === 'fulfillment lane') {
            activeEntitiesCount++;
          } else if (rawStatus === 'pending' || rawStatus === 'audit required') {
            pendingAuditsCount++;
          }
        });
      }

      // Bind calculations safely into the user interface text elements
      if (revenueEl) revenueEl.textContent = `$${runtimeRevenueSum.toFixed(2)}`;
      if (activeEl)  activeEl.textContent  = activeEntitiesCount.toString();
      if (pendingEl) pendingEl.textContent = pendingAuditsCount.toString();

    } catch (metricFault) {
      console.error("✕ Platform Metrics Tabulation Fault Intercepted:", metricFault);
    }
  }
})();
