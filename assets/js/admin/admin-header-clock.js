// ============================================================================
// 🎯 MODULAR ASSET: HEADER CLOCK HYDRATION LOGIC
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializePortalHeaderClock();
  });

  function initializePortalHeaderClock() {
    // 🟢 FIXED: Synchronized ID lookups string target to match your active DOM node exactly
    const clockOutputNode = document.getElementById("portal-clock");
    if (!clockOutputNode) return;

    const clockIntervalId = setInterval(() => {
      const now = new Date();

      // Format Date string: MM/DD/YYYY
      const datePart = now.toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric'
      });

      // Format Time string: HH:MM:SS AM/PM
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });

      // Update node layout to reflect unified parameters safely
      clockOutputNode.textContent = `${datePart} | ${timePart}`;
    }, 1000);

    // Safeguard circuit to clear intervals if memory states are refreshed
    window.addEventListener("unload", () => {
      clearInterval(clockIntervalId);
    });
  }
})();
