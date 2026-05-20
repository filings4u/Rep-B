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

    /**
 * 🔒 filings4u Production Session Protection Guard
 * Strictly intercepting unauthenticated traffic layers before view initialization
 */
(async function enforceSecureWorkspaceAccess() {
    const supabaseUrl = window.SUPABASE_URL || localStorage.getItem("https://lrbimrlbskjweynxlgas.supabase.co");
    const supabaseKey = window.SUPABASE_ANON_KEY || localStorage.getItem("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");

    if (!supabaseUrl || !supabaseKey) {
        console.error("Critical Platform Config Keys Isolated or Missing.");
        window.location.href = "https://portal.filings4u.com/portal-login.html";
        return;
    }

    // Initialize local instance checker cleanly prior to page load
    const clientInstance = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;
    
    if (!clientInstance) {
        window.location.href = "https://portal.filings4u.com/portal-login.html";
        return;
    }

    const { data: { session }, error } = await clientInstance.auth.getSession();
    
    if (error || !session) {
        console.warn("Unauthorized access trace blocked. Redirecting session context to login.");
        window.location.href = "https://portal.filings4u.com/portal-login.html";
    }
})();

})();
