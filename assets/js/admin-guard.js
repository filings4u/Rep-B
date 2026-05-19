// assets/js/admin-guard.js
(async function enforceAdminSessionSecurityGate() {
    "use strict";

    // 1. Establish absolute path configurations to prevent root route clipping
    const productionRootUrl = window.productionRootUrl || window.location.origin;
    const loginRedirectTarget = `${productionRootUrl}/admin-login.html`;

    function verifySupabaseEngineDeployment() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const clientTracker = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(clientTracker);
                    resolve(window.supabaseClient);
                }
            }, 10); // Ultra-fast checking interval prevents display rendering flashes
        });
    }

    try {
        const client = await verifySupabaseEngineDeployment();
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError || !session || !session.user) {
            throw new Error("No authenticated administration terminal sequence found.");
        }

        const userEmail = session.user.email.toLowerCase().trim();

        // 2. Apply your absolute security logic criteria filters
        const isExplicitAdmin = (userEmail === 'test-admin@filings4u.com');
        const isCorporateDomainAdmin = userEmail.endsWith('@filings4u.com') && userEmail !== 'filings@filings4u.com';

        if (!isExplicitAdmin && !isCorporateDomainAdmin) {
            throw new Error(`Unauthorized profile access attempt recorded: ${userEmail}`);
        }

        // System Success: Profile has clearance. Exits security gate and lets HTML parse.
        console.log("Admin security credentials validated. Terminal access granted.");

    } catch (gateError) {
        console.error("Security Terminal Violation:", gateError.message);
        
        // Hard purge local cookies/tokens instantly so Cloudflare doesn't loop bad states
        if (window.supabaseClient && window.supabaseClient.auth) {
            await window.supabaseClient.auth.signOut();
        }
        
        // Escape back to login terminal immediately
        window.location.replace(loginRedirectTarget);
    }
})();
