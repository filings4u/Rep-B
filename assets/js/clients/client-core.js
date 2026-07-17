// 🛡️ GLOBAL SECURITY FLAG: Tells portal-engine.js that this dashboard requires a login session
window.isProtectedPage = true; 

/**
 * 🔐 CLIENT PORTAL CORE INITIALIZATION ENGINE
 * Orchestrates Supabase connectivity, global state initialization, 
 * and handles database event dispatch handshakes.
 */
(async function () {
    "use strict";

    // 1. CONFIGURATION
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; // Double-check this matches your real project
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"; 

    try {
        if (typeof window.supabase === 'undefined') {
            console.error("❌ Supabase CDN dependency missing. Please load the supabase-js library script in your HTML.");
            return;
        }

        // Instantiate global connection instance used by your dashboard files
        window.supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("⚡ Supabase core transport pipeline successfully established.");

        // 2. CHECK AUTHENTIC SESSION TRACKING
        // Retrieve current active user session data strictly from secure local browser storage
        const { data: { session }, error: sessionError } = await window.supabaseInstance.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
            console.warn("⚠️ No active user session detected. Redirecting to login portal context...");
            // If a random user tries to open this page directly without logging in, send them back to login page:
            window.location.href = "portal.filings4u.com/get-started.html"; 
            return;
        }

        // 3. RUN ENGINE READY HANDSHAKE
        console.log("🚀 Real active user session detected! User identity:", session.user.email);
        const handshakeEvent = new CustomEvent("supabaseEngineReady", {
            detail: { session: session }
        });
        window.dispatchEvent(handshakeEvent);

    } catch (coreInitException) {
        console.error("💥 Core Infrastructure Exception on initialization:", coreInitException);
    }
})();
