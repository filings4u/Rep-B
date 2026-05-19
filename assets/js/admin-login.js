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

    async function verifyAdminRoleClearance(userId) {
        try {
            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) throw new Error(`Database check failed: ${profileError.message}`);
            
            if (!profile) {
                throw new Error("Your user row is missing inside the public 'profiles' table database ledger.");
            }

            if (profile.role !== 'admin') {
                throw new Error("Access Denied: Non-administrative account parameter matrix.");
            }

            // Production Success: Force forward redirect via absolute path assignment
            window.location.assign(`${window.productionRootUrl}/admin-dashboard.html`);

        } catch (routeErr) {
            console.error("Critical admin barrier breach:", routeErr.message);
            
            // 🎯 PAUSES SCREEN: Keeps you on screen to read the database error description
            alert(`CRITICAL BARRIER RESET:\n${routeErr.message}`);

            if (passError) {
                passError.innerText = `Authorization Denied: ${routeErr.message}`;
            }
            if (loginSubmitBtn) {
                loginSubmitBtn.innerText = "Verify Terminal Session →";
                loginSubmitBtn.disabled = false;
            }
            await client.auth.signOut();
        }
    }

    try {
        // 🎯 FIXED: Removed client.auth.initialize() to stop the silent script crash loops
        const { data: { session } } = await client.auth.getSession();
        
        if (session && session.user && session.user.email.toLowerCase().endsWith('@filings4u.com')) {
            window.location.assign(`${window.productionRootUrl}/admin-dashboard.html`);
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
                
                if (!email.endsWith('@filings4u.com')) {
                    emailInput.classList.add('field-error');
                    if (passError) passError.innerText = "Entry is strictly reserved for verified @filings4u.com corporate domains.";
                    return;
                }

                if (hasFormErrors) return;

                if (loginSubmitBtn) {
                    loginSubmitBtn.innerText = "Authenticating Admin...";
                    loginSubmitBtn.disabled = true;
                }

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);

                    await verifyAdminRoleClearance(result.data.user.id);

                } catch (err) {
                    console.warn("Auth exception caught:", err.message);
                    
                    // 🎯 PAUSES SCREEN: Traps bad passwords or server connection blockers on submission
                    alert(`AUTHENTICATION RUNTIME BLOCKER:\n${err.message}`);

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
