function calculateRealTimeSummaryMatrix() {
    const listTarget = document.getElementById('summary-items-list-target');
    const totalTarget = document.getElementById('summary-total-price-box');
    const docTarget = document.getElementById('dynamic-poa-document-body');
    if (!listTarget) return;

    const localBasePrice = parseFloat(sessionStorage.getItem('cached_coreBasePrice')) || 149.00;
    const localServiceTitle = sessionStorage.getItem('cached_chosenServiceTitle') || "Filing Setup";
    const localUpsellKeys = JSON.parse(sessionStorage.getItem('cached_selectedUpsellKeys') || "[]");
    const localCompanyName = sessionStorage.getItem('cached_globalCachedCompanyName') || "";
    const localUserEmail = sessionStorage.getItem('cached_globalCachedUserEmail') || "";

    listTarget.innerHTML = "";
    let rollingSum = localBasePrice;

    // Render configuration row values inside matching css classes
    listTarget.innerHTML += `
        <div class="summary-item-row">
            <strong>${localServiceTitle}</strong>
            <strong>$${localBasePrice.toFixed(2)}</strong>
        </div>
    `;

    if (localCompanyName) {
        listTarget.innerHTML += `
            <div class="summary-item-row">
                <span style="color:#64748b; font-weight:500;">Filing Company Name</span>
                <span style="color:#0a1f44; font-weight:700; text-align:right;">${localCompanyName}</span>
            </div>
        `;
    }

    if (localUserEmail) {
        listTarget.innerHTML += `
            <div class="summary-item-row">
                <span style="color:#64748b; font-weight:500;">Contact Email</span>
                <span style="color:#0a1f44; font-weight:700; text-align:right;">${localUserEmail}</span>
            </div>
        `;
    }

    // Process Selected Upsells Loop
    const registry = window.UPSELL_REGISTRY || {};
    localUpsellKeys.forEach(key => {
        const item = registry[key];
        if (item) {
            rollingSum += item.price;
            listTarget.innerHTML += `
                <div class="summary-item-row">
                    <span style="color:#64748b; font-weight:500;">+ ${item.title}</span>
                    <span style="color:#0a1f44; font-weight:700;">$${item.price.toFixed(2)}</span>
                </div>
            `;
        }
    });

    if (!localUpsellKeys.includes('registered-agent')) {
        const extAgentName = sessionStorage.getItem('ext_agent_name') || "";
        const extAgentState = sessionStorage.getItem('ext_agent_state') || "";
        if (extAgentName.trim() !== "") {
            listTarget.innerHTML += `
                <div class="summary-item-row">
                    <span style="color:#dd6b20; font-weight:600;">Third-Party Agent (${extAgentState})</span>
                    <span style="color:#0a1f44; font-weight:700; text-align:right;">${extAgentName}</span>
                </div>
            `;
        }
    }

    if (totalTarget) totalTarget.innerText = "$" + rollingSum.toFixed(2);
    sessionStorage.setItem('rollingCalculatedSumPrice', rollingSum);

    // FIX FOR POA: Explicitly map variable injections straight into target element text layout
    const legalContractText = "LIMITED POWER OF ATTORNEY & FILING AUTHORIZATION\n\nThis instrument certifies that the applicant, operating on behalf of corporate structure " + (localCompanyName || "[ SPECIFY COMPANY NAME ]") + " (\"Principal\"), hereby nominates, constitutes, and appoints filings4u LLC (\"Agent\") as its true and lawful attorney-in-fact.\n\nAgent is granted full limited authorization to act for the purpose of submitting regulatory applications directly with the Federal Motor Carrier Safety Administration (FMCSA), Internal Revenue Service (IRS), and State Secretarial Departments.\n\nAccount Correspondence Vector: " + (localUserEmail || "[ SPECIFY EMAIL ]");
    
   if (docTarget) {
    docTarget.textContent = legalContractText;
}
}

// 5. Fired when clicking your Step 3 Button "Authorize & Launch Payment Gateway ➔"
async function executeFinalFunnelOrderPaymentSubmit() {
    const signature = document.getElementById('poa_signature_input')?.value.trim();
    const checked = document.getElementById('poa_checkbox')?.checked;

    if (!checked || !signature) {
        alert("Please acknowledge the legal authorization declaration and sign with your full legal name to launch payment operations.");
        return;
    }

    const checkoutBtn = document.querySelector("button[onclick='executeFinalFunnelOrderPaymentSubmit()']");
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Connecting Secure Stripe Gateway...";
    }

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price: sessionStorage.getItem('rollingCalculatedSumPrice'),
                email: sessionStorage.getItem('cached_globalCachedUserEmail'),
                company: sessionStorage.getItem('cached_globalCachedCompanyName'),
                title: sessionStorage.getItem('cached_chosenServiceTitle'),
                signature: signature
            })
        });
        const data = await response.json();
        if (data && data.url) {
            window.location.href = data.url;
        } else {
            alert("Payment gateway session creation failed.");
            if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = "Authorize & Launch Payment Gateway ➔"; }
        }
    } catch(err) {
        console.error(err);
        if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = "Authorize & Launch Payment Gateway ➔"; }
    }
}
