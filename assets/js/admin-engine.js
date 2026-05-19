// assets/js/admin-engine.js
(async function initializeAdminDashboardEngine() {
    "use strict";

    const client = window.supabaseClient;
    if (!client) {
        console.error("Fatal Engine Failure: Supabase initialization client is missing.");
        return;
    }

    // 1. Gather all interface elements
    const globalLogoutBtn = document.getElementById('adminGlobalLogoutBtn');
    const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
    const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
    const clockDisplayElement = document.getElementById('portal-clock');

    // 2. Synchronize Live System Clock
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        clockDisplayElement.innerText = now.toTimeString().split(' ')[0];
    }
    setInterval(runLiveSystemClock, 1000);
    runLiveSystemClock();

    // 3. Inject User Meta State into system logs area
    try {
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && staffEmailDisplayLog) {
            staffEmailDisplayLog.innerText = `Active Session: ${session.user.email}`;
        }
    } catch (logErr) {
        console.warn("Unable to write active session mail stamp:", logErr);
    }

    // 4. Centralized Application Sign Out Protocol
    async function executeTerminalSessionTermination() {
        try {
            if (globalLogoutBtn) globalLogoutBtn.disabled = true;
            if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = true;
            
            console.log("Terminating administration session state...");
            await client.auth.signOut();
            
            const productionRootUrl = window.productionRootUrl || window.location.origin;
            window.location.assign(`${productionRootUrl}/admin-login.html`);
        } catch (logoutErr) {
            alert(`Logout Failed:\n${logoutErr.message}`);
            if (globalLogoutBtn) globalLogoutBtn.disabled = false;
            if (fallbackLogoutBtn) fallbackLogoutBtn.disabled = false;
        }
    }

    // Attach click listeners to both visual sign out interface triggers
    if (globalLogoutBtn) {
        globalLogoutBtn.addEventListener('click', e => { e.preventDefault(); executeTerminalSessionTermination(); });
    }
    if (fallbackLogoutBtn) {
        fallbackLogoutBtn.addEventListener('click', e => { e.preventDefault(); executeTerminalSessionTermination(); });
    }

})();
