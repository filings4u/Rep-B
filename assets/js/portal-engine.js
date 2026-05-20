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
    const clockElement = document.getElementById("portal-clock");
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
            window.location.href = "login.html";
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
    const targetState = document.getElementById("stateRateField").value;
    const totalCost = document.getElementById("ledgTotal").textContent;

    const payloadBundle = {
        service: nameStr,
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
        let currentCount = parseInt(pendingCounter.textContent) || 0;
        pendingCounter.textContent = currentCount + 1;
    }
}

async function syncAccountTelemetryGrid() {
    try {
        const [ent, fil] = await Promise.all([
            supabase.from('entities').select('*').eq('owner_id', activeClientSessionUser.id),
            supabase.from('filing_orders').select('*').eq('client_id', activeClientSessionUser.id)
        ]);
        if(ent.data) renderEntitiesPreviewTable(ent.data);
        if(fil.data) renderFilingsTimelineWidget(fil.data);
    } catch {
        loadClientTelemetryMocks();
    }
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
            <h4>${item.service_title}</h4>
            <p>${item.status_description || 'In pipeline state review.'}</p>
        </div>
    `).join('');
}

function toggleSidebarAccordion(buttonElement) {
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    if (panel.style.maxHeight && panel.style.maxHeight !== "0px") { panel.style.maxHeight = "0px"; } 
    else { panel.style.maxHeight = panel.scrollHeight + "px"; }
}

// ==========================================================================
// 🛑 SECURE SIGN-OUT ROUTE CONTROLLER ACTION (SAFE BINDING)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("portalLogoutBtn");
    
    if (logoutBtn) {
        // Clear any old accidental listener links before binding a clean one
        logoutBtn.onclick = null; 
        
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("🔒 Logout sequence initiated. Cleaning local token parameters...");
            
            // Disable button immediately to prevent double-submission errors
            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";

            // 1. Terminate secure Supabase token instance authentication if online
            if (typeof supabase !== 'undefined') {
                try {
                    await supabase.auth.signOut();
                } catch (err) {
                    console.warn("Supabase clean exit skipped:", err.message);
                }
            } else if (window.supabaseClient) {
                try {
                    await window.supabaseClient.auth.signOut();
                } catch (err) {
                    console.warn("Client window session exit skipped:", err.message);
                }
            }

            // 2. Clear out persistent browser session registers
            localStorage.removeItem("filings4u_secure_session_token");
            sessionStorage.clear();

            // 3. Clear location paths and route back to secure login entry wall
            const targetRedirect = "https://filings4u.com";
            window.location.replace(targetRedirect);
        });
        
        console.log("✅ Secure logout listener successfully locked onto client DOM button.");
    } else {
        console.warn("⚠️ Client logout button target (#portalLogoutBtn) not found in current DOM layout.");
    }
});
