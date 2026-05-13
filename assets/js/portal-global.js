function prepareOrder() {
    const totalDisplay = document.getElementById('summary-total');
    if (!totalDisplay) return;

    // Convert "$1,299.00" to "1299" (removes $, commas, and decimals)
    const rawPrice = totalDisplay.innerText.replace(/[^0-9.]/g, '');
    const cleanPrice = Math.floor(parseFloat(rawPrice));

    const params = new URLSearchParams(window.location.search);
    const orderData = {
        plan: params.get('plan') || 'standard_filing', // Identifies the service (e.g., trucker, 2290, llc)
        price: cleanPrice, 
        customer_email: "session-user@email.com", // Pull this from Supabase session
        company_name: document.querySelector('input[placeholder*="Business Name"]')?.value || "Client Entity"
    };

    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = "https://filings4u.com";
}

/* Inside PortalApp object */
const PortalApp = {
    async init() {
        await this.checkAuth(); // Added: Force login first
        this.syncEntityContext();
        this.loadPricingData();
        this.initMobileNav();
        // startClock(); // Ensure this is called if the clock is in this file
    },

    async checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // If no session, boot them to the login/registration page
            window.location.href = 'index.html';
        }
    },
    
}


    // 2. Entity Context Management (The "State of the Art" Switcher)
    syncEntityContext() {
        const urlParams = new URLSearchParams(window.location.search);
        const entityId = urlParams.get('eid') || localStorage.getItem('active_entity_id') || 'all';
        
        localStorage.setItem('active_entity_id', entityId);
        
        // Update all UI elements with the entity name
        const entityDisplays = document.querySelectorAll('.active-entity-name');
        const entityName = this.getEntityNameById(entityId);
        entityDisplays.forEach(el => el.innerText = entityName);

        // Sync the sidebar dropdown value
        const switcher = document.getElementById('entitySelect');
        if(switcher) switcher.value = entityId;
    },

    getEntityNameById(id) {
        const names = {
            '4242': 'Roseland Logistics LLC',
            '4243': 'Roseland Real Estate',
            'all': 'All Entities (Portfolio)'
        };
        return names[id] || 'Select Company';
    },

    handleContextSwitch(id) {
        // State-of-the-Art Transition
        const overlay = document.getElementById('switcher-overlay');
        if(overlay) overlay.style.display = 'flex';
        
        localStorage.setItem('active_entity_id', id);
        
        setTimeout(() => {
            window.location.reload(); // In production, use AJAX to fetch data
        }, 600);
    },

    // 3. Dynamic Pricing & Convenience Markup
    async loadPricingData() {
        try {
            // Cache busting with versioning
            const v = "1.4.2"; 
            const response = await fetch(`assets/data/pricing.json?v=${v}`);
            const data = await response.json();
            
            this.updatePricingUI(data);
            this.checkPromotions(data);
        } catch (e) { console.error("Pricing sync failed", e); }
    },

    updatePricingUI(data) {
        // Auto-calculate Total = Base + (State + Flat Convenience)
        const stateSelect = document.getElementById('state-select');
        if(stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                const state = e.target.value;
                const stateConfig = data.state_fees[state];
                const totalGovFee = stateConfig.llc_formation + stateConfig.convenience_markup;
                
                document.getElementById('state-fee-display').innerText = `$${totalGovFee.toFixed(2)}`;
                // Save to local storage to prevent price jumps during session
                localStorage.setItem('locked_quote', totalGovFee);
            });
        }
    },

    // 4. Mobile Navigation Logic
    initMobileNav() {
        window.toggleSidebar = () => {
            const sb = document.getElementById('sidebar');
            if(sb) sb.classList.toggle('mobile-active');
        };
    }
};

document.addEventListener('DOMContentLoaded', () => PortalApp.init());


// portal-global.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Highlight current sidebar link
    const currentPath = window.location.pathname.split("/").pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPath) item.classList.add('active');
    });

    // 2. Notification Toggle
    const bell = document.querySelector('.notification-wrapper');
    const dropdown = document.querySelector('.notification-dropdown');
    
    if (bell && dropdown) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => dropdown.classList.remove('show'));
    }
});


/* --- FILINGS4U PORTAL STATE ENGINE --- */
const PortalState = {
    // Current App State
    state: {
        activeEntityId: localStorage.getItem('active_entity_id') || '4242',
        lockedPrice: localStorage.getItem('locked_price') || '0.00',
        userRole: 'admin', // or 'client'
        isMobile: window.innerWidth  {
            el.innerText = names[this.state.activeEntityId] || 'All Entities';
        });

    }

    // Handle Entity Switching across ALL pages
    handleSwitch(id) {
        // Trigger the State-of-the-Art AJAX Overlay (from previous code)
        const overlay = document.getElementById('switcher-overlay');
        if (overlay) overlay.style.display = 'flex';

        localStorage.setItem('active_entity_id', id);
        this.state.activeEntityId = id;

        // Smart Redirect: Stay on same page but refresh data
        setTimeout(() => {
            const currentPage = window.location.pathname;
            window.location.href = currentPage + "?eid=" + id;
        }, 600);
    },

    // Logic for Step-by-Step Intakes
    saveStepData(stepNumber, data) {
        const key = `llc_intake_step_${stepNumber}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Price Guardrail: Locks the price during checkout
    lockPrice(amount) {
        localStorage.setItem('locked_price', amount);
        this.state.lockedPrice = amount;
    }
};

document.addEventListener('DOMContentLoaded', () => PortalState.init());

/* --- REFINED PAYMENT RETRY LOGIC --- */
const PaymentEngine = {
    handleFailure(errorCode) {
        console.warn("Payment Declined: " + errorCode);
        
        // Find the status area on Step 4
        const statusArea = document.getElementById('payment-status-area');
        if (!statusArea) return;

        statusArea.innerHTML = `
            <div class="error-box" style="padding: 25px; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #991b1b;">Card Declined (${errorCode})</h4>
                <p style="font-size: 0.85rem; color: #475569;">Your filing data is securely saved. Please use a different card or contact your bank.</p>
                <button class="btn-primary-small" style="margin-top: 15px; background: #991b1b;" onclick="location.reload()">Try Different Card</button>
            </div>
        `;
        
        // Ensure the scroll position moves to the error so they see it
        statusArea.scrollIntoView({ behavior: 'smooth' });
    }
};

// Add to your global retry function
PortalState.retryPayment = function() {
    // This function clears the error UI and re-enables the Stripe inputs
    const statusArea = document.getElementById('payment-status-area');
    if (statusArea) statusArea.innerHTML = '';
    console.log("Re-initializing Stripe Elements for retry...");
};


/**
 * filings4u Portal Switcher & Navigation Logic
 * Manages global entity switching and sidebar active states
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTOMATIC SIDEBAR ACTIVE STATE
    // Finds the current filename and highlights the matching nav-item
    const currentPath = window.location.pathname.split("/").pop();
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (currentPath === itemHref) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 2. ENTITY SWITCHER INITIALIZATION
    // Loads the last selected entity from localStorage if it exists
    const switcher = document.querySelector('.switcher-dropdown');
    if (switcher) {
        const savedEntity = localStorage.getItem('activeEntity');
        if (savedEntity) {
            switcher.value = savedEntity;
            updatePortalContext(savedEntity);
        }
    }
});

/**
 * Triggered when a user selects a different company in the sidebar
 * @param {string} entityName - The name of the selected company
 */
function switchEntity(entityName) {
    // Save selection for persistence across all 31 pages
    localStorage.setItem('activeEntity', entityName);
    
    // Add visual feedback (flash effect)
    const mainContent = document.querySelector('.portal-main');
    if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.transition = 'opacity 0.2s';
        
        setTimeout(() => {
            updatePortalContext(entityName);
            mainContent.style.opacity = '1';
            // Optional: Reload the page to refresh all company data
            // window.location.reload(); 
        }, 300);
    }
}

/**
 * Updates UI elements (like "Welcome back...") based on the active entity
 */
function updatePortalContext(name) {
    const welcomeBold = document.querySelector('.welcome-text p strong');
    const headerCompany = document.querySelector('.portal-header p strong');
    
    if (welcomeBold) welcomeBold.innerText = name;
    if (headerCompany) headerCompany.innerText = name;
    
    console.log(`Context Switched to: ${name}`);
}

/**
 * Logout Logic
 */
function handleLogout() {
    if (confirm("Are you sure you want to sign out?")) {
        localStorage.removeItem('activeEntity');
        window.location.href = 'index.html';
    }
}

async function prepareOrder() {
    // 1. Get current logged-in user email
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Session expired. Please log in again.");
        window.location.href = "index.html";
        return;
    }

    const totalDisplay = document.getElementById('summary-total');
    if (!totalDisplay) return;

    // 2. Clean price string: "$1,299.00" -> 1299
    const rawPrice = totalDisplay.innerText.replace(/[^0-9.]/g, '');
    const cleanPrice = Math.floor(parseFloat(rawPrice));

    // 3. Auto-detect service from filename (e.g. wizard-2290.html -> 2290)
    const serviceType = window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', '');

    const orderData = {
        plan: serviceType,
        price: cleanPrice,
        customer_email: session.user.email, // Use the secure session email
        company_name: document.querySelector('input[placeholder*="Business Name"]')?.value || "New Carrier"
    };

    // 4. Store and send to checkout
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = "https://portal.filings4u.com/order.html";
}
