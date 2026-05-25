let coreBasePrice = 149.00; 
let chosenServiceTitle = ""; 
let selectedUpsellKeys = ["registered-agent"]; 
let globalCachedUserEmail = ""; 
let globalCachedCompanyName = ""; 

// 1. Live Running Clock Timer
(function() { 
    function tick() { 
        const clock = document.getElementById('live-wizard-clock'); 
        const dBox = document.getElementById('live-wizard-date'); 
        const now = new Date(); 
        if (clock) clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); 
        if (dBox) dBox.innerText = now.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }); 
    } 
    tick(); 
    setInterval(tick, 1000); 
})(); 

// 2. Intake Initialization Engine Framework
document.addEventListener("DOMContentLoaded", () => { 
    const urlParams = new URLSearchParams(window.location.search); 
    const activeServiceKey = urlParams.get('service') || 'llc-formation'; 
    const chosenPlanTier = urlParams.get('plan') || 'compliance'; 
    
    const registry = window.WIZARD_REGISTRY || {}; 
    const config = registry[activeServiceKey]; 
    
    if (!config) { 
        document.getElementById('government-fields-injection-wrapper').innerHTML = `<div style="color:red; font-weight:700; text-align:center; padding:40px;">Configuration Error: Service profile map missing.</div>`; 
        return; 
    } 

    coreBasePrice = config.prices[chosenPlanTier] || config.prices['compliance']; 
    chosenServiceTitle = `${config.title} (${chosenPlanTier.toUpperCase()})`; 
    document.getElementById('wizard-title-display').innerText = config.title; 

    let baseFormFieldsHTML = ` 
        <p style="color:#4a5568; font-size:0.92rem; line-height:1.5; margin-bottom:25px;">${config.description}</p> 
        <div style="margin-bottom: 15px;"> 
            <label class="custom-dynamic-label">Your Active Contact Email</label> 
            <input type="email" id="customer_guest_email" class="custom-dynamic-input" placeholder="name@company.com" required> 
        </div> 
        <div style="margin-bottom: 15px;"> 
            <label class="custom-dynamic-label">Official Legal Entity / Filing Company Name</label> 
            <input type="text" id="target_company_name" class="custom-dynamic-input" placeholder="e.g., Alpha Logistics Group LLC" required> 
        </div> 
        <div id="extra-government-inputs-hook"></div> 
        <input type="hidden" id="cached_service_key" value="${activeServiceKey}"> 
        <input type="hidden" id="cached_plan_tier" value="${chosenPlanTier}"> 
    `; 
    
    document.getElementById('government-fields-injection-wrapper').innerHTML = baseFormFieldsHTML; 
    const hook = document.getElementById('extra-government-inputs-hook'); 
    
    if (config.extraFields) { 
        config.extraFields.forEach(field => { 
            const block = document.createElement('div'); 
            block.style.marginBottom = "15px"; 
            const lbl = document.createElement('label'); 
            lbl.className = "custom-dynamic-label"; 
            lbl.innerText = field.label; 
            block.appendChild(lbl); 
            
            if (field.type === "select") { 
                const sel = document.createElement('select'); 
                sel.id = `custom_${field.id}`; 
                sel.className = "custom-dynamic-input"; 
                field.options.forEach(o => { 
                    const opt = document.createElement('option'); 
                    opt.value = o.toLowerCase().replace(/\s+/g, '_'); 
                    opt.innerText = o; 
                    sel.appendChild(opt); 
                }); 
                block.appendChild(sel); 
            } else { 
                const inp = document.createElement('input'); 
                inp.type = "text"; 
                inp.id = `custom_${field.id}`; 
                inp.className = "custom-dynamic-input"; 
                inp.placeholder = field.placeholder || ''; 
                block.appendChild(inp); 
            } 
            hook.appendChild(block); 
        }); 
    } 
    buildUpsellInterfaceGrid(); 
}); 

// 3. Fired when clicking your Step 1 Button "Continue to Upsells ➔"
function transitionToUpsellStep() { 
    const inputs = document.querySelectorAll('#government-fields-injection-wrapper .custom-dynamic-input'); 
    let invalidElement = null;
    
    inputs.forEach(i => { 
        i.style.borderColor = '#e2e8f0'; 
        i.style.boxShadow = 'none'; 
    }); 

    const emailField = document.getElementById('customer_guest_email'); 
    const compField = document.getElementById('target_company_name'); 

    if (!emailField || !emailField.value.trim()) { 
        invalidElement = emailField; 
    } 
    if (!compField || !compField.value.trim()) { 
        if (!invalidElement) invalidElement = compField; 
    } 

    const key = document.getElementById('cached_service_key').value; 
    const extra = window.WIZARD_REGISTRY[key]?.extraFields || []; 
    extra.forEach(f => { 
        const el = document.getElementById(`custom_${f.id}`); 
        if (el && !el.value.trim()) { 
            if (!invalidElement) invalidElement = el; 
        } 
    }); 

    if (invalidElement) { 
        invalidElement.style.borderColor = '#ef4444'; 
        invalidElement.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)'; 
        invalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        return; 
    } 

    globalCachedUserEmail = emailField.value.trim(); 
    globalCachedCompanyName = compField.value.trim(); 
    
    document.getElementById('step-pane-intake').classList.remove('step-active'); 
    document.getElementById('step-pane-upsells').classList.add('step-active'); 
}

// 4. Step 2 Checklist Visual Card Grid Interface Compiler
function buildUpsellInterfaceGrid() { 
    const target = document.getElementById('upsell-items-injection-target'); 
    const upsells = window.UPSELL_REGISTRY || {}; 
    if (!target) return;
    target.innerHTML = ""; 

    Object.keys(upsells).forEach(key => { 
        const item = upsells[key]; 
        const isChecked = selectedUpsellKeys.includes(key); 
        const card = document.createElement('div'); 
        card.className = `upsell-item-card ${isChecked ? 'selected' : ''}`; 
        card.id = `upsell-card-${key}`; 
        card.innerHTML = ` 
            <div style="flex:1; text-align:left;"> 
                <h4 style="margin:0 0 4px 0; color:#0a1f44; font-weight:700; font-size:1.05rem;">${item.title}</h4> 
                <p style="margin:0; color:#64748b; font-size:0.85rem; line-height:1.4;">${item.desc}</p> 
            </div> 
            <div style="text-align:right; display:flex; align-items:center; gap:15px;"> 
                <span style="font-weight:800; color:var(--navy); font-size:1.1rem;">+$${item.price.toFixed(2)}</span> 
                <input type="checkbox" style="transform:scale(1.3); cursor:pointer;" ${isChecked ? 'checked' : ''} onchange="handleUpsellSelectionChange('${key}', this)"> 
            </div> 
        `; 
        target.appendChild(card); 
    }); 
} 

function handleUpsellSelectionChange(key, checkbox) { 
    const card = document.getElementById(`upsell-card-${key}`); 
    if (checkbox.checked) { 
        if (!selectedUpsellKeys.includes(key)) selectedUpsellKeys.push(key); 
        if (card) card.classList.add('selected'); 
    } else { 
        selectedUpsellKeys = selectedUpsellKeys.filter(k => k !== key); 
        if (card) card.classList.remove('selected'); 
    } 
    const extAgentForm = document.getElementById('external-agent-form-container'); 
    if (extAgentForm) {
        if (!selectedUpsellKeys.includes('registered-agent')) { 
            extAgentForm.style.display = "block"; 
        } else { 
            extAgentForm.style.display = "none"; 
        } 
    }
} 

// 5. Fired when clicking your Step 2 Button "Proceed directly to Order Summary ➔"
function transitionToSummaryStep() { 
    if (!selectedUpsellKeys.includes('registered-agent')) { 
        let invalidField = null; 
        const extInputs = document.querySelectorAll('#external-agent-form-container .custom-dynamic-input'); 
        extInputs.forEach(i => { 
            i.style.borderColor = '#e2e8f0'; 
            i.style.boxShadow = 'none'; 
        }); 
        extInputs.forEach(i => { 
            if (!i.value.trim()) { if (!invalidField) invalidField = i; } 
        }); 
        if (invalidField) { 
            invalidField.style.borderColor = '#ef4444'; 
            invalidField.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)'; 
            invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            return; 
        } 
    } 
    document.getElementById('step-pane-upsells').classList.remove('step-active'); 
    document.getElementById('step-pane-summary').classList.add('step-active'); 
    calculateRealTimeSummaryMatrix(); 
} 

// 6. Step 3 Order Summary Reconciliation Processing Engine
function calculateRealTimeSummaryMatrix() { 
    const listTarget = document.getElementById('summary-items-list-target'); 
    const totalTarget = document.getElementById('summary-total-price-box'); 
    const docTarget = document.getElementById('dynamic-poa-document-body'); 
    if (!listTarget) return;

    listTarget.innerHTML = ""; 
    let rollingSum = coreBasePrice; 
    
    listTarget.innerHTML += `<div class="summary-item-row"><strong>${chosenServiceTitle}</strong><span>$${coreBasePrice.toFixed(2)}</span></div>`; 
    
    selectedUpsellKeys.forEach(key => { 
        const item = window.UPSELL_REGISTRY[key]; 
        if (item) {
            rollingSum += item.price; 
            listTarget.innerHTML += `<div class="summary-item-row"><span>+ ${item.title}</span><span>$${item.price.toFixed(2)}</span></div>`; 
        }
    }); 

    if (!selectedUpsellKeys.includes('registered-agent')) { 
        const extAgentName = document.getElementById('ext_agent_name')?.value || ""; 
        const extAgentState = document.getElementById('ext_agent_state')?.value || ""; 
        if (extAgentName.trim() !== "") { 
            listTarget.innerHTML += `<div class="summary-item-row"><span style="color:#dd6b20; font-weight:600;">Third-Party Agent (${extAgentState})</span><span style="color:#0a1f44; font-weight:700; text-align:right;">${extAgentName}</span></div>`; 
        } 
    } 

    if (totalTarget) totalTarget.innerText = `$${rollingSum.toFixed(2)}`; 
    sessionStorage.setItem('rollingCalculatedSumPrice', rollingSum); 
    
    // UPDATED FULL STATEMENT POA INJECTION
    const legalContractText = `LIMITED POWER OF ATTORNEY & FILING AUTHORIZATION

This instrument certifies that the applicant, operating on behalf of corporate structure ${globalCachedCompanyName || "[ SPECIFY COMPANY NAME ]"} ("Principal"), hereby nominates, constitutes, and appoints filings4u LLC ("Agent") as its true and lawful attorney-in-fact.

Agent is granted full limited authorization and power to act in the name, place, and stead of Principal for the distinct purpose of drafting, preparing, electronic signing, and submitting processing declarations, licensing requests, regulatory registrations, and mandated compliance applications directly with the Federal Motor Carrier Safety Administration (FMCSA), Internal Revenue Service (IRS), and respective State Secretarial Departments.

Executed Remotely via Certified Electronic Form Delivery Channel.

Account Correspondence Vector: ${globalCachedUserEmail || "[ SPECIFY EMAIL ]"}`; 
    
    if (docTarget) docTarget.innerText = legalContractText; 
    sessionStorage.setItem('compiledLegalPoaTextString', legalContractText); 
}

// 7. Cloud Webhook Progress Delivery Channel Controller
async function saveDraftProgressToCloudEngine(currentStepNumber) { 
    if (typeof window.synchronizeStepToCloud === "function") { 
        const key = document.getElementById('cached_service_key')?.value || 'llc-formation'; 
        const tier = document.getElementById('cached_plan_tier')?.value || 'compliance'; 
        
        const progressPayload = { 
            business_name: globalCachedCompanyName, 
            contact_email: globalCachedUserEmail, 
            plan_tier: tier, 
            selected_upsell_packages: selectedUpsellKeys, 
            last_saved_timestamp: new Date().toISOString() 
        }; 

        const registry = window.WIZARD_REGISTRY || {}; 
        const extraFields = (registry[key] && registry[key].extraFields) ? registry[key].extraFields : []; 
        extraFields.forEach(f => { 
            const element = document.getElementById(`custom_${f.id}`); 
            if (element) { 
                progressPayload[f.id] = element.value; 
            } 
        }); 

        if (!selectedUpsellKeys.includes('registered-agent')) { 
            progressPayload.external_statutory_agent = { 
                name: document.getElementById('ext_agent_name')?.value || '', 
                street: document.getElementById('ext_agent_address')?.value || '', 
                suite: document.getElementById('ext_agent_suite')?.value || '', 
                city: document.getElementById('ext_agent_city')?.value || '', 
                state: document.getElementById('ext_agent_state')?.value || '', 
                zip: document.getElementById('ext_agent_zip')?.value || '' 
            }; 
        } 

        console.log(`Synchronizing step ${currentStepNumber} form parameters directly with your cloud ledger...`); 
        await window.synchronizeStepToCloud(currentStepNumber, progressPayload); 
    } 
}

// 8. Fired when clicking your Step 3 Button "Authorize & Launch Payment Gateway ➔"
async function executeFinalFunnelOrderPaymentSubmit(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault(); 

    const signature = document.getElementById('poa_signature_input')?.value.trim();
    const checked = document.getElementById('poa_checkbox')?.checked;

    if (!checked || !signature) {
        alert("Please acknowledge the legal authorization declaration and sign with your full legal name to launch payment operations.");
        return;
    }

    const checkoutBtn = document.querySelector("button[onclick^='executeFinalFunnelOrderPaymentSubmit']");
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Connecting Secure Stripe Gateway...";
    }

    // Sync state layout criteria to cloud data vault registries one final time
    try {
        await saveDraftProgressToCloudEngine(3);
    } catch(e) {}

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price: sessionStorage.getItem('rollingCalculatedSumPrice'),
                email: globalCachedUserEmail,
                company: globalCachedCompanyName,
                title: chosenServiceTitle,
                signature: signature
            })
        });
        const data = await response.json();
        if (data && data.url) {
            window.location.href = data.url;
        } else {
            alert("Payment gateway session creation failed.");
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = "Authorize & Launch Payment Gateway ➔";
            }
        }
    } catch(err) {
        console.error("Stripe Checkout Connection Exception:", err);
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = "Authorize & Launch Payment Gateway ➔";
        }
    }
}