/* ============================================================
   FILINGS4U GLOBAL PORTAL ENGINE & STATE MANAGEMENT
   Production Version 2.1 (Bug Fix for Loop & Navigation)
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

    // 1. NON-BLOCKING INITIALIZATION
    async init() {
        this.startClock();
        this.initMobileNav();
        this.initSidebarActiveState();
        this.initNotifications();

        // Check authentication safely without rendering freezes
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = 'index.html';
                return;
            }
            this.syncEntityContext();
            
            // Set initial dynamic labels without running structural validation loops
            const label = document.getElementById('step-label');
            if (label) label.innerText = `Step 1 of ${TOTAL_STEPS}`;
            
        } catch (e) {
            console.error("Auth security check failed: ", e);
        }
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
    }
};

/* ============================================================
   WIZARD FLOW & INTAKE VALIDATION CORE
   ============================================================ */

function nextStep(step) {
    const currentSection = document.querySelector('.form-section.active');
    if (currentSection) {
        const currentStepNum = parseInt(currentSection.id.split('-')[1]);
        // Only run validation if the user is trying to move FORWARD
        if (step > currentStepNum && !validateCurrentFields(currentSection)) return;
    }
    
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('step-' + step);
    if (target) target.classList.add('active');

    // Update Progress Bar UI
    const bar = document.getElementById('progress-fill');
    if (bar) {
        bar.style.width = (step / TOTAL_STEPS) * 100 + '%';
        bar.style.backgroundColor = '#10b981'; // Emerald
    }
    
    const label = document.getElementById('step-label');
    if (label) label.innerText = `Step ${step} of ${TOTAL_STEPS}`;

    if (step === TOTAL_STEPS) updateSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentFields(container) {
    let isValid = true;
    const currentStepNum = parseInt(container.id.split('-')[1]);

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

function updateSummary() {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') || 'basic';
    const basePrice = parseInt(params.get('price')) || 499;
    const govFee = 300;
    let boc3Price = (plan === 'elite' || plan === 'enterprise') ? 0 : 50;

    const bocStatusEl = document.getElementById('boc3-status');
    if (bocStatusEl) {
        bocStatusEl.innerText = (boc3Price === 0) ? 'Included' : '+$50.00';
        bocStatusEl.style.color = (boc3Price === 0) ? '#10b981' : 'inherit';
    }

    document.getElementById('summary-plan').innerText = plan.toUpperCase();
    document.getElementById('summary-price').innerText = "$" + basePrice.toFixed(2);
    document.getElementById('summary-total').innerText = "$" + (basePrice + govFee + boc3Price).toFixed(2);
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

        const companyInput = document.querySelector('input[placeholder*="Business Name"]') || 
                             document.querySelector('input[name="company_name"]');

        const orderData = {
            plan: window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', ''),
            price: cleanPrice,
            customer_email: userEmail,
            company_name: companyInput ? companyInput.value : "New Carrier LLC"
        };

        console.log("Packaging data for payment gateway:", orderData);
        sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
        
        // FIXED REDIRECT ROUTING TO YOUR PORTAL CHECKOUT HUB
        window.location.assign("https://portal.filings4u.com/order.html");

    } catch (err) {
        console.error("Pipeline failure. Executing fail-safe fallback routing: ", err);
        window.location.assign("filings4u.com");
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

// REPLACE THE INITIALIZATION BLOCK AT THE BOTTOM OF portal-global.js
window.addEventListener('load', () => {
    // 1. Start UI sub-systems safely
    startClock();
    
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.value = new Date().toLocaleDateString();

    // 2. Safe Section Switcher (Prevents loop crash)
    const activeSection = document.querySelector('.form-section.active');
    if (!activeSection) {
        // Only force step 1 if no section is explicitly set to active in HTML
        const firstSection = document.getElementById('step-1');
        if (firstSection) firstSection.classList.add('active');
    }

    // 3. Set the step bar metric safely without triggering global validation cycles
    const label = document.getElementById('step-label');
    const activeSectionNow = document.querySelector('.form-section.active');
    if (label && activeSectionNow) {
        const stepNum = activeSectionNow.id.split('-')[1] || '1';
        label.innerText = `Step ${stepNum} of ${TOTAL_STEPS}`;
        
        const bar = document.getElementById('progress-fill');
        if (bar) bar.style.width = (parseInt(stepNum) / TOTAL_STEPS) * 100 + '%';
    }

    // 4. Run pricing engine context evaluation
    updateSummary();
});

</script>
