document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // --- INTERNAL RATE LIMITING STATE REGISTER ---
  let formSubmissionAttemptsCounter = 0;
  let formExecutionLockoutTimestamp = 0;

  // 1. TIMING PROTECTION: Wait until global Supabase client initializes
  const waitForClient = () => new Promise(res => {
    if (window.supabaseClient) return res(window.supabaseClient);
    const idx = setInterval(() => {
      if (window.supabaseClient) {
        clearInterval(idx);
        res(window.supabaseClient);
      }
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

  // Parse and cleanly sanitize tracking tokens extracted from browser window location string
  const urlParams = new URLSearchParams(window.location.search);
  const rawTrackingToken = urlParams.get('token') || "";
  // SECURE CHECK: Strip away anything that does not match alphanumeric syntax structures to block injection hacks
  const trackingToken = /^[a-zA-Z0-9_\-]+$/.test(rawTrackingToken) ? rawTrackingToken : "";

  // ============================================================================ //
  // 🔑 STEP 1 & 2: EXTRACT LINK TOKEN & RE-ESTABLISH SECURED AUTHENTICATED SESSION //
  // ============================================================================ //
  const exchangeSecureEmailToken = async () => {
    try {
      const hashString = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashString);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken) {
        console.log("[Auth Engine] Direct inbound verification hash detected. Initializing handshake...");
        
        // Explicitly inject the tokens directly to lock the active session context down
        const { error: tokenError } = await client.auth.setSession({ 
          access_token: accessToken, 
          refresh_token: refreshToken || "" 
        });
        if (tokenError) throw tokenError;
      }

      // Fetch unified session status to guarantee verification passed
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        console.log("[Auth Engine] Session verified for: ", session.user.email);
        if (viewTitle) viewTitle.textContent = "Complete Password Setup";
        if (viewDesc) viewDesc.textContent = "Establish high-entropy alphanumeric credentials to unlock your compliance dashboard safely.";
        if (submitBtn) submitBtn.textContent = "Authorize & Build Account";
      } else {
        console.warn("[Auth Engine] Critical Failure: No active authenticated user session context found.");
        showInterlockError();
      }
    } catch (tokenExchangeErr) {
      console.error("[Token Handshake Crash]", tokenExchangeErr);
      showInterlockError();
    }
  };

  const showInterlockError = () => {
    if (statusMsg) {
      statusMsg.style.color = "#e53e3e";
      statusMsg.textContent = "Security Interlock Failure: Your verification link is invalid, expired, or has already been consumed.";
      statusMsg.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.style.cursor = "not-allowed";
    }
  };

  // Execute verification immediately on layout entry frame
  await exchangeSecureEmailToken();
  // ============================================================================ //
  // 👁️ STEP 3: EYE ICON TOGGLE LOGIC SWITCHES                                    //
  // ============================================================================ //
  const eyeIcons = document.querySelectorAll(".toggle-password-eye");
  eyeIcons.forEach(icon => {
    icon.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const inputField = document.getElementById(targetId);
      
      if (inputField) {
        if (inputField.type === "password") {
          inputField.type = "text";
          this.classList.remove("fa-eye");
          this.classList.add("fa-eye-slash");
        } else {
          inputField.type = "password";
          this.classList.remove("fa-eye-slash");
          this.classList.add("fa-eye");
        }
      }
    });
  });

  // ============================================================================ //
  // ⏱️ STEP 4: 10-MINUTE SECURITY TIMEOUT WATCHDOG                              //
  // ============================================================================ //
  setTimeout(() => {
    console.warn("[Security Watchdog] 10-minute activation window elapsed. Locking canvas forms.");
    if (passField) passField.disabled = true;
    if (confirmField) confirmField.disabled = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.textContent = "Session Timed Out";
    }
    if (timeoutBox) timeoutBox.style.display = "block";
  }, 10 * 60 * 1000);
  // ============================================================================ //
  // 🔄 STEP 5: TIMEOUT RE-VERIFICATION HANDSHAKE LOOP                          //
  // ============================================================================ //
  if (reverifyBtn) {
    reverifyBtn.addEventListener('click', async () => {
      reverifyBtn.disabled = true;
      reverifyBtn.textContent = 'Checking Database Ledger...';
      
      try {
        if (!trackingToken) {
          throw new Error("Tracking parameters are absent or invalid inside the current web view context.");
        }

        // Connect back to Supabase to extract customer routing metrics matching token
        const { data: matchedOrder, error: orderErr } = await client
          .from('orders')
          .select('email')
          .eq('tracking_number', trackingToken)
          .maybeSingle();

        if (orderErr) throw orderErr;
        const recEmail = matchedOrder?.email;

        if (!recEmail) {
          throw new Error("Dossier Mismatch: No registered transaction profiles match this tracking code.");
        }

        // Fire fresh routing request right back into your custom verified route
        const redirectUrl = `${window.location.origin}/forgot-password.html?token=${encodeURIComponent(trackingToken)}`;
        const { error: resetError } = await client.auth.resetPasswordForEmail(recEmail, { redirectTo: redirectUrl });
        if (resetError) throw resetError;

        reverifyBtn.style.background = "#10b981";
        reverifyBtn.textContent = 'Dispatched! Check Inbox.';
        alert(`✓ A fresh security link has been successfully issued to ${recEmail}. Please inspect your primary inbox or spam filters and close this tab.`);
      } catch (e) {
        console.error("[Reverification Pipeline Failure]", e);
        alert(`Verification Loop Interrupted: ${e.message || e}`);
        reverifyBtn.disabled = false;
        reverifyBtn.textContent = 'Request New Verification Email';
      }
    });
  }
  // ============================================================================ //
  // 🔒 STEP 6: COMPLEXITY MATRIX SUBMIT CHANNELS & DASHBOARD ROUTING            //
  // ============================================================================ //
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!passField || !confirmField || !statusMsg || !submitBtn) return;

    passField.classList.remove('field-error');
    confirmField.classList.remove('field-error');
    statusMsg.style.display = 'none';

    // SECURE CHECK: Rate Limit Bot Prevention Gate
    const currentTimestampUnix = Date.now();
    if (currentTimestampUnix < formExecutionLockoutTimestamp) {
      const remainingSeconds = Math.ceil((formExecutionLockoutTimestamp - currentTimestampUnix) / 1000);
      statusMsg.style.color = "#e53e3e";
      statusMsg.textContent = `Brute-Force Intercept: Too many attempts. Please pause for ${remainingSeconds} seconds before retry.`;
      statusMsg.style.display = 'block';
      return;
    }

    // High Entropy Verification regular expressions matrix
    const passValueString = passField.value;
    const hasUppercaseLetter = /[A-Z]/.test(passValueString);
    const hasLowercaseLetter = /[a-z]/.test(passValueString);
    const hasNumericalDigit   = /[0-9]/.test(passValueString);
    const hasSpecialSymbol   = /[^A-Za-z0-9]/.test(passValueString);

    if (passValueString.length < 10 || !hasUppercaseLetter || !hasLowercaseLetter || !hasNumericalDigit || !hasSpecialSymbol) {
      formSubmissionAttemptsCounter++;
      if (formSubmissionAttemptsCounter >= 3) {
        // Enforce a strict 30-second penalty delay on consecutive complexity errors
        formExecutionLockoutTimestamp = Date.now() + (30 * 1000);
      }
      
      passField.classList.add('field-error');
      statusMsg.style.color = "#e53e3e";
      statusMsg.textContent = "Security Gate Failure: Credentials must be at least 10 characters long and include an uppercase letter, lowercase letter, number, and special symbol.";
      statusMsg.style.display = 'block';
      return;
    }

    // CONSTANT TIME ITERATION MATCHING: Thwarts side-channel microsecond tracing strategies
    let alignmentMismatchCounter = 0;
    const maxStringLength = Math.max(passField.value.length, confirmField.value.length);
    for (let i = 0; i < maxStringLength; i++) {
      if (passField.value[i] !== confirmField.value[i]) {
        alignmentMismatchCounter++;
      }
    }

    if (alignmentMismatchCounter !== 0) {
      confirmField.classList.add('field-error');
      statusMsg.style.color = "#e53e3e";
      statusMsg.textContent = "Verification Failure: Password field confirmations do not match.";
      statusMsg.style.display = 'block';
      return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Encrypting Security Vault...";
    submitBtn.disabled = true;

    try {
      // Commit the password update configuration parameter payload to the database
      const { error: updateError } = await client.auth.updateUser({ password: passField.value });
      if (updateError) throw updateError;

      statusMsg.style.color = "#10b981";
      statusMsg.textContent = "✓ Security credentials established! Syncing parameters...";
      statusMsg.style.display = 'block';

      // Reset application states cleanly on success checkpoint
      formSubmissionAttemptsCounter = 0;

      // Log out user cleanly so they enter fresh via the login screen view route layout
      await client.auth.signOut();

      setTimeout(() => {
        const baseRoot = window.productionRootUrl || window.location.origin;
        window.location.href = `${baseRoot}/client-dashboard.html?login_hint=${encodeURIComponent(trackingToken)}&status=activated`;
      }, 1500);

    } catch (err) {
      console.error("[Finalization Intercept Fault]", err);
      passField.classList.add('field-error');
      statusMsg.style.color = "#e53e3e";
      statusMsg.textContent = `Update Halted: ${err.message || err}`;
      statusMsg.style.display = 'block';
      
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});
