/**
 * 👑 filings4u Consolidated Master Production Admin Infrastructure Engine
 * Manages secure telemetry, analytics compilation, global searches, and live chat syncs
 */
(function initializeProductionAdminMasterEngine() {
    "use strict";

    console.log("⚙️ Master Production Admin Infrastructure Engine Active...");

    let activeAdminSupportChannel = null;
    let currentlySelectedClientUuid = null;

    // ==========================================================================
    // ⏰ 1. REAL-TIME SYSTEM CLOCK & DATE COUPLING METRICS
    // ==========================================================================
    function runProductionGlobalClock() {
        const clockNode = document.getElementById('portal-clock');
        if (!clockNode) return;
        setInterval(() => {
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            clockNode.textContent = `${dateString} | ${timeString}`;
        }, 1000);
    }
    document.addEventListener('DOMContentLoaded', runProductionGlobalClock);

    // ==========================================================================
    // 🚪 2. SECURE LOGOUT & TELEMETRY CLEANER
    // ==========================================================================
    window.executeTerminalSessionTermination = async function(btnElement) {
        if (btnElement) btnElement.disabled = true;
        const client = window.supabaseClient;
        if (client && client.auth) {
            try {
                const { data: { session } } = await client.auth.getSession();
                if (session && session.user) {
                    await client.from('chat_messages').insert({
                        client_id: session.user.id,
                        sender_type: 'admin',
                        message_content: `Staff Administrator [${session.user.email}] logged out successfully.`
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

    // ==========================================================================
    // 🔍 3. GLOBAL PLATFORM SEARCH MATRIX OVERRIDE
    // ==========================================================================
    function bindGlobalSearchSystem() {
        const globalSearchBox = document.getElementById('adminGlobalSearchField');
        if (!globalSearchBox) return;
        globalSearchBox.addEventListener('keyup', (e) => {
            const criteria = e.target.value.toLowerCase().trim();
            const searchableRows = document.querySelectorAll('.admin-table-ledger tbody tr, .ticket-row, .log-entry-row, .portal-table tbody tr');
            searchableRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(criteria) ? "" : "none";
            });
        });
    }

    // ==========================================================================
    // 📊 4. ANALYTICS PIPELINE ENGINE (SECURE CORRECTION)
    // ==========================================================================
    window.loadGlobalLiveAnalytics = async function() {
        const client = window.supabaseClient;
        if (!client) return;
        try {
            // Mapped directly to your live production filing_orders relational schema table
            const { data: orderRows, error } = await client.from('filing_orders').select('total_amount, current_stage');
            if (error) throw error;

            if (orderRows) {
                const grossRevenue = orderRows.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                const pendingCount = orderRows.filter(r => r.current_stage === 'State Review' || r.current_stage === 'Pending').length;
                const activeOrdersCount = orderRows.length;

                const revenueText = document.getElementById('stat-total-revenue') || document.getElementById('summary-collected-revenue');
                const entitiesText = document.getElementById('stat-active-users') || document.getElementById('summary-total-orders');
                const filingsText = document.getElementById('stat-pending-filings') || document.getElementById('summary-unpaid-amount');

                if (revenueText) revenueText.innerText = `$${grossRevenue.toFixed(2)}`;
                if (entitiesText) entitiesText.innerText = activeOrdersCount.toString();
                if (filingsText) filingsText.innerText = pendingCount.toString();
            }
        } catch (err) {
            console.error("Analytics pipeline trace failure:", err.message);
        }
    };

    // ==========================================================================
    // 💬 5. REAL-TIME INTERACTION CHAT CHANNELS
    // ==========================================================================
    window.populateAdminChatDropdownOptions = async function() {
        const client = window.supabaseClient;
        const selector = document.getElementById("adminChatActiveClientSelector");
        if (!client || !selector) return;

        try {
            selector.innerHTML = `<option value="">Select an active client session user to open channel...</option>`;
            const { data: profiles, error } = await client.from('profiles').select('id, company_name');
            if (error) throw error;

            if (profiles) {
                profiles.forEach(user => {
                    const opt = document.createElement("option");
                    opt.value = user.id;
                    opt.textContent = user.company_name || `Client ID #${user.id.substring(0, 6)}`;
                    selector.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Failed to compile user dropdown list items:", err.message);
        }
    };

    window.bindAdminChatFocusToClient = async function(clientId) {
        const client = window.supabaseClient;
        if (!client || !clientId) return;

        currentlySelectedClientUuid = clientId;
        const logContainer = document.getElementById("adminChatMessagesLog");
        if (logContainer) logContainer.innerHTML = `<div style="padding:15px; color:#8a8a9e; font-style:italic;">Syncing message traces...</div>`;

        try {
            // A. Fetch historical records
            const { data: records, error } = await client
                .from('chat_messages')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (logContainer) logContainer.innerHTML = ""; 

            if (records) {
                records.forEach(msg => {
                    const alignmentStyle = msg.sender_type === 'admin' ? 'outbound' : 'inbound';
                    appendMessageBubbleToAdminConsole(msg.message_content, alignmentStyle);
                });
            }

            // B. Unsubscribe from stale channels
            if (activeAdminSupportChannel) {
                await client.removeChannel(activeAdminSupportChannel);
            }

            // C. Connect live websocket using the proper configuration instance wrapper
            activeAdminSupportChannel = client.channel(`support_thread_${clientId}`);

            activeAdminSupportChannel
                .on('broadcast', { event: 'text_message_event' }, (payload) => {
                    if (payload.payload.sender === 'client') {
                        appendMessageBubbleToAdminConsole(payload.payload.msg, 'inbound');
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`📡 Broadcast channel online for customer thread: ${clientId}`);
                    }
                });

        } catch (fault) {
            console.error("Failed to compile instant communication parameters:", fault.message);
        }
    };

    window.dispatchAdminResponseChatMessage = async function() {
        const client = window.supabaseClient;
        const field = document.getElementById("adminChatMessageInputField");
        if (!client || !field || !field.value.trim() || !currentlySelectedClientUuid) return;

        const typedMessage = field.value.trim();

        try {
            if (activeAdminSupportChannel) {
                await activeAdminSupportChannel.send({
                    type: 'broadcast',
                    event: 'text_message_event',
                    payload: { msg: typedMessage, sender: 'admin', timestamp: new Date().toISOString() }
                });
            }

            await client.from('chat_messages').insert({
                client_id: currentlySelectedClientUuid,
                sender_type: 'admin',
                message_content: typedMessage
            });

            appendMessageBubbleToAdminConsole(typedMessage, 'outbound');
            field.value = "";

        } catch (err) {
            console.error("Failed to execute text delivery payload:", err.message);
        }
    };

    function appendMessageBubbleToAdminConsole(text, orientationClass) {
        const logContainer = document.getElementById("adminChatMessagesLog");
        if (!logContainer) return;
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${orientationClass}`;
        bubble.textContent = text;
        logContainer.appendChild(bubble);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // ==========================================================================
    // 👑 6. GLOBAL NETWORKING REALTIME OVERWATCH (FIXED)
    // ==========================================================================
    window.initializeGlobalAdminOversightNetwork = function() {
        const client = window.supabaseClient;
        if (!client) return;

        client.channel('public_pipeline_tracker')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'filing_orders' }, (payload) => {
                notifyAdminSystemAlert(payload.new);
            })
            .subscribe();
    };

    function notifyAdminSystemAlert(newOrderRecord) {
        const alertBox = document.createElement("div");
        alertBox.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-size: 0.85rem; font-weight: 600;";
        alertBox.textContent = `New Order: ${newOrderRecord.service_title} in ${newOrderRecord.target_state} ($${newOrderRecord.total_amount})`;
        document.body.appendChild(alertBox);
        setTimeout(() => alertBox.remove(), 5000);
        
        window.loadGlobalLiveAnalytics();
    }

    // ==========================================================================
    // ⏱️ 7. BOOTSTRAP INITIALIZATION POLLING LAYER
    // ==========================================================================
    const verificationPollingLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(verificationPollingLoop);
            bindGlobalSearchSystem();
            window.loadGlobalLiveAnalytics();
            window.populateAdminChatDropdownOptions();
            window.initializeGlobalAdminOversightNetwork();

            // Bind selector actions cleanly if dropdown target exists in view layout
            const dropdownSelector = document.getElementById("adminChatActiveClientSelector");
            if (dropdownSelector) {
                dropdownSelector.addEventListener("change", (e) => {
                    window.bindAdminChatFocusToClient(e.target.value);
                });
            }
        }
    }, 150);

    document.addEventListener("DOMContentLoaded", () => {
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.executeTerminalSessionTermination(fallbackLogoutBtn);
            });
        }
    });

})();
