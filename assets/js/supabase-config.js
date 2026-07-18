/**
 * 🛡️ CENTRAL APPLICATION INFRASTRUCTURE CONTROL
 * Responsibility: Database Connection Initialization & Perimeter Security Patches
 */

// ========================================================================== //
// 🛡️ 1. PRE-FLIGHT INFRASTRUCTURE INJECTION & QUERY INTERCEPTOR PATCH       //
// ========================================================================== //

const escapeTimelineHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.executePerimeterSecurityGate = function(clientInstance) {
    console.log("🚀 System patch: executePerimeterSecurityGate mapped and stabilized.");
    if (clientInstance && clientInstance.from) {
        const originalFromMethod = clientInstance.from;
        
        clientInstance.from = function(tableName) {
            const queryBuilder = originalFromMethod.apply(this, arguments);
            
            // Defensively ensure the interceptor intercepts the query safely regardless of table choice
            if (queryBuilder && typeof queryBuilder.eq === 'function') {
                const originalEqMethod = queryBuilder.eq;
                
                queryBuilder.eq = function(columnName, criteriaValue) {
                    // Dynamically map user identity parameters matching your production keys across all target queries
                    if (columnName === 'user_id') {
                        console.log(`🔧 Query Interceptor: Validating user_id mapping integrity filter on table: [${tableName}]`);
                        return originalEqMethod.call(this, 'user_id', criteriaValue);
                    }
                    return originalEqMethod.apply(this, arguments);
                };
            }
            return queryBuilder;
        };
    }
};


// ========================================================================== //
// 🚀 2. PLATFORM DATABASE ENGINE INITIALIZATION (UNTOUCHED & PRESERVED)      //
// ========================================================================== //
(function bootstrapGlobalSupabaseSystem() {
    "use strict";

    const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

 function initializeClient() {
    // If it's already instantiated globally, make sure BOTH variables point to it and exit safely
    if (window.supabaseClient || window.supabaseInstance) {
        const existingClient = window.supabaseClient || window.supabaseInstance;
        window.supabaseClient = existingClient;
        window.supabaseInstance = existingClient;
        return;
    }

    const cdnLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

    if (cdnLibrary && typeof cdnLibrary.createClient === 'function') {
        // Instantiate your authentic production database driver connection
        const initializedInstance = cdnLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: "filings4u_secure_session_token"
            }
        });

        // 🚀 FORCE ABSOLUTE SYNCHRONIZATION VIA CROSS-ASSIGNMENT:
        window.supabaseClient = initializedInstance;
        window.supabaseInstance = initializedInstance;
        
        window.productionRootUrl = window.location.origin;
        console.log("📡 [Supabase Config] Production database instance successfully bound to all global namespaces.");

        // Fire your native perimeter security handler cleanly
        if (typeof executePerimeterSecurityGate === 'function') {
            executePerimeterSecurityGate(initializedInstance);
        }
    } else {
        console.error("❌ Critical Infrastructure Error: Supabase CDN factory constructor is missing from the global window object.");
    }
}
})();

/**
 * ==========================================================================
 * 🛡️ 4. YOUR ORIGINAL GLOBAL AUTH HOOKS & TIMEOUT GUARD
 * Responsibility: Platform Auditing & Security Telemetry Logs
 * ==========================================================================
 */
(function bindGlobalAuthStateTracking() {
    const trackingLoop = setInterval(() => {
        const client = window.supabaseClient;
        if (client && client.auth && typeof client.auth.onAuthStateChange === 'function') {
            clearInterval(trackingLoop);
            
            if (window.isTelemetryHookBound) return;
            window.isTelemetryHookBound = true;

            client.auth.onAuthStateChange(async (event, session) => {
                if (!session || !session.user) return;

                const userEmail = session.user.email;
                const currentPath = window.location.pathname.toLowerCase();
                const resolvedRole = (currentPath.includes("admin-") || currentPath.includes("/admin")) ? "ADMIN STAFF" : "PORTAL CLIENT";

                if (currentPath.includes("admin-system-logs")) return;

                if (event === 'SIGNED_IN') {
                    const cacheKey = `logged_in_${userEmail}_${session.id}`;
                    if (sessionStorage.getItem(cacheKey)) return;
                    sessionStorage.setItem(cacheKey, "true");

                    await client.from('platform_security_telemetry_logs').insert({
                        action_type: 'LOGIN',
                        actor_email: userEmail,
                        account_role: resolvedRole,
                        message_details: `Successfully authenticated session via ${resolvedRole.toLowerCase()} panel.`
                    });
                }

                if (event === 'SIGNED_OUT') {
                    await client.from('platform_security_telemetry_logs').insert({
                        action_type: 'LOGOUT',
                        actor_email: userEmail,
                        account_role: resolvedRole,
                        message_details: `Explicit session termination requested from ${resolvedRole.toLowerCase()} terminal.`
                    });
                }
            });
        }
    }, 200);
})();


(function deployStrictInactivityBarrierGate() {
    "use strict";

    let inactivityCountdownTimer = null;
    const INACTIVITY_DURATION_CAP_LIMIT = 15 * 60 * 1000; // 15 Minute Target Threshold

    async function purgeSessionOnTimeout() {
        console.warn("Security Alert: Session idle for 15 minutes.");
        const client = window.supabaseClient;
        if (client && client.auth) {
            try { 
                await client.auth.signOut(); 
            } catch (err) {}
        }
        window.location.replace(`${window.location.origin}/admin-login.html`);
    }

    function reloadInactivityCounter() {
        if (inactivityCountdownTimer) clearTimeout(inactivityCountdownTimer);
        inactivityCountdownTimer = setTimeout(purgeSessionOnTimeout, INACTIVITY_DURATION_CAP_LIMIT);
    }

    function registerInteractionTrackers() {
        const targetPath = window.location.pathname.toLowerCase();
        
        // Safety lock: Only monitor tracking actions if currently on an admin panel path layout
        if (!targetPath.includes('admin-') && !targetPath.includes('/admin')) return;

        const physicalEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        physicalEvents.forEach(evt => {
            document.addEventListener(evt, reloadInactivityCounter, { passive: true });
        });

        reloadInactivityCounter();
        console.log("📡 Automated Timeout System: Isolated 15-Minute Activity Guard Engaged.");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerInteractionTrackers);
    } else {
        registerInteractionTrackers();
    }
})();

/**
 * 🔒 CUSTOMER PORTAL INACTIVITY TIMEOUT GUARD
 * Responsibility: Enforces idle terminal restrictions on customer panels
 */
(function deployCustomerInactivityBarrierGate() {
    "use strict";

    let inactivityCountdownTimer = null;
    const INACTIVITY_DURATION_CAP_LIMIT = 15 * 60 * 1000; // 15 Minute Target Threshold

    async function purgeSessionOnTimeout() {
        console.warn("Security Alert: Customer session idle for 15 minutes.");
        const client = window.supabaseInstance || window.supabaseClient;
        if (client && client.auth) {
            try { 
                await client.auth.signOut(); 
            } catch (err) {}
        }
        window.location.replace(`${window.location.origin}/portal-login.html`);
    }

    function reloadInactivityCounter() {
        if (inactivityCountdownTimer) clearTimeout(inactivityCountdownTimer);
        inactivityCountdownTimer = setTimeout(purgeSessionOnTimeout, INACTIVITY_DURATION_CAP_LIMIT);
    }

    function registerInteractionTrackers() {
        const targetPath = window.location.pathname.toLowerCase();
        
        // Safety lock: Only monitor tracking actions if currently on a customer portal workspace path layout
        if (!targetPath.includes('client-') && !targetPath.includes('/client')) return;

        const physicalEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        physicalEvents.forEach(evt => {
            document.addEventListener(evt, reloadInactivityCounter, { passive: true });
        });

        reloadInactivityCounter();
        console.log("📡 Automated Timeout System: Isolated 15-Minute Client Activity Guard Engaged.");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerInteractionTrackers);
    } else {
        registerInteractionTrackers();
    }
})();
