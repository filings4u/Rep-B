
(function () {
  "use strict";
  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const rawSessionJson = localStorage.getItem(sessionTokenKey);
  let isAuthenticated = false;
  let userRole = null;

  if (rawSessionJson) {
    try {
      const sessionData = JSON.parse(rawSessionJson);
      if (sessionData && sessionData.access_token) {
        isAuthenticated = true;
        if (sessionData.user && sessionData.user.user_metadata) {
          userRole = sessionData.user.user_metadata.role;
        }
        if (sessionData.user && !userRole && sessionData.user.email) {
          if (String(sessionData.user.email).toLowerCase().endsWith("@filings4u.com")) {
            userRole = "admin";
          }
        }
      }
    } catch (error) {
      console.error("Security parsing failure:", error);
    }
  }

  const pagePathString = window.location.pathname.toLowerCase();
  const isAdminViewPage = pagePathString.includes("/admin-");

  if (!isAuthenticated) {
    document.documentElement.style.display = "none";
    window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
    throw new Error("Authentication required.");
  }

  if (isAdminViewPage && userRole !== "admin") {
    document.documentElement.style.display = "none";
    window.location.replace("client-dashboard.html");
    throw new Error("Administrator role required.");
  }
})();


document.addEventListener("DOMContentLoaded", async () => {
      "use strict";

      // 1. Resolve Strict DOM Form and Input Element Targets
      const envForm       = document.getElementById("globalEnvironmentSettingsForm");
      const maintenanceIn = document.getElementById("settingMaintenanceMode");
      const stripeUrlIn   = document.getElementById("settingStripeWebhookUrl");
      const mailUrlIn     = document.getElementById("settingMailGatewayUrl");
      const envStatusDiv  = document.getElementById("env-settings-status");
      const envSubmitBtn  = document.getElementById("envSubmitBtn");

      const priceForm     = document.getElementById("globalPricingSettingsForm");
      const feeStarterIn  = document.getElementById("feeStarterPlan");
      const feePremiumIn  = document.getElementById("feePremiumPlan");
      const feeDisburseIn = document.getElementById("feeDisbursementBaseline");
      const priceStatusDiv = document.getElementById("price-settings-status");
      const priceSubmitBtn = document.getElementById("priceSubmitBtn");

      if (!envForm || !priceForm || !envStatusDiv || !priceStatusDiv || !envSubmitBtn || !priceSubmitBtn) {
        throw new Error("✕ Critical UI Error: Form controls or operational status blocks are missing from document layout.");
      }

      // 2. Fetch Global Database Instance Connections
      const client = window.supabaseInstance || window.supabaseClient;
      if (!client || typeof client.from !== 'function') {
        throw new Error("✕ Initialization Error: Supabase client infrastructure missing from global window context.");
      }

      // --- STAGE 1: HYDRATE INITIAL ENVIRONMENT FIELDS FROM THE SETTINGS MATRIX ---
      async function populatePlatformConfigurations() {
        try {
          console.log("📡 [Settings Engine] Syncing existing configuration row keys from server tables...");
          
          // 🟢 DIRECT DB FETCH: Extract system configurations from a single configuration record cell
          const { data: settingsArray, error: fetchError } = await client
            .from('global_platform_settings')
            .select('*')
            .limit(1);

          if (fetchError) throw fetchError;

          if (settingsArray && settingsArray.length > 0) {
            const config = settingsArray[0];
            
            // Populating environment configuration elements cleanly
            maintenanceIn.value = String(config.maintenance_mode_interlock_active || 'false');
            stripeUrlIn.value   = config.stripe_webhook_receiver_url || "";
            mailUrlIn.value     = config.transactional_email_endpoint_url || "";
            
            // Populating price field index parameters safely
            feeStarterIn.value  = parseFloat(config.starter_base_processing_fee || 99.00).toFixed(2);
            feePremiumIn.value  = parseFloat(config.premium_suite_processing_fee || 299.00).toFixed(2);
            feeDisburseIn.value = parseFloat(config.state_disbursement_baseline_fee || 50.00).toFixed(2);
            
            console.log("✓ [Settings Engine] Environment row properties mapped completely onto UI.");
          }
        } catch (syncFault) {
          console.warn("⚠ [Settings Engine] Initial configuration blank or unassigned: ", syncFault.message);
        }
      }

      // --- STAGE 2: PROCESS ENVIRONMENT VARIABLES FORM SAVES ---
      envForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        envStatusDiv.style.display = "none";

        const maintenanceMode = maintenanceIn.value === "true";
        const stripeWebhookUrl = stripeUrlIn.value.trim();
        const emailGatewayUrl = mailUrlIn.value.trim();

        if (!stripeWebhookUrl || !emailGatewayUrl) {
          envStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          envStatusDiv.textContent = "✕ Validation Error: Environment gateway target inputs cannot evaluate to empty.";
          return;
        }

        envSubmitBtn.disabled = true;
        
        try {
          console.log("📡 [Settings Engine] Registering updated environment flags to server...");
          const { error: upsertError } = await client
            .from('global_platform_settings')
            .upsert({
              id: 1, // Enforces single target configuration cell row locking overrides
              maintenance_mode_interlock_active: maintenanceMode,
              stripe_webhook_receiver_url: stripeWebhookUrl,
              transactional_email_endpoint_url: emailGatewayUrl,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (upsertError) throw upsertError;

          envStatusDiv.style.cssText = "display:block; background:#ecfdf5; color:#047857;";
          envStatusDiv.textContent = "✓ Environment variable parameters successfully locked into global configuration grids.";
        } catch (fault) {
          console.error("✕ Environment patch transaction declined: ", fault.message);
          envStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          envStatusDiv.textContent = `✕ Server Transaction Error: ${fault.message}`;
        } finally {
          envSubmitBtn.disabled = false;
        }
      });

      // --- STAGE 3: PROCESS PRICING COEFFICIENTS MATRIX UPDATES ---
      priceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        priceStatusDiv.style.display = "none";

        const starterFee = parseFloat(feeStarterIn.value);
        const premiumFee = parseFloat(feePremiumIn.value);
        const disburseFee = parseFloat(feeDisburseIn.value);

        if (isNaN(starterFee) || isNaN(premiumFee) || isNaN(disburseFee)) {
          priceStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          priceStatusDiv.textContent = "✕ Validation Error: Pricing coefficients must be valid numeric constraints.";
          return;
        }

        priceSubmitBtn.disabled = true;

        try {
          console.log("📡 [Settings Engine] Deploying updated pricing matrix matrices to server tables...");
          const { error: upsertError } = await client
            .from('global_platform_settings')
            .upsert({
              id: 1,
              starter_base_processing_fee: starterFee,
              premium_suite_processing_fee: premiumFee,
              state_disbursement_baseline_fee: disburseFee,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (upsertError) throw upsertError;

          priceStatusDiv.style.cssText = "display:block; background:#ecfdf5; color:#047857;";
          priceStatusDiv.textContent = "✓ Success! Package processing matrix variables recompiled and pushed live.";
        } catch (fault) {
          console.error("✕ Pricing matrix save request refused: ", fault.message);
          priceStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          priceStatusDiv.textContent = `✕ Server Transaction Error: ${fault.message}`;
        } finally {
          priceSubmitBtn.disabled = false;
        }
      });

      // Execute configuration data check cycles immediately on loading context threads
      await populatePlatformConfigurations();
    });
