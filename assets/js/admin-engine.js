// assets/js/admin-engine.js
(function initializeRobustAdminEngine() {
    "use strict";

    console.log("🚀 Admin UI accordion engine successfully mounted.");


    // ⏰ 1. SELF-SUFFICIENT REAL-TIME SYSTEM CLOCK (WITH DATE MERGED)
    // ==========================================================================
    const clockDisplayElement = document.getElementById('portal-clock');
    
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        
        // 🎯 Injects numerical padded dates 
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateString = `${mm}/${dd}/${yyyy}`;
        
        // Strips any trailing timezone or GMT text parameters completely
        const timeString = now.toTimeString().split(' ')[0];
        
        // Merges into a clean, unified dashboard tracker string
        clockDisplayElement.innerText = `${dateString} | ${timeString}`;
    }
    
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock(); // Fires instantly to prevent initial placeholder flash
    }



       // 🚪 2. SECURE INSTANT DISCONNECTED ACTION ROUTER
    async function executeTerminalSessionTermination(btnElement) {
        if (btnElement) btnElement.disabled = true;
        console.log("Instant clearing local authentication metrics...");

        // 🎯 THE SPEED FIX: Clear local storage keys instantly before the server responds
        localStorage.removeItem("filings4u_secure_session_token");
        sessionStorage.clear();

        const baseTarget = window.productionRootUrl || window.location.origin;

        try {
            // Trigger the remote sign-out in the background without blocking the user
            if (window.supabaseClient && window.supabaseClient.auth) {
                window.supabaseClient.auth.signOut(); 
            }
        } catch (logoutErr) {
            console.warn("Background auth purge trace skipped:", logoutErr.message);
        }

        // Redirect immediately—takes under 50 milliseconds
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
