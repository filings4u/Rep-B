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

    // ROLE-BASED AUTHENTICATION GATE
    async function verifyAdminRoleClearance(userId) {
        try {
            // Query the profiles table to ensure this user has the real 'admin' role token
            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) throw new Error(`Database check failed: ${profileError.message}`);
            
            if (!profile) {
                throw new Error("Your user row is missing inside the public 'profiles' table. Run the SQL fix script.");
            }

            if (profile.role !== 'admin') {
                throw new Error("Access Denied: Your profile role is listed as a customer, not an administrator.");
            }

            // Success: Clean passage straight to dashboard
            console.log("Access authorization confirmed.");
            window.location.replace('admin-dashboard.html');

        } catch (routeErr) {
            console.error("Critical admin barrier breach:", routeErr.message);
            
            // Halt the flashing/blinking loop and display the technical error to the staff member
            if (passError) {
                passError.innerText = `Authorization Denied: ${routeErr.message}`;
            } else {
                alert(`Authorization Denied: ${routeErr.message}`);
            }

            if (loginSubmitBtn) {
                loginSubmitBtn.innerText = "Verify Terminal Session →";
                loginSubmitBtn.disabled = false;
            }

            // Wipe token and stay on the login screen instead of blindly bouncing
            await client.auth.signOut();
        }
    }

    try {
        await client.auth.initialize();

        // AUTO-REDIRECT GATE: Route straight out if already fully authenticated
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && session.user.email.toLowerCase().endsWith('@filings4u.com')) {
            window.location.replace('admin-dashboard.html');
            return;
        }

        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                if (!emailInput || !passwordInput) return;

                // Reset validation states
                emailInput.classList.remove('field-error');
                passwordInput.classList.remove('field-error');
                if (passError) passError.innerText = "";

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;

                // Form validation pre-flight check
                let hasFormErrors = false;
                if (!email) { emailInput.classList.add('field-error'); hasFormErrors = true; }
                if (!password) { passwordInput.classList.add('field-error'); hasFormErrors = true; }
                
                if (!email.endsWith('@filings4u.com')) {
                    emailInput.classList.add('field-error');
                    if (passError) passError.innerText = "Entry is strictly reserved for verified @filings4u.com corporate email profiles.";
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

                    // Execute profile evaluation loop
                    await verifyAdminRoleClearance(result.data.user.id);

                } catch (err) {
                    console.warn("Auth exception caught:", err.message);
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
