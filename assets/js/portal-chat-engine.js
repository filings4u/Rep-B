/**
 * 💬 Mutual Realtime Communication Control Engine
 * Synchronizes portal-chat.html and admin-dashboard.html instantly via web-sockets
 */
let communicationLinkChannel = null;
let activePortalUserId = null;

// Ensure database library definitions do not throw race exceptions
function getAuthenticatedSupabaseClient() {
    return window.supabaseClient || window.supabase;
}

window.linkLiveMessagingTerminal = async function(explicitClientId = null) {
    const dbClient = getAuthenticatedSupabaseClient();
    if (!dbClient) {
        console.error("🔒 Realtime Core Blocked: Supabase execution wrapper missing.");
        return;
    }

    try {
        const { data: { session } } = await dbClient.auth.getSession();
        if (!session) return;

        // Client evaluates its own session user ID; Admin utilizes explicit dropdown target ID context values
        activePortalUserId = explicitClientId || session.user.id;

        // Establish connection to matching tenant conversation room thread
        communicationLinkChannel = dbClient.channel(`support_thread_${activePortalUserId}`);

        communicationLinkChannel
            .on('broadcast', { event: 'text_message_event' }, (payload) => {
                // Determine orientation style context based on who is reading the message bubble payload
                const incomingSender = payload.payload.sender;
                const readingContext = explicitClientId ? 'admin' : 'client';
                const alignmentStyle = (incomingSender === readingContext) ? 'outbound' : 'inbound';
                
                appendMessageBubbleToLogView(payload.payload.msg, alignmentStyle);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`💬 Sync Online: Messaging channel established for thread: ${activePortalUserId}`);
                }
            });

    } catch (fault) {
        console.error("Websocket initialization failure:", fault.message);
    }
};

window.submitPortalChatMessagePayload = async function(msgContent, trackingRole = 'client') {
    const dbClient = getAuthenticatedSupabaseClient();
    if (!msgContent.trim() || !communicationLinkChannel || !dbClient) return;

    const messagePackage = {
        msg: msgContent.trim(),
        sender: trackingRole,
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Send the message instantly across open browser tabs via Broadcast websocket lines
        await communicationLinkChannel.send({
            type: 'broadcast',
            event: 'text_message_event',
            payload: messagePackage
        });

        // 2. Log transactions directly to relational schema tables for persistence
        await dbClient.from('chat_messages').insert({
            user_id: activePortalUserId,
            sender_type: trackingRole,
            message_content: messagePackage.msg
        });

        // Render your own message instantly as outbound
        appendMessageBubbleToLogView(messagePackage.msg, 'outbound');

    } catch (err) {
        console.error("Message delivery failed:", err.message);
    }
};

function appendMessageBubbleToLogView(text, orientationStyle) {
    // Gracefully fallback to either your customer viewport log or admin chat log frame
    const container = document.getElementById("portalChatMessagesLog") || document.getElementById("adminChatMessagesLog");
    if (!container) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${orientationStyle}`;
    bubble.textContent = text;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight; // Force scroll alignment visibility bounds
}

// ==========================================================================
// 🚀 PRODUCTION LIVE SOCKET SYNCHRONIZER (AUTO-RUN TESTER)
// ==========================================================================
(function automaticChatEngineBindingBootstrap() {
    const trackingPollingInterval = setInterval(async () => {
        // Wait for the master connection client script inside assets/js/supabase-config.js to load
        const activeClient = window.supabaseClient || window.supabase;
        
        if (activeClient && typeof activeClient.auth !== 'undefined') {
            clearInterval(trackingPollingInterval);
            console.log("💬 Portal Chat Script Engine hooked into storage instance. Syncing channels...");

            const currentPathName = window.location.pathname.toLowerCase();

            // Case A: If user is on the customer portal chat page
            if (currentPathName.includes("portal-chat")) {
                await window.linkLiveMessagingTerminal(); // Auto-binds user to their own UUID room
                console.log("👤 Customer real-time websocket link established.");
            }
            
            // Case B: If administrator is on the admin chat/dashboard viewports
            if (currentPathName.includes("admin-")) {
                console.log("👑 Admin runtime detected. Standing by for dropdown selection event triggers...");
                // The dropdown event listener defined inside admin-engine-wire.js handles switching rooms cleanly
            }
        }
    }, 150);
})();
