
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

  // Left Section Element Reference Targets Hooks
  const serviceSelect = document.getElementById("phoneServiceTitle");
  const stateSelect = document.getElementById("invoiceJurisdictionStateSelect");
  const stateSurchargeBadge = document.getElementById("stateFeesDisplayBadge");
  const upsellsWrapper = document.getElementById("invoiceUpsellsCheckboxGroupWrapper");
  const compileItemsBtn = document.getElementById("invoiceCompileItemsToLedgerActionBtn");
  const tierCards = document.querySelectorAll(".dynamic-tier-btn");

  // Right Section Element Reference Targets Hooks
  const canvasInvoiceCodeLabel = document.getElementById("canvasInvoiceCodeLabel");
  const canvasTableBody = document.getElementById("invoiceCanvasItemsTableBodyLogs");
  const clientDropdown = document.getElementById("invoiceTargetClientDropdownSelector");
  const graceDateInput = document.getElementById("invoicePaymentGraceLimitDate");
  const subtotalRegister = document.getElementById("registerInvoiceSubtotalString");
  const grandTotalRegister = document.getElementById("registerInvoiceGrandTotalString");
  const discountInput = document.getElementById("invoiceManualDiscountInput");
  const taxInput = document.getElementById("invoiceTaxRegisterPercentageInput");
  const submitInvoiceBtn = document.getElementById("invoiceSubmitDispatchActionBtn");
  const statusBanner = document.getElementById("invoiceStatusAlertBanner");

  // Memory Datastore Collection Caches
  let cachedServicesCatalog = [];
  let cachedStateFeesCatalog = [];
  let cachedUpsellsCatalog = [];
  let activeCompiledInvoiceItemsArray = [];
  let currentlySelectedTier = "starter";

  const client = window.supabaseInstance || window.supabaseClient;
  if (!client) return;

  // Generate Unique Invoice Token Identifier Code 
  const randomInvoiceCode = "INV-" + Math.floor(100000 + Math.random() * 900000);
  if (canvasInvoiceCodeLabel) canvasInvoiceCodeLabel.textContent = randomInvoiceCode;

  // --- STAGE 1: PARALLEL DATABASE CATALOG SYNCHRONIZER ENGINE ---
  async function downloadMasterBillingCatalogs() {
    try {
      console.log("📡 [Enterprise Biller] Hydrating dimensional master product tables...");
      
      const [servicesRes, statesRes, upsellsRes, profilesRes] = await Promise.all([
        client.from('services').select('*').order('service_title'),
        client.from('state_filing_fees').select('*').order('state_name'),
        client.from('platform_upsells').select('*').order('upsell_name'),
        client.from('client_profiles').select('id, email_address').order('email_address')
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (statesRes.error) throw statesRes.error;
      if (upsellsRes.error) throw upsellsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      cachedServicesCatalog = servicesRes.data || [];
      cachedStateFeesCatalog = statesRes.data || [];
      cachedUpsellsCatalog = upsellsRes.data || [];

       // Populate Services Dropdown Menu Groups Dynamically from Script Files
      if (serviceSelect) {
        // Core structure of your requested categories and option layouts
        serviceSelect.innerHTML = `
          <optgroup label="🏢 Entity Formation & Structuring">
            <option value="llc-formation">LLC Formation</option>
            <option value="corporations">Corporations (C/S-Corp)</option>
            <option value="sole-proprietorship">Sole Proprietorship</option>
            <option value="dba-registration">DBA Registration</option>
            <option value="nonprofits">Nonprofit Organization</option>
            <option value="series-llc">Series LLC</option>
          </optgroup>
          <optgroup label="📜 Corporate Maintenance & Compliance">
            <option value="foreign-qualification">Foreign Qualification</option>
            <option value="certificate-of-good-standing">Certificate of Good Standing</option>
            <option value="llc-reinstatement">LLC Reinstatement Processing</option>
            <option value="annual-reports">Annual Reports</option>
            <option value="operating-agreement">Operating Agreement</option>
            <option value="registered-agent">Registered Agent</option>
            <option value="business-licenses">Business Licenses</option>
            <option value="dissolution">Entity Dissolution</option>
          </optgroup>
            <optgroup label="🔑 Federal Tax & Corporate Identity">
            <option value="employer-id-ein">Employer ID (EIN)</option>
            <option value="cage-code">CAGE Code</option>
            <option value="duns-number">DUNS Number Procurement</option>
            <option value="minority-certificate">Minority Certificate</option>
          </optgroup>
          <optgroup label="🚛 Trucking Logistics & DOT Authority">
            <option value="owner-operators">Owner Operators Trucker Authority</option>
            <option value="broker-authority">Broker Authority</option>
            <option value="ucr-registration">UCR Registration</option>
            <option value="scac-code">SCAC Code Registration</option>
            <option value="dot-consortium">DOT Consortium</option>
            <option value="driver-file">Driver Qualification File</option>
            <option value="process-agents-boc-3">Process Agent (BOC-3)</option>
            <option value="ifta-registration">IFTA Registration</option>
            <option value="hazmat-registration">HAZMAT Registration</option>
            <option value="dot-permits">Licenses & Permits</option>
          </optgroup>
          <optgroup label="📊 Financial Services">
            <option value="federal-tax">Federal Income Tax</option>
            <option value="franchise-tax">Franchise Tax Filing</option>
            <option value="sales-tax-registration">Sales Tax Registration</option>
            <option value="apostille-services">Apostille Authentication Services</option>
          </optgroup>
          <optgroup label="🎨 Branding & Creative Services">
            <option value="web-design">Web Design Package</option>
            <option value="logo-design">Logo Design Package</option>
          </optgroup>
        `;

        console.log("⚡ [Invoice Studio] Intercepting dropdown rows to inject fluid external script price tiers...");

        // Resolve reference files handles safely
        const govPricingSource = window.FILINGS4U_GOVERNMENT_PRICING || {};
        const servicePlanSource = window.CENTRAL_SERVICE_PLAN_DB || {};

        // Loop through every freshly injected option element to map data attributes
        serviceSelect.querySelectorAll("option").forEach(opt => {
          const slug = opt.value;
          
          // Match object paths inside either file registry
          const match = servicePlanSource[slug] || govPricingSource[slug] || {};

          // Extract values fallback to 0.00 if unmapped
          const starterPrice = parseFloat(match.starter || match.base_price_starter || 0).toFixed(2);
          const compliancePrice = parseFloat(match.compliance || match.base_price_compliance || 0).toFixed(2);
          const enterprisePrice = parseFloat(match.enterprise || match.base_price_enterprise || 0).toFixed(2);

          // 🟢 AUTOMATED INJECTION: Append data nodes onto option targets live
          opt.setAttribute("data-starter", starterPrice);
          opt.setAttribute("data-compliance", compliancePrice);
          opt.setAttribute("data-enterprise", enterprisePrice);
        });

        // Set default row state selection cleanly on boot
        serviceSelect.value = "llc-formation";
      }


      // Populate State Jurisdictions Menu
      if (stateSelect) {
        stateSelect.innerHTML = `<option value="">-- No State Fees Applied --</option>`;
        cachedStateFeesCatalog.forEach(st => {
          const opt = document.createElement("option");
          opt.value = st.state_code;
          opt.textContent = `${st.state_name} (${st.state_code})`;
          stateSelect.appendChild(opt);
        });
      }

      // Populate Upsells Checklist Block Layout
      if (upsellsWrapper) {
        upsellsWrapper.innerHTML = "";
        cachedUpsellsCatalog.forEach(up => {
          const div = document.createElement("div");
          div.style.cssText = "display:flex; align-items:center; gap:8px; font-size:0.82rem; padding:2px 0;";
          div.innerHTML = `
            <input type="checkbox" class="invoice-upsell-checkbox" value="${up.upsell_slug}" id="up-${up.upsell_slug}" data-price="${up.price}" data-name="${up.upsell_name}">
            <label href="#up-${up.upsell_slug}" style="cursor:pointer; color:var(--text-dark); font-weight:600;">${up.upsell_name} <span style="color:var(--emerald);">(+$${parseFloat(up.price).toFixed(2)})</span></label>
          `;
          upsellsWrapper.appendChild(div);
        });
      }

      // Populate Recipient Profiles Dropdown
      if (clientDropdown && profilesRes.data) {
        clientDropdown.innerHTML = `<option value="">-- Choose Recipient Profile --</option>`;
        profilesRes.data.forEach(user => {
          const opt = document.createElement("option");
          opt.value = user.email_address;
          opt.dataset.uid = user.id;
          opt.textContent = user.email_address;
          clientDropdown.appendChild(opt);
        });
      }

      updatePricingTiersPreviews();

    } catch (fault) {
      console.error("✕ Master table hydration failed:", fault.message);
    }
  }

  // --- STAGE 2: PARALLEL DATABASE CATALOG SYNCHRONIZER ENGINE (FIXED MAPS) ---
  async function initializeStudioDataLayers() {
    try {
      console.log("📡 [Invoice Studio] Hydrating client metrics and structural table spaces...");
      
      const [profilesRes, statesRes, upsellsRes] = await Promise.all([
        client.from('client_profiles').select('id, email_address').order('email_address'),
        client.from('state_filing_fees').select('*').order('state_name'),
        client.from('platform_upsells').select('*').order('upsell_name')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      
      if (!statesRes.error && statesRes.data) cachedStateFeesCatalog = statesRes.data;

      // Populate Recipient Profiles Dropdown
      if (clientDropdown && profilesRes.data) {
        clientDropdown.innerHTML = `<option value="">-- Choose Recipient Profile --</option>`;
        profilesRes.data.forEach(user => {
          const opt = document.createElement("option");
          opt.value = user.email_address;
          opt.dataset.uid = user.id;
          opt.textContent = user.email_address;
          clientDropdown.appendChild(opt);
        });
      }

      // Populate State Jurisdictions Menu
      if (stateSelect && statesRes.data) {
        stateSelect.innerHTML = `<option value="">-- No State Fees Applied --</option>`;
        statesRes.data.forEach(st => {
          const opt = document.createElement("option");
          opt.value = st.state_code;
          opt.textContent = `${st.state_name} (${st.state_code})`;
          stateSelect.appendChild(opt);
        });
      }

      // Populate Upsells Checklist Block Layout
      if (upsellsWrapper && upsellsRes.data) {
        upsellsWrapper.innerHTML = "";
        upsellsRes.data.forEach(up => {
          const div = document.createElement("div");
          div.style.cssText = "display:flex; align-items:center; gap:8px; font-size:0.82rem; padding:2px 0;";
          div.innerHTML = `
            <input type="checkbox" class="invoice-upsell-checkbox" value="${up.upsell_slug}" id="up-${up.upsell_slug}" data-price="${up.price}" data-name="${up.upsell_name}">
            <label for="up-${up.upsell_slug}" style="cursor:pointer; color:var(--text-dark); font-weight:600;">${up.upsell_name} <span style="color:var(--emerald);">(+$${parseFloat(up.price).toFixed(2)})</span></label>
          `;
          upsellsWrapper.appendChild(div);
        });
      }

      // 🟢 RESOLVE SCRIPT REFERENCE POINTERS LIVE
      const govPricingSource = window.FILINGS4U_GOVERNMENT_PRICING || {};
      const servicePlanSource = window.CENTRAL_SERVICE_PLAN_DB || {};

      console.log("⚡ [Invoice Studio] Injecting external file prices straight onto drop-down options...");

      // Intercept options to parse custom configuration data files mapping attributes
      if (serviceSelect) {
        serviceSelect.querySelectorAll("option").forEach(opt => {
          const slug = opt.value;
          const match = servicePlanSource[slug] || govPricingSource[slug] || {};

          // Fallback seamlessly to hardcoded variables defaults if lookup tables match empty
          const sPrice = parseFloat(match.starter || match.base_price_starter || 0).toFixed(2);
          const cPrice = parseFloat(match.compliance || match.base_price_compliance || 0).toFixed(2);
          const ePrice = parseFloat(match.enterprise || match.base_price_enterprise || 0).toFixed(2);

          opt.setAttribute("data-starter", sPrice);
          opt.setAttribute("data-compliance", cPrice);
          opt.setAttribute("data-enterprise", ePrice);
        });
      }

      // 🟢 FORCE IMMEDIATE INTERFACE SYNC ON REBOOT
      updatePricingTiersPreviews();

    } catch (err) {
      console.error("✕ Ingestion failure:", err.message);
    }
  }


  // --- STAGE 3: COMPILE ITEMIZATIONS ONTO CANVAS LEDGER ---
  compileItemsBtn?.addEventListener("click", () => {
    const selectedSlug = serviceSelect.value;
    const svcMatch = cachedServicesCatalog.find(s => s.slug === selectedSlug);
    if (!svcMatch) return;

    let basePrice = 0;
    if (currentlySelectedTier === "starter") basePrice = parseFloat(svcMatch.base_price_starter || 0);
    else if (currentlySelectedTier === "compliance") basePrice = parseFloat(svcMatch.base_price_compliance || 0);
    else if (currentlySelectedTier === "enterprise") basePrice = parseFloat(svcMatch.base_price_enterprise || 0);

    // 1. Add Main Core Base Service Line
    activeCompiledInvoiceItemsArray.push({
      item_id: "svc_" + Date.now(),
      title: `${svcMatch.service_title} (${currentlySelectedTier.toUpperCase()})`,
      qty: 1,
      price: basePrice
    });

    // 2. Add State Surcharge Line if chosen
    if (stateSelect.value) {
      const stMatch = cachedStateFeesCatalog.find(s => s.state_code === stateSelect.value);
      if (stMatch && parseFloat(stMatch.corporate_surcharge) > 0) {
        activeCompiledInvoiceItemsArray.push({
          item_id: "state_" + Date.now(),
          title: `State Filing Surcharge: ${stMatch.state_name}`,
          qty: 1,
          price: parseFloat(stMatch.corporate_surcharge)
        });
      }
    }

    // 3. Add Selected Upsells Checklist Items
    upsellsWrapper.querySelectorAll(".invoice-upsell-checkbox:checked").forEach(cb => {
      activeCompiledInvoiceItemsArray.push({
        item_id: "up_" + Math.random().toString(36).substr(2, 5),
        title: `${cb.dataset.name}`,
        qty: 1,
        price: parseFloat(cb.dataset.price || 0)
      });
      cb.checked = false; // Clear checkbox check mark state locally
    });

    stateSelect.value = "";
    if (stateSurchargeBadge) stateSurchargeBadge.textContent = "+$0.00 Surcharge";

    renderItemizedInvoiceCanvas();
  });

  function renderItemizedInvoiceCanvas() {
    if (activeCompiledInvoiceItemsArray.length === 0) {
      canvasTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted); font-style:italic;">No line items compiled yet. Configure parameters on the left to begin.</td></tr>`;
      recalculateCanvasInvoiceTotals();
      return;
    }

    canvasTableBody.innerHTML = "";
    activeCompiledInvoiceItemsArray.forEach((item, index) => {
      const tr = document.createElement("tr");
      const itemTotal = item.qty * item.price;
      
      tr.innerHTML = `
        <td style="padding:10px; font-weight:600; color:var(--text-dark);">${escapeHtml(item.title)}</td>
        <td style="padding:10px; text-align:center;"><input type="number" class="form-input-control canvas-qty" value="${item.qty}" min="1" data-idx="${index}" style="width:100%; text-align:center; height:28px; padding:2px; background:#fff; border:1px solid #cbd5e1; border-radius:4px;"></td>
        <td style="padding:10px; text-align:right; font-family:monospace; font-weight:500;">$${parseFloat(item.price).toFixed(2)}</td>
        <td style="padding:10px; text-align:right; font-weight:700; color:var(--text-dark); font-family:monospace;">$${itemTotal.toFixed(2)}</td>
        <td style="padding:10px; text-align:center;"><button type="button" class="remove-canvas-line-btn" data-idx="${index}" style="background:none; border:none; color:var(--staff-red); font-weight:800; cursor:pointer; font-size:1.1rem;">✕</button></td>
      `;
      canvasTableBody.appendChild(tr);
    });

    // Bind item modifications sub-listeners inside canvas columns rows layout
    canvasTableBody.querySelectorAll(".canvas-qty").forEach(input => {
      input.addEventListener("input", function() {
        const idx = parseInt(this.dataset.idx);
        const nextQty = parseInt(this.value) || 1;
        activeCompiledInvoiceItemsArray[idx].qty = nextQty;
        renderItemizedInvoiceCanvas();
      });
    });

    canvasTableBody.querySelectorAll(".remove-canvas-line-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const idx = parseInt(this.dataset.idx);
        activeCompiledInvoiceItemsArray.splice(idx, 1);
        renderItemizedInvoiceCanvas();
      });
    });

    recalculateCanvasInvoiceTotals();
  }

  function recalculateCanvasInvoiceTotals() {
    let subtotalSum = 0;
    activeCompiledInvoiceItemsArray.forEach(item => {
      subtotalSum += (item.qty * item.price);
    });

    const manualDiscount = parseFloat(discountInput?.value || 0);
    const taxRatePercent = parseFloat(taxInput?.value || 0) / 100;
    
    let runningBalance = subtotalSum - manualDiscount;
    if (runningBalance < 0) runningBalance = 0;

    const totalCalculatedTaxAmount = runningBalance * taxRatePercent;
    const finalGrandTotalDue = runningBalance + totalCalculatedTaxAmount;

    if (subtotalRegister) subtotalRegister.textContent = `$${subtotalSum.toFixed(2)}`;
    if (grandTotalRegister) grandTotalRegister.textContent = `$${finalGrandTotalDue.toFixed(2)}`;
  }

  discountInput?.addEventListener("input", recalculateCanvasInvoiceTotals);
  taxInput?.addEventListener("input", recalculateCanvasInvoiceTotals);

  await downloadMasterBillingCatalogs();
  // --- STAGE 4: EMIT COMPLETE ENTERPRISE INVOICE RECORD PACKAGE ---
  submitInvoiceBtn?.addEventListener("click", async () => {
    if (statusBanner) statusBanner.style.display = "none";
    
    const selectedOpt = clientDropdown.options[clientDropdown.selectedIndex];
    const clientUid = selectedOpt?.dataset.uid;
    const targetEmail = clientDropdown.value;
    const invoiceCode = randomInvoiceCode;
    const dueDateVal = graceDateInput?.value;
    
    const rawSubtotal = parseFloat(subtotalRegister.textContent.replace('$', '')) || 0;
    const rawDiscount = parseFloat(discountInput?.value || 0);
    const rawTaxPercent = parseFloat(taxInput?.value || 0);
    const rawGrandTotal = parseFloat(grandTotalRegister.textContent.replace('$', '')) || 0;

    if (activeCompiledInvoiceItemsArray.length === 0) {
      showStudioStatusBanner("✕ Validation Failure: Cannot emit an empty invoice. Compile items on left first.", true);
      return;
    }
    if (!clientUid || !targetEmail || !dueDateVal) {
      showStudioStatusBanner("✕ Validation Failure: Please select a valid customer profile and choose a due date deadline.", true);
      return;
    }

    submitInvoiceBtn.disabled = true;
    submitInvoiceBtn.textContent = "Deploying Enterprise Ledger Row... 📡";

    try {
      console.log(`💾 [Invoice Studio] Compiling JSON lines array package data payload for code: [${invoiceCode}]`);

      // Write transaction row details straight into public.client_invoices table space
      const { error: insertError } = await client
        .from('client_invoices')
        .insert([{
          invoice_code: invoiceCode,
          client_id: clientUid,
          email_address: targetEmail.toLowerCase().trim(),
          subtotal: rawSubtotal,
          tax_percentage: rawTaxPercent,
          grand_total: rawGrandTotal,
          payment_status: 'Unpaid',
          due_date: dueDateVal,
          // Saves the complete structural itemized nested dictionary blocks array natively
          itemized_lines: activeCompiledInvoiceItemsArray,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      showStudioStatusBanner("✓ Success! Complete invoice record saved to backend table and secure payment notification email fired.", false);
      
      // Clean form containers back to defaults baseline definitions
      invoiceForm.reset();
      if (discountInput) discountInput.value = "0.00";
      if (taxInput) taxInput.value = "0";
      activeCompiledInvoiceItemsArray = [];
      
      renderItemizedInvoiceCanvas();
      
      // Auto-cycle a fresh new invoice code token reference mapping string for the next operation
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error("✕ Invoice emission rejected:", err.message);
      showStudioStatusBanner(`✕ Emission Failure: ${err.message}`, true);
      submitInvoiceBtn.disabled = false;
      submitInvoiceBtn.textContent = "Emit Complete Invoice & Dispatch Email Notification ➔";
    }
  });

  function showStudioStatusBanner(text, isError) {
    if (!statusBanner) return;
    statusBanner.textContent = text;
    statusBanner.style.display = "block";
    statusBanner.style.background = isError ? "#fef2f2" : "#ecfdf5";
    statusBanner.style.color = isError ? "#b91c1c" : "#047857";
  }
});
