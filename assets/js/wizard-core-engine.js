let coreBasePrice = 149.00; 
let chosenServiceTitle = ""; 
let selectedUpsellKeys = ["registered-agent"]; 
let globalCachedUserEmail = ""; 
let globalCachedCompanyName = ""; 

// 1. Initial Page Load Setup
document.addEventListener("DOMContentLoaded", () => { 
    const urlParams = new URLSearchParams(window.location.search); 
    const activeServiceKey = urlParams.get('service') || 'llc-formation'; 
    const chosenPlanTier = urlParams.get('plan') || 'compliance'; 
    
    const registry = window.WIZARD_REGISTRY || {}; 
    const config = registry[activeServiceKey]; 
    
    const wrapper = document.getElementById('government-fields-injection-wrapper'); 
    if (!wrapper) return; 

    if (!config) { 
        wrapper.innerHTML = `<div style="color:red; font-weight:700; text-align:center; padding:40px;">Configuration Error: Service map missing.</div>`; 
        return; 
    } 

    coreBasePrice = (config.prices && config.prices[chosenPlanTier]) || (config.prices && config.prices['compliance']) || 149.00; 
    chosenServiceTitle = `${config.title || 'Setup'} (${chosenPlanTier.toUpperCase()})`; 
    
    const titleDisplay = document.getElementById('wizard-title-display'); 
    if (titleDisplay) titleDisplay.textContent = config.title || ''; 

    wrapper.innerHTML = ` 
        <p id="config-desc-target" style="color:#4a5568; font-size:0.92rem; line-height:1.5; margin-bottom:25px;"></p> 
        <div style="margin-bottom: 15px;"> 
            <label class="custom-dynamic-label">Your Active Contact Email</label> 
            <input type="email" id="customer_guest_email" class="custom-dynamic-input" placeholder="name@company.com" required> 
        </div> 
        <div style="margin-bottom: 15px;"> 
            <label class="custom-dynamic-label">Official Legal Entity / Filing Company Name</label> 
            <input type="text" id="target_company_name" class="custom-dynamic-input" placeholder="e.g., Alpha Logistics Group LLC" required> 
        </div> 
    `; 
    
    const descTarget = document.getElementById('config-desc-target');
    if (descTarget) descTarget.textContent = config.description || ''; 
}); 

// 2. Fired when clicking your Step 1 Button "Continue to Upsells ➔"
// Switches views and forces Step 2 layout arrays to draw onto the screen
async function transitionToUpsellStep() { 
    const emailField = document.getElementById('customer_guest_email'); 
    const compField = document.getElementById('target_company_name'); 

    if (!emailField || !emailField.value.trim() || !compField || !compField.value.trim()) { 
        if (emailField && !emailField.value.trim()) emailField.style.borderColor = '#ef4444';
        if (compField && !compField.value.trim()) compField.style.borderColor = '#ef4444';
        alert("Please complete both your email and company name fields.");
        return; 
    } 

    globalCachedUserEmail = emailField.value.trim(); 
    globalCachedCompanyName = compField.value.trim(); 

    // Mirror entry fields straight into local cache arrays
    sessionStorage.setItem('cached_coreBasePrice', coreBasePrice); 
    sessionStorage.setItem('cached_chosenServiceTitle', chosenServiceTitle); 
    sessionStorage.setItem('cached_selectedUpsellKeys', JSON.stringify(selectedUpsellKeys)); 
    sessionStorage.setItem('cached_globalCachedUserEmail', globalCachedUserEmail); 
    sessionStorage.setItem('cached_globalCachedCompanyName', globalCachedCompanyName); 

    if (typeof saveDraftProgressToCloudEngine === "function") { 
        try { await saveDraftProgressToCloudEngine(1); } catch(e) {}
    } 

    // HARD VISIBILITY TOGGLE: Strip classes and force element visibility properties open
    const step1 = document.getElementById('step-pane-intake');
    const step2 = document.getElementById('step-pane-upsells');
    
    if (step1) {
        step1.classList.remove('step-active');
        step1.style.display = "none";
    }
    if (step2) {
        step2.classList.add('step-active');
        step2.style.display = "block";
        // Force the engine to append checkbox nodes right now
        buildUpsellInterfaceGrid(); 
    }
}


// 3. Step 2 Upsell Matrix Engine Card Compiler
function buildUpsellInterfaceGrid() {
    const target = document.getElementById('upsell-items-injection-target');
    const agentForm = document.getElementById('external-agent-form-container');
    if (!target) return; 

    let registry = window.UPSELL_REGISTRY;
    if (!registry || typeof registry !== 'object' || Object.keys(registry).length === 0) {
        registry = {
            "registered-agent": { title: "Registered Agent Service", price: 99.00, desc: "Satisfy state requirements with a secure, local statutory address presence." },
            "ein-tax-id": { title: "Employer Identification Number (EIN)", price: 75.00, desc: "Obtain your official IRS tax ID mapping to open commercial banking vaults." },
            "compliance-lock": { title: "Annual Compliance Shield", price: 125.00, desc: "Automated state report monitoring alerts to prevent structural penalties." }
        };
    }

    const storedKeys = sessionStorage.getItem('cached_selectedUpsellKeys');
    if (storedKeys) {
        try { selectedUpsellKeys = JSON.parse(storedKeys); } catch(e) {}
    }

    target.innerHTML = ""; 
    
    Object.keys(registry).forEach(key => {
        const item = registry[key];
        const isChecked = selectedUpsellKeys.includes(key);
        
        const card = document.createElement('div');
        card.className = `upsell-item-card ${isChecked ? 'selected' : ''}`;
        card.id = `upsell-card-${key}`;
        card.style.cursor = "pointer";

        card.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 15px; width: 100%;">
                <input type="checkbox" id="checkbox-${key}" ${isChecked ? 'checked' : ''} style="margin-top: 5px; transform: scale(1.2); pointer-events: none;">
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; width: 100%;">
                        <strong style="color: #0a1f44; font-size: 1.05rem;">${item.title}</strong>
                        <span style="color: #0a1f44; font-weight: 800; font-size: 1.1rem;">+$${item.price.toFixed(2)}</span>
                    </div>
                    <p style="margin: 0; color: #64748b; font-size: 0.88rem; line-height: 1.4;">${item.desc || item.description || ''}</p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            const checkbox = document.getElementById(`checkbox-${key}`);
            if (!checkbox) return;

            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                if (!selectedUpsellKeys.includes(key)) selectedUpsellKeys.push(key);
                card.classList.add('selected');
            } else {
                selectedUpsellKeys = selectedUpsellKeys.filter(k => k !== key);
                card.classList.remove('selected');
            }

            sessionStorage.setItem('cached_selectedUpsellKeys', JSON.stringify(selectedUpsellKeys));
            if (agentForm) handleAgentFormVisibility(agentForm);
        });

        target.appendChild(card);
    });

    if (agentForm) handleAgentFormVisibility(agentForm);
}

function handleAgentFormVisibility(agentForm) {
    const nameField = document.getElementById('ext_agent_name');
    if (!selectedUpsellKeys.includes('registered-agent')) {
        agentForm.style.display = "block";
        if (nameField) nameField.required = true;
    } else {
        agentForm.style.display = "none";
        if (nameField) nameField.required = false;
    }
}

// 4. Fired when clicking your Step 2 Button "Proceed directly to Order Summary ➔"
// Switches views and forces Step 3 layout elements to render
function transitionToSummaryStep() {
    const extAgentName = document.getElementById('ext_agent_name')?.value || "";
    const extAgentState = document.getElementById('ext_agent_state')?.value || "";
    
    sessionStorage.setItem('ext_agent_name', extAgentName);
    sessionStorage.setItem('ext_agent_state', extAgentState);

    const step2 = document.getElementById('step-pane-upsells');
    const step3 = document.getElementById('step-pane-summary');

    if (step2) {
        step2.classList.remove('step-active');
        step2.style.display = "none";
    }
    if (step3) {
        step3.classList.add('step-active');
        step3.style.display = "block";
        // Execute line-item totals calculations and compile legal contract strings
        calculateRealTimeSummaryMatrix();
    }
}
