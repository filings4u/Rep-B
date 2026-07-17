(function initializeCustomerPortalCore() { 
  "use strict"; 

  // =========================================================================
  // 🎯 1. CLEAN URL PATH RESILIENT ENTRANCE CHECKS
  // =========================================================================
  const cleanPathname = window.location.pathname.replace(/\/$/, "");
  const baseFileName = cleanPathname.split("/").pop() || "index.html";
  const currentRouteToken = baseFileName.split("?")[0].split("#")[0].toLowerCase();

  // Pure path exclusion array - handles query parameters and trailing slashes safely
  const authPagesDirectoryArray = ["portal-login.html", "forgot-password.html", "login.html", "index.html", ""];
  
  if (authPagesDirectoryArray.includes(currentRouteToken)) {
    console.log(`🔑 Core Guard: Auth entry viewport [${currentRouteToken}] matched. Guard deactivated.`);
    return; 
  }

  // =========================================================================
  // 🛰️ 2. STORAGE-PERSISTED SUPABASE INSTANTIATION
  // =========================================================================
  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"; 

  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    setTimeout(initializeCustomerPortalCore, 30);
    return;
  }

  // CRITICAL REPAIR: We force the client configuration to store tokens globally across all domain paths
  if (!window.filings4uSupabaseInstance) {
    window.filings4uSupabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-lrbimrlbskjweynxlgas-auth-token' // Matches Supabase's default layout key
      }
    });
  }

  window.supabase = window.filings4uSupabaseInstance;
  window.supabaseInstance = window.filings4uSupabaseInstance;
  window.supabaseClient = window.filings4uSupabaseInstance; 


    // =========================================================================
  // 🔒 3. SECURITY GATEKEEPER & RESOLUTION MANAGEMENT (REPAIRED ANTI-BLINK)
  // =========================================================================
  if (isProtectedPage || !isAuthPage) {
    (async function executeSecurityGatekeeper() {
      try {
        // Step 1: Force a direct user validation check instead of just local session storage cache
        let { data: { user }, error: userError } = await window.supabaseInstance.auth.getUser();
        let sessionObj = null;

        // Step 2: Anti-Blink Retry Loop - If user is blank, poll up to 3 times to allow async cookies to finish setting
        if (!user || userError) {
          let retriesRemaining = 3;
          while (retriesRemaining > 0 && (!user || userError)) {
            await new Promise(resolve => setTimeout(resolve, 80)); // 80ms backoff interval
            const retryCheck = await window.supabaseInstance.auth.getUser();
            user = retryCheck.data.user;
            userError = retryCheck.error;
            retriesRemaining--;
          }
        }

        // Step 3: Extract the confirmed session reference once user profile passes verification
        if (user && !userError) {
          const sessionState = await window.supabaseInstance.auth.getSession();
          sessionObj = sessionState.data.session;
        }

        // Step 4: Final clearance verification check
        if (userError || !user || !sessionObj) {
          console.warn("🛡️ Security Perimeter: Clearance criteria unverified. Routing to login gateway.");
          
          // Identify fallback redirect destination using data attribute parameters
          const fallbackLoginUrl = document.documentElement.getAttribute('data-login-url') || "portal-login.html";
          
          document.documentElement.style.display = 'none'; 
          window.location.replace(fallbackLoginUrl);
          return;
        }

        console.log("✅ Core Guard: Authentication verified successfully. User context active.");
        
        // Broadcast ready signal so dynamic sub-page elements can query tables safely
        window.dispatchEvent(new CustomEvent("supabaseEngineReady", { detail: { session: sessionObj } }));

        // Fire dashboard utilities depending on layout compilation state
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => bootGlobalDashboardFeatures(sessionObj));
        } else {
          bootGlobalDashboardFeatures(sessionObj);
        }
      } catch (gateCrashErr) {
        console.error("💥 Core Guard Failure:", gateCrashErr);
      }
    })();
  }

  // =========================================================================
  // 🏢 4. CORE DASHBOARD DRIVER (COMMON UTILITIES FOR ALL PAGES)
  // =========================================================================
  function bootGlobalDashboardFeatures(session) {
    initializePortalSystemClock();
    setupGlobalSearchEngineGate();
    setupGlobalLogoutTerminalRedirection();
    setupSidebarAccordionNavigationSystem();
    fetchUserAccountProfileMetadata(session.user.id);
    streamLiveHeaderBellAlertCounterBadge(session.user.id);
  }

  // ⏱️ Resilient Clock Engine Module
  function initializePortalSystemClock() {
    const clockNode = document.getElementById("portal-clock");
    if (!clockNode) return;
    
    function renderTimestamp() {
      const now = new Date();
      const dates = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const times = now.toLocaleTimeString('en-US', { hour12: false });
      clockNode.textContent = `${dates} | ${times}`;
    }
    
    renderTimestamp();
    setInterval(renderTimestamp, 1000);
  }
  // 💰 Global Platform Sign Out Terminal
  function setupGlobalLogoutTerminalRedirection() {
    const logoutActionNode = document.getElementById("portalLogoutBtn");
    if (!logoutActionNode) return;
    
    logoutActionNode.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Are you sure you want to log out of your filings4u workspace?")) return;
      
      await window.supabaseInstance.auth.signOut();
      
      // Pull landing target from the button's href dynamically
      window.location.href = logoutActionNode.getAttribute("href") || "https://filings4u.com";
    });
  }

  // 🔍 Header Layout Global Search Processing Input
  function setupGlobalSearchEngineGate() {
    const inputNode = document.getElementById("portalGlobalSearchField");
    if (!inputNode) return;
    
    inputNode.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inputNode.value.trim() !== "") {
        // Read the target search url dynamically from a data-attribute on the element
        const targetSearchPage = inputNode.getAttribute("data-search-url") || "client-filings.html";
        window.location.href = `${targetSearchPage}?search=${encodeURIComponent(inputNode.value.trim())}`;
      }
    });
  }
  // 🏢 Sidebar Accordion Management Module (Mutual Exclusion Lock)
  function setupSidebarAccordionNavigationSystem() {
    window.toggleSidebarAccordion = function(buttonElement) {
      if (!buttonElement) return;
      const isTargetAlreadyOpen = buttonElement.classList.contains("active");

      document.querySelectorAll(".accordion-trigger").forEach(trigger => {
        trigger.classList.remove("active");
        const chevron = trigger.querySelector(".chevron");
        if (chevron) chevron.textContent = "▼";
        const panel = trigger.closest(".accordion-group").querySelector(".accordion-panel");
        if (panel) panel.style.maxHeight = null;
      });

      if (!isTargetAlreadyOpen) {
        buttonElement.classList.add("active");
        const chevron = buttonElement.querySelector(".chevron");
        if (chevron) chevron.textContent = "▲";
        const targetPanel = buttonElement.closest(".accordion-group").querySelector(".accordion-panel");
        if (targetPanel) {
          targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
        }
      }
    };

    // Highlight active link by matching current path suffix against navigation nodes
    const localizedWindowPath = window.location.pathname.replace(/\/$/, "").toLowerCase();
    
    document.querySelectorAll(".sidebar-accordion-menu a").forEach(link => {
      const internalHref = link.getAttribute("href");
      if (!internalHref) return;
      
      const normalizedLinkPath = internalHref.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
      
      if (normalizedLinkPath && localizedWindowPath.endsWith(normalizedLinkPath)) {
        link.classList.add("active");
        const groupWrapper = link.closest(".accordion-group");
        if (groupWrapper) {
          const triggerBtn = groupWrapper.querySelector(".accordion-trigger");
          if (triggerBtn) {
            triggerBtn.classList.add("active");
            const chevron = triggerBtn.querySelector(".chevron");
            if (chevron) chevron.textContent = "▲";
          }
          const nestedPanel = groupWrapper.querySelector(".accordion-panel");
          if (nestedPanel) {
            nestedPanel.style.maxHeight = nestedPanel.scrollHeight + "px";
          }
        }
      }
    });
  }
  // 👤 Profile Hydration: Fetches first/last names from profile tables
  async function fetchUserAccountProfileMetadata(userId) {
    const textTargetNode = document.getElementById("clientNameField");
    if (!textTargetNode) return;
    
    const { data: userProfileRecord, error } = await window.supabaseInstance
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
      
    if (!error && userProfileRecord) {
      textTargetNode.textContent = `${userProfileRecord.first_name} ${userProfileRecord.last_name}`;
    }
  }

  // 🔔 Real-Time Optimized Notification Badge Management Module
  async function streamLiveHeaderBellAlertCounterBadge(userId) {
    const badgeElement = document.getElementById("globalNavUnreadCounterBadge");
    if (!badgeElement) return;

    async function evaluateAlertState() {
      const { count, error } = await window.supabaseInstance
        .from('portal_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      const unreadCount = (!error && count) ? count : 0;
      badgeElement.textContent = unreadCount;
      badgeElement.style.display = unreadCount > 0 ? "block" : "none";
    }

    evaluateAlertState();

    window.supabaseInstance
      .channel(`realtime:header_bell_sync:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_notifications', filter: `user_id=eq.${userId}` }, () => {
        evaluateAlertState();
      })
      .subscribe();
  }

  // Global Field Error Flusher helper expected by portal-login.html layout forms
  window.flushInterfaceFieldErrorStates = function() {
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  };

})();
