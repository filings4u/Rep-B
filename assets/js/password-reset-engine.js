document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // ============================================================================
  // ⚙️ INITIALIZATION CONFIGURATION (EMBEDDED PROJECT PARAMS)
  // ============================================================================
  const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";

  // Ensure client connects securely to global window mappings
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
  // --- EYE ICON VISIBILITY ENGINE ---
  const eyeIcons = document.querySelectorAll(".toggle-password-eye");
  eyeIcons.forEach(icon => {
    icon.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const inputField = document.getElementById(targetId);
      if (inputField) {
        if (inputField.type === "password") {
          inputField.type = "text";
          this.classList.replace("fa-eye", "fa-eye-slash");
        } else {
          inputField.type = "password";
          this.classList.replace("fa-eye-slash", "fa-eye");
        }
      }
    });
  });

  // --- PASSWORD STRENGTH WATCHER ---
  if (passField) {
    passField.addEventListener("input", () => {
      const val = passField.value;
      const b1 = document.getElementById("strength-1");
      const b2 = document.getElementById("strength-2");
      const b3 = document.getElementById("strength-3");

      if (!b1 || !b2 || !b3) return;

      if (val.length === 0) {
        b1.style.background = b2.style.background = b3.style.background = '';
        return;
      }
      
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      if (score === 1) {
        b1.style.background = '#ef4444'; 
        b2.style.background = b3.style.background = '';
      } else if (score === 2) {
        b1.style.background = b2.style.background = '#f59e0b'; 
        b3.style.background = '';
      } else if (score === 3) {
        b1.style.background = b2.style.background = b3.style.background = '#10b981'; 
      }
    });
  }

  // --- PARSE REGISTRATION URL PARAMETERS ---
  const urlParams = new URLSearchParams(window.location.search);
  const rawTrackingToken = urlParams.get('token') || ""; 
  const trackingToken = /^[a-zA-Z0-9_\-]+$/.test(rawTrackingToken) ? rawTrackingToken : "";
  // ============================================================================
  // 🔑 AUTH EXCHANGE HANDSHAKE 
  // ============================================================================
  const exchangeSecureEmailToken = async () => {
    try {
      const hashString = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashString);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken) {
        console.log("[Auth Engine] Inbound hash detected. Committing credentials loop...");
        const { error: tokenError } = await client.auth.setSession({ 
          access_token: accessToken, 
          refresh_token: refreshToken || "" 
        });
        if (tokenError) throw tokenError;
      }

      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        console.log("[Auth Engine] Active session mapped securely for: ", session.user.email);
        if (viewTitle) viewTitle.textContent = "Complete Password Setup";
        if (viewDesc) viewDesc.textContent = "Establish high-entropy alphanumeric credentials to unlock your compliance dashboard safely.";
        if (submitBtn) submitBtn.textContent = "Authorize & Build Account";
      } else {
        showInterlockError();
      }
    } catch (err) {
      console.error("[Token Handshake Crash]", err);
      showInterlockError();
    }
  };

  const showInterlockError = () => {
    if (statusMsg) {
      statusMsg.style.color = "var(--error)";
      statusMsg.textContent = "Security Interlock Failure: Your verification link is invalid, expired, or has already been consumed.";
      statusMsg.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.style.cursor = "not-allowed";
    }
  };

  await exchangeSecureEmailToken();

  // ============================================================================
  // ⏱️ SECURITY WATCHDOGS & REVERIFICATION LINK DISPATCHERS
  // ============================================================================
  setTimeout(() => {
    console.warn("[Watchdog] Session lifetime limit matched.");
    if (passField) passField.disabled = true;
    if (confirmField) confirmField.disabled = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.background = "#cbd5e1";
      submitBtn.textContent = "Session Timed Out";
    }
    if (timeoutBox) timeoutBox.style.display = "block";
  }, 10 * 60 * 1000);

  if (reverifyBtn) {
    reverifyBtn.addEventListener('click', async () => {
      reverifyBtn.disabled = true;
      reverifyBtn.textContent = 'Checking Database Ledger...';
      try {
        if (!trackingToken) throw new Error("Tracking parameters are absent or invalid inside view context.");

        const { data: matchedOrder, error: orderErr } = await client
          .from('orders')
          .select('email_address')
          .eq('tracking_number', trackingToken)
          .maybeSingle();

        if (orderErr) throw orderErr;
        const recEmail = matchedOrder?.email_address;

        if (!recEmail) throw new Error("Dossier Mismatch: No tracking signatures match this parameter token.");

        const redirectUrl = `${window.location.origin}/forgot-password.html?token=${encodeURIComponent(trackingToken)}`;
        const { error: resetError } = await client.auth.resetPasswordForEmail(recEmail, { redirectTo: redirectUrl });
        if (resetError) throw resetError;

        reverifyBtn.style.background = "var(--accent)";
        reverifyBtn.textContent = 'Dispatched! Check Inbox.';
        alert(`✓ A fresh recovery connection has been delivered to ${recEmail}. Please view your main tab files.`);
      } catch (e) {
        console.error(e);
        alert(`Verification Loop Interrupted: ${e.message}`);
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

    const currentTimestampUnix = Date.now();
    if (currentTimestampUnix < formExecutionLockoutTimestamp) {
      const remainingSeconds = Math.ceil((formExecutionLockoutTimestamp - currentTimestampUnix) / 1000);
      statusMsg.style.color = "var(--error)";
      statusMsg.textContent = `Brute-Force Intercept: Too many attempts. Pause for ${remainingSeconds} seconds.`;
      statusMsg.style.display = 'block';
      return;
    }

    const passValueString = passField.value;
    const hasUppercaseLetter = /[A-Z]/.test(passValueString);
    const hasLowercaseLetter = /[a-z]/.test(passValueString);
    const hasNumericalDigit = /[0-9]/.test(passValueString);
    const hasSpecialSymbol = /[^A-Za-z0-9]/.test(passValueString);

    if (passValueString.length < 10 || !hasUppercaseLetter || !hasLowercaseLetter || !hasNumericalDigit || !hasSpecialSymbol) {
      formSubmissionAttemptsCounter++;
      if (formSubmissionAttemptsCounter >= 3) {
        formExecutionLockoutTimestamp = Date.now() + (30 * 1000);
      }
      passField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.textContent = "Security Gate Failure: Credentials must be at least 10 characters long and include an uppercase letter, lowercase letter, number, and special symbol.";
      statusMsg.style.display = 'block';
      return;
    }

    if (passField.value !== confirmField.value) {
      confirmField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.textContent = "Verification Failure: Password field confirmations do not match.";
      statusMsg.style.display = 'block';
      return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Encrypting Security Vault...";
    submitBtn.disabled = true;

    try {
      // 1. Fire the user password modification parameter update payload to Supabase Auth
      const { data: updateData, error: updateError } = await client.auth.updateUser({ 
        password: passField.value 
      });
      if (updateError) throw updateError;

      statusMsg.style.color = "var(--accent)";
      statusMsg.textContent = "✓ Security credentials established! Verifying role privileges...";
      statusMsg.style.display = 'block';

      formSubmissionAttemptsCounter = 0;

      // 2. ROLE INTERCEPTOR ROUTER: Inspect the payload metadata arrays for clear admin variables
      const user = updateData?.user;
      const userRole = user?.app_metadata?.role || user?.user_metadata?.role || "client";
      
      let targetDashboard = "client-dashboard.html";
      if (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "administrator") {
        targetDashboard = "admin-dashboard.html";
      }

      const baseRoot = window.productionRootUrl || window.location.origin;
      const finalDestinationUrl = `${baseRoot}/${targetDashboard}?login_hint=${encodeURIComponent(trackingToken)}&status=activated`;

      // 3. Destruct the token session state tracking securely and fire execution links
      client.auth.signOut().then(() => {
        window.location.replace(finalDestinationUrl);
      }).catch(() => {
        window.location.replace(finalDestinationUrl);
      });

    } catch (err) {
      console.error(err);
      passField.classList.add('field-error');
      statusMsg.style.color = "var(--error)";
      statusMsg.textContent = `Update Halted: ${err.message || err}`;
      statusMsg.style.display = 'block';
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});
