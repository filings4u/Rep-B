let currentSelectedTicketUuid = null;
let currentAuthenticatedUserUuid = null;

document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    currentAuthenticatedUserUuid = session.user.id;
    
    // Fetch current customer ticket list using their profile UUID
    fetchSecureClientChatThreads(currentAuthenticatedUserUuid);
    setupChatInteractionTriggers();
});

// Build Channel List matching your exact columns (client_id, status)
async function fetchSecureClientChatThreads(userId) {
    const deck = document.getElementById("chatThreadsContainer");
    if (!deck) return;

    // Matches your schema: query client_id using the authenticated user UUID
    const { data: tickets, error } = await supabase
        .from('support_tickets') 
        .select('id, ticket_id, subject, status, updated_at')
        .eq('client_id', userId)
        .order('updated_at', { ascending: false });

    if (error || !tickets || tickets.length === 0) {
        deck.innerHTML = `
            <div style="padding:15px;"><button onclick="createNewSupportThread()" style="width:100%; background:var(--emerald); color:white; border:none; padding:10px; font-weight:700; border-radius:4px; cursor:pointer;">🆕 Open Support Ticket</button></div>
            <p style="padding:0 15px; font-size:0.8rem; color:var(--text-muted)">No active operational chat channels found.</p>
        `;
        return;
    }

    deck.innerHTML = `
        <div style="padding:15px;"><button onclick="createNewSupportThread()" style="width:100%; background:var(--emerald); color:white; border:none; padding:10px; font-weight:700; border-radius:4px; cursor:pointer;">🆕 Open Support Ticket</button></div>
    ` + tickets.map(t => `
        <div class="thread-channel-pill" data-ticket-id="${t.id}" onclick="selectActiveChatChannel('${t.id}')" style="padding:12px 15px; border-bottom:1px solid #edf2f7; cursor:pointer; transition:all 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.8rem; color:var(--text-dark);">${t.subject}</strong>
                <code style="font-size:0.65rem; background:#cbd5e1; padding:2px 4px; border-radius:3px; color:var(--text-dark);">${t.ticket_id}</code>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.7rem; color:var(--text-muted);">
                <span>Status: <strong>${t.status}</strong></span>
                <span>${new Date(t.updated_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Thread Selection and Viewport Binding
async function selectActiveChatChannel(ticketId) {
    currentSelectedTicketUuid = ticketId;
    
    // Highlight the selected channel element card
    document.querySelectorAll(".thread-channel-pill").forEach(p => {
        p.style.background = p.getAttribute("data-ticket-id") === ticketId ? "#edf2f7" : "transparent";
    });

    // Release interface form locks
    document.getElementById("chatMessageTextInput").disabled = false;
    document.getElementById("chatMessageSendBtn").disabled = false;

    loadLiveThreadMessagesMatrix(ticketId);

    // Unsubscribe from old hooks and listen for real-time chat updates
    supabase.removeAllChannels();
    supabase
        .channel(`public:platform_chat_messages:thread=${ticketId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_chat_messages', filter: `channel_user_id=eq.${currentAuthenticatedUserUuid}` }, () => {
            loadLiveThreadMessagesMatrix(ticketId);
        })
        .subscribe();
}

// Messages Render Array Stream Pipeline
async function loadLiveThreadMessagesMatrix(ticketId) {
    const frame = document.getElementById("chatMessageViewport");
    if (!frame) return;

    // Fetch message lines from your platform_chat_messages setup
    const { data: messages } = await supabase
        .from('platform_chat_messages')
        .select('sender_type, message_text, created_at')
        .eq('channel_user_id', currentAuthenticatedUserUuid)
        .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
        frame.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">Channel opened cleanly. Submit notes or filing queries below.</p>`;
        return;
    }

    frame.innerHTML = messages.map(m => {
        const isClient = m.sender_type === 'customer';
        return `
            <div style="display:flex; flex-direction:column; align-items:${isClient ? 'flex-end' : 'flex-start'} !important; width:100% !important;">
                <div style="max-width:70% !important; background:${isClient ? 'var(--emerald)' : '#e2e8f0'} !important; color:${isClient ? 'white' : 'var(--text-dark)'} !important; padding:10px 14px !important; border-radius:8px !important; font-size:0.85rem !important;">
                    <span style="display:block;">${m.message_text}</span>
                </div>
                <small style="font-size:0.6rem; color:#94a3b8; margin-top:3px;">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            </div>
        `;
    }).join('');
    
    frame.scrollTop = frame.scrollHeight;
}

function setupChatInteractionTriggers() {
    const input = document.getElementById("chatMessageTextInput");
    const sendBtn = document.getElementById("chatMessageSendBtn");

    async function dispatchMessageBody() {
        const value = input.value.trim();
        if (!value || !currentSelectedTicketUuid) return;

        input.value = "";
        await supabase
            .from('platform_chat_messages')
            .insert([{
                channel_user_id: currentAuthenticatedUserUuid,
                message_text: value,
                sender_type: 'customer'
            }]);
    }

    sendBtn.addEventListener("click", dispatchMessageBody);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") dispatchMessageBody(); });
}

// Programmatic Support Ticket Generator Interface
async function createNewSupportThread() {
    const subjectInput = prompt("Enter the subject summary for this support query:");
    if (!subjectInput || subjectInput.trim() === "") return;

    const descInput = prompt("Provide a short description of what needs review:");
    if (!descInput || descInput.trim() === "") return;

    const companyInput = prompt("Enter the associated legal entity company name:");
    if (!companyInput || companyInput.trim() === "") return;

    // Compiles an insert that perfectly matches your table columns and structures
    const { data: newTicket, error } = await supabase
        .from('support_tickets')
        .insert([{
            ticket_id: `TK-PENDING-${Date.now().toString().slice(-4)}`, // Temporary string overwritten by trigger function
            client_id: currentAuthenticatedUserUuid, // Tracks user identity cleanly via UUID token strings
            company_name: companyInput.trim(),
            subject: subjectInput.trim(),
            description: descInput.trim(),
            priority: 'Medium',
            status: 'New'
        }])
        .select()
        .single();

    if (error) {
        alert(`Failed to log support ticket parameters: ${error.message}`);
        return;
    }

    if (newTicket) {
        // Refresh ticket channel lists automatically
        await fetchSecureClientChatThreads(currentAuthenticatedUserUuid);
        selectActiveChatChannel(newTicket.id);
    }
}
