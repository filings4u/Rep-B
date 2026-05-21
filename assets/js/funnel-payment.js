/** * ========================================================================== * 💰 FILINGS4U DEDICATED FUNNEL TRANSACTION CONTROLLER (ANTI-COLLISION BUILD) * ========================================================================== */ 
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

    // 🔄 FIXED: Dynamically extract values from active typed fields to prevent blank handoffs
    const liveEmailField = document.querySelector('input[type="email"]') || document.getElementById('custom_customer_email') || document.getElementById('email');
    const liveCompanyField = document.getElementById('company_name') || document.getElementById('custom_company_name') || document.querySelector('input[placeholder*="Company"]');

    const runtimeEmail = liveEmailField ? liveEmailField.value.trim() : globalCachedUserEmail;
    const runtimeCompany = liveCompanyField ? liveCompanyField.value.trim() : globalCachedCompanyName;

    // Build Payload with fresh live values
    const pendingOrderPayload = { 
        company_name: runtimeCompany || 'Registration Profile', 
        customer_email: runtimeEmail || 'guest-checkout@filings4u.com', 
        price: finalPriceSum, 
        plan: serviceKey + '-' + verifiedPlanTier, 
        metadata: collectedCustomMetaData 
    }; 

    // 📦 STEP A: WRITE TO SESSION STORAGE 
    sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrderPayload)); 

    try { 
        // 1. Activate the loading state immediately to show feedback to the user 
        if (secureLoader) { 
            secureLoader.classList.add("is-active"); 
        } 

        // 2. FORCE the code to wait for the cloud save engine to completely resolve 
        if (typeof saveDraftProgressToCloudEngine === 'function') { 
            console.log("Saving final funnel state to cloud logs..."); 
            await saveDraftProgressToCloudEngine(3); 
        } 

        // 3. 🚀 STEP B: ROUTE TO CHECKOUT ONLY AFTER SECURE RECORDING IS COMPLETE 
        console.log("Data locked. Redirecting to secure order workspace..."); 
        window.location.href = 'order.html'; 
    } catch (err) { 
        // Drop the overlay loader so the user can try clicking submit again 
        if (secureLoader) { 
            secureLoader.classList.remove("is-active"); 
        } 
        console.error("Filing transmission error caught:", err); 
        alert('Order execution fault: ' + err.message); 
    } 
}
