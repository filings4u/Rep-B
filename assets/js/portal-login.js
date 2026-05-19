// assets/js/portal-login.js
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
    const portalLoginForm = document.getElementById('portalLoginForm'); // Verify this matches your HTML form ID
    const loginSubmitBtn = document.getElementById('loginBtn');
    const passError = document.getElementById('password-error');

    async function evaluateCustomerRoute(userEmail) {
        const cleanedEmail = userEmail.toLowerCase().trim();
        
        // 1. Identify staff accounts trying to access the customer area
        const isCorporateStaff = cleanedEmail.endsWith('@filings4u.com') || (cleanedEmail === 'test-admin@filings4u.com');

        if (isCorporateStaff) {
            console.warn("Administrative profile detected inside customer landing path. Rerouting...");
            window.location.assign(`${window.productionRootUrl}/admin-dashboard.html`);
            return;
        }

        // 2. Standard customer accounts proceed directly to their dashboard layout
        window.location.assign(`${window.productionRootUrl}/portal-dashboard.html`);
    }

    try {
        const { data: { session } } = await client.auth.getSession();
        
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

                emailInput.classList.remove('field-error');
                passwordInput.classList.remove('field-error');
                if (passError) passError.innerText = "";

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;
                let hasFormErrors = false;

                if (!email) { emailInput.classList.add('field-error'); hasFormErrors = true; }
                if (!password) { passwordInput.classList.add('field-error'); hasFormErrors = true; }

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
                    alert(`AUTHENTICATION ERROR:\n${err.message}`);
                    
                    emailInput.classList.add('field-error');
                    passwordInput.classList.add('field-error');
                    if (passError) passError.innerText = `Login Failed: ${err.message}`;
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerText = "Secure Login →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }
    } catch (err) {
        console.error("Portal System Error:", err.message);
    }
}

// Automatically mount engine to the DOM framework
document.addEventListener("DOMContentLoaded", () => {
    startCustomerLoginEngine();
});
