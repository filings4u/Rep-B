// ============================================================================
// 📁 SELF-CONTAINED LOCAL PURGE TERMINATOR INTERACTION CONTROLLER
// ============================================================================
(function injectIsolatedTerminatorPipeline() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeSessionPurgeController();
  });

  function initializeSessionPurgeController() {
    const triggerBtn = document.getElementById("sidebarFallbackLogoutBtn");
    if (!triggerBtn) return;

    triggerBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      triggerBtn.disabled = true;
      triggerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Wiping Security Cache...';

      // Use the verified failsafe database client picker module
      let coreClient = window.supabaseClient || window.supabase;
      if (!coreClient && typeof window.supabase?.createClient === 'function') {
        coreClient = window.supabase;
      }

      console.log("Terminal logout initialized via self-contained trigger...");

      try {
        if (coreClient && coreClient.auth) {
          // Attempt over-the-air backend session tear-down
          await coreClient.auth.signOut();
        }
      } catch (authErr) {
        console.warn("Server session clear deferred. Proceeding with hard client wipe.", authErr);
      } finally {
        // 1. HARD WIPE BROWSER CACHE REGISTRIES
        if (typeof window.localStorage !== 'undefined') {
          window.localStorage.clear();
        }
        if (typeof window.sessionStorage !== 'undefined') {
          window.sessionStorage.clear();
        }

        // 2. SCRUB ALL BROWSER COOKIES IDENTIFIER FIELDS
        if (document.cookie) {
          document.cookie.split(";").forEach(cookieItem => {
            const eqPos = cookieItem.indexOf("=");
            // 🟢 FIXED: Swapped deprecated .substr() for standard-compliant .substring()
            const cookieName = eqPos > -1 ? cookieItem.substring(0, eqPos).trim() : cookieItem.trim();
            
            document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname + ";";
          });
        }

        // 3. IMMEDIATE RE-ROUTING GATE
        console.log("Purge complete. Transferring terminal to login gateway.");
        window.location.replace('admin-login.html');
      }
    });
  }
})();
