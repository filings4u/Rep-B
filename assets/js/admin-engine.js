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
})();
