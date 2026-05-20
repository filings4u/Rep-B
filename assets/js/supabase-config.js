/**
 * 🚀 filings4u Global Production Infrastructure Config & Secure Perimeter Gate
 * Standardized single-source architecture for auth validation and connection syncing
 */
(function bootstrapGlobalSupabaseSystem() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    // 1. INSTANTLY INSTANTIATE CLIENT IF THE LIBRARY CORE IS LOADED
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: "filings4u_secure_session_token"
            }
        });
        window.productionRootUrl = window.location.origin;
        
        // Immediately run protection evaluations
        executePerimeterSecurityGate(window.supabaseClient);
    } else {
        // Fallback polling index watcher if script tag network latency occurs
        const scriptWatcher = setInterval(() => {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                clearInterval(scriptWatcher);
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                        storageKey: "filings4u_secure_session_token"
                    }
                });
                window.productionRootUrl = window.location.origin;
                executePerimeterSecurityGate(window.supabaseClient);
            }
        }, 10);
    }

    // ==========================================================================
    // 🛡️ 2. CENTRAL INTERCEPTION SECURITY GATEWAY
    // ==========================================================================
    async function executePerimeterSecurityGate(client) {
        const currentPath = window.location.pathname.toLowerCase();
        const fallbackBase = window.location.origin;

        // Public Pages Exemption List Matrix (Pages that MUST never lock)
        const publicPages = [
            "/portal-login.html",
            "/admin-login.html",
            "/forgot-password.html",
            "/update-password.html"
        ];

        const isPublic = publicPages.some(page => currentPath.endsWith(page)) || currentPath === "/" || currentPath === "";
        if (isPublic) return;

        // Hide page layout processing instantly to prevent data flickering
        const rootElement = document.documentElement;
        rootElement.style.visibility = "hidden";

        try {
            // Fetch session securely from persistent local storage token parameters
            const { data: { session }, error } = await client.auth.getSession();

            if (error || !session || !session.user) {
                throw new Error("Missing active profile credential tokens.");
            }

            const email = session.user.email.toLowerCase().trim();
            const isCorporate = email.endsWith("@filings4u.com") || email === "test-admin@filings4u.com";

            // Admin Area Protection Block Check
            if (currentPath.includes("admin-") || currentPath.includes("/admin")) {
                if (!isCorporate) {
                    console.warn(`Security Breach: Client profile ${email} rejected from admin space.`);
                    window.location.replace(`${fallbackBase}/portal-login.html`);
                    return;
                }
            }

            // SUCCESS: Verification Check Passed -> Reveal layout view elements instantly
            console.log(`🔒 Session verified for: ${email} on path: ${currentPath}`);
            rootElement.style.visibility = "visible";

        } catch (gateError) {
            console.warn("Perimeter Guard Redirect Action Intercepted:", gateError.message);
            
            // Clean out potentially corrupt token keys
            try { await client.auth.signOut(); } catch (_) {}

            // Direct route adjustments back to matching entry terminals
            if (currentPath.includes("admin")) {
                window.location.replace(`${fallbackBase}/admin-login.html`);
            } else {
                window.location.replace(`${fallbackBase}/portal-login.html`);
            }
        }
    }
})();

// ==========================================================================
// 🛡️ GLOBAL AUTH STATE TELEMETRY HOOK (TRACKS ALL ADMINS & CLIENTS)
// ==========================================================================
(function bindGlobalAuthStateTracking() {
    const trackingLoop = setInterval(() => {
        const client = window.supabaseClient || window.supabase;
        if (client && client.auth && typeof client.auth.onAuthStateChange === 'function') {
            clearInterval(trackingLoop);

            // Listen live for sign-in and sign-out events across the entire site instance
            client.auth.onAuthStateChange(async (event, session) => {
                if (!session || !session.user) return;

                const userEmail = session.user.email;
                const currentPath = window.location.pathname.toLowerCase();
                
                // Identify the user's role context based on the application path structure rules
                const resolvedRole = (currentPath.includes("admin-") || currentPath.includes("/admin")) 
                    ? "ADMIN STAFF" 
                    : "PORTAL CLIENT";

                // Prevent tracking loops by avoiding logs generated by the system logs page viewing actions
                if (currentPath.includes("admin-system-logs")) return;

                // 🟢 CASE A: USER SIGNED IN SUCCESSFULLY
                if (event === 'SIGNED_IN') {
                    // Check local storage to prevent duplicate logs on simple page refreshes
                    const cacheKey = `logged_in_${userEmail}_${session.id}`;
                    if (sessionStorage.getItem(cacheKey)) return;
                    sessionStorage.setItem(cacheKey, "true");

                    await client.from('platform_security_telemetry_logs').insert({
                        action_type: 'LOGIN',
                        actor_email: userEmail,
                        account_role: resolvedRole,
                        message_details: `Successfully authenticated session via ${resolvedRole.toLowerCase()} panel.`
                    });
                    console.log(`📡 Logged LOGIN state event for: ${userEmail}`);
                }

                // 🔴 CASE B: USER SIGNED OUT CLEANLY
                if (event === 'SIGNED_OUT') {
                    await client.from('platform_security_telemetry_logs').insert({
                        action_type: 'LOGOUT',
                        actor_email: userEmail,
                        account_role: resolvedRole,
                        message_details: `Explicit session termination requested from ${resolvedRole.toLowerCase()} terminal.`
                    });
                    console.log(`📡 Logged LOGOUT state event for: ${userEmail}`);
                }
            });
        }
    }, 200);
})();
