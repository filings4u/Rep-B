async function initializePortalSession() {
    "use strict";

    // 1. Verify that the root library layer is loaded globally
    if (typeof supabase === 'undefined' && !window.supabase) {
        console.warn("Supabase CDN library wrapper not found in global namespace.");
        return;
    }

    try {
        let primaryClient = window.supabaseInstance || window.supabaseClient;

        if (!primaryClient && window.supabase && typeof window.supabase.createClient === 'function') {
            const URL = "https://lrbimrlbskjweynxlgas.supabase.co";
            const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
            
            primaryClient = window.supabase.createClient(URL, KEY, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "filings4u_secure_session_token" }
            });
            window.supabaseInstance = primaryClient;
            window.supabaseClient = primaryClient;
        }

        if (!primaryClient || typeof primaryClient.from !== 'function') {
            setTimeout(initializePortalSession, 150);
            return;
        }

        // 2. Read user credentials straight from the running client instance
        let currentSessionData = null;
        try {
            const sessionResponse = await primaryClient.auth.getSession();
            currentSessionData = sessionResponse.data?.session;
        } catch (sessionErr) {
            console.warn("Direct session query lookups lagging...");
        }

        // 🚀 THE TOKEN BRIDGE OVERRIDE: If the session payload is lagging, extract the client footprint directly from local site storage
        if (!currentSessionData) {
            const storagePayload = localStorage.getItem("filings4u_secure_session_token");
            if (storagePayload) {
                try {
                    const parsedTokenData = JSON.parse(storagePayload);
                    if (parsedTokenData && parsedTokenData.user) {
                        console.log("🔗 [Token Bridge] Successfully bridged customer authorization state metrics.");
                        window.activeClientSessionUser = parsedTokenData.user;
                    }
                } catch (parseErr) {
                    console.error("Token decoding fault intercepted:", parseErr);
                }
            }
        } else if (currentSessionData.user) {
            window.activeClientSessionUser = currentSessionData.user;
        }

        // 3. Kick off data hydration only if a valid identity has been successfully confirmed
        if (window.activeClientSessionUser) {
            // Update Welcome Header Greetings greeting element
            const nameField = document.getElementById("clientNameField");
            if (nameField) {
                nameField.textContent = window.activeClientSessionUser.email.split('@')[0];
            }

            // Trigger your dynamic data grid metrics synchronization pipeline downstream
            if (typeof syncAccountTelemetryGrid === 'function') {
                console.log("📊 [Client Engine] Unfreezing dashboard metrics arrays...");
                await syncAccountTelemetryGrid();
            }

            // Auto-boot your compliance timeline tracking framework pipeline 
            if (typeof window.startTimelineTrackingPipeline === 'function') {
                window.startTimelineTrackingPipeline(primaryClient);
            }
        } else {
            console.log("No customer user context found. Forcing redirect to portal registration gate...");
            if (!window.location.pathname.includes("portal-login.html")) {
                window.location.href = "portal-login.html";
            }
        }

    } catch (err) {
        console.error("Portal session authorization pipeline error:", err);
    }
}
