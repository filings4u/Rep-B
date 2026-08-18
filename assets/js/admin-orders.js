
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


window.CENTRAL_SERVICE_PLAN_DB = window.CENTRAL_SERVICE_PLAN_DB || {};
window.FILINGS4U_GOVERNMENT_PRICING = window.FILINGS4U_GOVERNMENT_PRICING || {};

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const orderForm = document.getElementById("phoneCheckoutOrderForm");
  const strategySelect = document.getElementById("phonePaymentStrategy");
  const terminalFrame = document.getElementById("stripeCardTerminalContainerFrame");
  const statusSlat = document.getElementById("moto-checkout-status-slat");
  const processBtn = document.getElementById("motoProcessBtn");
  const tableBody = document.getElementById("admin-orders-stream-rows");

  // Price Calculation Selection Elements Mapping Nodes
  const serviceSelect = document.getElementById("phoneServiceTitle");
  const planSelect = document.getElementById("phonePlanTier");
  const stateSelect = document.getElementById("phoneFilingState");
  const upsellSelect = document.getElementById("phoneUpsellSelection");
  const priceOverrideField = document.getElementById("phoneOverrideCost");

  let liveOrdersChannel = null;

  // Establish Supabase Connection Handshake Properties
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }
  if (!client) return;

  // Initialize Sandbox Stripe Card Fields Mount
  let stripe = null, elements = null, cardElement = null;
  if (typeof Stripe !== 'undefined') {
    stripe = Stripe('pk_test_placeholder_key_abc123');
    elements = stripe.elements();
    cardElement = elements.create('card', { style: { base: { fontSize: '14px', color: '#0f172a' } } });
    cardElement.mount('#secureCardElementContainer');
  }
  // 🟢 LIVE UI INTERCEPTOR: Toggles Stripe payment container visibility based on active strategy choices
  if (strategySelect && terminalFrame) {
    strategySelect.addEventListener("change", () => {
      if (strategySelect.value === "stripe_live") {
        terminalFrame.style.setProperty("display", "flex", "important");
      } else {
        terminalFrame.style.setProperty("display", "none", "important");
      }
    });
    
    // Execute an initial pass to align visibility with the page entry selection
    if (strategySelect.value === "stripe_live") {
      terminalFrame.style.setProperty("display", "flex", "important");
    } else {
      terminalFrame.style.setProperty("display", "none", "important");
    }
  }

  function displayStatusMessage(text, isError) {
    if (!statusSlat) return;
    statusSlat.textContent = text;
    statusSlat.style.display = "block";
    statusSlat.style.background = isError ? "#fee2e2" : "#ecfdf5";
    statusSlat.style.color = isError ? "#991b1b" : "#047857";
    statusSlat.style.border = `1px solid ${isError ? '#fca5a5' : '#a7f3d0'}`;
  }

  function escapeMotoHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // REAL-TIME SYNC OVER THE AIR FOR TRANSACTIONS TABLES
  async function bindLiveOrdersRealtimeFeed() {
    if (liveOrdersChannel) liveOrdersChannel.unsubscribe();
    liveOrdersChannel = client
      .channel('admin-dashboard-orders-live-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_orders' }, async () => {
        await loadRecentDashboardOrdersFeed();
      })
      .subscribe();
  }

  // Load ledger records and subscribe to over-the-air database updates instantly
  await loadRecentDashboardOrdersFeed();
  await bindLiveOrdersRealtimeFeed();


   // 🟢 FIXED HANDSHAKE: Syncs HTML drop-downs directly with the real database records
  function syncGlobalPricingMatrixData() {
    if (!serviceSelect || !stateSelect || !planSelect) return;

    // Convert display value text securely to the dictionary's explicit hyphenated keys
    const rawService = serviceSelect.value || "";
    const currentService = rawService.replace(/\s+/g, ' ').trim().toLowerCase()
      .replace("corporations (c/s-corp)", "corporations")
      .replace("nonprofit organization", "nonprofits")
      .replace("foreign qualification certificate", "foreign-qualification")
      .replace("foreign qualification", "foreign-qualification")
      .replace("certificate of good standing", "certificate-of-good-standing")
      .replace("llc reinstatement processing", "llc-reinstatement")
      .replace("annual reports", "annual-reports")
      .replace("operating agreement", "operating-agreement")
      .replace("registered agent", "registered-agent")
      .replace("business licenses", "business-licenses")
      .replace("entity dissolution", "dissolution")
      .replace("employer id (ein)", "employer-id-ein")
      .replace("cage code", "cage-code")
      .replace("duns number procurement", "duns-number")
      .replace("owner operators trucker authority", "owner-operators")
      .replace("broker authority", "broker-authority")
      .replace("ucr registration", "ucr-registration")
      .replace("scac code registration", "scac-code")
      .replace("dot consortium", "dot-consortium")
      .replace("driver qualification file", "driver-file")
      .replace("process agent (boc-3)", "process-agents-boc-3")
      .replace("ifta registration", "ifta-registration")
      .replace("hazmat registration", "hazmat-registration")
      .replace("licenses & permits", "dot-permits")
      .replace("federal income tax", "federal-tax")
      .replace("franchise tax filing", "franchise-tax")
      .replace("sales tax registration", "sales-tax-registration")
      .replace("apostille authentication services", "apostille-services");

    // Pull values straight out of window.CENTRAL_SERVICE_PLAN_DB and write onto options
    if (window.CENTRAL_SERVICE_PLAN_DB[currentService]) {
      const servicePlanMap = window.CENTRAL_SERVICE_PLAN_DB[currentService];
      Array.from(planSelect.options).forEach(opt => {
        let tierKey = opt.value.toLowerCase().trim();
        if (tierKey === "premium") tierKey = "compliance"; // 🟢 Maps HTML premium selection straight to your real database compliance row

        if (servicePlanMap[tierKey] !== undefined) {
          opt.setAttribute('data-price', servicePlanMap[tierKey]);
        }
      });
    }

    // Pull values straight out of window.FILINGS4U_GOVERNMENT_PRICING and write onto options
    if (window.FILINGS4U_GOVERNMENT_PRICING && window.FILINGS4U_GOVERNMENT_PRICING[currentService]) {
      const stateFeesMap = window.FILINGS4U_GOVERNMENT_PRICING[currentService];
      Array.from(stateSelect.options).forEach(opt => {
        const stateKey = opt.value.toUpperCase().trim();
        if (stateFeesMap[stateKey] !== undefined) {
          opt.setAttribute('data-price', stateFeesMap[stateKey]);
        } else if (stateFeesMap["DEFAULT"] !== undefined) {
          opt.setAttribute('data-price', stateFeesMap["DEFAULT"]);
        } else {
          opt.setAttribute('data-price', "0.00");
        }
      });
    }
  }

   // 🟢 ENTERPRISE MATRIX CALCULATION ENGINE: Manages multi-tier pricing blocks natively
  function computeMOTOInvoicePricing() {
    const serviceSelect = document.getElementById("phoneServiceTitle");
    const stateSelect = document.getElementById("phoneFilingState");
    const upsellSelect = document.getElementById("phoneUpsellSelection");
    const priceOverrideField = document.getElementById("phoneOverrideCost");

    if (!serviceSelect || !stateSelect || !upsellSelect || !priceOverrideField) return;

    // 1. Resolve raw price metrics attached inline to the current service selection option node
    const selectedServiceOption = serviceSelect.options[serviceSelect.selectedIndex];
    
    const starterPrice = parseFloat(selectedServiceOption ? selectedServiceOption.getAttribute('data-starter') || 0 : 0);
    const compliancePrice = parseFloat(selectedServiceOption ? selectedServiceOption.getAttribute('data-compliance') || 0 : 0);
    const enterprisePrice = parseFloat(selectedServiceOption ? selectedServiceOption.getAttribute('data-enterprise') || 0 : 0);

    // 2. Refresh text label amounts inside the side-by-side option cards instantly
    const starterLbl = document.getElementById("price-lbl-starter");
    const complianceLbl = document.getElementById("price-lbl-compliance");
    const enterpriseLbl = document.getElementById("price-lbl-enterprise");

    if (starterLbl) starterLbl.textContent = `$${starterPrice.toFixed(2)}`;
    if (complianceLbl) complianceLbl.textContent = `$${compliancePrice.toFixed(2)}`;
    if (enterpriseLbl) enterpriseLbl.textContent = `$${enterprisePrice.toFixed(2)}`;

    // 3. Pin down the active radio selection out of the card cluster array
    const activeRadio = document.querySelector('input[name="enterpriseTierSelection"]:checked');
    const activeTier = activeRadio ? activeRadio.value : 'starter';

    let baseRate = starterPrice;
    if (activeTier === 'compliance') baseRate = compliancePrice;
    if (activeTier === 'enterprise') baseRate = enterprisePrice;

    // 4. Update card selection borders visually to match user input actions
    ['starter', 'compliance', 'enterprise'].forEach(tier => {
      const card = document.getElementById(`card-${tier}`);
      if (card) {
        if (tier === activeTier) {
          card.style.borderColor = "var(--moto-emerald, #10b981)";
          card.style.background = "#f0fdf4";
        } else {
          card.style.borderColor = "#cbd5e1";
          card.style.background = "#ffffff";
        }
      }
    });

    // 5. Extract jurisdiction regional state outlays
    const selectedStateOption = stateSelect.options[stateSelect.selectedIndex];
    const stateSurcharge = parseFloat(selectedStateOption ? selectedStateOption.getAttribute('data-price') || 0 : 0);

    // 6. Compile selected multi-add-ons parameters
    let upsellTotal = 0.00;
    Array.from(upsellSelect.selectedOptions).forEach(opt => {
      upsellTotal += parseFloat(opt.getAttribute('data-price') || 0);
    });

    // 7. Sum up absolute calculations
    const aggregateTotal = baseRate + stateSurcharge + upsellTotal;

    // 8. Flash calculations onto visual layout view elements
    const baseCostEl = document.getElementById("calcBaseCost");
    const stateCostEl = document.getElementById("calcStateCost");
    const upsellCostEl = document.getElementById("calcUpsellCost");
    const aggregateCostEl = document.getElementById("calcTotalAggregate");

    if (baseCostEl) baseCostEl.textContent = `$${baseRate.toFixed(2)}`;
    if (stateCostEl) stateCostEl.textContent = `$${stateSurcharge.toFixed(2)}`;
    if (upsellCostEl) upsellCostEl.textContent = `$${upsellTotal.toFixed(2)}`;
    if (aggregateCostEl) aggregateCostEl.textContent = `$${aggregateTotal.toFixed(2)}`;

    // Push total calculations straight inside price override field box
    priceOverrideField.value = aggregateTotal.toFixed(2);
  }

  // 🟢 ATTENTIVE CHANGE REGISTRATION TRIGGER RAIL
  const trackingSelectors = [
    document.getElementById("phoneServiceTitle"),
    document.getElementById("phoneFilingState"),
    document.getElementById("phoneUpsellSelection")
  ];

  trackingSelectors.forEach(node => {
    if (node) node.addEventListener("change", computeMOTOInvoicePricing);
  });

  // Bind change listeners to your radio cluster cards dynamically
  document.querySelectorAll('input[name="enterpriseTierSelection"]').forEach(radio => {
    radio.addEventListener("change", computeMOTOInvoicePricing);
  });

  // Fire an immediate layout calculation sweep to establish start parameters
  computeMOTOInvoicePricing();



  // 📡 FETCH LIVE ENTRIES FROM PUBLIC.DASHBOARD_ORDERS FOR AUDITING RAIL
  async function loadRecentDashboardOrdersFeed() {
    if (!tableBody) return;
    try {
      const { data: records, error } = await client
        .from('dashboard_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!records || records.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:30px; font-style:italic;">No recorded transaction rows found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = "";
      records.forEach(row => {
        const tr = document.createElement("tr");
        const totalPaid = parseFloat(row.total_paid_amount || 0).toFixed(2);
        const isStripe = row.payment_collection_strategy === 'stripe_live';

        tr.innerHTML = `
          <td>
            <div style="font-weight:700; color:var(--moto-dark);">${escapeMotoHtml(row.first_name)} ${escapeMotoHtml(row.last_name)}</div>
            <div style="font-size:0.72rem; color:var(--moto-muted); font-family:monospace;">${row.email_address}</div>
          </td>
          <td style="font-weight:600; color:var(--moto-muted);">${escapeMotoHtml(row.company_name)}</td>
          <td style="font-family:monospace; font-weight:700; color:var(--moto-dark);">${escapeMotoHtml(row.tracking_number)}</td>
          <td style="font-family:monospace; font-weight:700; color:var(--moto-emerald);">$${totalPaid}</td>
          <td style="text-align:right;">
            <span style="background:${isStripe ? '#e0f2fe' : '#f1f5f9'}; color:${isStripe ? '#0369a1' : '#475569'}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${isStripe ? 'Stripe Gateway' : 'Offline'}</span>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("✕ Ledger load failure:", err);
    }
  }

  // 🚀 ENTERPRISE TRANSACTION HANDLING MODULE
  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Catch element mappings cleanly
      const serviceSelect = document.getElementById("phoneServiceTitle");
      const stateSelect = document.getElementById("phoneFilingState");
      const upsellSelect = document.getElementById("phoneUpsellSelection");
      const strategySelect = document.getElementById("phonePaymentStrategy");
      const priceOverrideField = document.getElementById("phoneOverrideCost");

      const fName = document.getElementById("phoneCustFirstName").value.trim();
      const lName = document.getElementById("phoneCustLastName").value.trim();
      const email = document.getElementById("phoneCustEmail").value.trim().toLowerCase();
      const phone = document.getElementById("phoneCustPhone").value.trim();
      const compName = document.getElementById("phoneCompanyName").value.trim();
      
      // 🟢 FIXED: Extracting the new geographic field data parameters from your template
      const streetVal = document.getElementById("phoneStreetAddress").value.trim();
      const cityVal = document.getElementById("phoneCity").value.trim();
      const stateVal = document.getElementById("phoneStateRegion").value;
      const zipVal = document.getElementById("phoneZipCode").value.trim();

      const activeService = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex].text : 'Not Specified';
      
      // 🟢 FIXED: Resolves the selected plan directly from the active card layout instead of a ghost selector
      const activeRadio = document.querySelector('input[name="enterpriseTierSelection"]:checked');
      const activePlan = activeRadio ? activeRadio.value : 'starter';
      
      const finalAmount = parseFloat(priceOverrideField ? priceOverrideField.value || 0 : 0);
      const strategy = strategySelect ? strategySelect.value : 'stripe_live';

      // 🟢 FIXED: Verifies that all required fields are full before execution loops run
      if (!fName || !lName || !email || !phone || !compName || !streetVal || !cityVal || !stateVal || !zipVal) {
        displayStatusMessage("✕ Validation error: Customer tracking strings and billing coordinates must be fully populated.", true);
        return;
      }

      if (processBtn) {
        processBtn.disabled = true;
        processBtn.textContent = "Authorizing transaction ledger transaction... 📡";
      }

      try {
        let resolvedStripeChargeToken = "ch_offline_logged_" + Date.now();

        // COMPLIMENTARY/FREE GUARD: Bypasses Stripe token creation if logged without payment or $0.00 total
        if (strategy === 'stripe_live' && stripe && cardElement) {
          if (finalAmount > 0) {
            const { token, error } = await stripe.createToken(cardElement);
            if (error) throw new Error(`Stripe Gateway Fault: ${error.message}`);
            resolvedStripeChargeToken = token.id;
          } else {
            resolvedStripeChargeToken = "ch_free_tier_auth_" + Date.now();
          }
        } else {
          resolvedStripeChargeToken = "ch_offline_bypass_" + Date.now();
        }

        // 🟢 FIXED: Compiles the selected upsell multi-list variable before referencing it in payload
        const selectedUpsellsList = upsellSelect ? Array.from(upsellSelect.selectedOptions).map(o => o.text).join(", ") : "None";
        const randomTrackingCode = "F4U-SALE-" + Math.floor(100000 + Math.random() * 900000);

        // 📡 FIRST: Fire the direct background tunnel request to your Edge Function
        console.log("📡 [Auth Engine] Invoking workspace edge tunnel...");
        const edgeResponse = await fetch("https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/dashboard-orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${client.supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"}`
          },
          body: JSON.stringify({
            email_address: email,
            first_name: fName,
            last_name: lName,
            company_name: compName,
            selected_service: activeService,
            selected_plan: activePlan
          })
        });

        const isAccountProvisioned = edgeResponse.ok ? "true" : "false";

        // 🟢 FIXED: Transmits the real billing address data to matching columns instead of hardcoded strings
        const databasePayload = {
          tracking_number: randomTrackingCode,
          first_name: fName,
          last_name: lName,
          email_address: email,
          phone_number: phone,
          company_name: compName,
          selected_service: activeService,
          selected_plan: activePlan,
          total_paid_amount: finalAmount,
          stripe_payment_id: resolvedStripeChargeToken,
          payment_collection_strategy: strategy,
          selected_upsells: selectedUpsellsList,
          poa_signature: "MOTO-Merchant-Assigned",
          poa_execution_stamp: new Date().toISOString(),
          account_created: isAccountProvisioned,
          form_payload: "{}",
          street_address: streetVal,
          city: cityVal,
          state: stateVal,
          zip_code: zipVal
        };


        // STEP 2: Commit the complete record cleanly to public.dashboard_orders database ledger
        const { error: insertError } = await client
          .from('dashboard_orders')
          .insert([databasePayload]);

        if (insertError) throw insertError;


        displayStatusMessage(`✓ Success! Transaction committed to ledger. Tracking: [${randomTrackingCode}]`, false);
        orderForm.reset();
        if (cardElement) cardElement.clear();
        
        computeMOTOInvoicePricing();
        if (typeof loadRecentDashboardOrdersFeed === 'function') await loadRecentDashboardOrdersFeed();

      } catch (fault) {
        console.error(fault);
        displayStatusMessage(`✕ Transaction Aborted: ${fault.message}`, true);
      } finally {
        if (processBtn) {
          processBtn.disabled = false;
          processBtn.textContent = "Authorize Terminal Payment & Commit Records ➔";
        }
      }
    });
  }


  function displayStatusMessage(text, isError) {
    if (!statusSlat) return;
    statusSlat.textContent = text;
    statusSlat.style.display = "block";
    statusSlat.style.background = isError ? "#fee2e2" : "#ecfdf5";
    statusSlat.style.color = isError ? "#991b1b" : "#047857";
    statusSlat.style.border = `1px solid ${isError ? '#fca5a5' : '#a7f3d0'}`;
  }

  function escapeMotoHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // REAL-TIME SYNC OVER THE AIR FOR TRANSACTIONS TABLES
  async function bindLiveOrdersRealtimeFeed() {
    if (liveOrdersChannel) liveOrdersChannel.unsubscribe();
    liveOrdersChannel = client
      .channel('admin-dashboard-orders-live-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_orders' }, async () => {
        await loadRecentDashboardOrdersFeed();
      })
      .subscribe();
  }

  await loadRecentDashboardOrdersFeed();
  await bindLiveOrdersRealtimeFeed();

  // 🟢 COMPONENT KEY BRIDGE: Converts dropdown option text directly to database dictionary keys
  function normalizeDropdownValueToMatrixKey(displayValue) {
    if (!displayValue) return "";
    const cleanString = displayValue.replace(/\s+/g, ' ').trim().toLowerCase();
    
    const operationalBridgeMap = {
      "llc formation": "llc-formation",
      "corporations (c/s-corp)": "corporations",
      "series llc": "series-llc",
      "sole proprietorship": "sole-proprietorship",
      "dba registration": "dba-registration",
      "nonprofit organization": "nonprofits",
      "foreign qualification": "foreign-qualification",
      "certificate of good standing": "certificate-of-good-standing",
      "llc reinstatement processing": "llc-reinstatement",
      "annual reports": "annual-reports",
      "operating agreement": "operating-agreement",
      "registered agent": "registered-agent",
      "business licenses": "business-licenses",
      "entity dissolution": "dissolution",
      "employer id (ein)": "employer-id-ein",
      "cage code": "cage-code",
      "duns number procurement": "duns-number",
      "owner operators trucker authority": "owner-operators",
      "broker authority": "broker-authority",
      "ucr registration": "ucr-registration",
      "scac code registration": "scac-code",
      "dot consortium": "dot-consortium",
      "driver qualification file": "driver-file",
      "process agent (boc-3)": "process-agents-boc-3",
      "ifta registration": "ifta-registration",
      "hazmat registration": "hazmat-registration",
      "licenses & permits": "dot-permits",
      "federal income tax": "federal-tax",
      "franchise tax filing": "franchise-tax",
      "sales tax registration": "sales-tax-registration",
      "apostille authentication services": "apostille-services",
      "web design": "web-design",
      "logo_design": "logo-design"
    };
    return operationalBridgeMap[cleanString] || cleanString;
  }
});
