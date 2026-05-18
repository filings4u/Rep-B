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

    try {
        await client.auth.initialize();

        // 1. AUTO-REDIRECT GATE: Route them out of the login screen if already authenticated
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
            handleUserRouting(session.user.id);
            return;
        }

        // 2. FORM SUBMISSION EVENT HANDLER
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                if (!emailInput || !passwordInput) return;

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;

                if (loginSubmitBtn) {
                    loginSubmitBtn.innerHTML = `<span class="btn-spinner"></span> Authenticating...`;
                    loginSubmitBtn.disabled = true;
                }
                if (passError) passError.innerText = "";

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);

                    if (loginCard) loginCard.classList.add('auth-success');
                    handleUserRouting(result.data.user.id);

                } catch (err) {
                    console.warn("Client auth exception caught:", err.message);
                    if (passError) passError.innerText = `Login Failed: ${err.message}`;
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerHTML = "Enter Secure Portal →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }

        // 3. ROLE-BASED INTELLIGENT ROUTING ENGINE
        async function handleUserRouting(userId) {
            // Check profiles table securely for real administrative access role tokens
            const { data: profile } = await client
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (profile && profile.role === 'admin') {
                window.location.replace('admin-dashboard.html');
                return;
            }

            // Stateful redirection routing rules for customer wizards or dashboards
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
        }

    } catch (err) {
        console.error("Portal Login Application System Failure:", err.message);
    }
})();
