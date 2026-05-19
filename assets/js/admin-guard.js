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

// assets/js/admin-guard.js
(async function enforcePerimeterClearance() {
    "use strict";
    
    function checkClient() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const loop = setInterval(() => {
                if (window.supabaseClient) { clearInterval(loop); resolve(window.supabaseClient); }
            }, 10);
        });
    }

    const client = await checkClient();
    const { data: { session } } = await client.auth.getSession();
    const fallbackUrl = window.productionRootUrl || window.location.origin;

    if (!session || !session.user) {
        console.warn("Security Breach: Unauthenticated user intercepted. Redirecting to login wall...");
        window.location.replace(`${fallbackUrl}/admin-login.html`);
        return;
    }

    // Force strict corporate domain checking constraints
    const email = session.user.email.toLowerCase();
    const isAuthorizedStaff = email.endsWith('@filings4u.com') || email === 'test-admin@filings4u.com';

    if (!isAuthorizedStaff) {
        alert("Security Lockout: Your profile tokens hold insufficient clearance parameters.");
        await client.auth.signOut();
        window.location.replace(`${fallbackUrl}/admin-login.html`);
    }
})();
