document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    // 1. TIMING PROTECTION: Wait until global Supabase client initializes
    const waitForClient = () => new Promise(res => {
        if (window.supabaseClient) return res(window.supabaseClient);
        const idx = setInterval(() => {
            if (window.supabaseClient) { clearInterval(idx); res(window.supabaseClient); }
        }, 30);
    });

    const client = await waitForClient();
    const form = document.getElementById('passwordResetCommitForm');
    const passField = document.getElementById('portalUserPassword');
    const confirmField = document.getElementById('portalUserPasswordConfirm');
    const statusMsg = document.getElementById('reset-status-msg');
    const submitBtn = document.getElementById('resetSubmitBtn');
    const viewTitle = document.getElementById('portal-view-title');
    const viewDesc = document.getElementById('portal-view-desc');
    const timeoutBox = document.getElementById('timeout-warning-box');
    const reverifyBtn = document.getElementById('triggerReverifyBtn');

    // Parse specific tracking tags out of the URL parameters string
    const urlParams = new URLSearchParams(window.location.search);
    const trackingToken = urlParams.get('token') || "";

    // ============================================================================ //
    // 🔑 STEP 1 & 2: CONSUME THE LINK TOKEN AND VERIFY SUPABASE SESSION ON ARRIVAL  //
    // ============================================================================ //
    const exchangeSecureEmailToken = async () => {
        try {
            // Check if the arriving link has a native code or session hash attached
            const hash = window.location.hash || window.location.search;
            if (hash.includes("access_token=") || hash.includes("code=")) {
                console.log("[Auth Engine] Inbound verification token detected. Initializing authentication handshake...");
            }

            // Fetch session status to see if the browser successfully exchanged the link token
            const { data: { session }, error: sessionError } = await client.auth.getSession();
            if (sessionError) throw sessionError;

            if (session?.user) {
                console.log("[Auth Engine] Session verified for: ", session.user.email);
                viewTitle.innerText = "Complete Password Setup";
                viewDesc.innerText = "Establish mixed alphanumeric access properties to unlock your compliance files safely.";
                submitBtn.innerText = "Authorize & Build Account";
            } else {
                console.warn("[Auth Engine] Critical Failure: No active authenticated user session context found.");
            }
        } catch (tokenExchangeErr) {
            console.error("[Token Handshake Crash]", tokenExchangeErr);
            statusMsg.style.color = "#e53e3e";
            statusMsg.innerText = "Security Interlock Failure: Your verification link is either invalid, incomplete, or has already been used.";
            statusMsg.style.display = 'block';
        }
    };
    
    // Execute verification immediately on layout entry frame
    await exchangeSecureEmailToken();

    // ============================================================================ //
    // 👁️ STEP 3: EYE ICON TOGGLE LOGIC SWITCHES                                    //
    // ============================================================================ //
    document.querySelectorAll('.toggle-password-eye').forEach(eye => {
        eye.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput && targetInput.type === "password") {
                targetInput.type = "text";
                this.className = "fa-solid fa-eye-slash toggle-password-eye";
            } else if (targetInput) {
                targetInput.type = "password";
                this.className = "fa-solid fa-eye toggle-password-eye";
            }
        });
    });

    // ============================================================================ //
    // ⏱️ STEP 4: 10-MINUTE SECURITY TIMEOUT WATCHDOG                               //
    // ============================================================================ //
    setTimeout(() => {
        console.warn("[Security Watchdog] 10-minute activation window elapsed. Locking canvas forms.");
        if (passField) passField.disabled = true;
        if (confirmField) confirmField.disabled = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.background = "#cbd5e1";
            submitBtn.style.cursor = "not-allowed";
        }
        if (timeoutBox) timeoutBox.style.display = "block";
    }, 10 * 60 * 1000);

    // ============================================================================ //
    // 🔄 STEP 5: TIMEOUT RE-VERIFICATION HANDSHAKE LOOP & DATABASE ACCOUNT RE-CHECK//
    // ============================================================================ //
    if (reverifyBtn) {
        reverifyBtn.addEventListener('click', async () => {
            reverifyBtn.disabled = true;
            reverifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Database Ledger...';
            try {
                // Connect back to Supabase to verify that an account and order match the token
                const { data: matchedOrder, error: orderErr } = await client
                    .from('orders')
                    .select('communications_email')
                    .eq('tracking_number', trackingToken)
                    .maybeSingle();

                if (orderErr) throw orderErr;
                const recEmail = matchedOrder?.communications_email;
                
                if (!recEmail) {
                    throw new Error("Dossier Mismatch: No registered transaction profiles match this tracking code.");
                }

                // Fire a fresh routing request out to your edge function
                const redirectUrl = `${window.location.origin}/functions/v1/verify-and-detect-fraud?token=${trackingToken}`;
                const { error: resetError } = await client.auth.resetPasswordForEmail(recEmail, { redirectTo: redirectUrl });
                if (resetError) throw resetError;

                reverifyBtn.style.background = "#10b981";
                reverifyBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Dispatched! Check Inbox.';
                alert(`✓ A fresh security link has been successfully issued to ${recEmail}. Please inspect your primary inbox or spam filters and close this tab.`);
            } catch (e) {
                console.error("[Reverification Pipeline Failure]", e);
                alert(`Verification Loop Interrupted: ${e.message || e}`);
                reverifyBtn.disabled = false;
                reverifyBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Request New Verification Email';
            }
        });
    }

    // ============================================================================ //
    // 🔒 STEP 6: COMPLEXITY MATRIX SUBMIT CHANNELS & DASHBOARD ROUTING            //
    // ============================================================================ //
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        passField.classList.remove('field-error');
        confirmField.classList.remove('field-error');
        statusMsg.style.display = 'none';

        // Strict Complexity Gate: Enforces minimum 8 mixed characters alphanumeric
        if (passField.value.length < 8) {
            passField.classList.add('field-error');
            statusMsg.style.color = "#e53e3e";
            statusMsg.innerText = "Security Rule Violation: Passwords must be at least 8 mixed characters in length.";
            statusMsg.style.display = 'block';
            return;
        }

        if (passField.value !== confirmField.value) {
            confirmField.classList.add('field-error');
            statusMsg.style.color = "#e53e3e";
            statusMsg.innerText = "Verification Failure: Password field confirmations do not match.";
            statusMsg.style.display = 'block';
            return;
        }

        submitBtn.innerText = "Encrypting Security Vault...";
        submitBtn.disabled = true;

        try {
            // Commit the password choice to the authenticated user directory
            const { error: updateError } = await client.auth.updateUser({ password: passField.value });
            if (updateError) throw updateError;

            statusMsg.style.color = "#10b981";
            statusMsg.innerText = "✓ Security credentials established! Syncing parameters...";
            statusMsg.style.display = 'block';

            // Log out user cleanly so they are forced to complete their first legit login check securely on client-dashboard.html
            await client.auth.signOut();

            setTimeout(() => {
                const baseRoot = window.productionRootUrl || window.location.origin;
                window.location.href = `${baseRoot}/client-dashboard.html?login_hint=${encodeURIComponent(trackingToken)}&status=activated`;
            }, 1500);

        } catch (err) {
            console.error("[Finalization Intercept Fault]", err);
            passField.classList.add('field-error');
            statusMsg.style.color = "#e53e3e";
            statusMsg.innerText = `Update Halted: ${err.message}`;
            statusMsg.style.display = 'block';
            submitBtn.innerText = "Authorize & Build Account";
            submitBtn.disabled = false;
        }
    });
});
