/**
 * 📁 FILE PATH: assets/js/supabase-config.js (infrastructure-part-a)
 * Responsibility: Secure Core Database Bootstrapper, Visual Shield Generator, & Route Gate
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

  // 🎯 VISUAL SECURITY SHIELD INTERFACE LOGIC
  window.injectSecureBlurInterceptionOverlay = function() {
    if (document.getElementById("f4u-perimeter-blur-shield")) return;

    // Create a container layout that masks the entire browser screen window space
    const overlayNode = document.createElement("div");
    overlayNode.id = "f4u-perimeter-blur-shield";
    
    // Inject custom inline CSS properties to fully block the view frame background cleanly
    Object.assign(overlayNode.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(10, 31, 68, 0.4)",
      backdropFilter: "blur(16px)",
      webkitBackdropFilter: "blur(16px)",
      zIndex: "9999999",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    });

    // Create the modal banner interface text module panel block
    const cardNode = document.createElement("div");
    Object.assign(cardNode.style, {
      background: "#ffffff",
      padding: "32px 48px",
      borderRadius: "16px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      textAlign: "center",
      border: "1px solid #e2e8f0"
    });

    cardNode.innerHTML = `
      <div style="font-size: 24px; font-weight: 800; color: #0a1f44; margin-bottom: 8px;">Redirecting filings4u.com</div>
      <div style="font-size: 14px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="width: 16px; height: 16px; border: 2px solid #10b981; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: f4u-spin 0.8s linear infinite;"></span>
        Securing connection parameters...
      </div>
      <style>
        @keyframes f4u-spin { to { transform: rotate(360deg); } }
        body { overflow: hidden !important; } /* Prevent layout scrolling while active */
      </style>
    `;

    overlayNode.appendChild(cardNode);
    document.documentElement.appendChild(overlayNode);
  };

  window.executePerimeterSecurityGate = function(clientInstance) {
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
              if (isAdminRoute) return queryBuilder;
              return originalEqMethod.call(this, 'user_id', criteriaValue);
            }
            return originalEqMethod.apply(this, arguments);
          };
        }
        return queryBuilder;
      };
    }
  };
  // ============================================================================
  // FRONTEND ROUTE PERIMETER GUARD ENGINE WITH INTEGRATED BLUR SECURITY INTERCEPT
  // ============================================================================
  window.enforceSynchronousRoutePerimeterGuard = async function(clientInstance) {
    const currentPath = window.location.pathname.toLowerCase();
    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
    const isUpdatePasswordPage = currentPath.includes('update-password');

    // Bypass route perimeter checks entirely for non-restricted public landing grids
    if (!isAdminPage && !isClientPage && !isUpdatePasswordPage) return;

    // 🛡️ RE-GEN SAFEGUARD: Wipes broken placeholder tokens out of context to fix database crashes
    const activeStoredToken = localStorage.getItem("f4u_active_tracking_token");
    if (activeStoredToken === "F4U-UNKNOWN" || activeStoredToken === "UNKNOWN") {
      localStorage.removeItem("f4u_active_tracking_token");
      console.log("🔧 [Token Healer] Successfully cleared illegal F4U-UNKNOWN value from application memory.");
    }

    console.log("🛡️ [Route Perimeter Guard] Assessing session token authenticity parameter maps...");
    const { data: { session } } = await clientInstance.auth.getSession();
    const activeUser = session?.user;

    // SCENARIO 1: Visitor attempts accessing internal assets without an active account session
    if (!activeUser) {
      console.warn("🔒 Access Denied: Unauthenticated network request. Deploying perimeter blur shield...");
      
      // 🎯 Injects the visual blur overlay block instantly to screen out unauthorized views
      window.injectSecureBlurInterceptionOverlay();
      
      setTimeout(() => {
        window.location.replace("https://filings4u.com/get-started.html");
      }, 1500); // 1.5 seconds delay allows the redirect modal to render gracefully
      return;
    }

    // SCENARIO 2: Valid profile asset updates their security password access key
    if (isUpdatePasswordPage) {
      console.log("🎯 Access Validated: Secure password update panel initialized.");
      return;
    }

    // SCENARIO 3: Access Validation check monitoring structural administrative domain targets
    if (isAdminPage) {
      const emailString = (activeUser.email || "").toLowerCase();
      if (!emailString.endsWith('@filings4u.com')) {
        console.error("🔒 Security Escalation: Client profile rejected from admin territory. Engaging shield...");
        
        window.injectSecureBlurInterceptionOverlay();
        await clientInstance.auth.signOut();
        
        setTimeout(() => {
          window.location.replace("https://filings4u.com/get-started.html");
        }, 1500);
      }
    }
  };

  function bootstrapGlobalSupabaseSystem() {
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (window.supabaseClient || window.supabaseInstance) return;

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

      // 🎯 Engage the route guard check during the asset bootstrapping phase
      window.enforceSynchronousRoutePerimeterGuard(initializedInstance);
    }
  }

  bootstrapGlobalSupabaseSystem();
})();
