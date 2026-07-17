/**
 * 🚀 filings4u Customer Portal Engine
 * Standardized Production Module with Supabase Realtime Broadcast Routing
 */

let activeClientSessionUser = null;
let realtimeTelemetryChannel = null;

document.addEventListener("DOMContentLoaded", async () => {
    initLiveSystemClock();
    await initializePortalSession();
    initializeRealtimeBroadcastNetwork();
});

function initLiveSystemClock() {
    const clockElement = document.getElementById("client-clock");
    if (!clockElement) return;
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = `${now.toLocaleDateString('en-US')} | ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    }, 1000);
}

async function initializePortalSession() {
    if (typeof supabase === 'undefined') {
        loadClientTelemetryMocks();
        return;
    }
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            window.location.href = "portal-login.html";
            return;
        }
        activeClientSessionUser = session.user;
        const nameField = document.getElementById("clientNameField");
        if (nameField) nameField.textContent = activeClientSessionUser.email;
        
        await syncAccountTelemetryGrid();
    } catch (err) {
        loadClientTelemetryMocks();
    }
}

// ==========================================================================
// 🌐 CORRECTED SUPABASE REALTIME BROADCAST CHANNELS SETUP
// ==========================================================================
function initializeRealtimeBroadcastNetwork() {
    "use strict";

    // 🎯 FIX: Explicitly pull from the globally running window instance
    const activeClient = window.supabaseClient || window.supabase;
    
    // Safety abort tracking: Stops terminal crashes if script sequence delays occur
    if (!activeClient || typeof activeClient.channel !== 'function') {
        console.warn("⚠️ Realtime Channel Intercept: Active client system instance not ready.");
        return;
    }

    // Fallback assignment matching variable scope footprints if session cache values lag
    const userInstance = activeClientSessionUser || (activeClient.auth ? activeClient.auth.user : null);
    if (!userInstance) return;

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
