// assets/js/supabase-config.js
(async function initializeGlobalSupabase() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    // 🛠️ FIX: Wait for Cloudflare to finish loading the Supabase CDN script
    function waitForSupabaseLibrary() {
        return new Promise((resolve) => {
            if (window.supabase) return resolve(window.supabase);
            const checkInterval = setInterval(() => {
                if (window.supabase) {
                    clearInterval(checkInterval);
                    resolve(window.supabase);
                }
            }, 10); // Check every 10ms
        });
    }

    const supabaseLib = await waitForSupabaseLibrary();

    // 🎯 HARDENED PRODUCTION AUTH CONFIGURATION
    window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "filings4u_secure_session_token"
        }
    });

    // Explicitly set the absolute root environment url
    window.productionRootUrl = window.location.origin;
    
    console.log("⚡ Production client initialized safely with storage protection keys.");
})();
