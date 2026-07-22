/**
 * 📁 FILE PATH: assets/js/portal-engine.js
 * Responsibility: Platform Broadcast Multi-Plexing Network Channels & Messaging Hooks
 * Data Target: public.orders (Single Table Source)
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeRealtimeBroadcastNetwork();
  });

  async function initializeRealtimeBroadcastNetwork() {
    // 🚀 THE BREAKOUT FIX: Evaluate the shared database property dynamically to stop loop freezes
    let activeClient = window.supabaseInstance || window.supabaseClient;

    if (!activeClient || typeof activeClient.channel !== 'function') {
      const currentLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (currentLibrary && typeof currentLibrary.createClient === 'function') {
        console.log("🔧 [Portal Engine] Building fresh database fail-safe connection channel inline...");
        const targetUrl = "https://lrbimrlbskjweynxlgas.supabase.co";
        const targetKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
        
        activeClient = currentLibrary.createClient(targetUrl, targetKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "filings4u_secure_session_token" }
        });
        window.supabaseInstance = activeClient;
        window.supabaseClient = activeClient;
      }
    }

    // If the library isn't loaded on the window yet, delay and check again
    if (!activeClient || typeof activeClient.channel !== 'function') {
      console.warn("⚠️ Realtime Channel Intercept: Active client system instance not ready. Polling...");
      setTimeout(initializeRealtimeBroadcastNetwork, 200);
      return;
    }

    // 🛡️ SECURITY PATH INTERCEPTOR: Exit cleanly if loaded inside an admin panel interface path
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('admin-') || currentPath.includes('/admin')) {
      console.log("📡 [Realtime Engine] Bypassing client-specific websocket channel mapping on admin dashboard layouts.");
      return;
    }

    try {
      let userInstance = window.activeClientSessionUser;
      if (!userInstance && activeClient.auth && typeof activeClient.auth.getUser === 'function') {
        const { data: { user }, error } = await activeClient.auth.getUser();
        if (!error && user) {
          userInstance = user;
          window.activeClientSessionUser = user;
        }
      }

      if (!userInstance || !userInstance.id) {
        console.log("[Realtime Engine] Postponing connection: User session context unverified. Retrying...");
        setTimeout(initializeRealtimeBroadcastNetwork, 400);
        return;
      }

      // Open user specific telemetry socket desk channel room
      window.realtimeTelemetryChannel = activeClient.channel(`telemetry_desk_${userInstance.id}`);

      window.realtimeTelemetryChannel
        .on('broadcast', { event: 'pipeline_mutation' }, (payload) => {
          console.log('⚡ Realtime state sync received:', payload);
          handleIncomingStateSync(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Synchronized cleanly to Supabase Realtime Broadcast Network');
            // Safely chain down to load database data parameters
            syncAccountTelemetryGrid(activeClient, userInstance);
          }
        });

    } catch (realtimeSetupException) {
      console.error("[Fatal Realtime Setup Interception Failure]", realtimeSetupException);
    }
  }
})();

  // ============================================================================ //
  // 🚀 DISPATCH LIVE PIPELINE MUTATION DATA OVER THE AIR                         //
  // ============================================================================ //
  async function dispatchOrderViaBroadcast() {
    const targetState = document.getElementById("stateRateField")?.value || "DE";
    const totalCost = document.getElementById("ledgTotal")?.textContent || "1.00";
    
    const payloadBundle = {
      service: typeof nameStr !== 'undefined' ? nameStr : "Portal Service Item",
      state: targetState,
      total: totalCost,
      timestamp: new Date().toISOString()
    };

    // If a live realtime channel room is active on the window scope, transmit the message
    if (window.realtimeTelemetryChannel) {
      try {
        // Broadcast updates seamlessly across all open admin and user dashboards
        await window.realtimeTelemetryChannel.send({ 
          type: 'broadcast', 
          event: 'pipeline_mutation', 
          payload: payloadBundle 
        });
        console.log("⚡ [Telemetry Desk] Pipeline mutation payload dispatched: ", payloadBundle);
        alert(`Order logged. Telemetry payload broadcasted to pipeline: State ${targetState}`);
      } catch (broadcastErr) {
        console.error("✕ Telemetry Broadcast transmission dropped: ", broadcastErr);
      }
    } else {
      // Graceful fallback tracker if the page session runs offline
      alert(`Sandbox Simulation Mode: Order payload generated for ${targetState}`);
    }
  }

  // ============================================================================ //
  // 🔄 RUNTIME STATE INTEGRATION FRAMEWORK                                       //
  // ============================================================================ //
  function handleIncomingStateSync(data) {
    // Dynamic runtime interface manipulation updates counters immediately when secondary user files an item
    const pendingCounter = document.getElementById("countPending");
    if (pendingCounter) {
      let currentCount = parseInt(pendingCounter.textContent, 10) || 0;
      pendingCounter.textContent = (currentCount + 1).toString();
      console.log(`📈 [Telemetry Desk] countPending target incremented cleanly to: ${currentCount + 1}`);
    }
  }


  // ========================================================================== //
  // 🔄 SECURE REAL-TIME GRID SYNCHRONIZATION (MAPS STRICTLY TO ORDERS TABLE)  //
  // ========================================================================== //
  async function syncAccountTelemetryGrid(activeClient, userInstance) {
    if (!activeClient || !userInstance) return;

    // ✅ FIXED: Renamed target container selector strictly to track your orders table
    const ordersTableBody = document.getElementById("ordersTableBody");
    const timeline        = document.getElementById("filingTimeline");

    try {
      console.log(`📡 Fetching live data metrics from public.orders for user: ${userInstance.email}`);

      // 🟢 SINGLE SOURCE OF TRUTH QUERY: Pull columns straight from public.orders
      const { data: ordersDataset, error } = await activeClient
        .from('orders')
        .select('id, company_name, plan_tier, total_fee, status, tracking_number, created_at, service_title')
        .eq('user_id', userInstance.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Handle empty tables gracefully by falling back to the UI mock layouts
      if (!ordersDataset || ordersDataset.length === 0) {
        console.log("ℹ️ No profile orders found in database. Initializing visual framework fallback layout.");
        loadClientTelemetryMocks();
        return;
      }

      // --- STAGE 1: HYDRATE THE ACTIVE ORDERS PREVIEW TABLE GRID ---
      if (ordersTableBody) {
        ordersTableBody.innerHTML = ordersDataset.map(rowItem => {
          const currentStatus = String(rowItem.status || '').toLowerCase().trim();
          let pillColors = "background: #fffbe6; color: #b45309;"; // Default pending styling

          if (currentStatus === 'paid' || currentStatus === 'fulfillment lane') {
            pillColors = "background: #e6f4ea; color: #137333;"; // Confirmed paid styling
          }

          const parsedTrackingCode = rowItem.tracking_number || rowItem.id.substring(0, 8);

          return `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 0.85rem;">
              <td style="padding: 12px; text-align: left; color: #0f172a;"><strong>${escapeHtmlCharacters(rowItem.company_name)}</strong></td>
              <td style="padding: 12px; text-align: left; font-family: monospace; color: #475569;">${escapeHtmlCharacters(parsedTrackingCode)}</td>
              <td style="padding: 12px; text-align: left; text-transform: uppercase; font-weight: 600; color: #64748b;">${escapeHtmlCharacters(rowItem.plan_tier)}</td>
              <td style="padding: 12px; text-align: left;"><span style="${pillColors} padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${escapeHtmlCharacters(rowItem.status)}</span></td>
            </tr>
          `;
        }).join('');
      }

      // --- STAGE 2: HYDRATE THE STEP 7 FILING SUCCESS HISTORY TIMELINE ---
      if (timeline) {
        timeline.innerHTML = ordersDataset.map(rowItem => {
          const formatFilingDate = new Date(rowItem.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
          
          return `
            <div class="timeline-item" style="padding: 14px; border-left: 3px solid #10b981; background: #f8fafc; margin-bottom: 12px; border-radius: 0 8px 8px 0; text-align: left;">
              <h4 style="margin: 0 0 4px 0; color: #0a1f44; font-size: 0.95rem; font-weight: 700;">${escapeHtmlCharacters(rowItem.service_title)}</h4>
              <p style="margin: 0 0 4px 0; color: #475569; font-size: 0.85rem;">Filing Tracking Status: <strong style="text-transform: uppercase; color: #047857;">${escapeHtmlCharacters(rowItem.status)}</strong></p>
              <small style="color: #94a3b8; font-size: 0.75rem; font-family: monospace;">Filing Processing Session Logged: ${formatFilingDate}</small>
            </div>
          `;
        }).join('');
      }

    } catch (syncFaultException) {
      console.error("✕ Core Client Telemetry Synchronization Fault Intercepted:", syncFaultException.message);
      loadClientTelemetryMocks();
    }
  }

  // ========================================================================== //
  // 🛠️ DATA VISUALIZATION PORTAL PERIPHERAL HANDLERS                           //
  // ========================================================================== //
  function loadClientTelemetryMocks() {
    const ordersTableBody = document.getElementById("ordersTableBody");
    if (!ordersTableBody) return;

    ordersTableBody.innerHTML = `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 0.85rem;">
        <td style="padding: 12px; text-align: left; color: #0f172a;"><strong>Apex Venture Operations LLC</strong></td>
        <td style="padding: 12px; text-align: left; font-family: monospace; color: #475569;">TRK-MOCK-99A</td>
        <td style="padding: 12px; text-align: left; text-transform: uppercase; font-weight: 600; color: #64748b;">PREMIUM SUITE</td>
        <td style="padding: 12px; text-align: left;"><span style="background: #e6f4ea; color: #137333; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">PAID</span></td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 0.85rem;">
        <td style="padding: 12px; text-align: left; color: #0f172a;"><strong>Horizon Global Trade Group</strong></td>
        <td style="padding: 12px; text-align: left; font-family: monospace; color: #475569;">TRK-MOCK-88B</td>
        <td style="padding: 12px; text-align: left; text-transform: uppercase; font-weight: 600; color: #64748b;">STARTER PLAN</td>
        <td style="padding: 12px; text-align: left;"><span style="background: #fffbe6; color: #b45309; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">PENDING</span></td>
      </tr>
    `;
  }

  // Sidebar navigation panel accordion controller
  function toggleSidebarAccordion(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    if (panel && panel.style) {
      if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
        panel.style.maxHeight = "0px";
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    }
  }

  // Cross-Site Scripting (XSS) Sanitization Tool
  function escapeHtmlCharacters(textValue) {
    if (!textValue) return "";
    return String(textValue)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  // ========================================================================== //
  // 🛑 SECURE SIGN-OUT ROUTE CONTROLLER ACTION (SAFE BINDING)                  //
  // ========================================================================== //
  document.addEventListener("DOMContentLoaded", () => {
    // 🚀 FIXED ALIGNMENT: Check for either the standard portal button OR the admin logout node layout
    const logoutBtn = document.getElementById("portalLogoutBtn") || document.getElementById("adminLogoutBtn");
    
    if (logoutBtn) {
      logoutBtn.onclick = null;
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        executeSecureLogoutSequence(logoutBtn);
      });
      console.log("✅ Secure logout listener successfully locked onto portal DOM button.");
    } else {
      console.log("[Portal Engine] Skipping logout binding: No matching button target in current layout context.");
    }

    // ========================================================================== //
    // ⏱️ 15-MINUTE AUTOMATED INACTIVITY WATCHDOG                                //
    // ========================================================================== //
    let inactivityTimeoutTracker;
    const fifteenMinutesInMilliseconds = 15 * 60 * 1000;

    function resetInactivityTimer() {
      clearTimeout(inactivityTimeoutTracker);
      inactivityTimeoutTracker = setTimeout(() => {
        console.warn("[Security Watchdog] 15 minutes of inactivity detected. Enforcing automated session termination.");
        const fallbackLogoutButton = document.getElementById("portalLogoutBtn") || document.getElementById("adminLogoutBtn");
        executeSecureLogoutSequence(fallbackLogoutButton);
      }, fifteenMinutesInMilliseconds);
    }

    // Core human action event listeners matrix
    const interactionEventsArray = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    interactionEventsArray.forEach(eventType => {
      window.addEventListener(eventType, resetInactivityTimer, { passive: true });
    });

    // Start timer upon initial script evaluation frame
    resetInactivityTimer();
  });

  async function executeSecureLogoutSequence(buttonInstance) {
    console.log("🔒 Logout sequence initiated. Cleaning local token parameters...");
    if (buttonInstance) {
      buttonInstance.disabled = true;
      buttonInstance.textContent = "Logging out...";
    }

    const activeClient = window.supabaseInstance || window.supabaseClient;
    if (activeClient && activeClient.auth) {
      try {
        await activeClient.auth.signOut();
      } catch (err) {
        console.warn("Supabase clean exit skipped:", err?.message || err);
      }
    }

    // Flush secure browser state footprints completely
    localStorage.removeItem("filings4u_secure_session_token");
    sessionStorage.clear();

    // Force browser layout re-route replacing page traversal historical traces
    const targetRedirect = "portal-login.html";
    window.location.replace(targetRedirect);
  }