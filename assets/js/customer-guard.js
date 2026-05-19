// assets/js/customer-guard.js
(async function enforceCustomerSessionSecurityGate() {
    "use strict";

    // 1. Establish absolute path configurations to prevent root route clipping
    const productionRootUrl = window.productionRootUrl || window.location.origin;
    const loginRedirectTarget = `${productionRootUrl}/portal-login.html`;

    function verifySupabaseEngineDeployment() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const clientTracker = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(clientTracker);
                    resolve(window.supabaseClient);
                }
            }, 10); // Checked every 10ms to eliminate flash of unauthenticated content
        });
    }

    try {
        const client = await verifySupabaseEngineDeployment();
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        // 2. Verify that an active, validated session exists
        if (sessionError || !session || !session.user) {
            throw new Error("No authenticated customer session found.");
        }

        const userEmail = session.user.email.toLowerCase().trim();

        // 3. Redirect corporate staff profiles to the admin dashboard if they wander in here
        const isCorporateStaff = userEmail.endsWith('@filings4u.com') || (userEmail === 'test-admin@filings4u.com');

        if (isCorporateStaff) {
            console.warn("Administrative profile detected inside client dashboard. Rerouting...");
            window.location.replace(`${productionRootUrl}/admin-dashboard.html`);
            return;
        }

        // Success: Clear access validation check. The browser can now parse client data grids safely.
        console.log("Customer validation confirmed. Session active.");

    } catch (gateError) {
        console.error("Security Portal Violation:", gateError.message);
        
        // Hard purge local client tokens instantly so Cloudflare doesn't cache bad states
        if (window.supabaseClient && window.supabaseClient.auth) {
            await window.supabaseClient.auth.signOut();
        }
        
        // Escape back to customer login terminal immediately
        window.location.replace(loginRedirectTarget);
    }
})();
