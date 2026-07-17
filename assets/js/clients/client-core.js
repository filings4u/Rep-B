/**
 * 🔐 CLIENT PORTAL CORE INITIALIZATION ENGINE
 * Orchestrates Supabase connectivity, global state initialization, 
 * and handles database event dispatch handshakes.
 */
(async function () {
    "use strict";

    // 1. YOUR SUPABASE CREDENTIALS CONFIGURATION
    // Replace these placeholder strings with your actual project credentials from your Supabase Dashboard settings!
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    try {
        // 2. CHECK IF SUPABASE CDN LIBRARY IS LOADED
        // Ensure you have: <script src="https://jsdelivr.net"></script> in your HTML head!
        if (typeof window.supabase === 'undefined') {
            console.error("❌ Supabase CDN dependency missing. Please load the supabase-js library script in your HTML.");
            return;
        }

        // 3. INSTANTIATE GLOBAL CONNECTION INSTANCE
        // Your dashboard file explicitly relies on window.supabaseInstance to interact with your database tables
        window.supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("⚡ Supabase core transport pipeline successfully established.");

        // 4. RETRIEVE CURRENT USER SESSION DATA
        const { data: { session }, error: sessionError } = await window.supabaseInstance.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
            console.warn("⚠️ No active user session detected. Dashboard routing restricted to anonymous safety fallbacks.");
            // OPTIONAL LOCAL DEVELOPMENT HELPER: Uncomment the block below to simulate a fake user if you haven't implemented sign-in yet
            /*
            const simulatedSession = { user: { id: "00000000-0000-0000-0000-000000000000" } };
            dispatchEngineReadyHandshake(simulatedSession);
            */
            return;
        }

        // 5. RUN ENGINE READY HANDSHAKE
        dispatchEngineReadyHandshake(session);

    } catch (coreInitException) {
        console.error("💥 Core Infrastructure Exception on initialization:", coreInitException);
    }

    /**
     * Dispatches the authorization detail payload down to dashboard listening layout modules
     */
    function dispatchEngineReadyHandshake(validSession) {
        console.log("🚀 User context authenticated. Dispatching supabaseEngineReady handshake event wrapper...");
        
        const handshakeEvent = new CustomEvent("supabaseEngineReady", {
            detail: {
                session: validSession
            }
        });
        
        window.dispatchEvent(handshakeEvent);
    }
})();
