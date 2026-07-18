/**
 * 📁 FILE PATH: client-dashboard.js
 * Responsibility: UI Layout Mechanics, Clock Engine, Accordions, and Safe Sign-Out
 */

document.addEventListener("DOMContentLoaded", () => {
    initLiveSystemClock();
    initializeSecureSignOutAction();
});

function initLiveSystemClock() {
    const clockElement = document.getElementById("client-clock");
    if (!clockElement) return;
    
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = `${now.toLocaleDateString('en-US')} | ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    }, 1000);
}

function toggleSidebarAccordion(buttonElement) {
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    if (panel && panel.style) {
        panel.style.maxHeight = (panel.style.maxHeight && panel.style.maxHeight !== "0px") ? "0px" : panel.scrollHeight + "px";
    }
}

function initializeSecureSignOutAction() {
    const logoutBtn = document.getElementById("portalLogoutBtn") || document.getElementById("adminLogoutBtn");
    if (!logoutBtn) return;

    logoutBtn.onclick = null;
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        const activeClient = window.supabaseInstance || window.supabaseClient;

        if (activeClient && activeClient.auth) {
            try { 
                await activeClient.auth.signOut(); 
            } catch (err) { 
                console.warn("Supabase clean exit skipped:", err.message); 
            }
        }

        localStorage.removeItem("filings4u_secure_session_token");
        sessionStorage.clear();
        window.location.replace("https://filings4u.com");
    });
}

// ========================================================================== //
// 🌐 SECURE SUPABASE REALTIME BROADCAST CHANNELS SETUP                       //
// ========================================================================== //
async function initializeRealtimeBroadcastNetwork() {
    "use strict";

    // 🚀 THE BREAKOUT FIX: Evaluate the global property LIVE on every single tick cycle instead of saving a dead local pointer
    if (!window.supabaseInstance || typeof window.supabaseInstance.channel !== 'function') {
        console.warn("⚠️ Realtime Channel Intercept: Active client system instance not ready. Polling...");
        setTimeout(initializeRealtimeBroadcastNetwork, 200);
        return;
    }

    // Capture the valid, alive client reference now that the check pass has confirmed it exists
    const activeClient = window.supabaseInstance;

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
                if (typeof handleIncomingStateSync === 'function') {
                    handleIncomingStateSync(payload.payload);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('📡 Synchronized cleanly to Supabase Realtime Broadcast Network');
                    
                    // Update Action Log on Dashboard to mirror live status confirmation
                    const liveLogBox = document.querySelector('.live-log, p[style*="continuous state sync"]');
                    if (liveLogBox || document.getElementById('liveLogDisplay')) {
                        (liveLogBox || document.getElementById('liveLogDisplay')).textContent = "✓ Live state tracking synchronized cleanly to network.";
                    }
                }
            });

    } catch (realtimeSetupException) {
        console.error("[Fatal Realtime Setup Interception Failure]", realtimeSetupException);
    }
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
    const logoutBtn = document.getElementById("portalLogoutBtn") || document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = null;
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("🔐 Logout sequence initiated. Cleaning local token parameters...");
            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";
            
            const activeClient = window.supabaseInstance || window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
            if (activeClient && activeClient.auth) {
                try {
                    await activeClient.auth.signOut();
                } catch (err) {
                    console.warn("Supabase clean exit skipped:", err.message);
                }
            }
            
            localStorage.removeItem("filings4u_secure_session_token");
            sessionStorage.clear();
            
            const targetRedirect = "https://filings4u.com";
            window.location.replace(targetRedirect);
        });
        console.log("✅ Secure logout listener successfully locked onto client DOM button.");
    } else {
        console.log("[Portal Engine] Skipping logout binding: No matching button target in current layout context.");
    }
});


/**
 * ⏱️ 3. YOUR ORIGINAL CLOCK MATRIX ENGINE (SEPARATED)
 * Responsibility: Updates interface layouts with synchronized structural time vectors
 */
(function initializeGlobalAdminClockMatrix() {
    "use strict";

    function executeClockSynchronization() {
        const targetClock = document.getElementById('portal-clock');
        if (!targetClock) return;

        function renderTime() {
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            
            let rawHours = now.getHours();
            const ampmMarker = rawHours >= 12 ? 'PM' : 'AM';
            
            rawHours = rawHours % 12;
            rawHours = rawHours ? rawHours : 12; // Handle midnight loop points safely
            
            const hrs = String(rawHours).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            const secs = String(now.getSeconds()).padStart(2, '0');
            
            targetClock.textContent = `${m}/${d}/${y} | ${hrs}:${mins}:${secs} ${ampmMarker}`;
        }

        renderTime();
        setInterval(renderTime, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeClockSynchronization);
    } else {
        executeClockSynchronization();
    }
})();
