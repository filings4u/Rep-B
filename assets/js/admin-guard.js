// assets/js/admin-guard.js
(async function enforceStrictAdminProtection() {
    "use strict";

    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 30);
        });
    }

    const client = await waitForSupabaseClientEngine();

    // 🎯 CRITICAL PROTECTION CRASH GATE BYPASS
    // If the browser is currently resting on the login page layout, halt execution 
    // to prevent the session script from auto-refreshing its own form window!
    const isCurrentLoginPage = window.location.pathname.endsWith('admin-login.html');
    if (isCurrentLoginPage) {
        console.log("Guard initialized on login panel. Redirect loops bypassed successfully.");
        return;
    }

    try {
        // Fetch active session parameters directly from verified cache layers
        // (Removed the non-existent client.auth.initialize() crashing function)
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session || !session.user) {
            console.warn("Session context missing. Routing back to terminal gateway.");
            window.location.assign(`${window.productionRootUrl}/admin-login.html`);
            return;
        }

        const staffEmail = session.user.email.toLowerCase();
        
        if (!staffEmail.endsWith('@filings4u.com')) {
            console.warn("Security Barrier Activated: Unauthorized account domain profile detected.");
            await client.auth.signOut();
            window.location.assign(`${window.productionRootUrl}/portal-login.html?auth=denied`);
            return;
        }

        // ==========================================================================
        // DYNAMIC DOM WARNING MODAL GENERATION INFRASTRUCTURE
        // ==========================================================================
        const overlay = document.createElement('div');
        overlay.className = 'session-modal-overlay';
        overlay.innerHTML = `
            <div class="session-warning-box">
                <h3>⚠️ Terminal Inactivity Warning</h3>
                <p>Your administrative security token is expiring soon due to zero workflow movement. Would you like to extend this session?</p>
                <button class="session-btn-extend" id="extendSessionBtn">Extend Authorization Token</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const extendBtn = document.getElementById('extendSessionBtn');
        if (extendBtn) {
            extendBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                resetInactivityTrackingClock();
            });
        }

        // ==========================================================================
        // DUAL-STAGE AUTOMATIC INACTIVITY LOGOUT ENGINE
        // ==========================================================================
        let warningTimeoutTimer;
        let finalLogoutTimer;

        const WARNING_LIMIT_MS = 13 * 60 * 1000; 
        const FINAL_LIMIT_MS = 2 * 60 * 1000;    

        async function terminateInactiveAdminSession() {
            overlay.classList.remove('active');
            clearTimeout(warningTimeoutTimer);
            clearTimeout(finalLogoutTimer);
            await client.auth.signOut();
            window.location.assign('https://filings4u.com');
        }

        function triggerWarningPopup() {
            overlay.classList.add('active');
            finalLogoutTimer = setTimeout(terminateInactiveAdminSession, FINAL_LIMIT_MS);
        }

        function resetInactivityTrackingClock() {
            clearTimeout(warningTimeoutTimer);
            clearTimeout(finalLogoutTimer);
            if (!overlay.classList.contains('active')) {
                warningTimeoutTimer = setTimeout(triggerWarningPopup, WARNING_LIMIT_MS);
            }
        }

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, resetInactivityTrackingClock, { passive: true });
        });

        resetInactivityTrackingClock();

    } catch (err) {
        console.error("Guard Script Exception caught:", err.message);
        window.location.assign(`${window.productionRootUrl}/admin-login.html`);
    }
})();
