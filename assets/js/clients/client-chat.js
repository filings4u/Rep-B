let currentAuthenticatedUserUuid = null;

// Wakes up safely when client-core.js verifies the connection
window.addEventListener("supabaseEngineReady", (event) => {
    const session = event.detail.session;
    currentAuthenticatedUserUuid = session.user.id;
    
    // Unlock input form panels
    const msgInputNode = document.getElementById("chatMessageTextInput");
    const sendBtnNode = document.getElementById("chatMessageSendBtn");
    if (msgInputNode && sendBtnNode) {
        msgInputNode.disabled = false;
        sendBtnNode.disabled = false;
    }

    loadLiveDirectChatHistoryStream();
    setupChatInteractionTriggers();
});

function renderDefaultWelcomeMessageBanner() {
    return `
        <div style="display:flex; flex-direction:column; align-items:flex-start; width:100%; margin-bottom:15px;">
            <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">Filing Operations Desk</span>
            <div style="max-width:75%; background:#e2e8f0; color:var(--text-dark); padding:14px 18px; border-radius:10px; font-size:0.85rem; box-shadow:0 1px 2px rgba(0,0,0,0.02); line-height:1.4;">
                👋 Hello! Welcome back to your filings4u dashboard support desk. <br><br>
                Our compliance specialists are active. You can type an update, ask about your filing status, or message our team at any time below.
            </div>
        </div>
    `;
}

async function loadLiveDirectChatHistoryStream() {
    const viewportFrame = document.getElementById("chatMessageViewport");
    if (!viewportFrame) return;

    const { data: messages, error } = await window.supabaseInstance
        .from('chat_messages')
        .select('id, sender_type, message_content, created_at')
        .eq('client_id', currentAuthenticatedUserUuid)
        .order('created_at', { ascending: true });

    if (error) return;

    let compiledHtmlContentOutput = renderDefaultWelcomeMessageBanner();

    if (messages && messages.length > 0) {
        compiledHtmlContentOutput += messages.map(msg => {
            const isClientNode = msg.sender_type.toLowerCase() === 'client' || msg.sender_type.toLowerCase() === 'customer';
            return `
                <div style="display:flex; flex-direction:column; align-items:${isClientNode ? 'flex-end' : 'flex-start'} !important; width:100% !important; margin-top:10px;">
                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">${isClientNode ? 'You' : 'Compliance Desk Specialist'}</span>
                    <div style="max-width:70% !important; background:${isClientNode ? 'var(--emerald)' : '#e2e8f0'} !important; color:${isClientNode ? 'white' : 'var(--text-dark)'} !important; padding:12px 16px !important; border-radius:10px !important; font-size:0.85rem !important; box-shadow:0 1px 2px rgba(0,0,0,0.04); line-height:1.4;">
                        ${msg.message_content}
                    </div>
                    <small style="font-size:0.6rem; color:#94a3b8; margin-top:3px; padding:0 4px;">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
            `;
        }).join('');
    }

    viewportFrame.innerHTML = compiledHtmlContentOutput;
    viewportFrame.scrollTop = viewportFrame.scrollHeight;
}

function setupChatInteractionTriggers() {
    const textInputNode = document.getElementById("chatMessageTextInput");
    const dispatchButtonNode = document.getElementById("chatMessageSendBtn");

    async function processOutboundMessage() {
        const textPayloadString = textInputNode.value.trim();
        if (!textPayloadString) return;
        textInputNode.value = "";
        
        await window.supabaseInstance.from('chat_messages').insert([{
            client_id: currentAuthenticatedUserUuid,
            message_content: textPayloadString,
            sender_type: 'client',
            is_read_by_admin: false
        }]);
    }

    if (dispatchButtonNode && textInputNode) {
        dispatchButtonNode.addEventListener("click", processOutboundMessage);
        textInputNode.addEventListener("keydown", (e) => { if (e.key === "Enter") processOutboundMessage(); });
    }

    window.supabaseInstance
        .channel(`realtime:chat_messages_stream:${currentAuthenticatedUserUuid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `client_id=eq.${currentAuthenticatedUserUuid}` }, () => {
            loadLiveDirectChatHistoryStream();
        })
        .subscribe();
}
