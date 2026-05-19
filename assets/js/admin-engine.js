// assets/js/admin-engine.js
(async function initializeAdminDashboardEngine() {
    "use strict";

    // 1. Asynchronous polling engine waiting safely for config client instantiation
    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 10); // Polling checks every 10ms resolves Cloudflare race states
        });
    }

    const client = await waitForSupabaseClientEngine();

    // 2. Gather layout interaction components
    const globalLogoutBtn = document.getElementById('adminGlobalLogoutBtn');
    const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
    const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
    const clockDisplayElement = document.getElementById('portal-clock');

    // 3. Synchronize Live System Clock
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        clockDisplayElement.innerText = now.toTimeString().split(' ')[0];
    }
    setInterval(runLiveSystemClock, 1000);
    runLiveSystemClock();

    // 4. Inject Active User Meta State into administrative dashboard log panels
    try {
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && staffEmailDisplayLog) {
            staffEmailDisplayLog.innerText = `Active Session: ${session.user.email}`;
        }
    } catch (logErr) {
        console.warn("Unable to write active session mail stamp:", logErr);
    }

    // 5. Centralized Application Sign Out Protocol
    async function executeTerminalSessionTermination() {
        try {
            if (globalLogoutBtn) globalLogoutBtn.disabled = true;
            if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = true;
            
            console.log("Terminating administration session state...");
            await client.auth.signOut();
            
            // Hard boundary escape loop directly out to absolute subdomain endpoints
            const baseTarget = window.productionRootUrl || window.location.origin;
            window.location.replace(`${baseTarget}/admin-login.html`);
        } catch (logoutErr) {
            alert(`Logout Failed:\n${logoutErr.message}`);
            if (globalLogoutBtn) globalLogoutBtn.disabled = false;
            if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = false;
        }
    }

    // Bind safe click listeners onto header actions and fallback sidebar elements
    if (globalLogoutBtn) {
        globalLogoutBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            executeTerminalSessionTermination(); 
        });
    }
    if (fallbackLogoutBtn) {
        fallbackLogoutBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            executeTerminalSessionTermination(); 
        });
    }

    console.log("🚀 Admin core telemetry engine safely stabilized.");
})();