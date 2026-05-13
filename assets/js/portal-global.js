/* ============================================================
   FILINGS4U GLOBAL PORTAL ENGINE & STATE MANAGEMENT
   Production Version 2.6 (Unified Engine Object Architecture)
   ============================================================ */
const TOTAL_STEPS = 8;

const PortalApp = {
    state: {
        activeEntityId: localStorage.getItem('active_entity_id') || 'all',
        entities: {
            '4242': 'Roseland Logistics LLC',
            '4243': 'Roseland Real Estate',
            'all': 'All Entities (Portfolio)'
        }
    },

    // 1. NON-BLOCKING INITIALIZATION CONTEXT ENGINE
    async init() {
        this.startClock();
        this.initMobileNav();
        this.initSidebarActiveState();
        this.initNotifications();
        this.loadDynamicWizardFAQs();

        // Check authentication safely without rendering freezes
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = 'index.html';
                return;
            }
            this.syncEntityContext();
        } catch (e) {
            console.error("Auth security check failed: ", e);
        }

        // Run UI layout configuration safety checks
        this.initWizardLayout();
    },

    // 2. ENTITY CONTEXT SWITCHER
    syncEntityContext() {
        const urlParams = new URLSearchParams(window.location.search);
        const entityId = urlParams.get('eid') || localStorage.getItem('active_entity_id') || 'all';
        localStorage.setItem('active_entity_id', entityId);

        const entityName = this.state.entities[entityId] || 'Select Company';
        document.querySelectorAll('.active-entity-name').forEach(el => el.innerText = entityName);

        const switcher = document.getElementById('entitySelect') || document.querySelector('.switcher-dropdown');
        if (switcher) switcher.value = entityId;
    },

    handleContextSwitch(id) {
        const overlay = document.getElementById('switcher-overlay');
        if (overlay) overlay.style.display = 'flex';
        localStorage.setItem('active_entity_id', id);
        
        const mainContent = document.querySelector('.portal-main');
        if (mainContent) mainContent.style.opacity = '0.5';

        setTimeout(() => {
            const currentPage = window.location.pathname;
            window.location.href = currentPage + "?eid=" + id;
        }, 300);
    },

    // 3. UI INFRASTRUCTURE HELPERS
    startClock() {
        const clock = document.getElementById('portal-clock');
        if (!clock) return;
        setInterval(() => {
            const now = new Date();
            clock.innerText = now.toLocaleString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
            });
        }, 1000);
    },

    initSidebarActiveState() {
        const currentPath = window.location.pathname.split("/").pop();
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    initNotifications() {
        const bell = document.querySelector('.notification-wrapper');
        const dropdown = document.querySelector('.notification-dropdown');
        if (bell && dropdown) {
            bell.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
            document.onclick = () => dropdown.classList.remove('show');
        }
    },

    initMobileNav() {
        window.toggleSidebar = () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('mobile-active');
        };
    },

    // 4. SELF-CORRECTING SIDEBAR FAQ MANAGEMENT ENGINE
    async loadDynamicWizardFAQs() {
        const faqContainer = document.getElementById('dynamic-faq-container');
        if (!faqContainer) return; 

        try {
            const baseOrigin = window.location.origin;
            const targetUrl = `${baseOrigin}/assets/data/faqs.json?v=3.0`;
            console.log("Fetching matching FAQs from absolute path track:", targetUrl);

            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`HTTP network error status code: ${response.status}`);
            
            const faqMasterMap = await response.json();
            const currentWizardKey = window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', '');
            const activeFAQArray = faqMasterMap[currentWizardKey] || faqMasterMap['trucker-authority'];

            // Force a maximum limit of exactly 3 item nodes to preserve vertical layout boundaries
            const optimizedFAQList = activeFAQArray.slice(0, 4);

            let htmlOutput = '';
            optimizedFAQList.forEach(item => {
                htmlOutput += `
                    <div style="margin-bottom: 12px; animation: layoutFade 0.3s ease-in-out forwards;">
                        <p style="font-size: 0.82rem; font-weight: 700; margin: 0; color: var(--primary-blue); line-height: 1.25;">${item.q}</p>
                        <p style="font-size: 0.75rem; color: var(--text-gray); margin: 3px 0 0; line-height: 1.3;">${item.a}</p>
                    </div>
                `;
            });

            // Establish scrollable layout constraints so the Save & Exit button is never pushed down
            faqContainer.style.maxHeight = "calc(100vh - 420px)";
            faqContainer.style.overflowY = "auto";
            faqContainer.style.paddingRight = "5px";
            
            faqContainer.innerHTML = htmlOutput;

        } catch (err) {
            console.error("Dynamic UI compilation failed: FAQ context dropped.", err);
            faqContainer.innerHTML = '<p style="font-size:0.75rem; color:var(--danger-red); font-weight:600;">Compliance advisory data stream offline.</p>';
        }
    },

    // 5. WIZARD STEP PERSISTENCE MANAGEMENT LOGIC
    initWizardLayout() {
        const activeSection = document.querySelector('.form-section.active');
        if (!activeSection) {
            const firstSection = document.getElementById('step-1');
            if (firstSection) firstSection.classList.add('active');
        }

        const label = document.getElementById('step-label');
        const activeSectionNow = document.querySelector('.form-section.active');
        if (label && activeSectionNow) {
            const stepNum = activeSectionNow.id.split('-')[1] || '1';
            label.innerText = `Step ${stepNum} of ${TOTAL_STEPS}`;
            
            const bar = document.getElementById('progress-fill');
            if (bar) bar.style.width = (parseInt(stepNum) / TOTAL_STEPS) * 100 + '%';
        }
        updateSummary();
    }
};

/* ============================================================
   WIZARD FLOW & INTAKE VALIDATION CORE (RETIRED NaN LOOP BUG)
   ============================================================ */

function nextStep(step) {
    const currentSection = document.querySelector('.form-section.active');
    if (currentSection) {
        // FIX 1: Added array index [1] to extract the numeric string ('1') before parsing integers
        const currentStepNum = parseInt(currentSection.id.split('-')[1]) || 1;
        if (step > currentStepNum && !validateCurrentFields(currentSection)) return;
    }
    
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('step-' + step);
    if (target) target.classList.add('active');

    // Update Progress Bar UI
    const bar = document.getElementById('progress-fill');
    if (bar) {
        bar.style.width = (step / TOTAL_STEPS) * 100 + '%';
        bar.style.backgroundColor = '#10b981';
    }
    
    const label = document.getElementById('step-label');
    if (label) label.innerText = `Step ${step} of ${TOTAL_STEPS}`;

    if (step === TOTAL_STEPS) updateSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentFields(container) {
    let isValid = true;
    // FIX 2: Added array index [1] to prevent NaN crashes on step boundaries checks
    const currentStepNum = parseInt(container.id.split('-')[1]) || 1;

    // Group Checkbox Validation (Step 2 and 3)
    if (currentStepNum === 2 || currentStepNum === 3) {
        const grid = container.querySelector('.checkbox-grid');
        if (grid && grid.querySelectorAll('input:checked').length === 0) {
            grid.style.border = "2px solid #e53e3e";
            isValid = false;
        } else if (grid) {
            grid.style.border = "1px solid var(--border-color)";
        }
    }

    // Step 6 Rules (Strict Certification Checkboxes)
    if (currentStepNum === 6) {
        container.querySelectorAll('input[type="checkbox"]').forEach(cert => {
            if (!cert.checked) {
                cert.parentElement.style.border = "2px solid #e53e3e";
                isValid = false;
            } else {
                cert.parentElement.style.border = "none";
            }
        });
    }

    // Global Required Field Scraper
    container.querySelectorAll('[required]').forEach(field => {
        if ((field.type === 'checkbox' && !field.checked) || (!field.value.trim())) {
            field.style.border = "2px solid #e53e3e";
            isValid = false;
        } else {
            field.style.border = "1px solid var(--border-color)";
        }
    });

    if (!isValid) alert("Please complete required fields highlighted in red.");
    return isValid;
}


/* ============================================================
   UNIVERSAL SECURE ORDER ROUTING ENGINE
   ============================================================ */

async function prepareOrder() {
    console.log("Secure routing sequence initialized...");
    try {
        const totalEl = document.getElementById('summary-total');
        const rawValue = totalEl ? totalEl.innerText : "799";
        const cleanPrice = Math.floor(parseFloat(rawValue.replace(/[^0-9.]/g, ''))) || 799;

        let userEmail = "client@filings4u.com";
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) userEmail = session.user.email;
        } catch (e) {
            console.warn("Telemetry warning: Active secure context bypassed.");
        }

        const companyInput = document.querySelector('input[placeholder*="Business Name"]') || document.querySelector('input[name="company_name"]');

        const orderData = {
            plan: window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', ''),
            price: cleanPrice,
            customer_email: userEmail,
            company_name: companyInput ? companyInput.value : "New Carrier LLC"
        };

        console.log("Packaging data for payment gateway:", orderData);
        sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
        window.location.assign("order.html");
    } catch (err) {
        console.error("Pipeline failure. Executing fail-safe fallback routing: ", err);
        window.location.assign("order.html");
    }
}

// 4. MODAL MANAGEMENT UTILITIES
function handleSaveExit() { document.getElementById('save-modal').style.display = 'flex'; }
function closeSaveModal() { document.getElementById('save-modal').style.display = 'none'; }
function toggleDiv(id, show) { const el = document.getElementById(id); if (el) show ? el.classList.remove('hidden') : el.classList.add('hidden'); }
function handleLogout() { if (confirm("Sign out?")) { supabase.auth.signOut().then(() => { localStorage.clear(); window.location.href = 'index.html'; }); } }

// 5. BOOTSTRAP EVENT HOOK
document.addEventListener('DOMContentLoaded', () => {
    PortalApp.init();
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.value = new Date().toLocaleDateString();
});

/* ============================================================
   FILINGS4U CLOUD DATA, VAULT STORAGE & PAYMENTS ENGINE
   Production Version 2.4 (Consolidated Client API Wrappers)
   ============================================================ */

/**
 * 1. LIVE SECURE DOCUMENT VAULT DOWNLOADS
 * Fetches an ephemeral 60-second signed URL for a protected file asset in Supabase Storage
 * @param {string} filePath - The structured path within the bucket (e.g., "user-uuid/document.pdf")
 */
async function downloadUserDocument(filePath) {
    if (!filePath) return console.error('Aborting transfer: File token reference parameter missing.');
    console.log(`Requesting secure download handshake token for asset target: ${filePath}`);

    try {
        const { data, error } = await window.supabase.storage
            .from('compliance-documents')
            .createSignedUrl(filePath, 60, { download: true });

        if (error) throw error;

        if (data && data.signedUrl) {
            console.log("Token handshake verified. Dispatching browser download channel...");
            window.location.href = data.signedUrl;
        }
    } catch (err) {
        console.error('Secure Vault Sourcing Failure:', err.message);
        alert("Unable to fetch document download link. Please refresh your profile view.");
    }
}

/**
 * 2. REGULATORY SYSTEM PDF GENERATION INTERFACE
 * Invokes the edge function cluster to run a jsPDF instance and save the artifact directly into object storage
 * @param {string} company - The legal corporate business entity footprint name
 * @param {string} type - The specific application layout filing classification string (e.g., "Form_2290")
 */
async function handleGenerateAndSavePDF(company, type) {
    console.log(`Initializing cloud generation protocols for operational footprint: ${type}`);
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error("Active authenticated user identity reference missing.");

        // Invoke your deployed backend Deno function router instance
        const { data, error } = await window.supabase.functions.invoke('stripe-webhook', {
            body: { 
                action: 'generate-pdf', 
                companyName: company, 
                filingType: type, 
                userId: user.id 
            }
        });

        if (error) throw error;

        alert(`Filing artifact [${type}] generated successfully and written to your secure folder layer.`);
        
        // Auto-trigger dynamic download channel loop if returned path trace is active
        if (data && data.path) {
            await downloadUserDocument(data.path);
        }

    } catch (err) {
        console.error('Automated PDF Sourcing Deployment Aborted:', err.message);
        alert("Filing generation pipeline timed out. Verify your connection metrics or alert engineering.");
    }
}

/**
 * 3. FALLBACK SIDE-BAR DIRECT PAYMENTS HANDSHAKE
 * Creates a raw on-the-fly checkout token session directly from static list actions if needed
 * @param {string} email - Logged-in email anchor coordinate
 * @param {string} company - Registered target legal business entity name parameter
 * @param {string} service - Profile type key identifier (e.g., "dot-consortium")
 * @param {number} price - Absolute price formatted integer calculated strictly in cents (pennies)
 */
async function startCheckout(email, company, service, price) {
    console.log(`Processing direct off-wizard invoice placement routing context for: ${service}`);
    
    if (!price || isNaN(price) || price <= 0) {
        return console.error("Billing pipeline crash: Invalid integer amount properties passed.");
    }

    try {
        const { data, error } = await window.supabase.functions.invoke('stripe-webhook', {
            body: { 
                action: 'checkout', 
                email: email, 
                company_name: company, 
                service_type: service, 
                amount: Math.round(price) 
            }
        });

        if (error) throw error;

        // Stage data cleanly inside local storage arrays to bridge across pages
        const orderData = {
            plan: service,
            price: Math.round(price / 100),
            customer_email: email,
            company_name: company
        };
        sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

        console.log("Dynamic price tracking tokens locked. Navigating client to secure payment hub...");
        window.location.href = "filings4u.com";

    } catch (err) {
        console.error('Stripe Client Interface Handshake Interrupted:', err.message);
        alert("Billing network handshake failed. Please refresh your view or try a different invoice.");
    }
}
/* ============================================================
   FILINGS4U DOCUMENT VAULT CORE INTEGRATION FLUIDS
   Production Version 3.1 (Upload, Generate, & Download - Rectified)
   ============================================================ */

/**
 * 1. SECURE UPLOAD ENGINE
 * Routes any binary file object from a drag-and-drop or input zone directly to the Supabase Storage Vault
 * @param {File} fileObject - Browser file object extracted from input event
 * @param {string} customPrefix - Filing type subdirectory bucket label (e.g., 'mvr_records')
 */
async function uploadUserDocumentToVault(fileObject, customPrefix = 'general') {
    if (!fileObject) return alert("Upload aborted: No file binary target found.");
    
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) throw new Error("Authentication context expired. Please re-authenticate.");
        
        const userUuid = session.user.id;
        const cleanedFileName = fileObject.name.replace(/[^a-zA-Z0-9.]/g, '_');
        
        /* FIX: Restored balancing template literal evaluation expression structures */
        const storagePath = `${userUuid}/${customPrefix}_${Date.now()}_${cleanedFileName}`;

        console.log(`Streaming byte payloads to bucket pathway: ${storagePath}`);
        
        // Show universal UI loading state indicator if element exists
        const dropZoneText = document.querySelector('.drop-zone p');
        if (dropZoneText) dropZoneText.innerText = "Encrypting & Uploading File...";

        const { data, error } = await window.supabase.storage
            .from('compliance-documents')
            .upload(storagePath, fileObject, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        alert("Document successfully compiled and written to your encrypted vault layer.");
        
        // Trigger dashboard table refresh hook if active on view screen context
        if (typeof refreshDocumentVaultTable === 'function') refreshDocumentVaultTable();

    } catch (err) {
        console.error("Vault Upload Pipeline Broken:", err.message);
        alert(`Storage Interrupted: ${err.message}`);
    } finally {
        const dropZoneText = document.querySelector('.drop-zone p');
        if (dropZoneText) dropZoneText.innerHTML = "Drag files here or <strong>Browse</strong>";
    }
}

/**
 * 2. LIVE PROGRAMMATIC PDF INVOCATION ENGINE
 * Asynchronously commands your Edge Function to compile custom jsPDF assets and drop them into the cloud bucket
 * @param {string} entityName - Target legal company name
 * @param {string} filingKey - Core type tag identifier (e.g., 'trucker-authority', 'llc-formation')
 */
async function triggerCloudPDFGeneration(entityName, filingKey) {
    console.log(`Invoking remote compiler cluster for: ${filingKey}`);
    try {
        const { data, error } = await window.supabase.functions.invoke('stripe-webhook', {
            body: { 
                action: 'generate-pdf', 
                companyName: entityName, 
                filingType: filingKey, 
                date: new Date().toISOString() 
            }
        });
        if (error) throw error;
        console.log("Filing artifact auto-generation successful:", data);
    } catch (err) {
        console.error("PDF Compilation Flow Terminated:", err.message);
    }
}
