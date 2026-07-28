// BLOCK 1: Tab Inactivity Engine & Route Guard Perimeter Layouts
// ============================================================================
// ⏱️ 5-MINUTE TAB INACTIVITY AUTO-LOGOUT CONTROLLER (PART 1 OF 2)
// ============================================================================
(function() { 
    "use strict"; 
    let backgroundTimerReference = null; 
    const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; 

    window.initializeTabInactivityMonitorEngine = function(clientInstance) { 
        const currentPath = window.location.pathname.toLowerCase(); 
        if (currentPath.includes('login') || currentPath.includes('signin')) return; 
        
        const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin'); 
        const isClientPage = currentPath.includes('client-') || currentPath.includes('/client'); 
        if (!isAdminPage && !isClientPage) return; 
        
        console.log("⏱️ [Inactivity Engine] Monitoring active workspace tab presence matrices..."); 
        
        document.addEventListener("visibilitychange", async () => { 
            if (document.hidden) { 
                console.log("⚠️ [Inactivity Engine] Tab hidden. Initiating 5-minute logout countdown context..."); 
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
                    localStorage.removeItem("f4u_stripe_client_secret"); 
                    localStorage.removeItem("f4u_portal_login_strikes"); 
                    window.location.replace("https://filings4u.com/get-started.html"); 
                }, INACTIVITY_LIMIT_MS); 
            } else { 
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
    if (currentPath.includes('login') || currentPath.includes('signin')) { 
        console.log("🔓 [Route Perimeter Guard] Login view context detected. Perimeter checks disabled."); 
        return; 
    } 
    
    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin'); 
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client'); 
    const isUpdatePasswordPage = currentPath.includes('update-password'); 
    if (!isAdminPage && !isClientPage && !isUpdatePasswordPage) return; 

    if (typeof window.initializeTabInactivityMonitorEngine === "function") { 
        window.initializeTabInactivityMonitorEngine(clientInstance); 
    } 

    const activeStoredToken = localStorage.getItem("f4u_active_tracking_token"); 
    if (activeStoredToken === "F4U-UNKNOWN" || activeStoredToken === "UNKNOWN") { 
        localStorage.removeItem("f4u_active_tracking_token"); 
    } 
    
    console.log("🛡️ [Route Perimeter Guard] Assessing session token authenticity..."); 
    const { data: { session } } = await clientInstance.auth.getSession(); 
    const activeUser = session?.user; 

    if (!activeUser) { 
        if (typeof window.injectSecureBlurInterceptionOverlay === "function") { 
            window.injectSecureBlurInterceptionOverlay(); 
        } 
        setTimeout(() => { 
            window.location.replace("https://filings4u.com/get-started.html"); 
        }, 1500); 
        return; 
    } 

    if (isUpdatePasswordPage) return; 

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



// BLOCK 2: Authenticated Form Execution & 2-Strike Security Handler
window.executePortalProfileAuthentication = async function(email, password, clientInstance) {
    const errorAlert = document.getElementById("login-error-display");
    
    try {
        console.log("📡 [Auth Flow] Transmitting credentials packet securely...");
        const { data, error } = await clientInstance.auth.signInWithPassword({ email, password });
        
        if (error) {
            // If the credentials are explicitly wrong, register a strike!
            if (error.message.toLowerCase().includes("invalid login credentials") || error.status === 400) {
                window.handleFailedLoginAttemptTracking();
            }
            if (errorAlert) errorAlert.innerText = error.message;
            return;
        }

        // Sign in worked perfectly, wipe out any old strikes!
        window.clearLoginStrikesOnSuccess();
        window.location.replace("/client-dashboard.html");

    } catch (unexpectedException) {
        console.error("✕ Critical Authentication Routine Fault Caught: ", unexpectedException.message);
        if (errorAlert) errorAlert.innerText = "An unexpected processing system exception halted sign in.";
    }
};

// ============================================================================
// 🎯 THE 2-STRIKE FAILURE LOCK SYSTEM
// ============================================================================
window.handleFailedLoginAttemptTracking = function() {
    let currentStrikesCount = parseInt(localStorage.getItem("f4u_portal_login_strikes") || "0", 10);
    currentStrikesCount += 1;
    localStorage.setItem("f4u_portal_login_strikes", currentStrikesCount.toString());
    console.warn(`🔒 [Security Guard] Login strike logged: ${currentStrikesCount}/2`);

    // If they fail 2 times, freeze the page instantly with the blur popup and eject them
    if (currentStrikesCount >= 2) {
        console.error("🚨 Critical Lock Triggered: 2 sequential login failures detected. Deploying defense matrix...");
        localStorage.removeItem("f4u_portal_login_strikes");
        
        if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
            window.injectSecureBlurInterceptionOverlay();
        }
        
        setTimeout(() => {
            window.location.replace("https://filings4u.com");
        }, 1500);
    }
    return currentStrikesCount;
};

// 🎯 CLEAR STRIKES ON SUCCESS
window.clearLoginStrikesOnSuccess = function() {
    localStorage.removeItem("f4u_portal_login_strikes");
};
