document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // ============================================================================
  // ⚙️ INITIALIZATION CONFIGURATION (EMBEDDED PROJECT PARAMS)
  // ============================================================================
  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

  // Connect to Supabase cleanly
  if (!window.supabase || typeof window.supabase.from !== "function") {
    if (typeof createClient === "function") {
      window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (window.supabase && typeof window.supabase.createClient === "function") {
      window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  const client = window.supabaseClient || window.supabase;
  if (!client) {
    console.error("[Critical Error] Supabase SDK client failed instantiation pass.");
    return;
  }

  // --- INTERNAL RATE LIMITING STATE REGISTER ---
  let formSubmissionAttemptsCounter = 0;
  let formExecutionLockoutTimestamp = 0;

  // --- DOM ELEMENT MAPS ---
  const form = document.getElementById('passwordResetCommitForm');
  const passField = document.getElementById('portalUserPassword');
  const confirmField = document.getElementById('portalUserPasswordConfirm');
  const statusMsg = document.getElementById('reset-status-msg');
  const submitBtn = document.getElementById('resetSubmitBtn');
  const viewTitle = document.getElementById('portal-view-title');
  const viewDesc = document.getElementById('portal-view-desc');
  const timeoutBox = document.getElementById('timeout-warning-box');
  const reverifyBtn = document.getElementById('triggerReverifyBtn');

  // --- PARSE REGISTRATION URL PARAMETERS ---
  const urlParams = new URLSearchParams(window.location.search);
  const rawTrackingToken = urlParams.get('token') || ""; 
  const trackingToken = /^[a-zA-Z0-9_\-]+$/.test(rawTrackingToken) ? rawTrackingToken : "";
  // ============================================================================
  // 🔑 AUTH EXCHANGE HANDSHAKE (JWT PROTECTION LAYER)
  // ============================================================================
  const exchangeSecureEmailToken = async () => {
    try {
      const hashString = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashString);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      // 🔍 HARDENED VALIDATION GATE: Only execute setSession if a true JWT exists.
      // This stops Supabase from crashing on empty configurations or design layouts.
      if (accessToken && accessToken.trim() !== "" && accessToken.split('.').length === 3) {
        console.log("[Auth Engine] Valid inbound hash structure detected. Committing credentials loop...");
        const { error: tokenError } = await client.auth.setSession({ 
          access_token: accessToken, 
          refresh_token: refreshToken || "" 
        });
        if (tokenError) throw tokenError;
      } else if (accessToken) {
        // If an access token exists but failed our dot-count check, it is corrupted.
        console.warn("[Auth Engine] Malformed access token intercepted. Halting handshake safely.");
        showInterlockError();
        return;
      }

      // Check for an active session to see if the user is verified
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        console.log("[Auth Engine] Active session mapped securely for: ", session.user.email);
        if (viewTitle) viewTitle.textContent = "Complete Password Setup";
        if (viewDesc) viewDesc.textContent = "Establish high-entropy credentials to unlock your dashboard safely.";
        
        // Unlocks the button for true verified email clicks
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.background = "var(--primary)";
          submitBtn.style.cursor = "pointer";
          submitBtn.textContent = "Authorize & Build Account";
        }
      } else {
        // 🛠️ DESIGN LAYOUT BYPASS: If no token exists at all, unlock the button anyway!
        // This ensures your text fields, eye toggles, and color bars remain active for design tests.
        console.log("[Auth Engine] Standby Mode: Form fully unlocked for interface visualization checks.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.background = "var(--primary)";
          submitBtn.style.cursor = "pointer";
          submitBtn.textContent = "Finalize Profile Registration";
        }
      }
    } catch (err) {
      console.error("[Token Handshake Crash Intercepted]", err);
      showInterlockError();
    }
  };

  const showInterlockError = () => {
    if (statusMsg) {
      statusMsg.style.color = "var(--error)";
      statusMsg.style.backgroundColor = "var(--error-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #fca5a5";
      statusMsg.textContent = "Security Interlock Failure: Your verification link is invalid, expired, or has already been consumed.";
      statusMsg.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.style.boxShadow = "none";
      submitBtn.style.cursor = "not-allowed";
    }
  };

  // Run the handshake protocol immediately upon file entry
  await exchangeSecureEmailToken();
  // ============================================================================
  // ⏱️ STEP 4: 10-MINUTE SECURITY TIMEOUT WATCHDOG
  // ============================================================================
  setTimeout(() => {
    console.warn("[Security Watchdog] 10-minute activation window elapsed. Locking canvas forms.");
    if (passField) passField.disabled = true;
    if (confirmField) confirmField.disabled = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.style.boxShadow = "none";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.textContent = "Session Timed Out";
    }
    if (timeoutBox) timeoutBox.style.display = "block";
  }, 10 * 60 * 1000);

  // ============================================================================
  // 🔄 STEP 5: TIMEOUT RE-VERIFICATION HANDSHAKE LOOP
  // ============================================================================
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
          .select('email_address')
          .eq('tracking_number', trackingToken)
          .maybeSingle();

        if (orderErr) throw orderErr;
        const recEmail = matchedOrder?.email_address;

        if (!recEmail) {
          throw new Error("Dossier Mismatch: No registered transaction profiles match this tracking code.");
        }

        // Fire fresh routing request right back into your custom verified route
        const redirectUrl = `${window.location.origin}/forgot-password.html?token=${encodeURIComponent(trackingToken)}`;
        const { error: resetError } = await client.auth.resetPasswordForEmail(recEmail, { redirectTo: redirectUrl });
        if (resetError) throw resetError;

        reverifyBtn.style.background = "var(--accent)";
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
  // ============================================================================
  // 🚀 SUBMIT CHANNELS & ROLE-BASED REDIRECT ROUTING
  // ============================================================================
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
      statusMsg.style.color = "var(--error)";
      statusMsg.style.backgroundColor = "var(--error-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #fca5a5";
      statusMsg.textContent = `Brute-Force Intercept: Too many attempts. Pause for ${remainingSeconds} seconds.`;
      statusMsg.style.display = 'block';
      return;
    }

    const passValueString = passField.value;
    const hasUppercaseLetter = /[A-Z]/.test(passValueString);
    const hasLowercaseLetter = /[a-z]/.test(passValueString);
    const hasNumericalDigit = /[0-9]/.test(passValueString);
    const hasSpecialSymbol = /[^A-Za-z0-9]/.test(passValueString);

    // High Entropy Verification regular expressions matrix
    if (passValueString.length < 10 || !hasUppercaseLetter || !hasLowercaseLetter || !hasNumericalDigit || !hasSpecialSymbol) {
      formSubmissionAttemptsCounter++;
      if (formSubmissionAttemptsCounter >= 3) {
        formExecutionLockoutTimestamp = Date.now() + (30 * 1000);
      }
      passField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.style.backgroundColor = "var(--error-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #fca5a5";
      statusMsg.textContent = "Security Gate Failure: Credentials must be at least 10 characters long and include an uppercase letter, lowercase letter, number, and special symbol.";
      statusMsg.style.display = 'block';
      return;
    }

    if (passField.value !== confirmField.value) {
      confirmField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.style.backgroundColor = "var(--error-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #fca5a5";
      statusMsg.textContent = "Verification Failure: Password field confirmations do not match.";
      statusMsg.style.display = 'block';
      return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Encrypting Security Vault...";
    submitBtn.disabled = true;

    try {
      // 1. Commit the user password modification parameter update payload to Supabase Auth
      const { data: updateData, error: updateError } = await client.auth.updateUser({ 
        password: passField.value 
      });
      if (updateError) throw updateError;

      statusMsg.style.color = "var(--accent)";
      statusMsg.style.backgroundColor = "var(--accent-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #a7f3d0";
      statusMsg.textContent = "✓ Security credentials established! Verifying role privileges...";
      statusMsg.style.display = 'block';

      formSubmissionAttemptsCounter = 0;

      // 2. ROLE INTERCEPTOR ROUTER: Inspect payload metadata arrays for clear admin variables
      const user = updateData?.user;
      const userRole = user?.app_metadata?.role || user?.user_metadata?.role || "client";
      
      let targetDashboard = "client-dashboard.html";
      if (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "administrator") {
        targetDashboard = "admin-dashboard.html";
        console.log("[Role Gateway] Administrative privileges verified.");
      } else {
        console.log("[Role Gateway] Standard client clearance detected.");
      }

      const baseRoot = window.productionRootUrl || window.location.origin;
      const finalDestinationUrl = `${baseRoot}/${targetDashboard}?login_hint=${encodeURIComponent(trackingToken)}&status=activated`;

      console.log("[Redirect Engine] Destination complete: " + finalDestinationUrl);

      // 3. Clear token session state tracking securely and fire window routing loops
      client.auth.signOut().then(() => {
        window.location.replace(finalDestinationUrl);
      }).catch(() => {
        window.location.replace(finalDestinationUrl);
      });

    } catch (err) {
      console.error(err);
      passField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.style.backgroundColor = "var(--error-bg)";
      statusMsg.style.padding = "10px 12px";
      statusMsg.style.borderRadius = "6px";
      statusMsg.style.border = "1px solid #fca5a5";
      statusMsg.textContent = `Update Halted: ${err.message || err}`;
      statusMsg.style.display = 'block';
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});
