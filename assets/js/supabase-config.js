/** 
 * 🚀 filings4u Global Production Infrastructure Config & Secure Perimeter Gate 
 * Standardized single-source architecture for auth validation and connection syncing 
 */ 
(function bootstrapGlobalSupabaseSystem() {
  "use strict";
  
  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

  function initializeClient() {
    // Stop if the client is already initialized
    if (window.supabaseClient) return;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "filings4u_secure_session_token"
        }
      });
      window.productionRootUrl = window.location.origin;
      executePerimeterSecurityGate(window.supabaseClient);
    }
  }

  // Run immediately if the script is ready, otherwise wait for the page to load
  if (window.supabase) {
    initializeClient();
  } else {
    document.addEventListener("DOMContentLoaded", initializeClient);
  }
})();


/** 
 * ========================================================================== 
 * ⏱️ GLOBAL AUTOMATED ADMINISTRATIVE 12-HOUR REAL-TIME CLOCK ENGINE 
 * ========================================================================== 
 */ 
(function initializeGlobalAdminClockMatrix() { 
  "use strict"; 
  function executeClockSynchronization() { 
    const targetClock = document.getElementById('portal-clock'); 
    if (!targetClock) return; 
    function renderTime() { 
      const now = new Date(); 
      const d = String(now.getDate()).padStart(2, '0'); 
      const m = String(now.getMonth() + 1).padStart(2, '0'); 
      const y = now.getFullYear(); 
      let rawHours = now.getHours(); 
      const ampmMarker = rawHours >= 12 ? 'PM' : 'AM'; 
      rawHours = rawHours % 12; 
      rawHours = rawHours ? rawHours : 12; 
      const hrs = String(rawHours).padStart(2, '0'); 
      const mins = String(now.getMinutes()).padStart(2, '0'); 
      const secs = String(now.getSeconds()).padStart(2, '0'); 
      targetClock.textContent = `${m}/${d}/${y} | ${hrs}:${mins}:${secs} ${ampmMarker}`; 
    } 
    renderTime(); 
    setInterval(renderTime, 1000); 
  } 
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', executeClockSynchronization); 
  } else { 
    executeClockSynchronization(); 
  } 
})(); 

/** 
 * ========================================================================== 
 * 🛡️ GLOBAL AUTH STATE TELEMETRY HOOK (TRACKS ALL ADMINS & CLIENTS) 
 * ========================================================================== 
 */ 
(function bindGlobalAuthStateTracking() { 
  const trackingLoop = setInterval(() => { 
    const client = window.supabaseClient; 
    if (client && client.auth && typeof client.auth.onAuthStateChange === 'function') { 
      clearInterval(trackingLoop); 
      if (window.isTelemetryHookBound) return; 
      window.isTelemetryHookBound = true; 
      client.auth.onAuthStateChange(async (event, session) => { 
        if (!session || !session.user) return; 
        const userEmail = session.user.email; 
        const currentPath = window.location.pathname.toLowerCase(); 
        const resolvedRole = (currentPath.includes("admin-") || currentPath.includes("/admin")) ? "ADMIN STAFF" : "PORTAL CLIENT"; 
        if (currentPath.includes("admin-system-logs")) return; 
        if (event === 'SIGNED_IN') { 
          const cacheKey = `logged_in_${userEmail}_${session.id}`; 
          if (sessionStorage.getItem(cacheKey)) return; 
          sessionStorage.setItem(cacheKey, "true"); 
          await client.from('platform_security_telemetry_logs').insert({ 
            action_type: 'LOGIN', 
            actor_email: userEmail, 
            account_role: resolvedRole, 
            message_details: `Successfully authenticated session via ${resolvedRole.toLowerCase()} panel.` 
          }); 
        } 
        if (event === 'SIGNED_OUT') { 
          await client.from('platform_security_telemetry_logs').insert({ 
            action_type: 'LOGOUT', 
            actor_email: userEmail, 
            account_role: resolvedRole, 
            message_details: `Explicit session termination requested from ${resolvedRole.toLowerCase()} terminal.` 
          }); 
        } 
      }); 
    } 
  }, 200); 
})(); 

/** 
 * ========================================================================== 
 * 🛡️ ISOLATED 15-MINUTE INACTIVITY SECURITY ROUTE GUARD 
 * ========================================================================== 
 */ 
(function deployStrictInactivityBarrierGate() { 
  "use strict"; 
  let inactivityCountdownTimer = null; 
  const INACTIVITY_DURATION_CAP_LIMIT = 15 * 60 * 1000; 
  async function purgeSessionOnTimeout() { 
    console.warn("Security Alert: Session idle for 15 minutes."); 
    const client = window.supabaseClient; 
    if (client && client.auth) { 
      try { 
        await client.auth.signOut(); 
      } catch (err) {} 
    } 
    window.location.replace(`${window.location.origin}/admin-login.html`); 
  } 
  function reloadInactivityCounter() { 
    if (inactivityCountdownTimer) { 
      clearTimeout(inactivityCountdownTimer); 
    } 
    inactivityCountdownTimer = setTimeout(purgeSessionOnTimeout, INACTIVITY_DURATION_CAP_LIMIT); 
  } 
  function registerInteractionTrackers() { 
    const targetPath = window.location.pathname.toLowerCase(); 
    if (!targetPath.includes('admin-') && !targetPath.includes('/admin')) return; 
    const physicalEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']; 
    physicalEvents.forEach(evt => { 
      document.addEventListener(evt, reloadInactivityCounter, { passive: true }); 
    }); 
    reloadInactivityCounter(); 
    console.log("📡 Automated Timeout System: Isolated 15-Minute Activity Guard Engaged."); 
  } 
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', registerInteractionTrackers); 
  } else { 
    registerInteractionTrackers(); 
  } 
})();
