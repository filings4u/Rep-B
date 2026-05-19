// assets/js/admin-engine.js
(function initializeRobustAdminEngine() {
    "use strict";

    console.log("🚀 Admin UI telemetry engine initializing...");

    // ==========================================================================
    // ⏰ 1. SELF-SUFFICIENT REAL-TIME SYSTEM CLOCK (Runs immediately)
    // ==========================================================================
    const clockDisplayElement = document.getElementById('portal-clock');
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        clockDisplayElement.innerText = now.toTimeString().split(' ')[0];
    }
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();
    }

    // ==========================================================================
    // 🚪 2. SECURE DISCONNECTED ACTION ROUTER (Bypass race conditions)
    // ==========================================================================
    async function executeTerminalSessionTermination(btnElement) {
        try {
            if (btnElement) btnElement.disabled = true;
            console.log("Purging administrative authorization tokens...");

            // If Supabase client exists, trigger remote sign out
            if (window.supabaseClient && window.supabaseClient.auth) {
                await window.supabaseClient.auth.signOut();
            }

            // Fallback: Manually wipe your storage protection keys to break Cloudflare loops
            localStorage.removeItem("filings4u_secure_session_token");
            sessionStorage.clear();

            // absolute escape back to the staff login gate
            const baseTarget = window.productionRootUrl || window.location.origin;
            window.location.replace(`${baseTarget}/admin-login.html`);
        } catch (logoutErr) {
            console.error("Logout caught an exception:", logoutErr.message);
            const baseTarget = window.productionRootUrl || window.location.origin;
            window.location.replace(`${baseTarget}/admin-login.html`);
        }
    }

    // Attach click triggers to buttons immediately once the DOM parses them
    document.addEventListener("DOMContentLoaded", () => {
        const globalLogoutBtn = document.getElementById('adminGlobalLogoutBtn');
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');

        if (globalLogoutBtn) {
            globalLogoutBtn.style.display = "inline-flex"; // Explicitly force button visibility
            globalLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                executeTerminalSessionTermination(globalLogoutBtn);
            });
        }

        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.style.display = "block"; // Explicitly force sidebar link visibility
            fallbackLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                executeTerminalSessionTermination(fallbackLogoutBtn);
            });
        }
    });

    // ==========================================================================
    // 📊 3. ASYNCHRONOUS DATABASE HYDRATION LAYERS (Fails silently if missing)
    // ==========================================================================
    async function loadAsynchronousDatabaseMeta() {
        if (!window.supabaseClient) return;
        
        try {
            const client = window.supabaseClient;
            const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
            
            const { data: { session } } = await client.auth.getSession();
            if (session && session.user && staffEmailDisplayLog) {
                staffEmailDisplayLog.innerText = `Active Session: ${session.user.email}`;
            }
        } catch (err) {
            console.warn("Telemetry database hydration paused:", err.message);
        }
    }

    // Poll for client safely without freezing the interface loop
    const clientCheckLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(clientCheckLoop);
            loadAsynchronousDatabaseMeta();
        }
    }, 100);

    // Stop checking after 5 seconds to conserve browser performance
    setTimeout(() => clearInterval(clientCheckLoop), 5000);

})();
