// assets/js/admin-login.js
async function startAdminLoginEngine() {
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
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginSubmitBtn = document.getElementById('loginBtn');
    const passError = document.getElementById('password-error');

    async function evaluateAdminRoute(userEmail) {
        const cleanedEmail = userEmail.toLowerCase().trim();
        
        // 🎯 SCALABLE RULE: test-admin OR any standard corporate domain account holds admin rank
        const isTestAdmin = (cleanedEmail === 'test-admin@filings4u.com');
        const isCorporateStaff = cleanedEmail.endsWith('@filings4u.com');

        if (isTestAdmin || isCorporateStaff) {
            window.location.assign(`${window.productionRootUrl}/admin-dashboard.html`);
        } else {
            console.error("Access Denied: Standard profile attempting admin panel entry.");
            alert("ACCESS DENIED:\nThis terminal is strictly reserved for authorized filings4u corporate staff.");
            
            if (passError) {
                passError.innerText = "Authorization Denied: This profile lacks admin clearance.";
            }
            if (loginSubmitBtn) {
                loginSubmitBtn.innerText = "Verify Terminal Session →";
                loginSubmitBtn.disabled = false;
            }
            // Wipe token instantly to clear Cloudflare caching traps
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
}
