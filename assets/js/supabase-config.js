/**
 * filings4u Platform Architecture
 * Module: supabase-config.js (Unified Production-Grade Route Guard Matrix)
 * Mandatory Placement Requirement: Must be loaded inside the <head> tag across all views.
 */
(function() {
  "use strict";

  // ============================================================================
  // 🔒 STAGE 0: COLD FAST SYNCHRONOUS HEAD PRE-RENDER FIREWALL (BLOCKS FLASHING)
  // ============================================================================
  const STORAGE_HASH = "lrbimrlbskjweynxlgas"; 
  const CORE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
  const SUPABASE_URL = `https://${STORAGE_HASH}.supabase.co`;
  const LOCAL_SESSION_KEY = `sb-${STORAGE_HASH}-auth-token`;

  const currentPath = window.location.pathname.toLowerCase();
  const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');
  const isClientPage = currentPath.includes('client-') || currentPath.includes('/client');
  const isExemptPage = currentPath.includes('login') || currentPath.includes('signin') || currentPath.includes('update-password');

  // Inject a secure background blur element to catch layout painting artifacts early
  window.injectSecureBlurInterceptionOverlay = function() {
    if (document.getElementById("securePerimeterBlurMaskOverlayNode")) return;
    const blur = document.createElement("div");
    blur.id = "securePerimeterBlurMaskOverlayNode";
    blur.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:#ffffff; backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:sans-serif; color:#0f172a; font-weight:700; font-size:1.1rem;";
    blur.innerHTML = "<div>🔒 Secure Perimeter Active. Verification In Progress...</div>";
    document.documentElement.appendChild(blur);
  };

  if (!isExemptPage && (isAdminPage || isClientPage)) {
    const rawSessionJson = localStorage.getItem(LOCAL_SESSION_KEY);
    let hasValidTokenCache = false;
    let cachedUserEmail = "";

    if (rawSessionJson) {
      try {
        const sessionData = JSON.parse(rawSessionJson);
        if (sessionData && sessionData.access_token && sessionData.user) {
          hasValidTokenCache = true;
          cachedUserEmail = String(sessionData.user.email || "").toLowerCase().trim();
        }
      } catch (e) {
        console.error("✕ Local storage validation parse error:", e);
      }
    }

    // Fast synchronous bounce to block page rendering completely if tokens are missing
    if (!hasValidTokenCache) {
      document.documentElement.style.display = "none"; // Forces immediate blank canvas
      window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
      throw new Error("🔒 Authorization Halted: Session context token unassigned.");
    }

    // Fast local domain guard validation check
    if (isAdminPage && !cachedUserEmail.endsWith('@filings4u.com')) {
      document.documentElement.style.display = "none";
      window.location.replace("admin-login.html");
      throw new Error("🛡️ Authorization Halted: Insufficient credentials domain footprint.");
    }
  }

  // ============================================================================
  // 📁 STAGE 1: DYNAMIC WORKSPACE INTERACTION INACTIVITY ENGINE 
  // ============================================================================
  let activityTimerReference = null;

  window.initializeTabInactivityMonitorEngine = function(clientInstance) {
    if (isExemptPage || (!isAdminPage && !isClientPage)) return;

    const INACTIVITY_LIMIT_MS = isAdminPage ? (15 * 60 * 1000) : (5 * 60 * 1000);
    const logLabel = isAdminPage ? "15-Min Admin Limit" : "5-Min Customer Limit";
    console.log(`⏱️ [Inactivity Engine] Monitoring user workspace interactions (${logLabel})...`);

    async function executeSecureInactivityLogout() {
      console.warn("Palisade Warning: Inactivity threshold exceeded. Purging credentials...");
      window.injectSecureBlurInterceptionOverlay();
      
      try {
        await clientInstance.auth.signOut();
      } catch (logoutFault) {
        console.error("[Inactivity Engine Error] Clean signout blocked:", logoutFault);
      }

      localStorage.removeItem("f4u_stripe_client_secret");
      localStorage.removeItem("f4u_portal_login_strikes");
      localStorage.removeItem("f4u_active_tracking_token");

      window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
    }

    function resetInactivityCountdown() {
      if (activityTimerReference) clearTimeout(activityTimerReference);
      activityTimerReference = setTimeout(executeSecureInactivityLogout, INACTIVITY_LIMIT_MS);
    }

    const activeSensoryEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    activeSensoryEvents.forEach(eventName => {
      window.addEventListener(eventName, resetInactivityCountdown, { passive: true });
    });

    resetInactivityCountdown();
  };

  // ============================================================================
  // 🛡️ STAGE 2: ASYNCHRONOUS BACKEND NETWORK ROUTE GUARDIAN MATRIX
  // ============================================================================
  window.enforceSynchronousRoutePerimeterGuard = async function(clientInstance) {
    if (currentPath.includes('update-password')) {
      console.log("🔑 [Route Perimeter Guard] Password update page bypassed to preserve token handshakes.");
      return;
    }
    if (currentPath.includes('login') || currentPath.includes('signin')) {
      console.log("🔓 [Route Perimeter Guard] Login view context detected. Perimeter checks disabled.");
      return;
    }
    if (!isAdminPage && !isClientPage) return;

    if (typeof window.initializeTabInactivityMonitorEngine === "function") {
      window.initializeTabInactivityMonitorEngine(clientInstance);
    }

    const activeStoredToken = localStorage.getItem("f4u_active_tracking_token");
    if (activeStoredToken === "F4U-UNKNOWN" || activeStoredToken === "UNKNOWN") {
      localStorage.removeItem("f4u_active_tracking_token");
    }

    console.log("Aegis Status: Assessing session token authenticity...");
    const { data: { session } } = await clientInstance.auth.getSession();
    const activeUser = session?.user;

    if (!activeUser) {
      window.injectSecureBlurInterceptionOverlay();
      setTimeout(() => {
        window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
      }, 1500);
      return;
    }

    if (isAdminPage) {
      const emailString = (activeUser.email || "").toLowerCase();
      if (!emailString.endsWith('@filings4u.com')) {
        console.warn("Security Alert: Non-admin profile detected on admin route. Ejecting...");
        window.injectSecureBlurInterceptionOverlay();
        await clientInstance.auth.signOut();
        setTimeout(() => {
          window.location.replace("admin-login.html");
        }, 1500);
      }
    }
  };

  // ============================================================================
  // ⚙️ STAGE 3: CORE CLIENT GLOBAL SCOPE INITIALIZATION HANDSHAKE
  // ============================================================================
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, CORE_ANON_KEY);
    window.supabaseInstance = window.supabaseClient;

    // Attach lifecycle watchers immediately upon document DOM mount
    document.addEventListener("DOMContentLoaded", async () => {
      await window.enforceSynchronousRoutePerimeterGuard(window.supabaseClient);
    });
  } else {
    // Re-verify tracking loops on content build if library script loads asynchronously
    document.addEventListener("DOMContentLoaded", async () => {
      const asyncSupabase = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (asyncSupabase && typeof asyncSupabase.createClient === 'function') {
        window.supabaseClient = asyncSupabase.createClient(SUPABASE_URL, CORE_ANON_KEY);
        window.supabaseInstance = window.supabaseClient;
        await window.enforceSynchronousRoutePerimeterGuard(window.supabaseClient);
      }
    });
  }

})();

  // ============================================================================
  // 📁 STAGE 4: AUTHENTICATED FORM EXECUTION & 2-STRIKE SECURITY HANDLER
  // ============================================================================
  window.executePortalProfileAuthentication = async function(email, password, clientInstance) {
    const errorAlert = document.getElementById("login-error-display");
    
    try {
      console.log("📡 [Auth Flow] Transmitting credentials packet securely...");
      
      const { data, error } = await clientInstance.auth.signInWithPassword({ 
        email: String(email).trim().toLowerCase(), 
        password: password 
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials") || error.status === 400) {
          if (typeof window.handleFailedLoginAttemptTracking === "function") {
            window.handleFailedLoginAttemptTracking();
          }
        }
        if (errorAlert) errorAlert.innerText = error.message;
        return;
      }

      if (typeof window.clearLoginStrikesOnSuccess === "function") {
        window.clearLoginStrikesOnSuccess();
      }

      // 🟢 DYNAMIC GATE ROUTER & INACTIVITY TIMEOUT TRIGGER
      const activeUser = data.user;
      const emailString = (activeUser.email || "").toLowerCase();
      const currentPath = window.location.pathname.toLowerCase();

      // Determine role strictly by email domain matching matrix or page context rules
      const isAdmin = emailString.endsWith('@filings4u.com') || currentPath.includes('admin');

      // Trigger the Tab Inactivity Monitor Engine instantly on success
      if (typeof window.initializeTabInactivityMonitorEngine === "function") {
        window.initializeTabInactivityMonitorEngine(clientInstance);
      }

      // 🟢 Route users explicitly to their corresponding secure workspaces
      if (isAdmin) {
        console.log("🔓 [Auth Flow] Admin profile validated. Routing to internal admin console...");
        window.location.replace("admin-dashboard.html");
      } else {
        console.log("🔓 [Auth Flow] Customer profile validated. Routing to client workspace...");
        window.location.replace("client-dashboard.html");
      }

    } catch (unexpectedException) {
      console.error("✕ Critical Authentication Routine Fault Caught:", unexpectedException.message);
      if (errorAlert) {
        errorAlert.innerText = "An unexpected processing system exception halted sign in.";
      }
    }
  };


// ============================================================================
// 🎯 THE 2-STRIKE FAILURE LOCK SYSTEM (CORRECTED)
// ============================================================================
window.handleFailedLoginAttemptTracking = function() {
  const currentPath = window.location.pathname.toLowerCase();
  const isAdminPage = currentPath.includes('admin-') || currentPath.includes('/admin');

  let currentStrikesCount = parseInt(localStorage.getItem("f4u_portal_login_strikes") || "0", 10);
  currentStrikesCount += 1;
  localStorage.setItem("f4u_portal_login_strikes", currentStrikesCount.toString());
  
  console.warn("🔒 [Security Guard] Login strike logged: " + currentStrikesCount + "/2");

  if (currentStrikesCount >= 2) {
    console.error("🚨 Critical Lock Triggered: 2 sequential login failures detected. Deploying defense matrix...");
    
    // 🟢 FIXED PERIMETER SECURITY: Set a non-clearing lock timestamp to stop form bypass re-entries
    localStorage.setItem("f4u_security_lockout_active", "true");
    localStorage.setItem("f4u_security_lockout_timestamp", Date.now().toString());

    if (typeof window.injectSecureBlurInterceptionOverlay === "function") {
      window.injectSecureBlurInterceptionOverlay();
    }

    setTimeout(() => {
      // 🟢 FIXED REDIRECTION: Sends users back to their respective, explicit login gates instead of the home landing page
      if (isAdminPage) {
        window.location.replace("admin-login.html");
      } else {
        window.location.replace("portal-login.html");
      }
    }, 1500);
  }
  return currentStrikesCount;
};

window.clearLoginStrikesOnSuccess = function() {
  localStorage.removeItem("f4u_portal_login_strikes");
  localStorage.removeItem("f4u_security_lockout_active");
  localStorage.removeItem("f4u_security_lockout_timestamp");
};

// assets/js/supabase-config.js
// 🔐 Global Supabase Client Initialization Setup Matrix (CORRECTED)
(function () {
  "use strict";

  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

  if (!window.supabase) {
    console.error("Supabase CDN library was not loaded prior to initialization sequence.");
    return;
  }

  // 🟢 FIXED HANDSHAKE: Populates all cross-script global identity layers completely
  const initializedClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.supabaseInstance = initializedClient;
  window.supabaseClient = initializedClient;
  window.supabase = initializedClient;

  console.log("🚀 Supabase Client Workspace successfully established with multi-token listeners.");

  // 🟢 AUTOMATED ENTRY CHECK: Boots up guards and dynamic path tracking immediately on mount
  if (typeof window.enforceSynchronousRoutePerimeterGuard === "function") {
    window.enforceSynchronousRoutePerimeterGuard(initializedClient);
  }
})();

// ============================================================================
// 📡 REAL-TIME MIDDLEWARE WEBHOOK SYNC ENGINE (UPDATED COLUMN SCHEMA - CORRECTED)
// ============================================================================
window.Filings4uSyncEngine = {
  activeChannels: {},

  // Initialize Real-time Client Listening Portals
  initGlobalListener: function(client, userEmail, onNotificationCallback) {
    if (!client || !userEmail) return console.warn("⚡ [Sync Engine] Initialization parameters absent.");
    
    const formattedEmail = String(userEmail).trim().toLowerCase();
    console.log(`📡 [Sync Engine] Subscribing to live updates for profile: [${formattedEmail}]`);

    // 🟢 FIXED FILTER QUOTES: Added literal inner single quotes around the email variable 
    // to prevent syntax crashes on domains containing periods or hyphens
    this.activeChannels.portalNotifs = client
      .channel('public-portal-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'portal_notifications', 
        filter: `email_address=eq.'${formattedEmail}'` 
      }, (payload) => {
        console.log("🔔 [Sync Engine] Inbound portal alert captured:", payload.new);
        this.incrementGlobalNotificationBadge();
        if (typeof onNotificationCallback === 'function') onNotificationCallback(payload.new);
      })
      .subscribe();

    // Channel 2: Listen for systemic dashboard broadcasts
    this.activeChannels.systemBroadcasts = client
      .channel('global-system-broadcasts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_notifications' 
      }, (payload) => {
        console.log("📢 [Sync Engine] System broad banner pushed:", payload.new);
        if (typeof window.showGlobalBannerAlert === 'function') {
          // 🟢 FIXED SCHEMA COLUMN: Maps to alert_message instead of message to match your backend
          window.showGlobalBannerAlert(payload.new.alert_message || "System maintenance scheduled.");
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
    setTimeout(() => {
      badge.style.transform = "scale(1)";
    }, 150);
  },

  // Standardized interface state updating system
  dispatchPipelineMutation: async function(client, targetTable, recordId, updatedPayload) {
    console.log(`🚀 [Sync Engine] Broadcasting data mutation across: [public.${targetTable}] for ID: ${recordId}`);
    
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

/**
 * filings4u Platform Architecture
 * Global Script Attachment: Isolated Client Home Greetings Hydrator Engine
 */
(function() {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {

    // 🟢 CONSTRAINT 1: Restrict execution path strictly to the client home dashboard layout page
    const currentPathUrl = window.location.pathname.toLowerCase();
    if (!currentPathUrl.includes("client-dashboard.html") && currentPathUrl !== "/client-dashboard" && currentPathUrl !== "/") {
      console.log("ℹ️ [Global Greetings Engine] Execution skipped: Current view track requires explicit static page header titles.");
      return;
    }

    let client = window.supabaseInstance || window.supabaseClient;
    if (!client && typeof supabase !== 'undefined') {
      client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
    }
    if (!client) return;

    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError || !session || !session.user) return;

      const userEmail = String(session.user.email).trim().toLowerCase();
      const welcomeHeaderNode = document.querySelector(".welcome-text h1");
      if (!welcomeHeaderNode) return;

      // 🟢 PIPELINE RESOLUTION: Pulls name parameters from validated table schema column keys natively
      let resolvedFirstName = "";

      // Match Track A: Attempt profile verification lookup out of public.client_profiles ledger matrix rows
      try {
        const { data: profileMatch } = await client
          .from('client_profiles')
          .select('first_name')
          .eq('email_address', userEmail)
          .limit(1)
          .maybeSingle();

        if (profileMatch && profileMatch.first_name) {
          resolvedFirstName = profileMatch.first_name.trim().split(' ')[0];
        }
      } catch (err) {
        console.warn("client_profiles scan skipped", err);
      }

      // Match Track B: Fallback search via public.orders using explicit email_address and first_name columns
      if (!resolvedFirstName) {
        const { data: orderMatch } = await client
          .from('orders')
          .select('first_name') 
          .eq('email_address', userEmail) 
          .limit(1)
          .maybeSingle();

        if (orderMatch && orderMatch.first_name) {
          resolvedFirstName = orderMatch.first_name.trim().split(' ')[0];
        }
      }

      // Match Track C: Fallback search via public.dashboard_orders using explicit email_address and first_name columns
      if (!resolvedFirstName) {
        const { data: dashOrderMatch } = await client
          .from('dashboard_orders')
          .select('first_name')
          .eq('email_address', userEmail) 
          .limit(1)
          .maybeSingle();

        if (dashOrderMatch && dashOrderMatch.first_name) {
          resolvedFirstName = dashOrderMatch.first_name.trim().split(' ')[0];
        }
      }

      // If no historical name entry lines are logged anywhere, fall back safely onto a clean default asset string
      if (!resolvedFirstName) {
        resolvedFirstName = "Valued Member";
      }

      // 🟢 DOM INJECTION LAYER WITH MICRO-INTERACTION FADE
      if (welcomeHeaderNode) {
        const stylizedFormattedName = resolvedFirstName.charAt(0).toUpperCase() + resolvedFirstName.slice(1);
        const safeEscapedName = stylizedFormattedName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        welcomeHeaderNode.style.transition = "opacity 0.2s ease-in-out";
        welcomeHeaderNode.style.opacity = "0";
        welcomeHeaderNode.innerHTML = `Welcome Back, <span style="color: var(--emerald, #10b981); font-weight: 850;">${safeEscapedName}</span>`;
        
        setTimeout(() => {
          welcomeHeaderNode.style.opacity = "1";
        }, 30);

        console.log(`✓ [Global Greetings Engine] Flawlessly hydrated customer homepage header banner node: [${safeEscapedName}]`);
      }
    } catch (fault) {
      console.warn("⚠️ Global welcome message pipeline skipped context evaluation:", fault.message);
    }
  });
})();


/**
 * filings4u Platform Architecture
 * Global Script Attachment: Multi-Page Digital Ticking Clock Engine
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // 🟢 GLOBAL INITIALIZATION: Targets the unified clock container ID present on any layout page
    const clockElement = document.getElementById("portal-notifications-clock");
    
    if (!clockElement) {
      // Gracefully exits if the active page layout template does not contain a clock node placeholder
      return;
    }

    function updateGlobalClockTime() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      
      hours = hours % 12;
      hours = hours ? hours : 12; // Normalizes hour '0' to '12' cleanly

      clockElement.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
    }

    // Fire the calculation instantly on thread startup to eliminate layout pop
    updateGlobalClockTime();
    
    // Bind continuous ticking loop to execute precisely every 1000 milliseconds
    setInterval(updateGlobalClockTime, 1000);
    console.log("✓ [Global Clock Engine] High-priority ticking thread successfully attached to layout node.");
  });
})();

/**
 * Global Enterprise Logging Pipeline Hook
 * Fires events directly out to the serverless general_notifications engine
 */
window.logPlatformActivityEvent = async function(category, action, description, meta = {}) {
  try {
    const client = window.supabaseInstance || window.supabaseClient;
    if (!client) return;

    const { data: { session } } = await client.auth.getSession();
    const email = session?.user?.email || "anonymous-visitor@filings4u.com";
    const role = (email.toLowerCase().endsWith('@filings4u.com')) ? "admin" : "client";

    // Asynchronously dispatch the packet without blocking active page rendering loops
    fetch('https://supabase.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_email: email,
        actor_role: role,
        event_category: category,
        event_action: action,
        event_description: description,
        payload_metadata: meta,
        ip_address: "127.0.0.1" // Fallback local router address mapping hook
      })
    }).catch(err => console.warn("Logging transmission packet delayed:", err));

  } catch (e) {
    console.error("✕ Platform Activity Event compilation aborted:", e.message);
  }
};
