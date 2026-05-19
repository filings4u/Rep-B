// assets/js/admin-engine.js
(function initializeProductionAdminMasterEngine() {
    "use strict";

    console.log("⚙️ Master Production Admin Infrastructure Engine Active...");

    // ==========================================================================
    // ⏰ 1. REAL-TIME SYSTEM CLOCK & DATE COUPLING METRICS
    // ==========================================================================
    const clockDisplayElement = document.getElementById('portal-clock');
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateString = `${mm}/${dd}/${yyyy}`;
        const timeString = now.toTimeString().split(' ')[0]; 
        clockDisplayElement.innerText = `${dateString} | ${timeString}`;
    }
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();
    }

    // ==========================================================================
    // 🚪 2. SECURE LOGOUT & TELEMETRY CLEANER
    // ==========================================================================
    window.executeTerminalSessionTermination = async function(btnElement) {
        if (btnElement) btnElement.disabled = true;
        
        // Log auditing telemetry to system database trail before storage teardown
        const client = window.supabaseClient;
        if (client && client.auth) {
            try {
                const { data: { session } } = await client.auth.getSession();
                if (session && session.user) {
                    await client.from('platform_system_logs').insert({
                        timestamp: new Date().toISOString(),
                        log_type: 'SYSTEM',
                        user_email: session.user.email,
                        message: `Staff Administrator logged out successfully.`
                    });
                }
                await client.auth.signOut();
            } catch (err) {
                console.warn("Background audit write skipped:", err.message);
            }
        }

        localStorage.removeItem("filings4u_secure_session_token");
        sessionStorage.clear();
        const baseTarget = window.productionRootUrl || window.location.origin;
        window.location.replace(`${baseTarget}/admin-login.html`);
    };

    document.addEventListener("DOMContentLoaded", () => {
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.executeTerminalSessionTermination(fallbackLogoutBtn);
            });
        }
    });

    // ==========================================================================
    // 🔍 3. GLOBAL PLATFORM SEARCH MATRIX OVERRIDE
    // ==========================================================================
    const globalSearchBox = document.getElementById('adminGlobalSearchField');
    if (globalSearchBox) {
        globalSearchBox.addEventListener('keyup', (e) => {
            const criteria = e.target.value.toLowerCase().trim();
            const searchableRows = document.querySelectorAll('.admin-table-ledger tbody tr, .ticket-row, .log-entry-row');
            
            searchableRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(criteria) ? "" : "none";
            });
        });
    }

    // ==========================================================================
    // 📊 4. ANALYTICS PIPELINE ENGINE
    // ==========================================================================
    async function loadGlobalLiveAnalytics() {
        const client = window.supabaseClient;
        if (!client) return;

        try {
            const { data: workspaceRows } = await client.from('user_filings_workspace').select('amount_paid, status');
            
            if (workspaceRows) {
                const grossRevenue = workspaceRows
                    .filter(r => r.status === 'paid' && r.amount_paid)
                    .reduce((sum, item) => sum + parseFloat(item.amount_paid), 0);
                
                const activeEntitiesCount = [...new Set(workspaceRows.map(r => r.id))].length;
                const draftFilingCount = workspaceRows.filter(r => r.status === 'draft').length;

                const revenueText = document.getElementById('stat-total-revenue') || document.getElementById('summary-collected-revenue');
                const entitiesText = document.getElementById('stat-active-users') || document.getElementById('summary-total-orders');
                const filingsText = document.getElementById('stat-pending-filings') || document.getElementById('summary-unpaid-amount');

                if (revenueText) revenueText.innerText = `$${grossRevenue.toFixed(2)}`;
                if (entitiesText) entitiesText.innerText = activeEntitiesCount.toString();
                if (filingsText) {
                    if (filingsText.id === 'summary-unpaid-amount') {
                        filingsText.innerText = `$${(draftFilingCount * 149.00).toFixed(2)}`;
                    } else {
                        filingsText.innerText = draftFilingCount.toString();
                    }
                }
            }
        } catch (err) {
            console.error("Analytics pipeline trace failure:", err.message);
        }
    }

    const verificationPollingLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(verificationPollingLoop);
            loadGlobalLiveAnalytics();
        }
    }, 150);
})();
