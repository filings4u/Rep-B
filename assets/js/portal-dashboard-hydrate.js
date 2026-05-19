// assets/js/portal-dashboard-hydrate.js
(async function handleSecurePortalOrchestration() {
    "use strict";

    // 1. Polling engine waiting safely for centralized config setup initialization
    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 30);
        });
    }

    const client = await waitForSupabaseClientEngine();

    // Core Global Cache Handlers
    let activeUserSessionObject = null;

    // DOM Target Declarations Array Checks
    const billingModalNode = document.getElementById('billing-orders-modal');
    const billingTableBody = document.getElementById('billing-ledger-table-body');
    const totalSpentCard = document.getElementById('billing-total-spent');
    const settledCountCard = document.getElementById('billing-settled-count');

    // ==========================================================================
    // 💳 GLOBAL PERSISTENT TRANSACTION LEDGER MODAL MANAGERS
    // ==========================================================================
    window.openBillingOrdersModal = async function() {
        if (!billingModalNode) return;
        billingModalNode.style.display = 'flex';
        billingModalNode.style.animation = 'fadeIn 0.2s ease forwards';
        
        if (activeUserSessionObject) {
            await syncItemizedBillingLedger(activeUserSessionObject.email);
        }
    };

    window.closeBillingOrdersModal = function() {
        if (billingModalNode) billingModalNode.style.display = 'none';
    };

    // Fetches live data records directly from the newly created secure sales_ledger schema table
    async function syncItemizedBillingLedger(customerEmail) {
        if (!billingTableBody) return;

        try {
            const { data: transactions, error } = await client
                .from('sales_ledger')
                .select('*')
                .eq('customer_email', customerEmail.toLowerCase())
                .order('purchase_date', { ascending: false });

            if (error) throw error;

            if (!transactions || transactions.length === 0) {
                billingTableBody.innerHTML = `<tr><td colspan="4" style="padding:30px 5px; text-align:center; color:#64748b; font-style:italic;">No purchase transactions mapped to this accounting network vector.</td></tr>`;
                if (totalSpentCard) totalSpentCard.innerText = "$0.00";
                if (settledCountCard) settledCountCard.innerText = "0 Transactions";
                return;
            }

            // Compute lifetime financial metrics math algorithms on the fly safely
            const lifetimeTotalSpent = transactions.reduce((sum, row) => sum + (parseFloat(row.amount_paid) || 0), 0);
            
            if (totalSpentCard) totalSpentCard.innerText = `$${lifetimeTotalSpent.toFixed(2)}`;
            if (settledCountCard) settledCountCard.innerText = `${transactions.length} Transaction${transactions.length > 1 ? 's' : ''}`;

            billingTableBody.innerHTML = '';
            transactions.forEach(row => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';
                
                const settlementDate = row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : 'N/A';
                const costFormatted = typeof row.amount_paid === 'number' ? `$${row.amount_paid.toFixed(2)}` : `$${parseFloat(row.amount_paid || 0).toFixed(2)}`;

                tr.innerHTML = `
                    <td style="padding:12px 5px; font-weight:600; color:#0a1f44;">
                        <span style="display:block; font-size:0.85rem;">${row.filing_entity}</span>
                        <small style="color:#64748b; font-size:0.7rem; font-family:monospace;">Ref: #${row.id.substring(0,8).toUpperCase()}</small>
                    </td>
                    <td style="padding:12px 5px; color:#44526c;">${settlementDate}</td>
                    <td style="padding:12px 5px; text-align:right; font-weight:700; color:#0a1f44;">${costFormatted}</td>
                    <td style="padding:12px 5px; text-align:right;">
                        <button class="btn-portal-download" onclick="alert('Downloading invoice link for reference item: ${row.id}')" style="background:#0a1f44; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:0.7rem; cursor:pointer;">Receipt 🧾</button>
                    </td>
                `;
                billingTableBody.appendChild(tr);
            });

        } catch (err) {
            console.error("Billing ledger compilation anomaly caught:", err.message);
            billingTableBody.innerHTML = `<tr><td colspan="4" style="padding:30px 5px; text-align:center; color:#c15254; font-weight:700;">Failed to sync billing data ledger: ${err.message}</td></tr>`;
        }
    }

    // ==========================================================================
    // 🕹️ SINGLE-PAGE ARCHITECTURE ROUTER CONTROLLERS
    // ==========================================================================
    window.switchActivePortalTab = function(tabId, anchorElement) {
        const sectionsList = document.querySelectorAll('.portal-main-view');
        const navItemsList = document.querySelectorAll('.sidebar-nav .nav-item');

        if (billingModalNode) billingModalNode.style.display = 'none';

        sectionsList.forEach(viewNode => {
            if (viewNode.id === tabId) {
                viewNode.style.display = "block";
                viewNode.classList.add('active-view');
            } else {
                viewNode.style.display = "none";
                viewNode.classList.remove('active-view');
            }
        });

        if (anchorElement) {
            navItemsList.forEach(item => item.classList.remove('active'));
            anchorElement.classList.add('active');
        }

        const dashboardTitleHeadingNode = document.getElementById('dynamic-service-title-target');
        const headingsTextMap = {
            'dashboard-tab': 'Dashboard Overview',
            'catalog-tab': 'Compliance Store Catalog',
            'calendar-tab': 'Filing Milestones Calendar',
            'vault-tab': 'Encrypted Vault Storage Locker',
            'settings-tab': 'Account Information & Settings Profile'
        };

        if (dashboardTitleHeadingNode && headingsTextMap[tabId]) {
            dashboardTitleHeadingNode.innerText = headingsTextMap[tabId];
        }
    };

    // ==========================================================================
    // 📊 CLIENT APPLICATION RECORD WORKSPACE HANDLERS
    // ==========================================================================
    window.initializeSmartServiceDashboard = async function(userId) {
        if (!userId) return;

        try {
            // Self-Healing Profile Alignment Verification Check
            const { data: { user }, error: authUserError } = await client.auth.getUser();
            if (authUserError || !user) throw new Error("Could not recover session profile.");

            activeUserSessionObject = user;

            // 🎯 FIXED: Direct correction maps to update input targets to matching node selector properties
            const targetCompanyNameTextNode = document.getElementById('company-name-target');
            const targetSettingsEmailInputNode = document.getElementById('settings-user-email');
            const targetSettingsNameInputNode = document.getElementById('settings-user-name');

            if (targetCompanyNameTextNode) targetCompanyNameTextNode.innerText = user.email;
            if (targetSettingsEmailInputNode) targetSettingsEmailInputNode.value = user.email;
            
            // Safely hydrate profile layout details out of your public metadata tracking schemas
            const { data: profile } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (profile && targetSettingsNameInputNode) {
                targetSettingsNameInputNode.value = profile.full_name || '';
            }

            // Sync user steps progress metrics data
            const { data: filings, error: databaseQueryError } = await client
                .from('user_filings_workspace')
                .select('*')
                .eq('user_id', userId);

            if (databaseQueryError) throw databaseQueryError;

            const totalCount = filings ? filings.length : 0;
            const paidCount = filings ? filings.filter(f => f.status === 'paid').length : 0;
            const draftCount = filings ? filings.filter(f => f.status === 'draft').length : 0;

            const totalCountNode = document.getElementById('stat-total-count');
            const paidCountNode = document.getElementById('stat-paid-count');
            const draftCountNode = document.getElementById('stat-draft-count');

            if (totalCountNode) totalCountNode.innerText = totalCount;
            if (paidCountNode) paidCountNode.innerText = paidCount;
            if (draftCountNode) draftCountNode.innerText = draftCount;

            // Render sub-panel elements collections
            renderDashboardSubElements(filings || []);

        } catch (globalHandshakeErr) {
            console.error("Dashboard initialization breakdown structural tracking caught exception:", globalHandshakeErr.message);
        }

        // Inside assets/js/portal-dashboard-hydrate.js -> Successful authentication callback:
if (typeof initializeSmartServiceDashboard === 'function') {
    await initializeSmartServiceDashboard(session.user.id);
    
    // 🎯 INITIALIZE FRESH REVENUE AND REPOSITORY CHANNELS
    await window.streamLiveStaffSupportTimeline(session.user.id);
    await window.mountVaultDocumentTargetGrid(session.user.id);
}

    };

    function renderDashboardSubElements(filingsList) {
        const vaultDownloadsContainer = document.getElementById('dynamic-vault-downloads-target');
        const statusSnapshotContainer = document.getElementById('dynamic-status-snapshot-target');
        const corporateListTargetNode = document.getElementById('settings-corporate-filings-list');

        const paidFilings = filingsList.filter(f => f.status === 'paid');

        if (paidFilings.length > 0) {
            if (vaultDownloadsContainer) {
                vaultDownloadsContainer.innerHTML = paidFilings.map(file => `
                    <li style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 0.9rem; align-items:center;">
                        <span>📄 Approval_Certificate_${file.service_key.toUpperCase()}.pdf</span>
                        Download</button>
                    </li>
                `).join('');
            }

            if (statusSnapshotContainer) {
                statusSnapshotContainer.innerHTML = paidFilings.map(file => {
                    const humanReadableName = file.service_key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return `
                        <li class="compliance-list-item" style="display:flex; justify-content:space-between; padding: 10px 0; font-size:0.9rem; border-bottom: 1px solid #f1f5f9;">
                            <span>${humanReadableName}</span>
                            <span style="color:#10b981; font-weight:bold;">✓ Active</span>
                        </li>
                    `;
                }).join('');
            }

            if (corporateListTargetNode) {
                corporateListTargetNode.innerHTML = paidFilings.map(file => {
                    const humanReadableName = file.service_key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return `
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 15px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div>
                                <strong style="display:block; color:#0a1f44; font-weight:700;">${humanReadableName}</strong>
                                <small style="color:#4a5568; display:block; margin-top:2px;">Filing Record ID: #${file.id.substring(0,8).toUpperCase()}</small>
                            </div>
                            <span style="background:#ecfdf5; color:#10b981; font-weight:700; font-size:0.7rem; padding:3px 8px; border-radius:10px; text-transform:uppercase;">Active Account</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // ==========================================================================
    // RUN MASTER INITIALIZATION LOOP
    // ==========================================================================
    try {
        await client.auth.initialize();
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user) {
            await window.initializeSmartServiceDashboard(session.user.id);
        }
    } catch(err) {
        console.error("System configuration crash:", err.message);
    }

})();
