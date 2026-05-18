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
    const accessDeniedModal = document.getElementById('accessDeniedModal');
    const closeAccessModalBtn = document.getElementById('closeAccessModalBtn');

    // 1. POPUP TRIGGER WATCHER: Check if redirected here due to a lack of permissions
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('auth') === 'denied' && accessDeniedModal) {
        accessDeniedModal.classList.add('active');
    }

    if (closeAccessModalBtn && accessDeniedModal) {
        closeAccessModalBtn.addEventListener('click', () => {
            accessDeniedModal.classList.remove('active');
            // Clean up the URL search parameters cleanly
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    async function handleUserRouting(userId) {
        try {
            const { data: profile } = await client
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (profile && profile.role === 'admin') {
                window.location.replace('admin-dashboard.html');
                return;
            }

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
            window.location.replace('portal-dashboard.html');
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

                // Clear out old error formatting
                emailInput.classList.remove('field-error');
                passwordInput.classList.remove('field-error');
                if (passError) passError.innerText = "";

                // 2. FIELD ERROR RED GLOW HIGHLIGHT VALIDATION
                let hasFormErrors = false;
                if (!emailInput.value.trim()) {
                    emailInput.classList.add('field-error');
                    hasFormErrors = true;
                }
                if (!passwordInput.value) {
                    passwordInput.classList.add('field-error');
                    hasFormErrors = true;
                }

                if (hasFormErrors) {
                    if (passError) passError.innerText = "Please fill in all required operational credential keys.";
                    return;
                }

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;

                if (loginSubmitBtn) {
                    loginSubmitBtn.innerText = "Authenticating...";
                    loginSubmitBtn.disabled = true;
                }

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);

                    handleUserRouting(result.data.user.id);

                } catch (err) {
                    console.warn("Client auth exception caught:", err.message);
                    emailInput.classList.add('field-error');
                    passwordInput.classList.add('field-error');
                    if (passError) passError.innerText = `Login Failed: ${err.message}`;
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerText = "Enter Secure Portal →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }
    } catch (err) {
        console.error("Portal Login Application Failure:", err.message);
    }

        // ==========================================================================
    // PASSWORD VISIBILITY INTERACTIVE TOGGLE LOGIC
    // ==========================================================================
    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('passwordToggleBtn');

    if (passwordToggleBtn && passwordInput) {
        passwordToggleBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop form submission triggers
            
            // Check current presentation state and toggle format vector
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordToggleBtn.innerText = '🙈'; // Switch to closed eye icon
            } else {
                passwordInput.type = 'password';
                passwordToggleBtn.innerText = '👁️'; // Switch back to open eye icon
            }
        });
    }

})();
