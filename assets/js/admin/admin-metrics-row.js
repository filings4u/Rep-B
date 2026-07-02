// ============================================================================
// 📁 STAT CARD MODULAR COMPONENT: REAL-TIME ANALYTICS HYDRATION
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    hydrateAdminMetricsRow();
  });

  async function hydrateAdminMetricsRow() {
    const revNode = document.getElementById("stat-total-revenue");
    const activeNode = document.getElementById("stat-active-users");
    const pendingNode = document.getElementById("stat-pending-filings");

    // Failsafe database reference connection picker
    let supabaseClient = window.supabase || window.supabaseClient || window.sb;
    if (!supabaseClient) return;

    try {
      // 1. QUERY THE COMPLETE ORDERS HISTORY MATRIX FROM CORES SCHEMAS
      const { data: globalLedger, error } = await supabaseClient
        .from('orders')
        .select('total_fee, status');

      if (error) throw error;

      let aggregatePlatformRevenue = 0;
      let activeEntitiesCount = 0;
      let pendingAuditsCount = 0;

      if (globalLedger && globalLedger.length > 0) {
        globalLedger.forEach(row => {
          const fee = parseFloat(row.total_fee) || 0;
          const currentStatus = (row.status || "").toLowerCase();

          // Calculate aggregated revenue for successful transactions
          if (currentStatus.includes("paid") || currentStatus.includes("validated") || currentStatus.includes("active")) {
            aggregatePlatformRevenue += fee;
            activeEntitiesCount++;
          }

          // Count pending audits or reviews
          if (currentStatus.includes("review") || currentStatus.includes("pending") || currentStatus.includes("queued")) {
            pendingAuditsCount++;
          }
        });
      }

      // 2. INJECT REAL-TIME VALUES INTO STYLED METRICS SLOTS
      if (revNode) revNode.textContent = `$${aggregatePlatformRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (activeNode) activeNode.textContent = activeEntitiesCount.toLocaleString('en-US');
      if (pendingNode) pendingNode.textContent = pendingAuditsCount.toLocaleString('en-US');

      console.log("[Metrics Synchronizer] Base operational cards successfully hydrated.");

    } catch (metricError) {
      console.error("[Fatal Metrics Hydration Pass Exception]", metricError);
    }
  }
})();
