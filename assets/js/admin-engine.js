// assets/js/admin-engine.js
(async function initializeMasterAdminDashboardEngine() {
    "use strict";

    // 1. Poll until the centralized configuration initializes the client engine safely
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

    // DOM Target Selectors Mapping Array
    const salesTableBody = document.getElementById('admin-global-sales-target-box');
    const clientDropdown = document.getElementById('adminClientDropdown');
    const alertForm = document.getElementById('adminAlertForm');
    const alertStatus = document.getElementById('alertStatus');
    const liveStaffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
    const portalClock = document.getElementById('portal-clock');

    // ==========================================================================
    // ⏱️ SYSTEM CONSOLE CLOCK LOGIC
    // ==========================================================================
    if (portalClock) {
        setInterval(() => {
            const timeString = new Date().toLocaleTimeString();
            portalClock.innerText = timeString;
        }, 1000);
    }

    // ==========================================================================
    // 📊 REVENUE & LEDGER PIPELINE SYNCHRONIZATION
    // ==========================================================================
    async function syncGlobalSalesLedger() {
        if (!salesTableBody) return;

        try {
            // Query our newly created sales_ledger schema table order by recent sales
            const { data: sales, error } = await client
                .from('sales_ledger')
                .select('*')
                .order('purchase_date', { ascending: false });

            if (error) throw error;

            if (!sales || sales.length === 0) {
                salesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">Zero active transaction matrix records settled in the cloud.</td></tr>`;
                return;
            }

            salesTableBody.innerHTML = ''; // Wipe initialized placeholder text
            sales.forEach(row => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #e2e8f0';
                
                const purchaseDate = row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : 'N/A';
                const formattedAmount = typeof row.amount_paid === 'number' ? `$${row.amount_paid.toFixed(2)}` : `$${parseFloat(row.amount_paid || 0).toFixed(2)}`;
                
                // Safely convert JSONB nested audit blocks to plain strings for inspect debugging strings
                const auditDataString = typeof row.form_data_audit === 'object' ? JSON.stringify(row.form_data_audit) : row.form_data_audit || '{}';

                tr.innerHTML = `
                    <td style="padding: 12px 16px; font-weight: 600; color: #0a1f44;">${row.filing_entity}</td>
                    <td style="padding: 12px 16px; color: #44526c;">${row.customer_email}</td>
                    <td style="padding: 12px 16px;"><span class="status-pill regular" style="background:#e2e8f0; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:700;">${row.tier_purchased || 'Compliance'}</span></td>
                    <td style="padding: 12px 16px; font-family: monospace; font-size:0.75rem; color:#64748b; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title='${auditDataString}'>${auditDataString}</td>
                    <td style="padding: 12px 16px; color: #64748b;">${purchaseDate}</td>
                    <td style="padding: 12px 16px; font-weight: 700; color: #10b981;">${formattedAmount}</td>
                    <td style="padding: 12px 16px;"><button class="crm-btn secondary" style="padding:4px 8px; font-size:0.8rem;" onclick="alert('Auditing element verification reference key: ${row.id}')">Audit Row</button></td>
                `;
                salesTableBody.appendChild(tr);
            });

        } catch (err) {
            console.error("Sales ledger rendering failed:", err.message);
            salesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #c15254; font-weight:700; padding:40px;">Failed to populate metrics: ${err.message}</td></tr>`;
        }
    }

    // ==========================================================================
    // 👥 REGISTERED USER HYDRATION DROPDOWN SELECTOR
    // ==========================================================================
    async function populateClientDropdownSelector() {
        if (!clientDropdown) return;

        try {
            // Fetch registered accounts to hook into interaction modules
            const { data: profiles, error } = await client
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name', { ascending: true });

            if (error) throw error;

            clientDropdown.innerHTML = '<option value="">-- Choose Target Account Profile --</option>';
            if (profiles) {
                profiles.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.full_name || 'Unnamed Company'} (${user.email})`;
                    clientDropdown.appendChild(option);
                });
            }
        } catch (err) {
            console.error("Client selector drop hydration issue:", err.message);
            clientDropdown.innerHTML = '<option value="">Error compiling profile targets</option>';
        }
    }

    // ==========================================================================
    // 💬 REAL-TIME ADMIN NOTIFICATION DISPATCH ENGINE
    // ==========================================================================
    if (alertForm) {
        alertForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!alertStatus) return;

            const selectedUserId = clientDropdown ? clientDropdown.value : '';
            const titleInput = document.getElementById('alertTitle');
            const messageInput = document.getElementById('alertMessage');
            const submitBtn = document.getElementById('alertSubmitBtn');

            if (!selectedUserId) {
                alertStatus.style.color = '#c15254';
                alertStatus.innerText = "❌ Transaction Error: You must match this notification event to an active target user profile ID.";
                return;
            }

            // Display UI loading animation state markers
            submitBtn.disabled = true;
            submitBtn.innerText = "Processing Push Alert Vector...";
            alertStatus.innerText = "";

            try {
                // Insert a real-time event record into a notifications tracking table
                const { error } = await client.from('system_notifications').insert([{
                    profile_id: selectedUserId,
                    title: titleInput.value.trim(),
                    message: messageInput.value.trim(),
                    is_read: false
                }]);

                if (error) throw error;

                alertStatus.style.color = '#10b981';
                alertStatus.innerText = "✓ Security communication payload dispatched to client dashboard cleanly.";
                alertForm.reset();

            } catch (err) {
                console.error("Communication dispatch fault:", err.message);
                alertStatus.style.color = '#c15254';
                alertStatus.innerText = `System Error Intercept: ${err.message}`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Push Real-Time Alert →";
            }
        });
    }

    // ==========================================================================
    // INITIALIZATION PIPELINE RUNNERS
    // ==========================================================================
    try {
        // Hydrate staff profile logs metrics visually into the footer blocks
        const { data: { session } } = await client.auth.getSession();
        if (session && session.user && liveStaffEmailDisplayLog) {
            liveStaffEmailDisplayLog.innerText = `• Staff Session Token Owner: ${session.user.email.toLowerCase()}`;
        }

        // Trigger database ledger sync pipelines
        await syncGlobalSalesLedger();
        await populateClientDropdownSelector();

    } catch (systemErr) {
        console.error("Dashboard engine failed to complete lifecycle setup:", systemErr.message);
    }

    // ==========================================================================
    // 💬 STREAM LIVE STAFF SUPPORT NOTIFICATIONS
    // ==========================================================================
    window.streamLiveStaffSupportTimeline = async function(userId) {
        const messageContainer = document.getElementById('client-message-timeline-target');
        if (!messageContainer || !userId) return;

        try {
            // 🎯 FIXED SCHEMA TARGET: Queries system_notifications for your client alert cards
            const { data: chatHistory, error } = await client
                .from('system_notifications')
                .select('*')
                .eq('profile_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (chatHistory && chatHistory.length > 0) {
                messageContainer.innerHTML = chatHistory.map(chat => `
                    <div style="background:#ffffff; border:1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:10px; text-align:left; box-shadow: 0 2px 5px rgba(0,0,0,0.01);">
                        <span style="font-size:0.7rem; font-weight:800; color:#10b981; display:block; margin-bottom:4px; letter-spacing:0.5px; text-transform:uppercase;">MESSAGE FROM STAFF OPERATOR</span>
                        <h4 style="margin: 0 0 5px 0; color:#0a1f44; font-size:0.95rem; font-weight:700;">${chat.title}</h4>
                        <p style="margin:0; font-size:0.88rem; color:#4a5568; line-height:1.4;">${chat.message_text || chat.message}</p>
                        <small style="color:#64748b; font-size:0.75rem; display:block; margin-top:6px;">Received: ${new Date(chat.created_at).toLocaleString()}</small>
                    </div>
                `).join('');
            } else {
                messageContainer.innerHTML = `<p style='color:#64748b; font-size:0.85rem; padding:15px; font-style:italic;'>No active support messages thread available.</p>`;
            }
        } catch (err) {
            console.error("Timeline streaming crash:", err.message);
        }
    };

    // ==========================================================================
    // 📂 MOUNT VAULT INTERFACE SYSTEM BADGES
    // ==========================================================================
    window.mountVaultDocumentTargetGrid = async function(userId) {
        const vaultContainer = document.getElementById('client-vault-documents-target');
        if (!vaultContainer || !userId) return;

        try {
            // 🎯 FIXED DATA TARGET: Lists assets from storage clusters securely instead of ghost tables
            const { data: legalFiles, error } = await client.storage
                .from('compliance_vault_documents')
                .list(userId, { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });

            if (error) throw error;

            if (legalFiles && legalFiles.length > 0) {
                vaultContainer.innerHTML = legalFiles.map(doc => {
                    const uploadDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A';
                    const sizeMB = doc.metadata ? (doc.metadata.size / (1024 * 1024)).toFixed(2) : "0.00";
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1px solid #e2e8f0; padding:12px 15px; border-radius:8px; margin-bottom:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.01);">
                            <div style="text-align:left;">
                                <strong style="color:#0a1f44; font-size:0.88rem; display:block;">📄 ${doc.name}</strong>
                                <small style="color:#64748b; font-size:0.75rem;">Size: ${sizeMB} MB • Vaulted: ${uploadDate}</small>
                            </div>
                            <button onclick="window.triggerVaultFileDownloadAction('${userId}', '${doc.name}')" style="background:#10b981; color:#ffffff; font-size:0.75rem; font-weight:700; padding:6px 12px; border-radius:4px; text-decoration:none; border:none; cursor:pointer;">Download ⬇️</button>
                        </div>`;
                }).join('');
            } else {
                vaultContainer.innerHTML = `<p style='color:#64748b; font-size:0.85rem; padding:15px; font-style:italic;'>Your secure private documentation vault is empty.</p>`;
            }
        } catch (err) {
            console.error("Vault mapping exception error:", err.message);
        }
    };

})();
