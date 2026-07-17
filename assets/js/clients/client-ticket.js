let targetWorkspaceTicketId = null;
let profileAuthenticatedUuid = null;

document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    profileAuthenticatedUuid = session.user.id;

    // Pull targeted ticket ID direct from search parameter strings
    const linkQueryString = new URLSearchParams(window.location.search);
    targetWorkspaceTicketId = linkQueryString.get("id");

    if (!targetWorkspaceTicketId) {
        document.getElementById("ticketMessagesTimelineViewport").innerHTML = `<p style="text-align:center; padding:30px; color:red; font-weight:700;">Exception Error: Missing critical ticket identification routing token keys.</p>`;
        return;
    }

    // Resolve structural ticket subject text from your table setups
    fetchTicketMetadataSubjectContext();
    loadSpecificTicketMessagesTimeline();
    setupTicketInputInterfaceActions();
});

async function fetchTicketMetadataSubjectContext() {
    // Looks up ticket label context logs from support_tickets master index schema
    const { data: ticketRow } = await supabase
        .from('support_tickets')
        .select('subject, status')
        .eq('id', targetWorkspaceTicketId)
        .single();

    if (ticketRow) {
        document.getElementById("ticketWorkspaceSubjectField").textContent = `${ticketRow.subject} (Status: ${ticketRow.status})`;
        // Activate user interaction deck nodes smoothly
        document.getElementById("ticketWorkspaceInputField").disabled = false;
        document.getElementById("ticketWorkspaceSendButton").disabled = false;
    }
}

async function loadSpecificTicketMessagesTimeline() {
    const boxFrame = document.getElementById("ticketMessagesTimelineViewport");
    if (!boxFrame) return;

    // Queries platform_chat_messages bound under the authenticated client account user id
    const { data: streamLogs } = await supabase
        .from('platform_chat_messages')
        .select('message_text, sender_type, created_at')
        .eq('channel_user_id', profileAuthenticatedUuid)
        .order('created_at', { ascending: true });

    if (!streamLogs || streamLogs.length === 0) {
        boxFrame.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem;">Channel initialized cleanly. Submit messages or files below.</p>`;
        return;
    }

    boxFrame.innerHTML = streamLogs.map(m => {
        const isSelfNode = m.sender_type === 'customer';
        return `
            <div style="display:flex; flex-direction:column; align-items:${isSelfNode ? 'flex-end' : 'flex-start'} !important; width:100% !important;">
                <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">
                    ${isSelfNode ? 'You' : 'Admin Operations Agent'}
                </span>
                <div style="max-width:70% !important; background:${isSelfNode ? 'var(--emerald)' : '#e2e8f0'} !important; color:${isSelfNode ? 'white' : 'var(--text-dark)'} !important; padding:12px 16px !important; border-radius:10px !important; font-size:0.85rem !important; box-shadow:0 1px 2px rgba(0,0,0,0.03); line-height:1.4;">
                    ${m.message_text}
                </div>
                <small style="font-size:0.6rem; color:#94a3b8; margin-top:3px; padding:0 4px;">${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
            </div>
        `;
    }).join('');
    boxFrame.scrollTop = boxFrame.scrollHeight;
}

function setupTicketInputInterfaceActions() {
    const inputNode = document.getElementById("ticketWorkspaceInputField");
    const sendButtonNode = document.getElementById("ticketWorkspaceSendButton");

    async function dispatchTicketMessage() {
        const bodyValue = inputNode.value.trim();
        if (!bodyValue) return;

        inputNode.value = "";
        await supabase
            .from('platform_chat_messages')
            .insert([{
                channel_user_id: profileAuthenticatedUuid,
                message_text: bodyValue,
                sender_type: 'customer'
            }]);
    }

    sendButtonNode.addEventListener("click", dispatchTicketMessage);
    inputNode.addEventListener("keydown", (e) => { if (e.key === "Enter") dispatchTicketMessage(); });

    // Stream updates instantly when new text rows load
    supabase
        .channel(`realtime:ticket_workspace_stream:${profileAuthenticatedUuid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_chat_messages', filter: `channel_user_id=eq.${profileAuthenticatedUuid}` }, () => {
            loadSpecificTicketMessagesTimeline();
        })
        .subscribe();
}
