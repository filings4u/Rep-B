// assets/js/admin-engine.js
(function initializeRobustAdminEngine() {
    "use strict";

    console.log("🚀 Admin UI engine successfully mounted.");

    // ==========================================================================
    // ⏰ 1. INTEGRATED CLOCK AND SYSTEM DATE MATRIX (Clean HH:MM:SS)
    // ==========================================================================
    const clockDisplayElement = document.getElementById('portal-clock');
    
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateString = `${mm}/${dd}/${yyyy}`;
        
        const timeString = now.toTimeString().split(' ')[0]; // Strictly extracts HH:MM:SS format
        
        clockDisplayElement.innerText = `${dateString} | ${timeString}`;
    }
    
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();
    }

    // ==========================================================================
    // 🚪 2. SECURE INSTANT DISCONNECTED ACTION ROUTER (FAST LOGOUT)
    // ==========================================================================
    async function executeTerminalSessionTermination(btnElement) {
        if (btnElement) btnElement.disabled = true;
        console.log("Instant clearing local authentication metrics...");

        localStorage.removeItem("filings4u_secure_session_token");
        sessionStorage.clear();

        const baseTarget = window.productionRootUrl || window.location.origin;

        try {
            if (window.supabaseClient && window.supabaseClient.auth) {
                window.supabaseClient.auth.signOut(); 
            }
        } catch (logoutErr) {
            console.warn("Background auth purge trace skipped:", logoutErr.message);
        }

        window.location.replace(`${baseTarget}/admin-login.html`);
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
