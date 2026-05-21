/**
 * ==========================================================================
 * 💰 FILINGS4U DEDICATED FUNNEL TRANSACTION CONTROLLER (ANTI-COLLISION BUILD)
 * ==========================================================================
 */

async function executeFinalFunnelOrderPaymentSubmit() {
  const check = document.getElementById('poa_checkbox');
  const sig = document.getElementById('poa_signature_input');
  const secureLoader = document.getElementById("checkoutLoadingOverlay");
  
  if (sig) {
    sig.style.borderColor = '#e2e8f0';
    sig.style.boxShadow = 'none';
  }
  
  if (!check || !check.checked || !sig || !sig.value.trim()) {
    if (sig) {
      sig.style.borderColor = '#ef4444';
      sig.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
      sig.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    alert("Mandatory Verification: You must execute and sign the corporate Limited Power of Attorney to launch government processing.");
    return;
  }

  // Clear previous validation states
  const allFormInputs = document.querySelectorAll('#extra-government-inputs-hook .custom-dynamic-input');
  allFormInputs.forEach(input => {
    input.style.borderColor = '#e2e8f0';
    input.style.boxShadow = 'none';
  });

  let firstInvalidElement = null;
  const calculatedPriceEl = document.getElementById('cachedActivePrice');
  const calculatedPrice = calculatedPriceEl ? calculatedPriceEl.value : coreBasePrice;
  const verifiedPlanTierEl = document.getElementById('cached_plan_tier');
  const verifiedPlanTier = verifiedPlanTierEl ? verifiedPlanTierEl.value : 'compliance';
  const serviceKeyEl = document.getElementById('cached_service_key');
  const serviceKey = serviceKeyEl ? serviceKeyEl.value : 'llc-formation';

  let finalPriceSum = parseFloat(sessionStorage.getItem('rollingCalculatedSumPrice'));
  if (isNaN(finalPriceSum) || !finalPriceSum) {
    finalPriceSum = parseFloat(calculatedPrice) || 149.00;
  }

  const collectedCustomMetaData = {
    poa_signature_name: sig.value.trim(),
    compiled_poa_text: sessionStorage.getItem('compiledLegalPoaTextString') || ''
  };

  // Enforce runtime data input validation rules
  allFormInputs.forEach(element => {
    const val = element.value.trim();
    const isRequired = element.getAttribute('data-required') === 'true';

    if (isRequired && (!val || val === "")) {
      element.style.borderColor = '#ef4444';
      element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
      if (!firstInvalidElement) firstInvalidElement = element;
    } else if (val !== "") {
      const cleanId = element.id.replace('custom_', '');
      collectedCustomMetaData[cleanId] = val;
    }
  });

  if (firstInvalidElement) {
    firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { firstInvalidElement.focus(); }, 400);
    return;
  }

  const cleanEscapedEmail = encodeURIComponent(globalCachedUserEmail);
  const pendingOrderPayload = {
    company_name: globalCachedCompanyName,
    customer_email: globalCachedUserEmail,
    price: finalPriceSum,
    plan: serviceKey + '-' + verifiedPlanTier,
    metadata: collectedCustomMetaData
  };

  // 📦 SECURELY LOCK OBJECT DATA INTO SESSION STORAGE FOR ORDER.HTML TO READ
  sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrderPayload));

  try {
    // 1. Synchronize form values to cloud progress logs
    if (typeof saveDraftProgressToCloudEngine === 'function') {
      await saveDraftProgressToCloudEngine(3);
    }

    // 2. ACTIVATE LOADING BACKDROP OVERLAY OVER VIEWPORTS
    if (secureLoader) {
      secureLoader.classList.add("is-active");
    }

    const baseTargetUrl = window.productionRootUrl || window.location.origin;
    const structuralReturnUrl = baseTargetUrl + '/portal-dashboard.html?email=' + cleanEscapedEmail + '&session_id={CHECKOUT_SESSION_ID}';
    
    console.log("🚀 Initializing secure Stripe Checkout session transmission...");

    // The public anonymous credential token for project: lrbimrlbskjweynxlgas
    const projectAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU';

    // 3. RUN THE SINGLE SECURE CONNECTION HANDSHAKE
    const response = await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/stripe-checkout', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + projectAnonKey // 🔐 Clears authorization gate safely
      },
      body: JSON.stringify({
        action: 'checkout',
        email: globalCachedUserEmail,
        company_name: globalCachedCompanyName,
        amount: Math.round(finalPriceSum * 100),
        service_type: serviceKey + '-' + verifiedPlanTier,
        return_url: structuralReturnUrl
      })
    });

    if (!response.ok) throw new Error('Edge Function Response Error Status: ' + response.status);
    const data = await response.json();

    // 🚀 CLIENT ROUTING REDIRECTIONS
    if (data.clientSecret) {
      window.location.href = 'order.html';
    } else if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Mismatched integration secret tracking keys.");
    }

  } catch (err) {
    // 4. FAULT FALLBACK: Deactivate loading panel drawer if server drops down
    if (secureLoader) {
      secureLoader.classList.remove("is-active");
    }
    console.error("Filing transmission error caught:", err);
    alert('Order execution fault: ' + err.message);
  }
}

/**
 * ==========================================================================
 * 🔄 CHRONOLOGICAL RUNTIME POPULATOR FOR ORDER.HTML PANEL CARD
 * Runs automatically inside order.html page scope initialization
 * ==========================================================================
 */
function hydrateEmbeddedOrderSummaryDashboard() {
  const rawData = sessionStorage.getItem('pendingOrder');
  if (!rawData) return;

  const orderData = JSON.parse(rawData);

  // Read string primitives safely with fallback tokens
  const targetEmail = orderData.customer_email || 'guest-checkout@filings4u.com';
  const targetCompany = orderData.company_name || 'Registration Profile';
  const targetPrice = parseFloat(orderData.price) || 149.00;

  // Hydrate order summary DOM text boxes instantly
  const emailSummaryEl = document.getElementById('summary-customer-email');
  const companySummaryEl = document.getElementById('summary-company-name');
  const priceSummaryEl = document.getElementById('summary-price-display');

  if (emailSummaryEl) emailSummaryEl.innerText = targetEmail;
  if (companySummaryEl) companySummaryEl.innerText = targetCompany;
  if (priceSummaryEl) priceSummaryEl.innerText = `$${targetPrice.toFixed(2)}`;
}

// Attach script auto-hydration trigger to order page window context safely
if (window.location.pathname.includes("order.html")) {
  document.addEventListener("DOMContentLoaded", hydrateEmbeddedOrderSummaryDashboard);
}
