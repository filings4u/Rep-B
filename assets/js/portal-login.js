// assets/js/portal-login.js 

// 🎯 ACCELERATION TRICK: Check local storage tokens instantly before making remote database calls
const fastTokenCheck = localStorage.getItem("filings4u_secure_session_token");
if (!fastTokenCheck) {
    console.log("No token present, rendering login inputs instantly.");
}

async function startCustomerLoginEngine() {
    "use strict";

    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 10);
        });
    }

    const client = await waitForSupabaseClientEngine();

    // Elements mapped directly to your portal-login.html layout IDs
    const passwordToggleBtn = document.getElementById('passwordToggleBtn');

    async function evaluateCustomerRoute(userEmail) {
        const cleanedEmail = userEmail.toLowerCase().trim();
        const fallbackUrl = window.productionRootUrl || window.location.origin;

        // Intercept staff members who accidentally use the customer portal
        const isCorporateStaff = cleanedEmail.endsWith('@filings4u.com') || (cleanedEmail === 'test-admin@filings4u.com');
        if (isCorporateStaff) {
            console.warn("Administrative profile detected inside customer landing path. Rerouting...");
            window.location.assign(`${fallbackUrl}/admin-dashboard.html`);
            return;
        }

        // Standard user profiles pass directly to the customer dashboard layout
        window.location.assign(`${fallbackUrl}/client-dashboard.html`);
    }

    // Interactive Password Masking Toggle Logic
    if (passwordToggleBtn) {
        passwordToggleBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                passwordToggleBtn.innerText = isPassword ? '🙈' : '👁️';
            }
        });
    }

    try {
        // Auto-redirect if a valid customer session token already exists
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
            await evaluateCustomerRoute(session.user.email);
            return;
        }
    } catch (err) {
        console.error("Portal System Error:", err.message);
    }
}

// Ensure DOM structure completes loading safely before running configurations
document.addEventListener("DOMContentLoaded", () => {
    startCustomerLoginEngine();
});


// Ensure DOM structure completes loading safely before attaching events
document.addEventListener("DOMContentLoaded", async () => {
    // Timeout safeguard for external configuration script definitions
    if (typeof initializeGlobalSupabase === "function") {
        try {
            await initializeGlobalSupabase();
        } catch (configError) {
            console.error("Supabase config execution error:", configError.message);
        }
    }
    startCustomerLoginEngine();
});
