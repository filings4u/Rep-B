/**
 * 🎫 CLIENT OPERATION TICKETS WORKSPACE DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
let targetWorkspaceTicketId = null; 
let profileAuthenticatedUuid = null;

window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Ticket workspace loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  profileAuthenticatedUuid = session.user.id;

  // Isolate dynamic routing tokens from query string parameters
  const linkQueryString = new URLSearchParams(window.location.search);
  targetWorkspaceTicketId = linkQueryString.get("id");

  const viewportFrame = document.getElementById("ticketMessagesTimelineViewport");

  // STRICT ERROR CHECKING: Crash structural views instantly if mandatory keys are missing
  if (!targetWorkspaceTicketId) {
    if (viewportFrame) {
      viewportFrame.innerHTML = `<p style="text-align:center; padding:30px; color:#ef4444; font-weight:700; font-size:0.85rem;">Exception Error: Missing critical ticket identification routing token keys.</p>`;
    }
    throw new Error("Routing Exception: Operational view mounted without a valid target tracking 'id'.");
  }

  // Hydrate interactive data workspaces
  fetchTicketMetadataSubjectContext();
  loadSpecificTicketMessagesTimeline();
  setupTicketInputInterfaceActions();
});

/**
 * 📡 DATABASE ACCESS DISPATCH: RESOLVE SUBJECT HEADER CONTEXT
 * Fetches ticket tracking definitions and handles input activation boundaries.
 */
async function fetchTicketMetadataSubjectContext() {
  "use strict";

  if (!targetWorkspaceTicketId) return;

  const subjectHeaderField = document.getElementById("ticketWorkspaceSubjectField");
  const workspaceInput = document.getElementById("ticketWorkspaceInputField");
  const workspaceSendBtn = document.getElementById("ticketWorkspaceSendButton");

  // Query row fields directly matching your ticket index schemas
  const { data: ticketRow, error } = await window.supabaseInstance
    .from('support_tickets')
    .select('subject, status')
    .eq('id', targetWorkspaceTicketId)
    .single();

  if (error) {
    console.error("Ticket Metadata Retrieval Failure:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  if (ticketRow) {
    if (subjectHeaderField) {
      subjectHeaderField.textContent = `${ticketRow.subject} (Status: ${ticketRow.status})`;
    }
    // Activate input elements dynamically only when connection context is fully stable
    if (workspaceInput) workspaceInput.disabled = false;
    if (workspaceSendBtn) workspaceSendBtn.disabled = false;
  }
}
/**
 * 📡 DATABASE ACCESS DISPATCH: HYDRATE TIMELINE FEED VIEWPORT
 * Pulls row history logs from table channels and throws errors on structural anomalies.
 */
async function loadSpecificTicketMessagesTimeline() {
  "use strict";

  if (!profileAuthenticatedUuid) {
    throw new Error("Data Integrity Exception: Ticket message loading aborted due to unverified user credentials data.");
  }

  const boxFrame = document.getElementById("ticketMessagesTimelineViewport");
  if (!boxFrame) {
    throw new Error("Viewport Structure Exception: Required DOM node #ticketMessagesTimelineViewport missing from active view template layout.");
  }

  // Fetch full row stream matching this user instance
  const { data: streamLogs, error } = await window.supabaseInstance
    .from('platform_chat_messages')
    .select('message_text, sender_type, created_at')
    .eq('channel_user_id', profileAuthenticatedUuid)
    .order('created_at', { ascending: true });

  // STRICT ERROR CHECKING: Throw operational failure instantly to clear silent exceptions
  if (error) {
    console.error("Ticket Messages Stream Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty database records securely with zero-state UI layout feedback
  if (!streamLogs || streamLogs.length === 0) {
    boxFrame.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding: 20px 0;">Channel initialized cleanly. Submit messages or files below.</p>`;
    return;
  }

  // Construct message thread fragments safely
  boxFrame.innerHTML = streamLogs.map(m => {
    if (!m.message_text || !m.sender_type || !m.created_at) {
      throw new Error("Data Integrity Exception: Failed parsing corrupted log row parameter matching chat schemas.");
    }

    const isSelfNode = m.sender_type === 'customer';
    const senderDisplayName = isSelfNode ? 'You' : 'Admin Operations Agent';
    const formattedTimestamp = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div style="display:flex; flex-direction:column; align-items:${isSelfNode ? 'flex-end' : 'flex-start'} !important; width:100% !important; margin-top: 10px; box-sizing: border-box !important;">
        <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:2px; padding:0 4px;">
          ${senderDisplayName}
        </span>
        <div style="max-width:70% !important; background:${isSelfNode ? 'var(--emerald)' : '#e2e8f0'} !important; color:${isSelfNode ? 'white' : 'var(--text-dark)'} !important; padding:12px 16px !important; border-radius:10px !important; font-size:0.85rem !important; box-shadow:0 1px 2px rgba(0,0,0,0.03); line-height:1.4; word-break: break-word !important;">
          ${m.message_text}
        </div>
        <small style="font-size:0.6rem; color:#94a3b8; margin-top:3px; padding:0 4px;">${formattedTimestamp}</small>
      </div>
    `;
  }).join('');

  boxFrame.scrollTop = boxFrame.scrollHeight;
}

/**
 * ⚡ INTERACTION EVENT ENGINE
 * Attaches operational click/keydown handlers and subscribes to remote database event notifications.
 */
function setupTicketInputInterfaceActions() {
  "use strict";

  const inputNode = document.getElementById("ticketWorkspaceInputField");
  const sendButtonNode = document.getElementById("ticketWorkspaceSendButton");

  if (!inputNode || !sendButtonNode) {
    throw new Error("Viewport Structure Exception: Active text layout handles missing during input trigger assembly.");
  }

  // Database insert dispatcher function
  async function dispatchTicketMessage() {
    const bodyValue = inputNode.value.trim();
    if (!bodyValue) return;

    // Reset layout text node value immediately to clear interface focus
    inputNode.value = "";

    const { error: insertError } = await window.supabaseInstance
      .from('platform_chat_messages')
      .insert([{ 
        channel_user_id: profileAuthenticatedUuid, 
        message_text: bodyValue, 
        sender_type: 'customer' 
      }]);

    if (insertError) {
      console.error("Ticket Message Dispatch Insert Failure Context:", insertError);
      throw new Error(`Database Operation Exception: [${insertError.code}] ${insertError.message}`);
    }
  }

  // Attach interface structural handlers
  sendButtonNode.addEventListener("click", dispatchTicketMessage);
  
  inputNode.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Stop raw newlines from polluting the container structure
      dispatchTicketMessage();
    }
  });

  // Attach a persistent real-time streaming pipeline
  window.supabaseInstance
    .channel(`realtime:ticket_workspace_stream:${profileAuthenticatedUuid}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'platform_chat_messages', 
      filter: `channel_user_id=eq.${profileAuthenticatedUuid}` 
    }, function () {
      loadSpecificTicketMessagesTimeline();
    })
    .subscribe(function (status) {
      if (status === 'CHANNEL_ERROR') {
        throw new Error("Realtime Connection Exception: Ticket operations timeline streaming channel disconnected.");
      }
    });
}
