// assets/js/admin-login.js
(async function handleAdminLoginFlow() {
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
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginSubmitBtn = document.getElementById('loginBtn');
    const passError = document.getElementById('password-error');

    async function evaluateAdminRoute(userEmail) {
        const cleanedEmail = userEmail.toLowerCase().trim();
        
        // Define which emails are explicitly authorized as administrative profiles
        const isExplicitAdmin = (cleanedEmail === 'test-admin@filings4u.com');
        const isCorporateDomainAdmin = cleanedEmail.endsWith('@filings4u.com') && cleanedEmail !== 'filings@filings4u.com';

        if (isExplicitAdmin || isCorporateDomainAdmin) {
            window.location.assign(`${window.productionRootUrl}/admin-dashboard.html`);
        } else {
            console.error("Access Denied: Customer profile attempting admin panel entry.");
            alert("ACCESS DENIED:\nThis console is strictly reserved for corporate system administrators.");
            
            if (passError) {
                passError.innerText = "Authorization Denied: This account does not possess admin clearance.";
            }
            if (loginSubmitBtn) {
                loginSubmitBtn.innerText = "Verify Terminal Session →";
                loginSubmitBtn.disabled = false;
            }
            // Wipe token out of local memory to clear out Cloudflare loop hooks
            await client.auth.signOut();
        }
    }

    try {
        const { data: { session } } = await client.auth.getSession();
        
        if (session && session.user) {
            await evaluateAdminRoute(session.user.email);
            return;
        }

        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
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
                    loginSubmitBtn.innerText = "Authenticating Admin...";
                    loginSubmitBtn.disabled = true;
                }

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);
                    
                    await evaluateAdminRoute(result.data.user.email);
                } catch (err) {
                    console.warn("Auth exception caught:", err.message);
                    alert(`AUTHENTICATION ERROR:\n${err.message}`);
                    
                    emailInput.classList.add('field-error');
                    passwordInput.classList.add('field-error');
                    if (passError) passError.innerText = `Authorization Failed: ${err.message}`;
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerText = "Verify Terminal Session →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }
    } catch (err) {
        console.error("Login System Error:", err.message);
    }
})();
