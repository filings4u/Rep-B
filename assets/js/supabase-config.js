// ============================================================================
// ⏱️ 5-MINUTE TAB INACTIVITY AUTO-LOGOUT CONTROLLER (PART 1 OF 2)
// ============================================================================
(function() {
  "use strict";

  let backgroundTimerReference = null;
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // Exact 5-minute timeout conversion check bounds

  window.initializeTabInactivityMonitorEngine = function(clientInstance) {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Safety check: Do not execute background timeouts on the public login layout nodes
    if (currentPath.includes('login') || currentPath.includes('signin')) return;

    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
    
    // Limit execution contexts strictly to operational portal modules
    if (!isAdminPage && !isClientPage) return;

    console.log("⏱️ [Inactivity Engine] Monitoring active workspace tab presence matrices...");

    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) {
        console.log("⚠️ [Inactivity Engine] Tab hidden. Initiating 5-minute logout countdown context...");
        
        // Spawn an absolute background execution block tracking inactivity spans
        backgroundTimerReference = setTimeout(async () => {
          console.warn("🚨 [Inactivity Engine] 5 minutes exceeded in background state. Purging credentials...");
          
          if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
            window.injectSecureBlurInterceptionOverlay();
          }

          try {
            await clientInstance.auth.signOut();
          } catch (logoutFault) {
            console.error("[Inactivity Engine Error] Clean signout blocked:", logoutFault);
          }

          // Clear local browser storage maps completely to eliminate trace state properties
          localStorage.removeItem("f4u_stripe_client_secret");
          localStorage.removeItem("f4u_portal_login_strikes");
          
          // Eject the unauthenticated browser session immediately to the main sales landing page
          window.location.replace("https://filings4u.com/get-started.html");
        }, INACTIVITY_LIMIT_MS);

      } else {
        // If the user re-focuses the page before 5 minutes pass, clear the pending clock loop safely
        if (backgroundTimerReference) {
          console.log("✅ [Inactivity Engine] Tab focused. Resetting background timer triggers.");
          clearTimeout(backgroundTimerReference);
          backgroundTimerReference = null;
        }
      }
    });
  };
})();


// ============================================================================
// FRONTEND ROUTE PERIMETER GUARD ENGINE (PART 2 OF 2 - INTEGRATED INITIALIZATION)
// ============================================================================
window.enforceSynchronousRoutePerimeterGuard = async function(clientInstance) {
  const currentPath = window.location.pathname.toLowerCase();

  // 🎯 THE DIRECT FIX: This check must stay at the absolute top of the function.
  if (currentPath.includes('login') || currentPath.includes('signin')) {
    console.log("🔓 [Route Perimeter Guard] Login view context detected. Perimeter checks disabled.");
    return;
  }

  const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
  const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
  const isUpdatePasswordPage = currentPath.includes('update-password');

  // Skip verification routines entirely if the visitor is browsing standard public landing layouts
  if (!isAdminPage && !isClientPage && !isUpdatePasswordPage) return;

  // 🎯 RUN INACTIVITY ENGINE HOOK ON SECURE PATH PASSES
  if (typeof window.initializeTabInactivityMonitorEngine === "function") {
    window.initializeTabInactivityMonitorEngine(clientInstance);
  }

  // Wipes broken placeholder tokens out of memory to fix database crashes
  const activeStoredToken = localStorage.getItem("f4u_active_tracking_token");
  if (activeStoredToken === "F4U-UNKNOWN" || activeStoredToken === "UNKNOWN") {
    localStorage.removeItem("f4u_active_tracking_token");
  }

  console.log("🛡️ [Route Perimeter Guard] Assessing session token authenticity...");
  const { data: { session } } = await clientInstance.auth.getSession();
  const activeUser = session?.user;

  // SCENARIO 1: Visitor attempts accessing internal assets without an active account session
  if (!activeUser) {
    if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
      window.injectSecureBlurInterceptionOverlay();
    }
    setTimeout(() => {
      window.location.replace("https://filings4u.com/get-started.html");
    }, 1500);
    return;
  }

  // SCENARIO 2: Valid profile asset updates their security password access key
  if (isUpdatePasswordPage) return;

  // SCENARIO 3: Access Validation check monitoring administrative group scopes
  if (isAdminPage) {
    const emailString = (activeUser.email || "").toLowerCase();
    if (!emailString.endsWith('@filings4u.com')) {
      console.warn("🔒 Security Alert: Non-admin profile detected on admin route. Ejecting...");
      if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
        window.injectSecureBlurInterceptionOverlay();
      }
      await clientInstance.auth.signOut();
      setTimeout(() => {
        window.location.replace("https://filings4u.com/get-started.html");
      }, 1500);
    }
  }
};



const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  // If the credentials are explicitly wrong, register a strike!
  if (error.message.toLowerCase().includes("invalid login credentials") || error.status === 400) {
    window.handleFailedLoginAttemptTracking();
  }
  
  // Display standard error text to legitimate users who still have strikes left
  const errorAlert = document.getElementById("login-error-display");
  if (errorAlert) errorAlert.innerText = error.message;
} else {
  // Sign in worked perfectly, wipe out any old strikes!
  window.clearLoginStrikesOnSuccess();
  window.location.replace("/client-dashboard.html");
}


  // ============================================================================
// 🎯 THE 2-STRIKE FAILURE LOCK SYSTEM
// ============================================================================
window.handleFailedLoginAttemptTracking = function() {
  // Read current tracking numbers from local application memory
  let currentStrikesCount = parseInt(localStorage.getItem("f4u_portal_login_strikes") || "0", 10);
  
  currentStrikesCount += 1;
  localStorage.setItem("f4u_portal_login_strikes", currentStrikesCount.toString());
  
  console.warn(`🔒 [Security Guard] Login strike logged: ${currentStrikesCount}/2`);

  // If they fail 2 times, freeze the page instantly with the blur popup and eject them
  if (currentStrikesCount >= 2) {
    console.error("🚨 Critical Lock Triggered: 2 sequential login failures detected. Deploying defense matrix...");
    
    // Clear out the tracking strike value so they can try again on the landing page if necessary
    localStorage.removeItem("f4u_portal_login_strikes");

    // Block their viewport cleanly with your blur element overlay
    if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
      window.injectSecureBlurInterceptionOverlay();
    }

    // Reroute them to the sales funnel flow instantly
    setTimeout(() => {
      window.location.replace("https://filings4u.com/get-started.html");
    }, 1500);
  }
  
  return currentStrikesCount;
};

// 🎯 CLEAR STRIKES ON SUCCESS: Call this function when window.supabaseClient.auth.signInWithPassword() is successful
window.clearLoginStrikesOnSuccess = function() {
  localStorage.removeItem("f4u_portal_login_strikes");
};
