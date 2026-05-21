/**
 * ==========================================================================
 * 💰 FILINGS4U DEDICATED FUNNEL TRANSACTION CONTROLLER
 * ==========================================================================
 */

async function executeFinalFunnelOrderPaymentSubmit() {
  const check = document.getElementById('poa_checkbox');
  const sig = document.getElementById('poa_signature_input');
  
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
  const allDynamicInputs = document.querySelectorAll('#extra-government-inputs-hook .custom-dynamic-input');
  allDynamicInputs.forEach(input => {
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
  allDynamicInputs.forEach(element => {
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

  sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrderPayload));

  try {
    if (typeof saveDraftProgressToCloudEngine === 'function') {
      await saveDraftProgressToCloudEngine(3);
    }
    
    const baseTargetUrl = window.productionRootUrl || window.location.origin;
    const structuralReturnUrl = baseTargetUrl + '/portal-dashboard.html?email=' + cleanEscapedEmail + '&session_id={CHECKOUT_SESSION_ID}';
    
    console.log("🚀 Initializing secure Stripe Checkout session transmission...");

    // ROUTED DIRECTLY TO THE LIVE STRIPE-CHECKOUT CONTROLLER
    const response = await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/stripe-webhook', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

    if (data.clientSecret) {
      window.location.href = 'order.html';
    } else if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Mismatched integration secret tracking keys.");
    }

  } catch (err) {
    console.error("Filing transmission error caught:", err);
    alert('Order execution fault: ' + err.message);
  }

  // Add these handling triggers directly inside your executeFinalFunnelOrderPaymentSubmit() try-catch routine:

  try {
    // 1. Fetch DOM tracker elements instantly
    const secureLoader = document.getElementById("checkoutLoadingOverlay");
    
    // Push form data values to your backend tracking logs before loading stripe
    if (typeof saveDraftProgressToCloudEngine === 'function') {
      await saveDraftProgressToCloudEngine(3);
    }
    
    // 2. ACTIVATE LOADING BACKDROP: Locks screen from secondary button taps
    if (secureLoader) {
      secureLoader.classList.add("is-active");
    }
    
    const baseTargetUrl = window.productionRootUrl || window.location.origin;
    const structuralReturnUrl = baseTargetUrl + '/portal-dashboard.html?email=' + cleanEscapedEmail + '&session_id={CHECKOUT_SESSION_ID}';
    
    console.log("🚀 Initializing secure Stripe Checkout session transmission...");

    const response = await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/stripe-webhook', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

    // 🚀 CLIENT REDIRECT REDIRECTION HANDOFFS
    if (data.clientSecret) {
      window.location.href = 'order.html';
    } else if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Mismatched integration secret tracking keys.");
    }

  } catch (err) {
    // 3. FAULT FALLBACK: Instantly drop the loading panel if the gateway breaks so users can see the notice
    const secureLoader = document.getElementById("checkoutLoadingOverlay");
    if (secureLoader) {
      secureLoader.classList.remove("is-active");
    }

    console.error("Filing transmission error caught:", err);
    alert('Order execution fault: ' + err.message);
  }

}
