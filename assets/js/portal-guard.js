// assets/js/portal-guard.js
(async function shieldCustomerWorkspace() {
    "use strict";

    // 1. Instantly hide the page layout to prevent unauthorized data flash
    const rootElement = document.documentElement;
    rootElement.style.visibility = "hidden";

    // 2. Establish uniform routing targets
    const productionRootUrl = window.productionRootUrl || window.location.origin;
    const portalLoginTarget = `${productionRootUrl}/portal-login.html`;

    function waitForSupabase() {
        return new Promise((resolve, reject) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            
            let attempts = 0;
            const idx = setInterval(() => {
                attempts++;
                if (window.supabaseClient) {
                    clearInterval(idx);
                    resolve(window.supabaseClient);
                } else if (attempts > 100) { // Timeout safety trigger after 3 seconds
                    clearInterval(idx);
                    reject(new Error("Supabase engine initialization timed out."));
                }
            }, 30);
        });
    }

    try {
        const client = await waitForSupabase();
        
        // Ensure auth configuration is completely initialized
        if (typeof client.auth.initialize === 'function') {
            await client.auth.initialize();
        }

        const { data: { session }, error } = await client.auth.getSession();

        // 3. Reject access if session holds no active user token
        if (error || !session || !session.user) {
            throw new Error("Unauthorized customer path blocked. Missing session token.");
        }

        // 4. Verification Check Passed: Reveal the UI to the verified client
        console.log(`🔒 Workspace verified for client token identity: ${session.user.email}`);
        rootElement.style.visibility = "visible";

    } catch (err) {
        console.warn("Security Perimeter Intercept:", err.message);
        
        // Clean out any corrupt session parameters
        if (window.supabaseClient?.auth) {
            try { await window.supabaseClient.auth.signOut(); } catch (_) {}
        }
        
        // 5. Force client redirect back to secure portal entry wall
        window.location.replace(portalLoginTarget);
    }
})();
