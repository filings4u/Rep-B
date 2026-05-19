// assets/js/admin-engine.js
(async function initializeAdminDashboardEngine() {
    "use strict";

    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 10);
        });
    }

    try {
        const client = await waitForSupabaseClientEngine();

        const globalLogoutBtn = document.getElementById('adminGlobalLogoutBtn');
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
        const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
        const clockDisplayElement = document.getElementById('portal-clock');

        function runLiveSystemClock() {
            if (!clockDisplayElement) return;
            const now = new Date();
            clockDisplayElement.innerText = now.toTimeString().split(' ');
        }
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();

        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && staffEmailDisplayLog) {
            staffEmailDisplayLog.innerText = `Active Session: ${session.user.email}`;
        }

        async function executeTerminalSessionTermination() {
            try {
                if (globalLogoutBtn) globalLogoutBtn.disabled = true;
                if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = true;
                
                await client.auth.signOut();
                const baseTarget = window.productionRootUrl || window.location.origin;
                window.location.replace(`${baseTarget}/admin-login.html`);
            } catch (logoutErr) {
                alert(`Logout Failed:\n${logoutErr.message}`);
                if (globalLogoutBtn) globalLogoutBtn.disabled = false;
                if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = false;
            }
        }

        if (globalLogoutBtn) {
            globalLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); executeTerminalSessionTermination(); });
        }
        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); executeTerminalSessionTermination(); });
        }

        console.log("🚀 Admin core telemetry engine safely stabilized.");
    } catch (engineErr) {
        console.error("Critical core telemetry crash:", engineErr.message);
    }
})();
