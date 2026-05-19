// assets/js/admin-engine.js
(function initializeRobustAdminEngine() {
    "use strict";

    console.log("🚀 Admin UI accordion engine successfully mounted.");

       // Update the clock section inside your assets/js/admin-engine.js file:
    const clockDisplayElement = document.getElementById('portal-clock');
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        // 🎯 FIXED: Extracts only the basic HH:MM:SS format and drops the timezone text
        clockDisplayElement.innerText = now.toTimeString().split(' ')[0];
    }
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();
    }


    // ==========================================================================
    // 🚪 2. DISCONNECTED SESSION TERMINATION ROUTINES
    // ==========================================================================
    async function executeTerminalSessionTermination(btnElement) {
        try {
            if (btnElement) btnElement.disabled = true;
            console.log("Purging administrative authorization tokens...");

            if (window.supabaseClient && window.supabaseClient.auth) {
                await window.supabaseClient.auth.signOut();
            }

            localStorage.removeItem("filings4u_secure_session_token");
            sessionStorage.clear();

            const baseTarget = window.productionRootUrl || window.location.origin;
            window.location.replace(`${baseTarget}/admin-login.html`);
        } catch (logoutErr) {
            console.error("Logout caught an exception:", logoutErr.message);
            const baseTarget = window.productionRootUrl || window.location.origin;
            window.location.replace(`${baseTarget}/admin-login.html`);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                executeTerminalSessionTermination(fallbackLogoutBtn);
            });
        }
    });

    // ==========================================================================
    // 📊 3. RUNTIME TELEMETRY DATA RECONCILIATIONS
    // ==========================================================================
    async function loadAsynchronousDatabaseMeta() {
        if (!window.supabaseClient) return;
        
        try {
            const client = window.supabaseClient;
            const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
            
            const { data: { session } } = await client.auth.getSession();
            if (session && session.user && staffEmailDisplayLog) {
                staffEmailDisplayLog.innerText = `Active Account: ${session.user.email}`;
            }
        } catch (err) {
            console.warn("Database metadata tracking paused:", err.message);
        }
    }

    const clientCheckLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(clientCheckLoop);
            loadAsynchronousDatabaseMeta();
        }
    }, 100);

    setTimeout(() => clearInterval(clientCheckLoop), 5000);

})();
