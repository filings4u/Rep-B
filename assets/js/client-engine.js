async function initializePortalSession() {
    // 1. Verify that the root library layer is loaded globally
    if (typeof supabase === 'undefined' && !window.supabase) {
        console.warn("Supabase CDN library wrapper not found in global namespace.");
        return;
    }

    try {
        // Look for any existing globally configured database connections
        let primaryClient = window.supabaseInstance || window.supabaseClient;

        // 🚀 THE RESILIENT BYPASS: If lagging or missing, force an immediate inline connection factory build
        if (!primaryClient || typeof primaryClient.from !== 'function') {
            const currentLibrary = window.supabase || supabase;
            
            if (currentLibrary && typeof currentLibrary.createClient === 'function') {
                console.log("🔧 [Client Engine] Config client lagging. Bootstrapping isolated fail-safe connection channel...");
                
                const targetUrl = "https://lrbimrlbskjweynxlgas.supabase.co";
                const targetKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
                
                primaryClient = currentLibrary.createClient(targetUrl, targetKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                        storageKey: "filings4u_secure_session_token"
                    }
                });

                // Hydrate the global context properties immediately to unlock sister dashboard scripts
                window.supabaseInstance = primaryClient;
                window.supabaseClient = primaryClient;
                
                // Inject your original pre-flight security patch manually if it is available
                if (typeof window.executePerimeterSecurityGate === 'function') {
                    window.executePerimeterSecurityGate(primaryClient);
                }
            }
        }

        // If the database library completely failed to answer, fall back to standard polling loop
        if (!primaryClient || typeof primaryClient.from !== 'function') {
            console.log("[Portal Session] Waiting for global supabase-config.js client setup...");
            setTimeout(initializePortalSession, 150);
            return;
        }

        // 2. Read user credentials straight from your running client instance
        const { data: { session }, error } = await primaryClient.auth.getSession();

        if (error || !session) {
            console.log("No active user session verified. Forcing redirect to login gate...");
            if (!window.location.pathname.includes("portal-login.html")) {
                window.location.href = "portal-login.html";
            }
            return;
        }

        // 3. Populate global session matrix targets
        window.activeClientSessionUser = session.user;

        const nameField = document.getElementById("clientNameField");
        if (nameField) nameField.textContent = window.activeClientSessionUser.email;

        // Auto-boot up your dynamic timeline framework pipeline if loaded elsewhere in your layout
        if (typeof window.startTimelineTrackingPipeline === 'function') {
            window.startTimelineTrackingPipeline(primaryClient);
        }

        // Trigger your telemetry grid synchronization pipeline down-stream
        if (typeof syncAccountTelemetryGrid === 'function') {
            await syncAccountTelemetryGrid();
        }

    } catch (err) {
        console.error("Portal session authorization pipeline error:", err);
    }
}
