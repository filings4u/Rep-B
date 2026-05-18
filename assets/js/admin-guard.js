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

    try {
        await client.auth.initialize();
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session || !session.user) {
            window.location.href = 'admin-login.html';
            return;
        }

        const staffEmail = session.user.email.toLowerCase();
        
        // 🎯 SECURITY CHECK BARRIER: Throw out non-corporate users and prompt the login popup modal
        if (!staffEmail.endsWith('@filings4u.com')) {
            console.warn("Security Barrier Activated: Unauthorized account domain profile detected.");
            await client.auth.signOut();
            window.location.href = 'portal-login.html?auth=denied';
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
                resetInactivityTrackingClock(); // Fully extend and wipe warning state
            });
        }

        // ==========================================================================
        // DUAL-STAGE AUTOMATIC INACTIVITY LOGOUT ENGINE
        // ==========================================================================
        let warningTimeoutTimer;
        let finalLogoutTimer;

        const WARNING_LIMIT_MS = 13 * 60 * 1000; // Trigger alert at 13 minutes
        const FINAL_LIMIT_MS = 2 * 60 * 1000;    // Terminate 2 minutes later (15 mins total)

        async function terminateInactiveAdminSession() {
            overlay.classList.remove('active');
            clearTimeout(warningTimeoutTimer);
            clearTimeout(finalLogoutTimer);
            await client.auth.signOut();
            window.location.href = 'https://filings4u.com';
        }

        function triggerWarningPopup() {
            overlay.classList.add('active'); // Pop open in the middle of screen
            finalLogoutTimer = setTimeout(terminateInactiveAdminSession, FINAL_LIMIT_MS);
        }

        function resetInactivityTrackingClock() {
            clearTimeout(warningTimeoutTimer);
            clearTimeout(finalLogoutTimer);
            
            // Do not listen to user events or clear tracking if the popup window is showing
            if (!overlay.classList.contains('active')) {
                warningTimeoutTimer = setTimeout(triggerWarningPopup, WARNING_LIMIT_MS);
            }
        }

        // Standard user lifecycle interaction events
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, resetInactivityTrackingClock, { passive: true });
        });

        // Initialize clock parameters immediately upon page injection
        resetInactivityTrackingClock();

    } catch (err) {
        console.error("Guard Script Exception caught:", err.message);
        window.location.href = 'admin-login.html';
    }
})();
