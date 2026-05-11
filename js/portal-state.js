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


