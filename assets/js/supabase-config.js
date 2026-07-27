  // ============================================================================
  // FRONTEND ROUTE PERIMETER GUARD ENGINE (FIXED LOGIN EXCLUSION)
  // ============================================================================
  window.enforceSynchronousRoutePerimeterGuard = async function(clientInstance) {
    const currentPath = window.location.pathname.toLowerCase();
    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
    const isUpdatePasswordPage = currentPath.includes('update-password');
    
    // 🎯 THE DIRECT LOGIN FIX: If they are on a login screen, exit immediately and let them type!
    if (currentPath.includes('login') || currentPath.includes('signin')) return;

    // Skip verification routines entirely if the visitor is browsing standard public landing layouts
    if (!isAdminPage && !isClientPage && !isUpdatePasswordPage) return;

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
      window.injectSecureBlurInterceptionOverlay();
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
        window.injectSecureBlurInterceptionOverlay();
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
