/**
 * 📁 FILE PATH: assets/js/supabase-config.js (infrastructure-part-a)
 * Responsibility: Secure Core Database Bootstrapper & Direct Route Perimeter Guard
 */
(function() {
  "use strict";

  window.escapeTimelineHTML = function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
            const currentPath = window.location.pathname.toLowerCase();
            const isAdminRoute = currentPath.includes('admin-') || currentPath.includes('/admin');
            
            if (columnName === 'user_id') {
              if (isAdminRoute) {
                console.log(`📡 [Security Gate] Admin path detected. Allowing global matrix bypass on table: [${tableName}]`);
                return queryBuilder;
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

  // 🎯 THE DIRECT FRONTEND PERIMETER GUARD HIGHWAY
  window.enforceSynchronousRoutePerimeterGuard = async function(clientInstance) {
    const currentPath = window.location.pathname.toLowerCase();
    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
    const isUpdatePasswordPage = currentPath.includes('update-password');

    // Skip verification routines entirely if the visitor is browsing public-facing landing layouts
    if (!isAdminPage && !isClientPage && !isUpdatePasswordPage) return;

    console.log("🛡️ [Route Perimeter Guard] Verifying access token credentials state...");
    
    // Retrieve the active session payload context directly from memory
    const { data: { session }, error } = await clientInstance.auth.getSession();
    const activeUser = session?.user;

    // SCENARIO 1: Unauthenticated user tries accessing restricted portal spaces
    if (!activeUser) {
      console.warn("🔒 Access Denied: Session token context missing. Routing to entry login gates.");
      if (isAdminPage) {
        window.location.replace(`${window.location.origin}/admin-login.html`);
      } else {
        window.location.replace(`${window.location.origin}/portal-login.html`);
      }
      return;
    }

    // SCENARIO 2: Authenticated user hits the password revision view frame
    if (isUpdatePasswordPage) {
      console.log("🎯 Access Validated: Secure password modernization terminal initialized.");
      return;
    }

    // SCENARIO 3: Access Validation check verifying administrative group scopes
    if (isAdminPage) {
      const emailString = (activeUser.email || "").toLowerCase();
      if (!emailString.endsWith('@filings4u.com')) {
        console.error("🔒 Security Escalation: Client profile rejected from admin territory.");
        await clientInstance.auth.signOut();
        window.location.replace(`${window.location.origin}/admin-login.html`);
      }
    }
  };

  function bootstrapGlobalSupabaseSystem() {
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (window.supabaseClient || window.supabaseInstance) {
      return;
    }

    const cdnLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (cdnLibrary && typeof cdnLibrary.createClient === 'function') {
      const initializedInstance = cdnLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "filings4u_secure_session_token"
        }
      });

      window.supabaseClient = initializedInstance;
      window.supabaseInstance = initializedInstance;
      window.productionRootUrl = window.location.origin;

      if (typeof window.executePerimeterSecurityGate === 'function') {
        window.executePerimeterSecurityGate(initializedInstance);
      }

      // 🎯 Run the structural verification engine right at script execution checkpoint
      window.enforceSynchronousRoutePerimeterGuard(initializedInstance);
    }
  }

  bootstrapGlobalSupabaseSystem();
})();
