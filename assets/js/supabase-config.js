// assets/js/supabase-config.js
(function initializeGlobalSupabase() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (!window.supabase) return;

    // 🎯 HARDENED PRODUCTION AUTH CONFIGURATION
    // Forces the token matrix to load into a local storage channel with a persistent window name
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "filings4u_secure_session_token"
        }
    });
    
    window.productionRootUrl = window.location.origin;
    console.log("⚡ Production client initialized safely with storage protection keys.");
})();
