// assets/js/supabase-config.js
(function initializeGlobalSupabase() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

    if (!window.supabase) {
        console.error("Supabase CDN library must be loaded before initializing the config file.");
        return;
    }

    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Administrative security layer centralized safely.");

        // ==========================================================================
    // GLOBAL FAVICON INJECTION ENGINE
    // ==========================================================================
    (function injectGlobalFavicon() {
        // Prevent duplicate favicon injections if one is already hardcoded in the HTML
        if (document.querySelector("link[rel*='icon']")) return;

        const faviconLinkElement = document.createElement('link');
        faviconLinkElement.type = 'image/png';
        faviconLinkElement.rel = 'icon';
        
        // Using a relative path from the root directory
        faviconLinkElement.href = 'images/fav.png';
        
        document.head.appendChild(faviconLinkElement);
        console.log("🎯 Favicon asset node mounted globally.");
    })();

})();
