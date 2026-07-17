// ============================================================================
// 📁 STAT CARD MODULAR COMPONENT: REAL-TIME ANALYTICS HYDRATION
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // 🟢 DELAY PATCH: Postpones boot checks to let the central config file load cleanly
    setTimeout(() => {
      hydrateAdminMetricsRow();
    }, 100);
  });

  async function hydrateAdminMetricsRow() {
    const revNode = document.getElementById("stat-total-revenue");
    const activeNode = document.getElementById("stat-active-users");
    const pendingNode = document.getElementById("stat-pending-filings");

    // 🟢 SECURITY LOOKUP FIX: Maps safely to verified, ready backend database client pools
    let supabaseClient = window.supabaseClient || window.supabase || window.sb;
    if (!supabaseClient || typeof supabaseClient.from !== 'function') {
      console.warn("[Metrics Gateway Delay] Database client layer not ready. Yielding thread context.");
      return;
    }

    try {
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

          if (currentStatus.includes("paid") || currentStatus.includes("validated") || currentStatus.includes("active")) {
            aggregatePlatformRevenue += fee;
            activeEntitiesCount++;
          }

          if (currentStatus.includes("review") || currentStatus.includes("pending") || currentStatus.includes("queued")) {
            pendingAuditsCount++;
          }
        });
      }

      if (revNode) revNode.textContent = `$${aggregatePlatformRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (activeNode) activeNode.textContent = activeEntitiesCount.toLocaleString('en-US');
      if (pendingNode) pendingNode.textContent = pendingAuditsCount.toLocaleString('en-US');

    } catch (metricError) {
      console.error("[Fatal Metrics Hydration Pass Exception]", metricError);
    }
  }
})();
