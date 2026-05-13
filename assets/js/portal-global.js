/* --- FILINGS4U MASTER PORTAL ENGINE --- */
const PortalApp = {
    state: {
        activeEntityId: localStorage.getItem('active_entity_id') || 'all',
        entities: {
            '4242': 'Roseland Logistics LLC',
            '4243': 'Roseland Real Estate',
            'all': 'All Entities (Portfolio)'
        }
    },

    async init() {
        // 1. Run Security Check First (Non-blocking)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Load UI Components
        this.updateEntityUI();
        this.initSidebar();
        this.initNotifications();
        this.startClock();
    },

    // Entity Management
    updateEntityUI() {
        const name = this.state.entities[this.state.activeEntityId] || 'Select Company';
        document.querySelectorAll('.active-entity-name').forEach(el => el.innerText = name);
        
        const switcher = document.getElementById('entitySelect');
        if (switcher) switcher.value = this.state.activeEntityId;
    },

    handleContextSwitch(id) {
        localStorage.setItem('active_entity_id', id);
        // Visual feedback before reload
        document.body.style.opacity = '0.6';
        window.location.reload();
    },

    // Sidebar Active State Logic
    initSidebar() {
        const currentPath = window.location.pathname.split("/").pop();
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('href') === currentPath) item.classList.add('active');
        });
    },

    // UI Helpers
    startClock() {
        const clock = document.getElementById('portal-clock');
        if (!clock) return;
        setInterval(() => {
            const now = new Date();
            clock.innerText = now.toLocaleString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', hour12: true 
            });
        }, 1000);
    },

    initNotifications() {
        const bell = document.querySelector('.notification-wrapper');
        const dropdown = document.querySelector('.notification-dropdown');
        if (bell && dropdown) {
            bell.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
            document.onclick = () => dropdown.classList.remove('show');
        }
    }
};

// 3. GLOBAL PAYMENT PREP (Works for all 33 Wizards)
async function prepareOrder() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = "index.html";

    const totalDisplay = document.getElementById('summary-total');
    if (!totalDisplay) return;

    const rawPrice = totalDisplay.innerText.replace(/[^0-9.]/g, '');
    const cleanPrice = Math.floor(parseFloat(rawPrice));
    const serviceType = window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', '');

    const orderData = {
        plan: serviceType,
        price: cleanPrice,
        customer_email: session.user.email,
        company_name: document.querySelector('input[placeholder*="Business Name"]')?.value || "New Carrier"
    };

    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = "https://portal.filings4u.com/order.html";
}

function handleLogout() {
    if (confirm("Sign out?")) {
        supabase.auth.signOut().then(() => {
            localStorage.removeItem('active_entity_id');
            window.location.href = 'index.html';
        });
    }
}

// SINGLE entry point for performance
document.addEventListener('DOMContentLoaded', () => PortalApp.init());

async function prepareOrder() {
    console.log("Preparing Order...");
    
    // 1. Get the total from the UI
    const totalEl = document.getElementById('summary-total');
    if (!totalEl) {
        console.error("Critical Error: element 'summary-total' not found.");
        return;
    }

    // 2. Format Price: Remove ALL non-numeric characters (converts $849.00 to 849)
    const rawValue = totalEl.innerText;
    const cleanPrice = Math.floor(parseFloat(rawValue.replace(/[^0-9.]/g, '')));
    
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
        alert("Invalid order amount. Please refresh and try again.");
        return;
    }

    // 3. Get Auth Session for Email
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email || "pending@filings4u.com";

    // 4. Capture Company Name
    const companyInput = document.querySelector('input[placeholder*="Business Name"]') || 
                         document.querySelector('input[name="company_name"]');
    const companyName = companyInput?.value || "New Filing Entity";

    // 5. detect Service Type (from filename)
    const serviceType = window.location.pathname.split('/').pop().replace('wizard-', '').replace('.html', '');

    const orderData = {
        plan: serviceType,
        price: cleanPrice, // Number, not string
        customer_email: userEmail,
        company_name: companyName
    };

    // 6. Save and Force Redirect
    console.log("Saving order data:", orderData);
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Using assign() to force the browser to navigate
    window.location.assign("https://filings4u.com");
}
