/**
 * 💬 filings4u Live Admin Chat Desk Controller (Production-Ready)
 * Synchronized dropdown hydration and event-listener binding mechanics
 */
(function initializeAdminChatController() {
    "use strict";

    let activeAdminChatChannel = null;
    let currentlySelectedClientUuid = null;

    // ==========================================================================
    // 👥 1. POPULATE SYSTEM USERS INTO SELECTION DROPDOWN
    // ==========================================================================
    window.populateAdminChatDropdownOptions = async function() {
        const client = window.supabaseClient;
        const selector = document.getElementById("adminChatActiveClientSelector");
        if (!client || !selector) return;

        try {
            // Reset dropdown but maintain primary placeholder row option prompt
            selector.innerHTML = `<option value="">Select an active client session user to open channel...</option>`;
            
            // Pull user profile tokens from your public metadata directory ledger
            const { data: profiles, error } = await client
                .from('profiles')
                .select('id, company_name')
                .order('company_name', { ascending: true });

            if (error) throw error;

            if (profiles && profiles.length > 0) {
                profiles.forEach(user => {
                    const opt = document.createElement("option");
                    opt.value = user.id;
                    opt.textContent = user.company_name || `Client Account #${user.id.substring(0, 6)}`;
                    selector.appendChild(opt);
                });
                console.log(`✅ Successfully loaded ${profiles.length} users into admin dropdown.`);
            } else {
                console.warn("⚠️ No customer accounts located in profiles relational table index.");
            }
        } catch (err) {
            console.error("❌ Failed to compile target chat selection arrays:", err.message);
        }
    };

    // ==========================================================================
    // 🎧 2. SWITCH CONVERSATION FOCUS CONTEXT (ROOM JOIN PIPELINE)
    // ==========================================================================
    window.bindAdminChatFocusToClient = async function(clientId) {
        const client = window.supabaseClient;
        if (!client || !clientId) return;

        currentlySelectedClientUuid = clientId;
        const logContainer = document.getElementById("adminChatMessagesLog");
        
        if (logContainer) {
            logContainer.innerHTML = `<div style="padding:15px; color:#8a8a9e; font-style:italic; font-size:0.85rem; text-align:center;">Syncing message traces...</div>`;
        }

        try {
            // A. Fetch historical message logs stored on table disk records
            const { data: records, error } = await client
                .from('chat_messages')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (logContainer) logContainer.innerHTML = ""; 

            if (records && records.length > 0) {
                records.forEach(msg => {
                    const alignmentStyle = msg.sender_type === 'admin' ? 'outbound' : 'inbound';
                    appendMessageBubbleToConsoleLog(msg.message_content, alignmentStyle);
                });
            } else {
                if (logContainer) {
                    logContainer.innerHTML = `<div style="padding:15px; color:#8a8a9e; font-style:italic; font-size:0.85rem; text-align:center;">No past conversation logs. Thread initialized safely.</div>`;
                }
            }

            // B. Clean out any previous client broadcast web-socket connections safely
            if (activeAdminChatChannel) {
                await client.removeChannel(activeAdminChatChannel);
            }

            // C. Establish streaming connection channel to this specific customer's UUID room
            activeAdminChatChannel = client.channel(`support_thread_${clientId}`);

            activeAdminChatChannel
                .on('broadcast', { event: 'text_message_event' }, (payload) => {
                    if (payload.payload.sender === 'client') {
                        appendMessageBubbleToConsoleLog(payload.payload.msg, 'inbound');
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`📡 Broadcast matrix listening live for user thread: ${clientId}`);
                    }
                });

        } catch (fault) {
            console.error("❌ Failed to connect live messaging thread arrays:", fault.message);
        }
    };

    // ==========================================================================
    // 📤 3. DISPATCH ADMIN RESPONSE OVER THE AIR
    // ==========================================================================
    window.dispatchAdminResponseChatMessage = async function() {
        const client = window.supabaseClient;
        const field = document.getElementById("adminChatMessageInputField");
        if (!client || !field || !field.value.trim() || !currentlySelectedClientUuid) return;

        const typedMessage = field.value.trim();

        try {
            if (activeAdminChatChannel) {
                await activeAdminChatChannel.send({
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

            appendMessageBubbleToConsoleLog(typedMessage, 'outbound');
            field.value = ""; 

        } catch (err) {
            console.error("❌ Failed to execute text delivery transaction:", err.message);
        }
    };

    function appendMessageBubbleToConsoleLog(text, orientationClass) {
        const logContainer = document.getElementById("adminChatMessagesLog");
        if (!logContainer) return;

        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${orientationClass}`;
        bubble.textContent = text;
        
        logContainer.appendChild(bubble);
        logContainer.scrollTop = logContainer.scrollHeight; 
    }

    // ==========================================================================
    // ⚙️ 4. SAFE CORE BINDING INITIALIZATION DISPATCHER
    // ==========================================================================
    function setupChatEventListeners() {
        const dropdownSelector = document.getElementById("adminChatActiveClientSelector");
        const chatInput = document.getElementById("adminChatMessageInputField");

        if (dropdownSelector) {
            // Remove any stale listeners before attaching to prevent duplicates
            dropdownSelector.removeEventListener("change", handleDropdownChange);
            dropdownSelector.addEventListener("change", handleDropdownChange);
            console.log("🔗 Dropdown change listener successfully locked onto DOM.");
        }

        if (chatInput) {
            chatInput.removeEventListener("keydown", handleInputFieldKeyDown);
            chatInput.addEventListener("keydown", handleInputFieldKeyDown);
            console.log("🔗 Textarea input listener successfully locked onto DOM.");
        }

        // Run primary collection population
        window.populateAdminChatDropdownOptions();
    }

    function handleDropdownChange(e) {
        if (e.target.value) {
            window.bindAdminChatFocusToClient(e.target.value);
        }
    }

    function handleInputFieldKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            window.dispatchAdminResponseChatMessage();
        }
    }

    // Polling bootstrap watcher checking for structural availability of dependencies
    const initializationPollingLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(initializationPollingLoop);
            
            // Check if DOM elements are ready right now. If not, wait for full page load.
            if (document.getElementById("adminChatActiveClientSelector")) {
                setupChatEventListeners();
            } else {
                document.addEventListener("DOMContentLoaded", setupChatEventListeners);
            }
        }
    }, 100);

})();
