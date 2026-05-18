// auth-guard.js
(async function protectWizard() {
    "use strict";

    // 1. Poll until your centralized config initializes the client engine safely
    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 30);
        });
    }

    const client = await waitForSupabaseClientEngine();

    try {
        // Hydrate local storage tokens into memory
        await client.auth.initialize();

        // 2. Fetch active user session
        const { data: { session }, error } = await client.auth.getSession();

        // 3. If no token or active session exists, execute stateful redirect routing
        if (error || !session) {
            // Extract file name (e.g., 'wizard-2290.html') and preserve active URL queries
            const currentWizard = window.location.pathname.split("/").pop() || "index.html";
            const currentParams = window.location.search; 

            // Construct exact safe callback string
            const returnUrl = encodeURIComponent(currentWizard + currentParams);
            
            console.warn("Wizard progress paused: No session token. Saving position vector...");
            window.location.href = `index.html?redirect=${returnUrl}`;
        }
        
    } catch (err) {
        console.error("Wizard Guard tracking system exception:", err.message);
        window.location.href = "index.html";
    }
})();

// Append this small enhancement inside your assets/js/admin-guard.js file
const executionLogoutTriggers = [
    document.getElementById('adminGlobalLogoutBtn'),
    document.getElementById('sidebarFallbackLogoutBtn')
];

executionLogoutTriggers.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Re-use your existing animated sign-out routine here...
            btn.classList.add('signing-out');
            btn.innerHTML = `🚪 Clearing Token...`;
            
            await client.auth.signOut();
            window.location.replace('https://filings4u.com');
        });
    }
});
