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
    const portalLoginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginBtn');
    const globalErrorMessage = document.getElementById('errorMessage');
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
        window.location.assign(`${fallbackUrl}/portal-dashboard.html`);
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
        const { data: { session } } = await client.auth.getSession();
        
        // Auto-redirect if a valid customer session token already exists
        if (session && session.user) {
            await evaluateCustomerRoute(session.user.email);
            return;
        }

        if (portalLoginForm) {
            portalLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                
                if (!emailInput || !passwordInput) return;

                // Clear previous validation styles
                emailInput.classList.remove('field-error');
                passwordInput.classList.remove('field-error');
                if (globalErrorMessage) globalErrorMessage.innerText = "";

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;
                let hasFormErrors = false;

                if (!email) {
                    emailInput.classList.add('field-error');
                    hasFormErrors = true;
                }
                if (!password) {
                    passwordInput.classList.add('field-error');
                    hasFormErrors = true;
                }
                if (hasFormErrors) return;

                if (loginSubmitBtn) {
                    loginSubmitBtn.innerText = "Securing Connection...";
                    loginSubmitBtn.disabled = true;
                }

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);
                    
                    await evaluateCustomerRoute(result.data.user.email);
                } catch (err) {
                    console.warn("Auth exception caught:", err.message);
                    
                    emailInput.classList.add('field-error');
                    passwordInput.classList.add('field-error');
                    
                    if (globalErrorMessage) {
                        globalErrorMessage.innerText = `Login Failed: ${err.message}`;
                    }
                    
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerText = "Enter Secure Portal →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }
    } catch (err) {
        console.error("Portal System Error:", err.message);
    }
}

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
