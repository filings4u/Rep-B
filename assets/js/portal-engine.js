// assets/js/portal-engine.js
(async function initializeUnifiedPortalEngine() {
    "use strict";

    // 1. Asynchronous polling engine waiting safely for config client instantiation
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

    // Global Environment Tracking Pointers
    window.globalSessionUserId = null;
    window.activeSessionUserObject = null;

    // ==========================================================================
    // 🌐 SINGLE-PAGE APP NAVIGATION ROUTER VIEW CONTROL
    // ==========================================================================
    window.switchActivePortalTab = function(tabId, anchorElement) {
        const views = document.querySelectorAll('.portal-main-view');
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

        const billingModalNode = document.getElementById('billing-orders-modal');
        if (billingModalNode) billingModalNode.style.display = 'none';

        views.forEach(v => {
            if (v.id === tabId) {
                v.style.display = "block";
                v.classList.add('active-view');
            } else {
                v.style.display = "none";
                v.classList.remove('active-view');
            }
        });

        if (anchorElement) {
            navItems.forEach(item => item.classList.remove('active'));
            anchorElement.classList.add('active');
        } else {
            navItems.forEach(item => item.classList.remove('active'));
            const matchLink = Array.from(navItems).find(i => 
                i.innerHTML.includes('My Companies') || 
                (i.getAttribute('onclick') && i.getAttribute('onclick').includes(tabId))
            );
            if (matchLink) matchLink.classList.add('active');
        }

        const headingsMap = {
            'dashboard-tab': 'Dashboard',
            'catalog-tab': 'Compliance Store Catalog',
            'calendar-tab': 'Compliance Calendar',
            'vault-tab': 'Secure Document Archive',
            'settings-tab': 'Account Information & Settings Profile'
        };
        
        const headingTarget = document.getElementById('dynamic-service-title-target');
        if (headingTarget && headingsMap[tabId]) {
            headingTarget.innerText = headingsMap[tabId];
        }
    };

    // ==========================================================================
    // 📊 CORE WORKSPACE DATA RENDERING ORCHESTRATOR
    // ==========================================================================
    window.initializeSmartServiceDashboard = async function(userId) {
        if (!userId) return;
        window.globalSessionUserId = userId;

        try {
            const { data: { session }, error: sessionError } = await client.auth.getSession();
            if (!sessionError && session && session.user) {
                window.activeSessionUserObject = session.user;
                
                const companyLabel = document.getElementById('company-name-target');
                if (companyLabel) companyLabel.innerText = session.user.email;

                // Sync profile configuration form input elements values safely
                const settingsEmailInput = document.getElementById('settings-user-email');
                if (settingsEmailInput) settingsEmailInput.value = session.user.email;
                
                const settingsNameInput = document.getElementById('settings-user-name');
                if (settingsNameInput && !settingsNameInput.value && session.user.user_metadata?.full_name) {
                    settingsNameInput.value = session.user.user_metadata.full_name;
                }

                const settingsAddressInput = document.getElementById('settings-user-address');
                if (settingsAddressInput && !settingsAddressInput.value && session.user.user_metadata?.personal_address) {
                    settingsAddressInput.value = session.user.user_metadata.personal_address;
                }
            }

            const { data: filings, error } = await client
                .from('user_filings_workspace')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const totalCount = filings ? filings.length : 0;
            const paidCount = filings ? filings.filter(f => f.status === 'paid').length : 0;
            const draftCount = filings ? filings.filter(f => f.status === 'draft').length : 0;

            const totalEl = document.getElementById('stat-total-count');
            const paidEl = document.getElementById('stat-paid-count');
            const draftEl = document.getElementById('stat-draft-count');

            if (totalEl) totalEl.innerText = totalCount;
            if (paidEl) paidEl.innerText = paidCount;
            if (draftEl) draftEl.innerText = draftCount;

            const vaultContainer = document.getElementById('dynamic-vault-downloads-target');
            const statusContainer = document.getElementById('dynamic-status-snapshot-target');
            const activityContainer = document.getElementById('dynamic-activity-logs-target');

            const registryMeta = window.WIZARD_REGISTRY || {};
            const paidFilings = filings ? filings.filter(f => f.status === 'paid') : [];
            const draftFilings = filings ? filings.filter(f => f.status === 'draft') : [];

            if (vaultContainer) vaultContainer.innerHTML = '';
            if (statusContainer) statusContainer.innerHTML = '';
            if (activityContainer) activityContainer.innerHTML = '';

            if (paidFilings.length > 0) {
                if (vaultContainer) {
                    vaultContainer.innerHTML = paidFilings.map(file => `
                        <li style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 0.9rem; align-items:center;">
                            <span>📄 Approval_Certificate_${file.service_key.toUpperCase()}.pdf</span>
                            <button onclick="window.triggerDeliverableDownload('${file.service_key}')" style="color: #0a1f44; font-weight: bold; background:#edf2f7; padding:4px 8px; border-radius:4px; font-size:0.75rem; border:none; cursor:pointer;">Download</button>
                        </li>
                    `).join('');
                }

                if (statusContainer) {
                    statusContainer.innerHTML = paidFilings.map(file => {
                        const meta = registryMeta[file.service_key] || { title: file.service_key };
                        return `
                            <li class="compliance-list-item" style="display:flex; justify-content:space-between; padding: 10px 0; font-size:0.9rem; border-bottom: 1px solid #f1f5f9;">
                                <span>${meta.title || file.service_key}</span>
                                <span style="color:#10b981; font-weight:bold;">✓ Active</span>
                            </li>
                        `;
                    }).join('');
                }
            }

            if (draftFilings.length > 0 && activityContainer) {
                activityContainer.innerHTML = draftFilings.map(file => {
                    const meta = registryMeta[file.service_key] || { title: file.service_key };
                    return `
                        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align:left;">
                            <p style="margin:0; font-size: 0.9rem; color:#0a1f44;">Draft active: <strong>${meta.title || file.service_key}</strong> forms suite requires entries.</p>
                            <small style="color: #a0aec0; display:block; margin-top:4px;"><a href="wizard.html?service=${file.service_key}" style="color:#0a1f44; font-weight:700; text-decoration:none;">Resume Filing Form ➔</a></small>
                        </div>
                    `;
                }).join('');
            }

            window.generateLiveStoreCatalogGrid(filings);
            window.renderCorporateAmendmentsInterfaceGrid(filings);
            window.syncVaultTabDocumentGrid(userId);

        } catch (err) {
            console.error("Dashboard engine hydration issue:", err.message);
        }
    };

    window.triggerDeliverableDownload = function(serviceKey) {
        alert(`Handshaking cloud data architecture compiler variables matching deliverable item: [Certificate_${serviceKey.toUpperCase()}.PDF]. Generating printable document receipt...`);
    };

    // ==========================================================================
    // 🏢 SERVICE CATALOG GRID CONSTRUCT FACTORY
    // ==========================================================================
    window.generateLiveStoreCatalogGrid = function(filings) {
        const targetGrid = document.getElementById('live-store-catalog-grid-target');
        if (!targetGrid) return;

        const registry = window.WIZARD_REGISTRY || {};
        const activeKeys = filings ? filings.map(f => f.service_key) : [];

        targetGrid.innerHTML = Object.keys(registry).map(key => {
            const spec = registry[key];
            const alreadyPurchased = activeKeys.includes(key);
            const itemPrice = spec.basePrice || 149.00;
            const escapedTitle = encodeURIComponent(spec.title);

            return `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:20px; display:flex; flex-direction:column; justify-content:space-between; opacity:${alreadyPurchased ? '0.65' : '1'}; text-align:left; box-shadow:0 4px 12px rgba(0,0,0,0.02); box-sizing:border-box; height:100%;">
                    <div>
                        <h4 style="margin:0 0 6px 0; color:#0a1f44; font-size:0.95rem; font-weight:700; min-height:2.4em; display:flex; align-items:center;">${spec.title}</h4>
                        <p style="margin:0 0 20px 0; font-size:0.8rem; color:#4a5568; line-height:1.4; min-height:4.2em; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">Initialize dynamic legal configurations configurations metrics safely inside your portal compliance profile layers.</p>
                    </div>
                    <button onclick="${alreadyPurchased ? 'void(0)' : `window.launchEmbeddedPortalCheckout('${key}', ${itemPrice}, '${escapedTitle}')`}" class="btn-primary-small" style="text-align:center; display:block; border:none; outline:none; width:100%; box-sizing:border-box; background:${alreadyPurchased ? '#a0aec0' : '#0a1f44'}; padding:10px; color:white; border-radius:4px; font-size:0.8rem; font-weight:600; margin-top:auto; cursor:${alreadyPurchased ? 'default' : 'pointer'};">
                        ${alreadyPurchased ? '✓ Package Active' : 'Launch Setup ➔'}
                    </button>
                </div>
            `;
        }).join('');
    };

    // ==========================================================================
    // 👥 USER UPDATE SNAPSHOT HANDLERS
    // ==========================================================================
    window.handlePersonalProfileUpdate = async function(event) {
        event.preventDefault();
        const btn = event.submitter;
        const originalText = btn.innerText;
        const emailInput = document.getElementById('settings-user-email').value.trim().toLowerCase();
        const nameInput = document.getElementById('settings-user-name').value.trim();
        const addressInput = document.getElementById('settings-user-address').value.trim();

        btn.innerText = "Synchronizing...";
        btn.disabled = true;

        try {
            if (emailInput !== window.activeSessionUserObject.email) {
                const { error: emailError } = await client.auth.updateUser({ email: emailInput });
                if (emailError) throw emailError;
            }

            const { data, error } = await client.auth.updateUser({
                data: { full_name: nameInput, personal_address: addressInput }
            });
            if (error) throw error;

            alert("Personal profile configurations updated successfully across your session tokens.");
            if (data && data.user) window.activeSessionUserObject = data.user;

        } catch (err) {
            alert(`Profile Update Blocked: ${err.message}`);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

        window.renderCorporateAmendmentsInterfaceGrid = function(filings) {
        const targetContainer = document.getElementById('settings-corporate-filings-list');
        if (!targetContainer) return;

        const paidFilings = filings ? filings.filter(f => f.status === 'paid') : [];
        const registry = window.WIZARD_REGISTRY || {};

        if (paidFilings.length === 0) {
            targetContainer.innerHTML = `
                <div style="padding:20px; text-align:center; color:#64748b; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:0.85rem; line-height:1.4;">
                    No state-registered entities found under this account token.<br>
                    <small style="color:#64748b; display:block; margin-top:5px;">Purchase an active company pack to unlock amendment filings.</small>
                </div>`;
            return;
        }

        targetContainer.innerHTML = paidFilings.map(company => {
            const spec = registry[company.service_key] || { title: `Service: ${company.service_key.toUpperCase()}` };
            const businessLegalName = company.payload_data?.business_name || company.payload_data?.desired_llc_name || spec.title;
            
            return `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:18px 20px; box-shadow:0 2px 8px rgba(0,0,0,0.01); box-sizing:border-box; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <div>
                            <strong style="display:block; color:#0a1f44; font-size:0.92rem; font-weight:700;">${businessLegalName}</strong>
                            <small style="color:#64748b; font-size:0.72rem; display:block; margin-top:2px;">Entity Record reference ID: #FIL-${company.id.substring(0,8).toUpperCase()}</small>
                        </div>
                        <span style="background:#ecfdf5; color:#10b981; font-weight:700; font-size:0.65rem; padding:3px 8px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px; flex-shrink:0;">Active Standing</span>
                    </div>
                    <div style="background:#f8fafc; border-radius:6px; padding:10px; border:1px solid #edf2f7; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#4a5568; font-weight:600;">Need to change company address or info?</span>
                        <button onclick="window.launchPortalAmendmentCheckout('${company.id}', '${company.service_key}', '${encodeURIComponent(businessLegalName)}')" style="background:#0a1f44; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:0.75rem; font-weight:700; cursor:pointer; box-shadow:0 2px 5px rgba(10,31,68,0.15);">Order Amendment ($149)</button>
                    </div>
                </div>`;
        }).join('');
    };

    // ==========================================================================
    // 💳 SECURE PRODUCTION STRIPE EMBEDDED ENGINE
    // ==========================================================================
    window.launchPortalAmendmentCheckout = function(recordId, parentServiceKey, entityName) {
        const calculatedAmendmentFeeNum = 149.00;
        const amendmentContextKey = `amend-${parentServiceKey}`;
        
        // Fires embedded DOM render module directly without destroying workflow loops
        window.launchEmbeddedPortalCheckout(amendmentContextKey, calculatedAmendmentFeeNum, entityName);
    };

    window.launchEmbeddedPortalCheckout = async function(serviceKeyTarget, itemPriceNum, businessLegalNameString) {
        window.switchActivePortalTab('checkout-tab', null);
        
        const loaderElement = document.getElementById('stripe-loading-screen');
        const iframeMountTarget = document.getElementById('checkout-embedded-iframe-target');
        
        if (loaderElement) loaderElement.style.display = 'block';
        if (iframeMountTarget) iframeMountTarget.innerHTML = '';
        
        document.getElementById('display-company-checkout-label').innerText = decodeURIComponent(businessLegalNameString);

        if (typeof Stripe === 'undefined') {
            if (loaderElement) loaderElement.innerHTML = "<div style='color:red; font-weight:700; padding:20px;'>Stripe delivery network offline. Check connections.</div>";
            return;
        }

        const stripeInstance = Stripe('pk_test_51TTy4u1hrjQxq47MgsMyTpdS4Aadnk4H63kILJaWbuUfppSySDt4Ijx9we7zkkCFEaeqzQ7C3k7Ql9HcSA5Urh3n00pEKGxNLE');
        let fallbackEmailToken = "billing@company.com";
        if (window.activeSessionUserObject) fallbackEmailToken = window.activeSessionUserObject.email;

        try {
            // Secure edge connection path routing
            const edgeResponseStream = await fetch('https://supabase.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'checkout',
                    email: fallbackEmailToken,
                    company_name: decodeURIComponent(businessLegalNameString),
                    amount: Math.round(parseFloat(itemPriceNum) * 100),
                    service_type: serviceKeyTarget
                })
            });

// assets/js/portal-engine.js (Part 4 - Stripe Callback, Storage Bucket Vault, & Security Triggers)

            if (!edgeResponseStream.ok) {
                throw new Error(`Edge networks rejected initialization: Code ${edgeResponseStream.status}`);
            }

            const dataPayloadJSON = await edgeResponseStream.json();
            if (dataPayloadJSON.error) throw new Error(dataPayloadJSON.error);

            const clientSecret = dataPayloadJSON.clientSecret;
            const embeddedCheckoutObject = await stripeInstance.initEmbeddedCheckout({
                fetchClientSecret: function() { return clientSecret; },
                onComplete: function() { window.handlePaidWorkspaceTableMutation(serviceKeyTarget); }
            });

            if (loaderElement) loaderElement.style.display = 'none';
            embeddedCheckoutObject.mount('#checkout-embedded-iframe-target');

        } catch (handshakeExceptionError) {
            console.error("Stripe connection failed:", handshakeExceptionError);
            if (loaderElement) {
                loaderElement.innerHTML = `<div style="color:#c15254; font-weight:700; padding:20px;">Stripe Configuration Handshake Error: ${handshakeExceptionError.message}</div>`;
            }
        }
    };

    window.handlePaidWorkspaceTableMutation = async function(serviceKeyTarget) {
        if (!window.globalSessionUserId) return;

        const { error } = await client
            .from('user_filings_workspace')
            .update({ status: 'paid' })
            .eq('user_id', window.globalSessionUserId)
            .eq('service_key', serviceKeyTarget)
            .eq('status', 'draft');

        if (error) console.error("Failed to clear draft updates flag:", error.message);

        const receiptLabel = document.getElementById('success-service-receipt-key');
        if (receiptLabel) {
            receiptLabel.innerText = `Paid Filing Module Reference Key: Code-${serviceKeyTarget.toUpperCase()}`;
        }
        window.switchActivePortalTab('success-tab', null);
    };

    // ==========================================================================
    // 💳 ITEMIZATION BILLING STATEMENTS & ORDER HISTORY
    // ==========================================================================
    window.openBillingOrdersModal = async function() {
        const modal = document.getElementById('billing-orders-modal');
        if (!modal || !window.globalSessionUserId) return;

        modal.style.display = 'flex';

        const tableBody = document.getElementById('billing-ledger-table-body');
        const spentTarget = document.getElementById('billing-total-spent');
        const countTarget = document.getElementById('billing-settled-count');
        const registry = window.WIZARD_REGISTRY || {};

        const { data: records, error } = await client
            .from('user_filings_workspace')
            .select('*')
            .eq('user_id', window.globalSessionUserId)
            .eq('status', 'paid');

        if (error || !records || records.length === 0) {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="4" style="padding:30px 5px; text-align:center; color:#64748b; font-style:italic;">No settled transactions or order histories found under this workspace account token profile.</td></tr>`;
            }
            if (spentTarget) spentTarget.innerText = "$0.00";
            if (countTarget) countTarget.innerText = "0 Transactions";
            return;
        }

        let spent = 0;
        tableBody.innerHTML = records.map(item => {
            const spec = registry[item.service_key] || { basePrice: 149, govFee: 0, title: `Service: ${item.service_key}` };
            const total = (spec.basePrice || 0) + (spec.govFee || 0);
            spent += total;

            return `
                <tr style="border-bottom:1px solid #e2e8f0; color:#0a1f44; font-size:0.85rem;">
                    <td style="padding:15px 5px; font-weight:700;">
                        ${spec.title}
                        <small style="display:block; font-size:0.7rem; color:#64748b; font-weight:500; margin-top:2px;">Filing Hash Reference: #FIL-${item.id.substring(0,8).toUpperCase()}</small>
                    </td>
                    <td style="padding:15px 5px;">${new Date(item.updated_at).toLocaleDateString()}</td>
                    <td style="padding:15px 5px; text-align:right; font-weight:800;">$${total.toFixed(2)}</td>
                    <td style="padding:15px 5px; text-align:right;"><button onclick="alert('Downloading printable invoice PDF statement layout receipt...')" style="background:transparent; border:1px solid #0a1f44; color:#0a1f44; padding:4px 8px; border-radius:4px; font-weight:700; cursor:pointer;">Print</button></td>
                </tr>`;
        }).join('');

        if (spentTarget) spentTarget.innerText = `$${spent.toFixed(2)}`;
        if (countTarget) countTarget.innerText = `${records.length} Paid Order(s)`;
    };

    window.closeBillingOrdersModal = function() {
        const modal = document.getElementById('billing-orders-modal');
        if (modal) modal.style.display = 'none';
    };

    // ==========================================================================
    // 📂 STORAGE CLUSTER SECURE VAULT ENGINE
    // ==========================================================================
    window.syncVaultTabDocumentGrid = async function(userId) {
        const tabInventoryTargetNode = document.getElementById('vault-tab-inventory-list');
        if (!userId || !tabInventoryTargetNode) return;

        const { data: clusterStorageFiles, error } = await client.storage
            .from('compliance_vault_documents')
            .list(userId, { limit: 15, sortBy: { column: 'created_at', order: 'desc' } });

        if (error || !clusterStorageFiles || clusterStorageFiles.length === 0) {
            tabInventoryTargetNode.innerHTML = `<div style="padding:25px; text-align:center; color:#64748b; background:rgba(0,0,0,0.01); border:1px solid #e2e8f0; border-radius:6px; font-size:0.85rem; font-style:italic;">No documents matching this session token currently present in the cluster storage repository. Drag files onto the shortcut element to populate this archive.</div>`;
            return;
        }

        tabInventoryTargetNode.innerHTML = clusterStorageFiles.map(fileObject => {
            const calculatedPayloadMB = fileObject.metadata ? (fileObject.metadata.size / (1024 * 1024)).toFixed(2) : "0.00";
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:0.85rem; margin-bottom: 8px;">
                    <div style="display:flex; align-items:center; gap:10px; font-weight:600; color:#0a1f44;">
                        <span>📄</span>
                        <span>${fileObject.name}</span>
                        <span style="font-size:0.72rem; color:#64748b; font-weight:400;">(${calculatedPayloadMB} MB)</span>
                    </div>
                    <button onclick="window.triggerVaultFileDownloadAction('${userId}', '${fileObject.name}')" style="background:transparent; border:1px solid #0a1f44; color:#0a1f44; padding:4px 8px; border-radius:4px; font-weight:700; cursor:pointer;">Download</button>
                </div>`;
        }).join('');
    };

    window.triggerVaultFileDownloadAction = async function(userId, targetFileNameString) {
        try {
            const { data, error } = await client.storage
                .from('compliance_vault_documents')
                .download(`${userId}/${targetFileNameString}`);

            if (error) throw error;

            const fileStreamBlobUrl = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = fileStreamBlobUrl;
            a.download = targetFileNameString.substring(targetFileNameString.indexOf('_') + 1);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(fileStreamBlobUrl);
        } catch (downloadErr) {
            alert(`Download failed: ${downloadErr.message}`);
        }
    };

    // ==========================================================================
    // 🔐 ACCOUNT SECURITY PROFILE DATA LINK SIGN-OUTS
    // ==========================================================================
    window.triggerSettingsPasswordReset = async function(event) {
        event.preventDefault();
        
        const triggerBtn = document.getElementById('settingsResetBtn');
        const inputEmailValueStr = document.getElementById('settings-user-email').value;
        
        if (!inputEmailValueStr || inputEmailValueStr.includes('Loading')) return;

        triggerBtn.innerText = "Transmitting Reset Request...";
        triggerBtn.disabled = true;

        const baseTarget = window.productionRootUrl || window.location.origin;
        
        const { error } = await client.auth.resetPasswordForEmail(inputEmailValueStr, { 
            redirectTo: `${baseTarget}/update-password.html` 
        });

        if (error) {
            alert(`Security error: ${error.message}`);
            triggerBtn.innerText = "Reset Password 🔐";
            triggerBtn.disabled = false;
        } else {
            alert("Password reset configuration link securely delivered to your registered inbox.");
            triggerBtn.innerText = "Link Dispatched ✓";
        }
    };

})(); // Engine closure execution complete.
