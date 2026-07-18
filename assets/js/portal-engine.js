/**
 * 📁 FILE PATH: assets/js/portal-engine.js
 * Responsibility: Platform Broadcast Multi-Plexing Network Channels & Messaging Hooks
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
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                        storageKey: "filings4u_secure_session_token"
                    }
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
                if (!error && user) userInstance = user;
            }

            if (!userInstance || !userInstance.id) {
                console.log("[Realtime Engine] Postponing connection: User session context unverified. Retrying...");
                setTimeout(initializeRealtimeBroadcastNetwork, 400);
                return;
            }

            window.realtimeTelemetryChannel = activeClient.channel(`telemetry_desk_${userInstance.id}`);

            window.realtimeTelemetryChannel
                .on('broadcast', { event: 'pipeline_mutation' }, (payload) => {
                    console.log('⚡ Realtime state sync received:', payload);
                    const pendingCounter = document.getElementById("countPending");
                    if (pendingCounter) {
                        let currentCount = parseInt(pendingCounter.textContent, 10) || 0;
                        pendingCounter.textContent = currentCount + 1;
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('📡 Synchronized cleanly to Supabase Realtime Broadcast Network');
                    }
                });

        } catch (realtimeSetupException) {
            console.error("[Fatal Realtime Setup Interception Failure]", realtimeSetupException);
        }
    }
})();



// 🚀 DISPATCH LIVE PIPELINE MUTATION DATA OVER THE AIR
async function dispatchOrderViaBroadcast() {
  const targetState = document.getElementById("stateRateField")?.value || "DE";
  const totalCost = document.getElementById("ledgTotal")?.textContent || "1.00";
  
  const payloadBundle = {
    service: typeof nameStr !== 'undefined' ? nameStr : "Portal Service Item",
    state: targetState,
    total: totalCost,
    timestamp: new Date().toISOString()
  };

  if (realtimeTelemetryChannel) {
    // Broadcast updates seamlessly across all open admin and user dashboards
    await realtimeTelemetryChannel.send({
      type: 'broadcast',
      event: 'pipeline_mutation',
      payload: payloadBundle
    });
    alert(`Order logged. Telemetry payload broadcasted to pipeline: State ${targetState}`);
  } else {
    alert(`Sandbox Simulation Mode: Order payload generated for ${targetState}`);
  }
}

function handleIncomingStateSync(data) {
  // Dynamic runtime interface manipulation updates counters immediately when secondary user files an item
  const pendingCounter = document.getElementById("countPending");
  if (pendingCounter) {
    let currentCount = parseInt(pendingCounter.textContent, 10) || 0;
    pendingCounter.textContent = currentCount + 1;
  }
}

// ==========================================================================
// 🔄 SECURE REAL-TIME GRID SYNCHRONIZATION (REFACTORED USER_ID CORE)
// ==========================================================================
async function syncAccountTelemetryGrid() {
  const activeClient = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (!activeClient || !activeClientSessionUser) return;

  try {
    const [ent, fil] = await Promise.all([
      // ✅ FIX 1: Swapped legacy owner_id column for your unified user_id schema
      activeClient.from('entities').select('*').eq('user_id', activeClientSessionUser.id),
      activeClient.from('filing_orders').select('*').eq('user_id', activeClientSessionUser.id)
    ]);

    if (ent.error) throw ent.error;
    if (fil.error) throw fil.error;

    // Render database data or fall back to layout mocks if rows are completely vacant
    if (ent.data && ent.data.length > 0) {
      renderEntitiesPreviewTable(ent.data);
    } else {
      loadClientTelemetryMocks();
    }

    if (fil.data && fil.data.length > 0) {
      renderFilingsTimelineWidget(fil.data);
    } else {
      // Inject clean empty placeholder status states if no orders exist yet
      const timeline = document.getElementById("filingTimeline");
      if (timeline) timeline.innerHTML = `<p style="color: #64748b; font-size: 0.88rem;">No active filing tracking history in your dashboard timeline.</p>`;
    }

    // ✅ AUTOMATED DOCUMENT VAULT SYNC INSTANCE INITIATION
    // Automatically runs background tracking lookups for files pushed from your admin workspace panel
    initializeAutomatedVaultSyncEngine(activeClient, activeClientSessionUser.id);

  } catch (err) {
    console.error("Database tracking sync layer dropped out:", err.message);
    loadClientTelemetryMocks();
  }
}

// 📁 THE LIVE DOCUMENT VAULT REAL-TIME SUBSCRIBER ENGINE
function initializeAutomatedVaultSyncEngine(client, userId) {
  const documentTableBody = document.getElementById("clientVaultTableLayoutBody");
  if (!documentTableBody) return;

  // Set up a real-time replication listener on the document vault table
  client
    .channel('live-client-vault-sync-stream')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all INSERTS, UPDATES, or DELETES pushed from the admin panel
        schema: 'public',
        table: 'client_documents_vault',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log("📂 File Sync Action Logged by Admin Desk:", payload);
        
        // Dynamic UI fetch block to update the user's files instantly
        const { data: files } = await client
          .from('client_documents_vault')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!files || files.length === 0) {
          documentTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">No documents vaulted yet.</td></tr>`;
          return;
        }

        documentTableBody.innerHTML = files.map(file => {
          const fileDate = new Date(file.created_at).toLocaleDateString();
          return `
            <tr class="animated-sync-fade-in-row">
              <td style="font-weight: 600; color: #1e293b;">${file.file_name || 'vaulted_document.pdf'}</td>
              <td style="color: #64748b;">${fileDate}</td>
              <td>
                <a href="${file.file_url}" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: none;">
                  Download File ↓
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }
    )
    .subscribe();
}

function loadClientTelemetryMocks() {
  renderEntitiesPreviewTable([
    { entity_name: "Apex Venture Operations LLC", state: "DE", structure_type: "LLC", status: "Active" },
    { entity_name: "Horizon Global Trade Group", state: "TX", structure_type: "LLC", status: "Pending" }
  ]);
}

function renderEntitiesPreviewTable(dataset) {
  const tableBody = document.getElementById("entitiesTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = dataset.map(ent => `
    <tr>
      <td><strong>${ent.entity_name}</strong></td>
      <td>${ent.state || 'DE'}</td>
      <td>${ent.structure_type || 'LLC'}</td>
      <td><span class="status-pill active">${ent.status || 'Active'}</span></td>
    </tr>
  `).join('');
}

function renderFilingsTimelineWidget(dataset) {
  const timeline = document.getElementById("filingTimeline");
  if (!timeline) return;
  timeline.innerHTML = dataset.map(item => `
    <div class="timeline-item">
      <h4>${item.company_name || 'Company Incorporation'}</h4>
      <p>${item.status_name || 'In pipeline state review.'}</p>
    </div>
  `).join('');
}

function toggleSidebarAccordion(buttonElement) {
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
            console.log("🔐 Logout sequence initiated. Cleaning local token parameters...");
            
            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";

            // Resolve authenticated database instances specifically
            const activeClient = window.supabaseInstance || window.supabaseClient;

            if (activeClient && activeClient.auth) {
                try {
                    await activeClient.auth.signOut();
                } catch (err) {
                    console.warn("Supabase clean exit skipped:", err?.message || err);
                }
            }

            // Flush secure browser state footprints
            localStorage.removeItem("filings4u_secure_session_token");
            sessionStorage.clear();

            // Force browser layout re-route replacing page traversal historical traces
            const targetRedirect = "portal-login.html";
            window.location.replace(targetRedirect);
        });
        
        console.log("✅ Secure logout listener successfully locked onto client DOM button.");
    } else {
        // Quiet debug log instead of a warning since this script runs across multi-route paths
        console.log("[Portal Engine] Skipping logout binding: No matching button target in current layout context.");
    }
});
