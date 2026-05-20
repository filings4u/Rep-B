/**
 * 🚀 filings4u Global Production Infrastructure Config & Secure Perimeter Gate
 * Standardized single-source architecture for auth validation and connection syncing
 */
async function initializeGlobalSupabase() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    function checkLibraryState() {
        return new Promise((resolve) => {
            if (window.supabase) return resolve(window.supabase);
            const scriptWatcher = setInterval(() => {
                if (window.supabase) {
                    clearInterval(scriptWatcher);
                    resolve(window.supabase);
                }
            }, 10);
        });
    }

    try {
        const supabaseLib = await checkLibraryState();
        
        // Build the active client window property cleanly
        window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: "filings4u_secure_session_token"
            }
        });

        // Set global scope URL helpers for fallback actions
        window.productionRootUrl = window.location.origin;
        console.log("⚡ Production client initialized safely with storage protection keys.");

        // Execute unified security routines safely inside the synchronous block chain
        await executePerimeterSecurityGate(window.supabaseClient);

    } catch (e) {
        console.error("Supabase config setup failure:", e);
    }
}

// Central Interception Security Matrix
async function executePerimeterSecurityGate(client) {
    const currentPath = window.location.pathname.toLowerCase();
    const fallbackBase = window.location.origin;

    // 1. Define Public Access Exemptions (Pages that MUST never lock)
    const publicPages = [
        "/portal-login.html",
        "/admin-login.html",
        "/forgot-password.html",
        "/update-password.html"
    ];

    const isPublic = publicPages.some(page => currentPath.endsWith(page)) || currentPath === "/" || currentPath === "";
    if (isPublic) return;

    // 2. Hide page layout processing instantly to prevent data flickering
    const rootElement = document.documentElement;
    rootElement.style.visibility = "hidden";

    try {
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session || !session.user) {
            throw new Error("Missing active profile credential tokens.");
        }

        const email = session.user.email.toLowerCase().trim();
        const isCorporate = email.endsWith("@filings4u.com") || email === "test-admin@filings4u.com";

        // 3. Admin Area Routing Protection
        if (currentPath.includes("admin-") || currentPath.includes("/admin")) {
            if (!isCorporate) {
                console.warn(`Security Breach: Client profile ${email} rejected from admin space.`);
                window.location.replace(`${fallbackBase}/portal-login.html`);
                return;
            }
        }

        // Token verified: Reveal layout instantly
        rootElement.style.visibility = "visible";

    } catch (gateError) {
        console.warn("Perimeter Guard Redirect Action:", gateError.message);
        
        // Clean up corrupt session memory rows safely
        try { await client.auth.signOut(); } catch (_) {}

        // 4. Intelligently route back to matching entry terminals
        if (currentPath.includes("admin")) {
            window.location.replace(`${fallbackBase}/admin-login.html`);
        } else {
            window.location.replace(`${fallbackBase}/portal-login.html`);
        }
    }
}

// Auto-trigger clean sequence instantiation
if (!window.supabaseClient) {
    initializeGlobalSupabase();
}
