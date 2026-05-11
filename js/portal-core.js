/* --- FILINGS4U GLOBAL PORTAL CORE --- */

const PortalApp = {
    // 1. Initialize State
    init() {
        this.syncEntityContext();
        this.loadPricingData();
        this.initMobileNav();
        this.applyPriceLock();
    },

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
