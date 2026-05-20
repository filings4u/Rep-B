// assets/js/admin-perimeter-guard.js
(async function enforceAdminPerimeterSecurity() {
    "use strict";

    // 1. Instantly hide the page body to prevent "Flash of Unauthenticated Content" (FOUC)
    const rootElement = document.documentElement;
    rootElement.style.visibility = "hidden";

    const productionRootUrl = window.productionRootUrl || window.location.origin;
    const loginRedirectTarget = `${productionRootUrl}/admin-login.html`;

    // 2. Await Supabase client initialization safely with a timeout fallback
    function waitForSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            
            let attempts = 0;
            const clientTracker = setInterval(() => {
                attempts++;
                if (window.supabaseClient) {
                    clearInterval(clientTracker);
                    resolve(window.supabaseClient);
                } else if (attempts > 200) { // Timeout after 2 seconds if Supabase fails to load
                    clearInterval(clientTracker);
                    reject(new Error("Supabase engine failed to initialize."));
                }
            }, 10);
        });
    }

    try {
        const client = await waitForSupabaseClient();
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError || !session || !session.user) {
            throw new Error("No authenticated terminal session detected.");
        }

        const userEmail = session.user.email.toLowerCase().trim();
        const isAuthorized = userEmail.endsWith('@filings4u.com') || userEmail === 'test-admin@filings4u.com';

        if (!isAuthorized) {
            throw new Error(`Unauthorized profile clearance attempt: ${userEmail}`);
        }

        // Clearance Granted: Make the page visible to the administrator
        console.log("Admin security credentials validated. Access granted.");
        rootElement.style.visibility = "visible";

    } catch (gateError) {
        console.error("Security Perimeter Violation:", gateError.message);
        
        // Wipe local storage / state instantly
        if (window.supabaseClient?.auth) {
            try {
                await window.supabaseClient.auth.signOut();
            } catch (signOutError) {
                console.error("Signout sequence failed:", signOutError);
            }
        }
        
        // Force immediate redirection away from administrative views
        window.location.replace(loginRedirectTarget);
    }
})();
