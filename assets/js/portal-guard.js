// assets/js/portal-guard.js
(async function shieldCustomerWorkspace() {
    "use strict";

    function waitForSupabase() {
        return new Promise(res => {
            if (window.supabaseClient) return res(window.supabaseClient);
            const idx = setInterval(() => { if (window.supabaseClient) { clearInterval(idx); res(window.supabaseClient); } }, 30);
        });
    }
    const client = await waitForSupabase();

    try {
        await client.auth.initialize();
        const { data: { session }, error } = await client.auth.getSession();

        // Halt layout execution if no valid token is found
        if (error || !session || !session.user) {
            console.warn("Unauthorized customer path blocked. Routing to terminal gateway.");
            window.location.href = 'portal-login.html';
            return;
        }

        console.log(`🔒 Workspace verified for client token identity: ${session.user.email}`);
    } catch (err) {
        window.location.href = 'portal-login.html';
    }
})();
