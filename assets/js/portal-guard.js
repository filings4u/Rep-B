(async function shieldCustomerWorkspace() {
    "use strict";

    // 1. Instantly hide the page layout to prevent unauthorized data flash
    const rootElement = document.documentElement;
    rootElement.style.visibility = "hidden";

    // 2. Establish exact explicit portal entry wall URL location
    const portalLoginTarget = "https://portal.filings4u.com/portal-login.html";

    // Hardcoded production infrastructure connection definitions 
    const SB_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    function waitForSupabaseEngine() {
        return new Promise((resolve, reject) => {
            // Check if window object instance or client configuration already instantiated
            if (window.supabaseClient) return resolve(window.supabaseClient);
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                window.supabaseClient = window.supabase.createClient(SB_URL, SB_KEY);
                return resolve(window.supabaseClient);
            }

            let attempts = 0;
            const idx = setInterval(() => {
                attempts++;
                if (window.supabaseClient) {
                    clearInterval(idx);
                    resolve(window.supabaseClient);
                } else if (window.supabase && typeof window.supabase.createClient === 'function') {
                    clearInterval(idx);
                    window.supabaseClient = window.supabase.createClient(SB_URL, SB_KEY);
                    resolve(window.supabaseClient);
                } else if (attempts > 60) { // Safety clearance threshold cutoff after 1.8 seconds
                    clearInterval(idx);
                    reject(new Error("Supabase engine initialization timed out."));
                }
            }, 30);
        });
    }

    try {
        const client = await waitForSupabaseEngine();

        // Ensure auth configuration parameters are completely fully initialized
        if (client.auth && typeof client.auth.initialize === 'function') {
            await client.auth.initialize();
        }

        const { data: { session }, error } = await client.auth.getSession();

        // 3. Reject workspace clearance access if session holds no active user token arrays
        if (error || !session || !session.user) {
            throw new Error("Unauthorized customer path blocked. Missing active session token.");
        }

        // 4. Verification Check Passed: Reveal the UI to the verified client profile console
        console.log(`🔒 Workspace verified for client token identity: ${session.user.email}`);
        rootElement.style.visibility = "visible";

    } catch (err) {
        console.warn("Security Perimeter Intercept:", err.message);

        // Clean out any potentially corrupt token references
        if (window.supabaseClient?.auth) {
            try { await window.supabaseClient.auth.signOut(); } catch (_) {}
        }

        // 5. Force client redirect location parameters back to secure login entry wall
        window.location.replace(portalLoginTarget);
    }
})();
