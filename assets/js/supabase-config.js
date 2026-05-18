// assets/js/supabase-config.js
(function initializeGlobalSupabase() {
    "use strict";

    // ⚡ PRODUCTION CONTEXT MATRIX
    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (!window.supabase) {
        console.error("Supabase CDN library must be loaded before initializing the config file.");
        return;
    }

    // Initialize globally shared clients
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 🌐 PRODUCTION ABSOLUTE URL ROOT ANCHOR
    // This stops host-level URL truncation loops completely
    window.productionRootUrl = window.location.origin;

    console.log("⚡ Administrative security layer centralized safely for production mapping.");
})();

