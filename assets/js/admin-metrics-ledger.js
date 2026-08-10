/**
 * 📁 FILE PATH: assets/js/admin-metrics-ledger.js
 * Responsibility: Mathematical tabulation of platform revenue metrics from database fields (CORRECTED)
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeMetricsHandshake();
  });

  async function initializeMetricsHandshake() {
    const revenueEl = document.getElementById("stat-total-revenue");
    const activeEl = document.getElementById("stat-active-users");
    const pendingEl = document.getElementById("stat-pending-filings");

    let client = window.supabaseInstance || window.supabaseClient;
    if (!client || typeof client.from !== 'function') {
      setTimeout(initializeMetricsHandshake, 200);
      return;
    }

    try {
      // 🟢 FIXED COLUMNS LOOKUP: Pulling your exact production column schema structures
      const { data: metricsGrid, error } = await client
        .from('orders')
        .select('total_paid_amount, account_created');

      if (error) throw error;

      let runtimeRevenueSum = 0;
      let activeEntitiesCount = 0;
      let pendingAuditsCount = 0;

      if (metricsGrid && metricsGrid.length > 0) {
        metricsGrid.forEach(orderRow => {
          // 🟢 FIXED SCHEMA PROPERTY: Maps onto total_paid_amount natively
          const rowFee = parseFloat(orderRow.total_paid_amount || 0);
          runtimeRevenueSum += rowFee;

          // Evaluate account tracking status fields matching your schema properties
          const isProvisioned = orderRow.account_created === true;
          if (isProvisioned) {
            activeEntitiesCount++;
          } else {
            pendingAuditsCount++;
          }
        });
      }

      // Bind calculations safely into the user interface text elements
      if (revenueEl) revenueEl.textContent = `$${runtimeRevenueSum.toFixed(2)}`;
      if (activeEl) activeEl.textContent = activeEntitiesCount.toString();
      if (pendingEl) pendingEl.textContent = pendingAuditsCount.toString();

    } catch (metricFault) {
      console.error("✕ Platform Metrics Tabulation Fault Intercepted:", metricFault);
    }
  }
})();
