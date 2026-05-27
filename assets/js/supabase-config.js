/** 
 * 🚀 filings4u Global Production Infrastructure Config & Secure Perimeter Gate 
 * Standardized single-source architecture for auth validation and connection syncing 
 */ 
(function bootstrapGlobalSupabaseSystem() { 
    "use strict"; 
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"; 

    function initializeCoreClient() {
        // Fix capitalization lookup error from official CDN engine signature
        const cdnInstance = window.Supabase || window.supabase;
        if (cdnInstance && typeof cdnInstance.createClient === 'function') { 
            if (!window.supabaseClient) { 
                window.supabaseClient = cdnInstance.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
                    auth: { 
                        persistSession: true, 
                        autoRefreshToken: true, 
                        detectSessionInUrl: true, 
                        storageKey: "filings4u_secure_session_token" 
                    } 
                }); 
                // Legacy support mapping for background engine scripts
                window.supabase = window.supabaseClient;
                window.productionRootUrl = window.location.origin; 
            } 
            executePerimeterSecurityGate(window.supabaseClient); 
            return true;
        }
        return false;
    }

    if (!initializeCoreClient()) { 
        const scriptWatcher = setInterval(() => { 
            if (initializeCoreClient()) { 
                clearInterval(scriptWatcher); 
            } 
        }, 10); 
    } 

    // ========================================================================== 
    // 🛡️ CENTRAL INTERCEPTION SECURITY GATEWAY 
    // ========================================================================== 
    async function executePerimeterSecurityGate(client) { 
        const currentPath = window.location.pathname.toLowerCase(); 
        const fallbackBase = window.location.origin; 
        const publicPages = [ 
            "/portal-login.html", 
            "/admin-login.html", 
            "/forgot-password.html", 
            "/update-password.html" 
        ]; 
        const isPublic = publicPages.some(page => currentPath.endsWith(page)) || currentPath === "/" || currentPath === ""; 
        
        if (isPublic) return; 
        const rootElement = document.documentElement; 
        rootElement.style.visibility = "hidden"; 
        
        try { 
            const { data: { session }, error } = await client.auth.getSession(); 
            if (error || !session || !session.user) { 
                throw new Error("Missing active profile credential tokens."); 
            } 
            const email = session.user.email.toLowerCase().trim(); 
            const isCorporate = email.endsWith("@filings4u.com") || email === "test-admin@filings4u.com"; 
            
            if (currentPath.includes("admin-") || currentPath.includes("/admin")) { 
                if (!isCorporate) { 
                    console.warn(`Security Breach: Client profile ${email} rejected from admin space.`); 
                    window.location.replace(`${fallbackBase}/portal-login.html`); 
                    return; 
                } 
            } 
            console.log(`🔐 Session verified for: ${email} on path: ${currentPath}`); 
            rootElement.style.visibility = "visible"; 
        } catch (gateError) { 
            console.warn("Perimeter Guard Redirect Action Intercepted:", gateError.message); 
            try { await client.auth.signOut(); } catch (_) {} 
            if (currentPath.includes("admin")) { 
                window.location.replace(`${fallbackBase}/admin-login.html`); 
            } else { 
                window.location.replace(`${fallbackBase}/portal-login.html`); 
            } 
        } 
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
        const client = window.supabaseClient; // Fixed variable pointer lookup case
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

  async function executeAdministrativeStaffSignOut() {
      // 1. Establish direct link to the active Supabase client instance gate
      const logoutGateClient = window.supabaseClient || window.supabase;
      
      console.log("Initializing secure platform log out sequence tracker...");

      try {
          // 2. Perform defensive cloud session clearance token check
          if (logoutGateClient && logoutGateClient.auth) {
              await logoutGateClient.auth.signOut();
          }
      } catch (authErr) {
          // If the server network link fails, bypass it silently to guarantee frontend ejection
          console.warn("Server-side session teardown deferred. Proceeding with absolute client-side local cache purge.");
      } finally {
          // 3. HARD PURGE: Force wipe all localized storage indices across current browser caches
          if (typeof window.localStorage !== 'undefined') {
              window.localStorage.clear();
          }
          if (typeof window.sessionStorage !== 'undefined') {
              window.sessionStorage.clear();
          }

          // 4. COOKIE PURGE FLASH: Wipe out any platform auth tokens stored in cookies fields
          document.cookie.split(";").forEach(cookieItem => {
              const eqPos = cookieItem.indexOf("=");
              const cookieName = eqPos > -1 ? cookieItem.substr(0, eqPos).trim() : cookieItem.trim();
              document.cookie = cookieName + "=;expires=Thu, 01 Jan 170 blank;path=/;";
              document.cookie = cookieName + "=;expires=Thu, 01 Jan 170 blank;path=/;domain=" + window.location.hostname + ";";
          });

          // 5. IMMEDIATE REDIRECT EJECTION GATES
          console.log("Wipe completed. Transferring profile to verification gate lines.");
          window.location.replace('admin-login.html');
      }
  }

  // --- WIRE UP HTML COMPONENT CLICK TRIGGERS AUTOMATICALLY ---
  document.addEventListener("DOMContentLoaded", () => {
      // Auto-binds this secure script engine to any button or link containing a 'logout' keyword property
      document.querySelectorAll("button, a").forEach(domNode => {
          const clickAttr = String(domNode.getAttribute("onclick") || "");
          const hrefAttr = String(domNode.getAttribute("href") || "");
          const textContent = String(domNode.textContent || "").toLowerCase();

          if (clickAttr.includes("logout") || clickAttr.includes("signOut") || hrefAttr.includes("logout") || textContent.includes("log out") || textContent.includes("logout") || textContent.includes("sign out")) {
              domNode.removeAttribute("onclick");
              domNode.setAttribute("href", "javascript:void(0);");
              domNode.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  executeAdministrativeStaffSignOut();
              });
              domNode.style.cursor = "pointer";
          }
      });
  });