// assets/js/portal-login.js
(async function handleClientLoginFlow() {
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

    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginBtn');
    const passError = document.getElementById('password-error');
    const loginCard = document.querySelector('.login-card');

    // ROLE-BASED INTELLIGENT ROUTING ENGINE WITH VISUAL ERROR TRAPPING
    async function handleUserRouting(userId) {
        try {
            // Fetch profile metrics to confirm system clearance levels
            const { data: profile, error: profileFetchError } = await client
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            // 🚨 PROFILE RECORD MISSING EXCEPTION
            if (profileFetchError) {
                throw new Error(`Profile sync dropped: ${profileFetchError.message}`);
            }
            
            if (!profile) {
                throw new Error("Authentication successful, but your user profile record does not exist inside the public 'profiles' table database ledger yet.");
            }

            // Route safely based on verified table role fields
            if (profile.role === 'admin') {
                window.location.replace('admin-dashboard.html');
                return;
            }

            const currentParams = new URLSearchParams(window.location.search);
            const savedRedirectDestination = currentParams.get('redirect');
            const targetService = currentParams.get('service');
            const targetPlan = currentParams.get('plan') || 'compliance';

            if (savedRedirectDestination) {
                window.location.replace(decodeURIComponent(savedRedirectDestination));
            } else if (targetService) {
                window.location.replace(`wizard.html?service=${targetService}&plan=${targetPlan}`);
            } else {
                window.location.replace('portal-dashboard.html');
            }

        } catch (routeErr) {
            console.error("Critical routing breakdown:", routeErr.message);
            
            // Halt the blinding loop sequence and push the error context out to the user
            if (passError) {
                passError.style.color = "#c15254";
                passError.innerText = `System Gate Configuration Error: ${routeErr.message}`;
            } else {
                alert(`Configuration Exception: ${routeErr.message}`);
            }

            // Re-enable submission controls so the interface does not lock permanently
            if (loginSubmitBtn) {
                loginSubmitBtn.innerText = "Enter Secure Portal →";
                loginSubmitBtn.disabled = false;
            }
            
            // Clean up credentials and sign out cleanly so corrupted configurations do not stack
            await client.auth.signOut();
        }
    }

    try {
        await client.auth.initialize();

        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
            handleUserRouting(session.user.id);
            return;
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                if (!emailInput || !passwordInput) return;

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;

                if (loginSubmitBtn) {
                    loginSubmitBtn.innerText = "Authenticating...";
                    loginSubmitBtn.disabled = true;
                }
                if (passError) passError.innerText = "";

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);

                    if (loginCard) loginCard.classList.add('auth-success');
                    await handleUserRouting(result.data.user.id);

                } catch (err) {
                    console.warn("Client auth exception caught:", err.message);
                    if (passError) passError.innerText = `Login Failed: ${err.message}`;
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerText = "Enter Secure Portal →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }
    } catch (err) {
        console.error("Portal Login Application System Failure:", err.message);
    }
})();
