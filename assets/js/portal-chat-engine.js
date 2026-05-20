/**
 * 💬 Mutual Realtime Communication Control Engine
 * Connects portal-chat.html and admin-dashboard.html instantly via web-sockets
 */
let communicationLinkChannel = null;
let activePortalUserId = null;

async function linkLiveMessagingTerminal(explicitClientId = null) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Client reads its own ID; Admin views passed explicit ID context values
    activePortalUserId = explicitClientId || session.user.id;
    
    // Connect tracking instance cleanly to the matching tenant room thread channel
    communicationLinkChannel = supabase.channel(`support_thread_${activePortalUserId}`);

    communicationLinkChannel
        .on('broadcast', { event: 'text_message_event' }, (payload) => {
            appendMessageBubbleToLogView(payload.payload.msg, payload.payload.sender === 'admin' ? 'inbound' : 'outbound');
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`💬 Support message bridge fully synced online for thread root: ${activePortalUserId}`);
            }
        });
}

// 📤 TRANSMIT TELEMETRY THROUGH THE AIR INSTANTLY
async function submitPortalChatMessagePayload(msgContent, trackingRole = 'client') {
    if (!msgContent.trim()) return;

    const messagePackage = {
        msg: msgContent,
        sender: trackingRole,
        timestamp: new Date().toISOString()
    };

    // 1. Send the message instantly across open tab views via Broadcast
    await communicationLinkChannel.send({
        type: 'broadcast',
        event: 'text_message_event',
        payload: messagePackage
    });

    // 2. Log the data directly to disk storage so the chat history persists
    await supabase.from('chat_messages').insert({
        client_id: activePortalUserId,
        sender_type: trackingRole,
        message_content: msgContent
    });

    appendMessageBubbleToLogView(msgContent, trackingRole === 'client' ? 'outbound' : 'inbound');
}

function appendMessageBubbleToLogView(text, orientationStyle) {
    const container = document.getElementById("portalChatMessagesLog") || document.getElementById("adminChatMessagesLog");
    if (!container) return;

    const bubble = document.createElement("div");
    // Maps style layers cleanly ('inbound' or 'outbound' formatting styles)
    bubble.className = `chat-bubble ${orientationStyle}`;
    bubble.textContent = text;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}
