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
    const loginCard = document.querySelector('.login-card');

    try {
        await client.auth.initialize();

        // 1. AUTO-REDIRECT TRANSITION
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && session.user.email.toLowerCase().endsWith('@filings4u.com')) {
            if (loginCard) loginCard.classList.add('auth-success');
            setTimeout(() => {
                window.location.replace('admin-dashboard.html');
            }, 350);
            return;
        }

        // 2. FORM INTERACTION HANDLING
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                if (!emailInput || !passwordInput) return;

                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;

                if (!email.endsWith('@filings4u.com')) {
                    if (passError) {
                        passError.innerText = "Access denied: Entry is strictly reserved for verified @filings4u.com email domains.";
                    }
                    return;
                }

                // Inject spinner infrastructure into UI
                if (loginSubmitBtn) {
                    loginSubmitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying Session...`;
                    loginSubmitBtn.disabled = true;
                }
                if (passError) passError.innerText = "";

                try {
                    const result = await client.auth.signInWithPassword({ email, password });
                    if (result.error) throw new Error(result.error.message);

                    const authenticatedUser = result.data.user;
                    if (!authenticatedUser || !authenticatedUser.email.toLowerCase().endsWith('@filings4u.com')) {
                        await client.auth.signOut();
                        throw new Error("Administrative server validation check failed.");
                    }

                    // Success state animation trigger
                    if (loginSubmitBtn) loginSubmitBtn.innerHTML = "Access Authorized ✓";
                    if (loginCard) loginCard.classList.add('auth-success');
                    
                    setTimeout(() => {
                        window.location.replace('admin-dashboard.html');
                    }, 400);

                } catch (err) {
                    console.warn("Auth barrier caught exception:", err.message);
                    if (passError) {
                        passError.innerText = `Authorization Failed: ${err.message}`;
                    }
                    if (loginSubmitBtn) {
                        loginSubmitBtn.innerHTML = "Verify Terminal Session →";
                        loginSubmitBtn.disabled = false;
                    }
                }
            });
        }

    } catch (err) {
        console.error("Login System Error:", err.message);
    }
})();
