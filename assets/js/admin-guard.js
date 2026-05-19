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
            }, 10); // Checked every 10ms to eliminate flash of unauthenticated content
        });
    }

    try {
        const client = await verifySupabaseEngineDeployment();
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError || !session || !session.user) {
            throw new Error("No authenticated administration terminal sequence found.");
        }

        const userEmail = session.user.email.toLowerCase().trim();

        // 2. 🎯 MATCHED DOMAIN RULE: Any corporate email suffix or explicit test account has access
        const isTestAdmin = (userEmail === 'test-admin@filings4u.com');
        const isCorporateStaff = userEmail.endsWith('@filings4u.com');

        if (!isTestAdmin && !isCorporateStaff) {
            throw new Error(`Unauthorized profile access attempt recorded: ${userEmail}`);
        }

        // System Success: Profile has clearance. Exits security gate and lets HTML parse.
        console.log("Admin security credentials validated. Terminal access granted.");

    } catch (gateError) {
        console.error("Security Terminal Violation:", gateError.message);
        
        // Hard purge local tokens instantly so Cloudflare doesn't cache bad states
        if (window.supabaseClient && window.supabaseClient.auth) {
            await window.supabaseClient.auth.signOut();
        }
        
        // Escape back to login terminal immediately
        window.location.replace(loginRedirectTarget);
    }
})();
