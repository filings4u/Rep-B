/**
 * 🚀 filings4u Customer Portal Engine
 * Standardized Production Module with Supabase Realtime Broadcast Routing
 * PART 1: CORE HOOKS, DATA LIFECYCLES & SYSTEM CLOCK
 */
let activeClientSessionUser = null;
let realtimeTelemetryChannel = null;

// =========================================================================
// 🚀 EVENT-DRIVEN LIFECYCLE HOOKS
// =========================================================================

// Standalone UI elements compile instantly without waiting on network buffers
document.addEventListener("DOMContentLoaded", () => {
  initLiveSystemClock();
});

// Centralized handoff: Listens directly to the core.js authentication gates
window.addEventListener("supabaseEngineReady", async (handshakeEvent) => {
  const verifiedSession = handshakeEvent.detail.session;
  
  if (!verifiedSession || !verifiedSession.user) {
    console.warn("⚠️ Portal Engine: Session payload missing at handshake frame.");
    if (typeof loadClientTelemetryMocks === 'function') loadClientTelemetryMocks();
    return;
  }

  console.log("📡 Portal Engine: Handshake verified. Booting database-dependent layouts...");

  // Capture user tracking context globally
  activeClientSessionUser = verifiedSession.user;

  // Hydrate interface profile displays
  const nameField = document.getElementById("clientNameField");
  if (nameField) {
    nameField.textContent = activeClientSessionUser.email;
  }

  // Safely trigger data grids down the asset file
  try {
    if (typeof syncAccountTelemetryGrid === 'function') {
      await syncAccountTelemetryGrid();
    }
  } catch (gridError) {
    console.error("Non-fatal error updating telemetry data layouts:", gridError);
  }

  // Launch secure broadcast communication streams
  if (typeof initializeRealtimeBroadcastNetwork === 'function') {
    initializeRealtimeBroadcastNetwork(verifiedSession);
  }
});

// =========================================================================
// 🕒 STANDALONE INTERFACE SYSTEMS
// =========================================================================
function initLiveSystemClock() {
  const clockElement = document.getElementById("client-clock");
  if (!clockElement) return;

  setInterval(() => {
    const now = new Date();
    clockElement.textContent = `${now.toLocaleDateString('en-US')} | ${now.toLocaleTimeString('en-US', { hour12: false })}`;
  }, 1000);
  console.log("🕒 Core Clock active and synced.");
}


// ========================================================================== //
// 🌐 CORRECTED SUPABASE REALTIME BROADCAST CHANNELS SETUP
// ========================================================================== //
function initializeRealtimeBroadcastNetwork(session) {
  "use strict";

  // Explicitly pull from the globally running window instance
  const activeClient = window.supabaseClient || window.supabase;

  // Safety abort tracking: Stops terminal crashes if script sequence delays occur
  if (!activeClient || typeof activeClient.channel !== 'function') {
    console.warn("⚠️ Realtime Channel Intercept: Active client system instance not ready.");
    return;
  }

  // CRITICAL REPAIR: Safely read user context straight from verified session payload or global placeholder
  const userInstance = session?.user || activeClientSessionUser;
  if (!userInstance || !userInstance.id) {
    console.warn("⚠️ Realtime Channel Intercept: Operational tracking credentials missing.");
    return;
  }

  // Open connection channel targeting the active client's unique user UUID
  realtimeTelemetryChannel = activeClient.channel(`telemetry_desk_${userInstance.id}`);

  realtimeTelemetryChannel
    .on('broadcast', { event: 'pipeline_mutation' }, (payload) => {
      console.log('⚡ Realtime state sync received:', payload);
      if (typeof handleIncomingStateSync === 'function') {
        handleIncomingStateSync(payload.payload);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📡 Synchronized cleanly to Supabase Realtime Broadcast Network');
      }
    });
}

// ========================================================================== //
// 🚀 PIPELINE TRANSMISSION & MUTATION HANDLERS
// ========================================================================== //

/**
 * 🚀 DISPATCH LIVE PIPELINE MUTATION DATA OVER THE AIR
 */
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

/**
 * ⚡ HANDLE INCOMING STATE SYNC
 * Dynamic runtime interface manipulation updates counters immediately when secondary user files an item
 */
function handleIncomingStateSync(data) {
  const pendingCounter = document.getElementById("countPending");
  if (pendingCounter) {
    let currentCount = parseInt(pendingCounter.textContent, 10) || 0;
    pendingCounter.textContent = currentCount + 1;
  }
}

// ========================================================================== //
// 🔄 SECURE REAL-TIME GRID SYNCHRONIZATION (REFACTORED USER_ID CORE)
// ========================================================================== //
async function syncAccountTelemetryGrid() {
  const activeClient = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (!activeClient || !activeClientSessionUser) return;

  try {
    const [ent, fil] = await Promise.all([
      // Swapped legacy owner_id column for your unified user_id schema
      activeClient.from('entities').select('*').eq('user_id', activeClientSessionUser.id),
      activeClient.from('filing_orders').select('*').eq('user_id', activeClientSessionUser.id)
    ]);

    if (ent.error) throw ent.error;
    if (fil.error) throw fil.error;

    // Render database data or fall back to layout mocks if rows are completely vacant
    if (ent.data && ent.data.length > 0) {
      if (typeof renderEntitiesPreviewTable === 'function') {
        renderEntitiesPreviewTable(ent.data);
      }
    } else {
      if (typeof loadClientTelemetryMocks === 'function') loadClientTelemetryMocks();
    }

    if (fil.data && fil.data.length > 0) {
      if (typeof renderFilingsTimelineWidget === 'function') {
        renderFilingsTimelineWidget(fil.data);
      }
    } else {
      // Inject clean empty placeholder status states if no orders exist yet
      const timeline = document.getElementById("filingTimeline");
      if (timeline) {
        timeline.innerHTML = `<p style="color: #64748b; font-size: 0.88rem;">No active filing tracking history in your dashboard timeline.</p>`;
      }
    }

    // AUTOMATED DOCUMENT VAULT SYNC INSTANCE INITIATION
    // Automatically runs background tracking lookups for files pushed from your admin workspace panel
    if (typeof initializeAutomatedVaultSyncEngine === 'function') {
      initializeAutomatedVaultSyncEngine(activeClient, activeClientSessionUser.id);
    }

  } catch (err) {
    console.error("Database tracking sync layer dropped out:", err.message);
    if (typeof loadClientTelemetryMocks === 'function') loadClientTelemetryMocks();
  }
}


// ========================================================================== //
// 📁 THE LIVE DOCUMENT VAULT REAL-TIME SUBSCRIBER ENGINE & INTERFACE LAYOUTS
// ========================================================================== //

/**
 * 📁 INITIALIZE AUTOMATED VAULT SYNC ENGINE
 * Set up a real-time replication listener on the document vault table
 */
function initializeAutomatedVaultSyncEngine(client, userId) {
  const documentTableBody = document.getElementById("clientVaultTableLayoutBody");
  if (!documentTableBody) return;

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

/**
 * 🛠️ LOAD CLIENT TELEMETRY MOCKS
 * Injects sandbox preview datasets into view components if network state layers encounter blocks
 */
function loadClientTelemetryMocks() {
  if (typeof renderEntitiesPreviewTable === 'function') {
    renderEntitiesPreviewTable([
      { entity_name: "Apex Venture Operations LLC", state: "DE", structure_type: "LLC", status: "Active" },
      { entity_name: "Horizon Global Trade Group", state: "TX", structure_type: "LLC", status: "Pending" }
    ]);
  }
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

// ==========================================================================
// 🛑 SECURE SIGN-OUT ROUTE CONTROLLER ACTION (SAFE BINDING)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("portalLogoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = null;
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("🔒 Logout sequence initiated. Cleaning local token parameters...");
      
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Logging out...";

      const activeClient = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (activeClient && activeClient.auth) {
        try {
          await activeClient.auth.signOut();
        } catch (err) {
          console.warn("Supabase clean exit skipped:", err.message);
        }
      }

      localStorage.removeItem("filings4u_secure_session_token");
      sessionStorage.clear();

      // ✅ FIX 2: Redirect cleanly back to the absolute main website portal path destination
      const targetRedirect = "https://filings4u.com";
      window.location.replace(targetRedirect);
    });
    console.log("✅ Secure logout listener successfully locked onto client DOM button.");
  } else {
    console.warn("⚠️ Client logout button target (#portalLogoutBtn) not found in current DOM layout.");
  }
});
