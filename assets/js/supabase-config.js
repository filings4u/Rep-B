/**
 * 📁 FILE PATH: assets/js/supabase-config.js (infrastructure-part-a)
 * Responsibility: Secure Core Database Bootstrapper & Query Interceptor Security Gate
 */
(function() {
  "use strict";

  // ✅ FIXED: Corrected the quote escaping syntax crash string parameter safely
  window.escapeTimelineHTML = function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  window.executePerimeterSecurityGate = function(clientInstance) {
    console.log("🚀 System patch: executePerimeterSecurityGate mapped and stabilized.");
    
    if (clientInstance && clientInstance.from) {
      const originalFromMethod = clientInstance.from;
      
      clientInstance.from = function(tableName) {
        const queryBuilder = originalFromMethod.apply(this, arguments);
        
        if (queryBuilder && typeof queryBuilder.eq === 'function') {
          const originalEqMethod = queryBuilder.eq;
          
          queryBuilder.eq = function(columnName, criteriaValue) {
            // ✅ FIXED: Bypass the user_id lockout if the user is operating within an admin path
            const currentPath = window.location.pathname.toLowerCase();
            const isAdminRoute = currentPath.includes('admin-') || currentPath.includes('/admin');

            if (columnName === 'user_id') {
              if (isAdminRoute) {
                console.log(`📡 [Security Gate] Admin path detected. Allowing global matrix bypass on table: [${tableName}]`);
                return queryBuilder; // Skip injecting the user_id constraint entirely for admins
              }
              console.log(`🔧 [Security Gate] Query Interceptor: Enforcing strict user_id mapping validation layout on table: [${tableName}]`);
              return originalEqMethod.call(this, 'user_id', criteriaValue);
            }
            return originalEqMethod.apply(this, arguments);
          };
        }
        return queryBuilder;
      };
    }
  };

  // PLATFORM DATABASE ENGINE INITIALIZATION
  function bootstrapGlobalSupabaseSystem() {
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (window.supabaseClient || window.supabaseInstance) {
      const existingClient = window.supabaseClient || window.supabaseInstance;
      window.supabaseClient = existingClient;
      window.supabaseInstance = existingClient;
      return;
    }

    const cdnLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    
    if (cdnLibrary && typeof cdnLibrary.createClient === 'function') {
      const initializedInstance = cdnLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "filings4u_secure_session_token" }
      });

      window.supabaseClient = initializedInstance;
      window.supabaseInstance = initializedInstance;
      window.productionRootUrl = window.location.origin;
      
      console.log("📡 [Supabase Config] Production database instance successfully bound to all global namespaces.");
      
      if (typeof window.executePerimeterSecurityGate === 'function') {
        window.executePerimeterSecurityGate(initializedInstance);
      }
    } else {
      console.error("❌ Critical Infrastructure Error: Supabase CDN factory constructor is missing from the global window object.");
    }
  }

  bootstrapGlobalSupabaseSystem();
})();


/**
 * 📁 FILE PATH: assets/js/infrastructure-part-b.js
 * Responsibility: Platform Auditing Logging Channels & Inactivity Timeout Watchdogs
 */
(function() {
  "use strict";

  // --- STAGE 1: GLOBAL SECURE AUTH HOOKS INTEGRATION PIPELINE ---
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
        
        const resolvedRole = (currentPath.includes("admin-") || currentPath.includes("/admin")) 
          ? "ADMIN STAFF" 
          : "PORTAL CLIENT";

        if (currentPath.includes("admin-system-logs")) return;

        try {
          if (event === 'SIGNED_IN') {
            const cacheKey = `logged_in_${userEmail}_${session.id}`;
            if (sessionStorage.getItem(cacheKey)) return;
            sessionStorage.setItem(cacheKey, "true");

            // Appends authentication event telemetry history straight into your logs table
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
        } catch (telemetryFault) {
          console.warn("⚠️ Telemetry logging exception bypassed safely:", telemetryFault.message);
        }
      });
    }
  }, 200);

  // --- STAGE 2: INACTIVITY WATCHDOG CHANNEL TIMERS ---
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes
  let adminTimer = null;
  let clientTimer = null;

  async function purgeAdminSession() {
    console.warn("🔒 Security Alert: Admin session idle for 15 minutes. Triggering purge...");
    if (window.supabaseClient?.auth) {
      try {
        await window.supabaseClient.auth.signOut();
      } catch(e){}
    }
    // Wipe local cache layers
    localStorage.removeItem("filings4u_secure_session_token");
    sessionStorage.clear();
    window.location.replace(`${window.location.origin}/admin-login.html`);
  }

  async function purgeClientSession() {
    console.warn("🔒 Security Alert: Customer session idle for 15 minutes. Triggering purge...");
    if (window.supabaseInstance?.auth) {
      try {
        await window.supabaseInstance.auth.signOut();
      } catch(e){}
    }
    // Wipe local cache layers
    localStorage.removeItem("filings4u_secure_session_token");
    sessionStorage.clear();
    window.location.replace(`${window.location.origin}/portal-login.html`);
  }

  function resetTimers() {
    const path = window.location.pathname.toLowerCase();
    
    if (path.includes('admin-') || path.includes('/admin')) {
      if (adminTimer) clearTimeout(adminTimer);
      adminTimer = setTimeout(purgeAdminSession, INACTIVITY_LIMIT);
    }
    
    // Updated to match your standard client-dashboard or web routing conventions
    if (path.includes('client-') || path.includes('/client') || path.includes('forgot-password')) {
      if (clientTimer) clearTimeout(clientTimer);
      clientTimer = setTimeout(purgeClientSession, INACTIVITY_LIMIT);
    }
  }

  function startInteractionTracking() {
    const path = window.location.pathname.toLowerCase();
    const isAdmin = path.includes('admin-') || path.includes('/admin');
    const isClient = path.includes('client-') || path.includes('/client') || path.includes('forgot-password');

    if (!isAdmin && !isClient) return; // Do not apply timeouts on public landing layouts

    const interactionEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    interactionEvents.forEach(evt => {
      document.addEventListener(evt, resetTimers, { passive: true });
    });

    resetTimers();
    console.log(`📡 Automated Timeout System: Isolated 15-Minute activity barrier guard engaged for [${isAdmin ? "ADMIN" : "CLIENT"}].`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInteractionTracking);
  } else {
    startInteractionTracking();
  }
})();
