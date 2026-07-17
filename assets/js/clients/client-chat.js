/**
 * 💬 CLIENT DASHBOARD LIVE OPERATIONS CHAT DRIVER
 * Synchronized with filings4u customer portal core architecture.
 */
let currentAuthenticatedUserUuid = null;

window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Payload schema missing active session verification parameters.");
  }

  const session = engineEvent.detail.session;
  currentAuthenticatedUserUuid = session.user.id;

  // Unlock chat infrastructure inputs
  const msgInputNode = document.getElementById("chatMessageTextInput");
  const sendBtnNode = document.getElementById("chatMessageSendBtn");

  if (!msgInputNode) {
    throw new Error("Viewport Structure Exception: Required DOM node #chatMessageTextInput missing from template layout.");
  }
  if (!sendBtnNode) {
    throw new Error("Viewport Structure Exception: Required DOM node #chatMessageSendBtn missing from template layout.");
  }

  msgInputNode.disabled = false;
  sendBtnNode.disabled = false;

  // Initialize data streaming layers
  loadLiveDirectChatHistoryStream();
  setupChatInteractionTriggers();
});

/**
 * 🧱 LAYOUT TEMPLATE ENGINE MODULE
 * Returns structural system message string layouts.
 */
function renderDefaultWelcomeMessageBanner() {
  "use strict";
  return `
    <div style="display:flex; flex-direction:column; align-items:flex-start; width:100%; margin-bottom:15px;">
      <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">Filing Operations Desk</span>
      <div style="max-width:75%; background:#e2e8f0; color:var(--text-dark); padding:14px 18px; border-radius:10px; font-size:0.85rem; box-shadow:0 1px 2px rgba(0,0,0,0.02); line-height:1.4;">
        👋 Hello! Welcome back to your filings4u dashboard support desk. <br><br> Our compliance specialists are active. You can type an update, ask about your filing status, or message our team at any time below.
      </div>
    </div>
  `;
}

/**
 * 📡 DATABASE ACCESS DISPATCH: HYDRATE MESSAGES VIEWPORT
 * Pulls row arrays from chat logs and renders message fragments.
 */
async function loadLiveDirectChatHistoryStream() {
  "use strict";

  if (!currentAuthenticatedUserUuid) {
    throw new Error("Data Integrity Exception: Operation failed due to unverified user identification variables.");
  }

  const viewportFrame = document.getElementById("chatMessageViewport");
  if (!viewportFrame) {
    throw new Error("Viewport Structure Exception: Required DOM target node #chatMessageViewport missing from template layout.");
  }

  // Fetch full row stream matching this user instance
  const { data: messages, error } = await window.supabaseInstance
    .from('chat_messages')
    .select('id, sender_type, message_content, created_at')
    .eq('client_id', currentAuthenticatedUserUuid)
    .order('created_at', { ascending: true });

  // STRICT ERROR CHECKING: Crash script immediately if query encounters system anomalies
  if (error) {
    console.error("Database Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  let compiledHtmlContentOutput = renderDefaultWelcomeMessageBanner();

  if (messages && messages.length > 0) {
    compiledHtmlContentOutput += messages.map(msg => {
      // Validate object payload integrity explicitly before string concatenation operations
      if (!msg.id || !msg.sender_type || msg.message_content === undefined || !msg.created_at) {
        throw new Error(`Data Integrity Exception: Malformed database schema detected on message row identifier token: ${msg.id || 'Unknown ID'}`);
      }

      const isClientNode = msg.sender_type.toLowerCase() === 'client' || msg.sender_type.toLowerCase() === 'customer';
      const senderDisplayName = isClientNode ? 'You' : 'Compliance Desk Specialist';
      const formattedTimestamp = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div style="display:flex; flex-direction:column; align-items:${isClientNode ? 'flex-end' : 'flex-start'} !important; width:100% !important; margin-top:10px;">
          <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">${senderDisplayName}</span>
          <div style="max-width:70% !important; background:${isClientNode ? 'var(--emerald)' : '#e2e8f0'} !important; color:${isClientNode ? 'white' : 'var(--text-dark)'} !important; padding:12px 16px !important; border-radius:10px !important; font-size:0.85rem !important; box-shadow:0 1px 2px rgba(0,0,0,0.04); line-height:1.4;">
            ${msg.message_content}
          </div>
          <small style="font-size:0.6rem; color:#94a3b8; margin-top:3px; padding:0 4px;">${formattedTimestamp}</small>
        </div>
      `;
    }).join('');
  }

  viewportFrame.innerHTML = compiledHtmlContentOutput;
  viewportFrame.scrollTop = viewportFrame.scrollHeight;
}

/**
 * ⚡ INTERACTION EVENT ENGINE
 * Attaches operational handlers and subscribes to remote database event notifications.
 */
function setupChatInteractionTriggers() {
  "use strict";

  const textInputNode = document.getElementById("chatMessageTextInput");
  const dispatchButtonNode = document.getElementById("chatMessageSendBtn");

  if (!textInputNode || !dispatchButtonNode) {
    throw new Error("Viewport Structure Exception: Active text layout handles missing during trigger assembly.");
  }

  // Database insert dispatcher function
  async function processOutboundMessage() {
    const textPayloadString = textInputNode.value.trim();
    if (!textPayloadString) return;

    // Reset layout text node value immediately to clear interface focus
    textInputNode.value = "";

    const { error: insertError } = await window.supabaseInstance
      .from('chat_messages')
      .insert([{ 
        client_id: currentAuthenticatedUserUuid, 
        message_content: textPayloadString, 
        sender_type: 'client', 
        is_read_by_admin: false 
      }]);

    if (insertError) {
      console.error("Outbound Message Transaction Failure:", insertError);
      throw new Error(`Database Operation Exception: [${insertError.code}] ${insertError.message}`);
    }
  }

  // Attach interface structural handlers
  dispatchButtonNode.addEventListener("click", processOutboundMessage);
  
  textInputNode.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Stop raw newlines from polluting the container structure
      processOutboundMessage();
    }
  });

  // Attach a persistent real-time streaming pipeline
  const realTimeChannelInstance = window.supabaseInstance
    .channel(`realtime:chat_messages_stream:${currentAuthenticatedUserUuid}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages', 
      filter: `client_id=eq.${currentAuthenticatedUserUuid}` 
    }, function () {
      loadLiveDirectChatHistoryStream();
    })
    .subscribe(function (status) {
      if (status === 'CHANNEL_ERROR') {
        throw new Error("Realtime Connection Exception: Synchronization channel broke down unexpectedly.");
      }
    });
}
