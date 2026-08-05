// BLOCK 1: Tab Inactivity Engine & Route Guard Perimeter Layouts
// ============================================================================
// ⏱️ 10-MINUTE TAB INACTIVITY AUTO-LOGOUT CONTROLLER (PART 1 OF 2)
// ============================================================================
(function() {
  "use strict";
  let backgroundTimerReference = null;
  // ⚡ UNIFORM UPGRADE: Changed from 5 minutes to exactly 10 minutes to match password-reset watchdog parameters
  const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;

  window.initializeTabInactivityMonitorEngine = function(clientInstance) {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Ignore logic on public authentication and update password pages entirely
    if (currentPath.includes('login') || currentPath.includes('signin') || currentPath.includes('update-password')) return;
    
    const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
    const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
    if (!isAdminPage && !isClientPage) return;

    console.log("⏱️ [Inactivity Engine] Monitoring active workspace tab presence matrices (10-Min Limit)...");
    
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) {
        console.log("⚠️ [Inactivity Engine] Tab hidden. Initiating 10-minute logout countdown context...");
        backgroundTimerReference = setTimeout(async () => {
          console.warn("🚨 [Inactivity Engine] 10 minutes exceeded in background state. Purging credentials...");
          
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
          window.location.replace("https://filings4u.com");
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
  
  // 🛡️ CRITICAL SAFETIES: If they are resetting their password, immediately break away!
  // This blocks the global router from pre-emptively eating the hash token and causing JWT errors.
  if (currentPath.includes('update-password')) {
    console.log("🔒 [Route Perimeter Guard] Password update page bypassed to preserve token handshakes.");
    return;
  }

  if (currentPath.includes('login') || currentPath.includes('signin')) {
    console.log("🔐 [Route Perimeter Guard] Login view context detected. Perimeter checks disabled.");
    return;
  }

  const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
  const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
  if (!isAdminPage && !isClientPage) return;

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
      window.location.replace("https://filings4u.com");
    }, 1500);
    return;
  }

  if (isAdminPage) {
    const emailString = (activeUser.email || "").toLowerCase();
    if (!emailString.endsWith('@filings4u.com')) {
      console.warn("🔒 Security Alert: Non-admin profile detected on admin route. Ejecting...");
      if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
        window.injectSecureBlurInterceptionOverlay();
      }
      await clientInstance.auth.signOut();
      setTimeout(() => {
        window.location.replace("https://filings4u.com");
      }, 1500);
    }
  }
};

// ============================================================================
// BLOCK 2: Authenticated Form Execution & 2-Strike Security Handler
// ============================================================================
window.executePortalProfileAuthentication = async function(email, password, clientInstance) {
  const errorAlert = document.getElementById("login-error-display");
  try {
    console.log("📡 [Auth Flow] Transmitting credentials packet securely...");
    const { data, error } = await clientInstance.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials") || error.status === 400) {
        window.handleFailedLoginAttemptTracking();
      }
      if (errorAlert) errorAlert.innerText = error.message;
      return;
    }

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
  console.warn("🔒 [Security Guard] Login strike logged: " + currentStrikesCount + "/2");

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

window.clearLoginStrikesOnSuccess = function() {
  localStorage.removeItem("f4u_portal_login_strikes");
};


// assets/js/supabase-config.js
// 🔐 Global Supabase Client Initialization Setup Matrix

(function () {
  // Replace these placeholders with your actual project keys
  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

  if (!window.supabase) {
    console.error("Supabase CDN library was not loaded prior to initialization sequence.");
    return;
  }

  // Initialize and attach securely to window context
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("🚀 Supabase Client Workspace successfully established.");
})();


/**
 * Filings4U Enterprise Synchronization Engine
 * Central Real-Time Webhook Pipeline Middleware 
 */
window.Filings4uSyncEngine = {
  activeChannels: {},

  // Initialize Real-time Client Listening Portals
  initGlobalListener: function(client, userEmail, onNotificationCallback) {
    if (!client || !userEmail) return console.warn("⚡ [Sync Engine] Initialization parameters absent.");

    console.log(`📡 [Sync Engine] Subscribing to live updates for profile: [${userEmail}]`);

    // Channel 1: Listen for specific client notification flags
    this.activeChannels.portalNotifs = client
      .channel('public-portal-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'portal_notifications',
        filter: `user_email=eq.${userEmail}`
      }, (payload) => {
        console.log("🔔 [Sync Engine] Inbound portal alert captured:", payload.new);
        this.incrementGlobalNotificationBadge();
        if (typeof onNotificationCallback === 'function') onNotificationCallback(payload.new);
      })
      .subscribe();

    // Channel 2: Listen for systemic dashboard broadcasts
    this.activeChannels.systemBroadcasts = client
      .channel('global-system-broadcasts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' }, (payload) => {
        console.log("📢 [Sync Engine] System broad banner pushed:", payload.new);
        if (typeof window.showGlobalBannerAlert === 'function') {
          window.showGlobalBannerAlert(payload.new.message || "System maintenance scheduled.");
        }
      })
      .subscribe();
  },

  // Updates notification indicator across headers cleanly
  incrementGlobalNotificationBadge: function() {
    const badge = document.getElementById("globalNavUnreadCounterBadge");
    if (!badge) return;
    
    let activeCount = parseInt(badge.textContent.trim(), 10) || 0;
    activeCount += 1;
    badge.textContent = activeCount;
    badge.style.display = "inline-flex";
    
    // Play light visual entry pop
    badge.style.transform = "scale(1.2)";
    setTimeout(() => { badge.style.transform = "scale(1)"; }, 150);
  },

  // Standardized interface state updating system
  dispatchPipelineMutation: async function(client, targetTable, recordId, updatedPayload) {
    console.log(`🚀 [Sync Engine] Broadcasting data mutation across: [public.${targetTable}] for ID: ${recordId}`);
    
    // Broadcast mutation to Supabase via database updates
    const { data, error } = await client
      .from(targetTable)
      .update(updatedPayload)
      .eq('id', recordId);
      
    if (error) {
      console.error(`✕ [Sync Engine] Mutation dispatch failed on table ${targetTable}:`, error.message);
      throw error;
    }
    return data;
  }
};
