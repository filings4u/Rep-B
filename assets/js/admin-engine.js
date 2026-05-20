// assets/js/admin-engine.js
(function initializeProductionAdminMasterEngine() {
    "use strict";

    console.log("⚙️ Master Production Admin Infrastructure Engine Active...");

    // ==========================================================================
    // ⏰ 1. REAL-TIME SYSTEM CLOCK & DATE COUPLING METRICS
    // ==========================================================================

function runProductionGlobalClock() {
    const clockNode = document.getElementById('portal-clock');
    if (!clockNode) return;
    
    setInterval(() => {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
        
        // FORCED 12-HOUR REGIME: Enforces AM/PM structural criteria
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        clockNode.textContent = `${dateString} | ${timeString}`;
    }, 1000);
}
document.addEventListener('DOMContentLoaded', runProductionGlobalClock);


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

/**
 * 👑 Admin Directorate Synchronization Hook Extension
 * Injected to manage incoming customer orders and link chat lines dynamically
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("👑 Admin Operation Engine fully loaded. Mapping global event wires...");
    initializeGlobalAdminOversightNetwork();
});

function initializeGlobalAdminOversightNetwork() {
    if (typeof supabase === 'undefined') return;

    // Admin monitors all user registration pipeline modifications across the network
    supabase.channel('public_pipeline_tracker')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'filing_orders' }, (payload) => {
            notifyAdminSystemAlert(payload.new);
        })
        .subscribe();
}

function notifyAdminSystemAlert(newOrderRecord) {
    console.log("🔔 New client order payload logged to platform:", newOrderRecord);
    
    // Smoothly pushes notifications straight to the admin manager screen layout
    const alertBox = document.createElement("div");
    alertBox.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: var(--emerald); color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-size: 0.85rem; font-weight: 600;";
    alertBox.textContent = `New Order: ${newOrderRecord.service_title} in ${newOrderRecord.target_state} ($${newOrderRecord.total_amount})`;
    
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 5000);

    // Refresh data tables in admin-dashboard layout automatically if function definitions exist
    if (typeof fetchSystemWideOperationsMetrics === 'function') {
        fetchSystemWideOperationsMetrics();
    }
}

// 🎧 ACTIVATE ADMIN CHAT OVER WATCH LINK FOR SELECTED CLIENT
function bindAdminChatFocusToClient(clientId) {
    const logContainer = document.getElementById("adminChatMessagesLog");
    if (logContainer) logContainer.innerHTML = ""; // Wipe past active chat thread panel views
    
    // Connect admin listeners to the specified user's room tracking thread
    linkLiveMessagingTerminal(clientId);
}

// assets/js/admin-engine.js
(function initializeProductionAdminMasterEngine() {
    "use strict";

    console.log("⚙️ Master Production Admin Infrastructure Engine Active...");

    // ==========================================================================
    // ⏰ 1. REAL-TIME SYSTEM CLOCK & DATE COUPLING METRICS
    // ==========================================================================

function runProductionGlobalClock() {
    const clockNode = document.getElementById('portal-clock');
    if (!clockNode) return;
    
    setInterval(() => {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
        
        // FORCED 12-HOUR REGIME: Enforces AM/PM structural criteria
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        clockNode.textContent = `${dateString} | ${timeString}`;
    }, 1000);
}
document.addEventListener('DOMContentLoaded', runProductionGlobalClock);


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

/**
 * 👑 Admin Directorate Synchronization Hook Extension
 * Injected to manage incoming customer orders and link chat lines dynamically
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("👑 Admin Operation Engine fully loaded. Mapping global event wires...");
    initializeGlobalAdminOversightNetwork();
});

function initializeGlobalAdminOversightNetwork() {
    if (typeof supabase === 'undefined') return;

    // Admin monitors all user registration pipeline modifications across the network
    supabase.channel('public_pipeline_tracker')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'filing_orders' }, (payload) => {
            notifyAdminSystemAlert(payload.new);
        })
        .subscribe();
}

function notifyAdminSystemAlert(newOrderRecord) {
    console.log("🔔 New client order payload logged to platform:", newOrderRecord);
    
    // Smoothly pushes notifications straight to the admin manager screen layout
    const alertBox = document.createElement("div");
    alertBox.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: var(--emerald); color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-size: 0.85rem; font-weight: 600;";
    alertBox.textContent = `New Order: ${newOrderRecord.service_title} in ${newOrderRecord.target_state} ($${newOrderRecord.total_amount})`;
    
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 5000);

    // Refresh data tables in admin-dashboard layout automatically if function definitions exist
    if (typeof fetchSystemWideOperationsMetrics === 'function') {
        fetchSystemWideOperationsMetrics();
    }
}

// 🎧 ACTIVATE ADMIN CHAT OVER WATCH LINK FOR SELECTED CLIENT
function bindAdminChatFocusToClient(clientId) {
    const logContainer = document.getElementById("adminChatMessagesLog");
    if (logContainer) logContainer.innerHTML = ""; // Wipe past active chat thread panel views
    
    // Connect admin listeners to the specified user's room tracking thread
    linkLiveMessagingTerminal(clientId);
}