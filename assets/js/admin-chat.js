
/* ========================================================================== 
   FILINGS4U ADMIN PAGE BOOTSTRAP
   Shared shell behavior; page functionality remains below.
   ========================================================================== */
(function adminPageBootstrap() {
  "use strict";
  document.documentElement.classList.add("admin-page-loading");

  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const path = window.location.pathname.toLowerCase();
  const isAdminPage = path.includes("/admin-") || /admin-[^/]+$/.test(path);

  let authenticated = false;
  let role = null;

  try {
    const raw = localStorage.getItem(sessionTokenKey);
    if (raw) {
      const session = JSON.parse(raw);
      if (session && session.access_token) {
        authenticated = true;
        role = session.user?.user_metadata?.role || null;
        if (!role && session.user?.email?.toLowerCase().endsWith("@filings4u.com")) {
          role = "admin";
        }
      }
    }
  } catch (error) {
    console.error("Admin session parsing failed:", error);
  }

  if (!authenticated) {
    window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
    return;
  }

  if (isAdminPage && role !== "admin") {
    window.location.replace("client-dashboard.html");
    return;
  }

  document.documentElement.classList.remove("admin-page-loading");
})();

function initializeAdminPageClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  const render = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    clock.textContent = `${date} | ${time}`;
  };
  render();
  window.setInterval(render, 1000);
}

document.addEventListener("DOMContentLoaded", initializeAdminPageClock);


/**
 * Filings4U Enterprise Admin
 * Customer Communication Desk
 *
 * Page-specific controller extracted from admin-chat.html.
 * Uses the shared Supabase configuration and admin navigation.
 */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // Global variables initialization frame parameters
  window.activeSelectedClientId = null; // Links directly to client_profiles.id
  window.masterCrmThreadsCache = [];
  window.realtimeChatSubscriptionChannel = null;

  // Safe visual markup input strings XSS sanitation helper utility
  window.escapeChatTextMarkup = function(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "'");
  };

  // Helper utility to construct initials avatar when no avatar image string exists
  window.createFallbackInitialsMarkup = function(first, last, email) {
    let text = "👤";
    if (first || last) {
      text = ((first ? first[0] : "") + (last ? last[0] : "")).toUpperCase();
    } else if (email) {
      text = email[0].toUpperCase();
    }
    return `<div class="avatar-fallback-circle">${text}</div>`;
  };

  // --- STAGE 1: DIRECTORY ROSTER RETRIEVAL MATRIX FROM THE RAW TABLE ---
  window.synchronizeChatThreadsRoster = async function() {
    const rosterContainer = document.getElementById("adminUsersFeedContainer");
    const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;

    if (!rosterContainer || !client) return;

    try {
      console.log("📡 [Roster Engine] Syncing bidirectional thread logs from raw chat table...");

      // 🟢 OPTIMIZED: Fetches profile data alongside avatar pointers out of tables
      const { data: rawMessages, error } = await client
        .from('chat_messages')
        .select(`
          id, 
          message_content, 
          created_at, 
          sender_type, 
          first_name, 
          last_name, 
          email_address, 
          is_read_by_admin,
          avatar_url
        `)
        .order('created_at', { ascending: false });

      console.log("📦 [Diagnostic Log] Raw data payload returned from table:", rawMessages);

      if (error) throw error;

      if (!rawMessages || rawMessages.length === 0) {
        window.masterCrmThreadsCache = [];
        rosterContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.8rem; font-style:italic;">No active conversations registered.</div>`;
        return;
      }

      // 🟢 GROUPING MATRIX: Group raw messages by unique client profile 'id'
      const threadsGroupMap = {};
      
      rawMessages.forEach(msg => {
        const uid = msg.id; 

        // Since rows are ordered newest first, the first time we see an id is their absolute latest message
        if (!threadsGroupMap[uid]) {
          threadsGroupMap[uid] = {
            id: uid, 
            message_content: msg.message_content,
            last_message_at: msg.created_at,
            sender_type: msg.sender_type,
            first_name: msg.first_name,
            last_name: msg.last_name,
            email_address: msg.email_address,
            avatar_url: msg.avatar_url || null, // 🟢 Captured for avatar rendering engines
            unread_count: 0
          };
        }

        // Calculate unread message counts for this specific sidebar row badge context
        if (msg.sender_type === 'client' && msg.is_read_by_admin === false) {
          threadsGroupMap[uid].unread_count += 1;
        }
      });

      // Convert unified map back into standard array sorted chronologically
      window.masterCrmThreadsCache = Object.values(threadsGroupMap).sort((a, b) => {
        return new Date(b.last_message_at) - new Date(a.last_message_at);
      });

      // Send cleaned collection array straight onto UI list layout engines
      window.renderChatSidebarList(window.masterCrmThreadsCache);

    } catch (err) {
      console.error("✕ Roster synchronization failure:", err.message);
      rosterContainer.innerHTML = `<div style="text-align:center; padding:15px; color:#ef4444; font-size:0.8rem; font-weight:700;">⚠️ Database Connection Offline.</div>`;
    }
  };


 // --- STAGE 2: SIDEBAR RENDERING SYSTEM ---
window.renderChatSidebarList = function(threads) {
  const rosterContainer = document.getElementById("adminUsersFeedContainer");
  if (!rosterContainer) return;

  if (!threads || threads.length === 0) {
    rosterContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.8rem; font-style:italic;">No active chats found.</div>`;
    return;
  }

  rosterContainer.innerHTML = threads.map(user => {
    const isSelected = window.activeSelectedClientId === user.id;
    const activeClass = isSelected ? "active-user-row" : "";
    
    let name = "Valued Member";
    if (user.first_name || user.last_name) {
      name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    } else if (user.email_address) {
      name = user.email_address.split('@')[0];
    }

    let snippet = user.message_content || 'No text content.';
    if (snippet.includes("Name:")) {
      snippet = "📋 [New Room Onboarding Parameters]";
    } else if (snippet.length > 35) {
      snippet = snippet.substring(0, 32) + "...";
    }

    const badge = user.unread_count > 0 ? `<span class="unread-count-badge">${user.unread_count}</span>` : "";

    let avatarMarkup = "";
    if (user.avatar_url) {
      avatarMarkup = `<img src="${user.avatar_url}" class="chat-avatar-frame" alt="Profile" onerror="this.outerHTML='<div class=\'avatar-fallback-circle\'>👤</div>'">`;
    } else {
      const initialLetters = ((user.first_name ? user.first_name : '') + (user.last_name ? user.last_name : '')).toUpperCase() || '👤';
      avatarMarkup = `<div class="avatar-fallback-circle">${initialLetters}</div>`;
    }

    const backgroundStyles = isSelected ? "background: rgba(37, 99, 235, 0.06) !important; border-left: 4px solid #dc2626 !important;" : "background: #ffffff;";

    return `
      <div class="user-chat-row-card ${activeClass}" style="${backgroundStyles}" onclick="window.selectActiveClientThread('${user.id}')">
        ${avatarMarkup}
        <div class="sidebar-text-group">
          <div class="user-row-meta">
            <strong class="user-profile-title">${window.escapeChatTextMarkup(name)}</strong>
            ${badge}
          </div>
          <p class="user-message-snippet">${window.escapeChatTextMarkup(snippet)}</p>
        </div>
      </div>
    `;
  }).join('');
};


 // --- STAGE 3: LOADING CHAT HISTORY LOG (AVATAR & TIMELINE ALIGNMENT SYSTEM) ---
window.selectActiveClientThread = async function(clientId) {
  window.activeSelectedClientId = clientId;
  
  // Highlight the row visually in the sidebar
  window.renderChatSidebarList(window.masterCrmThreadsCache);
  
  const messageLogContainer = document.getElementById("adminChatMessagesLog");
  const inputField = document.getElementById("adminChatMessageInputField");
  const sendButton = document.getElementById("adminChatSendButton");
  const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;

  if (!messageLogContainer || !client) return;

  // Enable entry form layout inputs
  if (inputField) { 
    inputField.disabled = false; 
    inputField.placeholder = "Type your response here..."; 
  }
  if (sendButton) { 
    sendButton.disabled = false; 
  }

  try {
    messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Loading conversation...</div>`;

    // Fetch message logs belonging exclusively to this selected conversation row
    const { data: messages, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('id', clientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:var(--text-muted); font-size:0.85rem; font-style:italic;">No messages found in this history timeline.</div>`;
      return;
    }

    // Generate message markup using absolute data styling structures
    messageLogContainer.innerHTML = messages.map(msg => {
      const type = String(msg.sender_type || '').trim().toLowerCase();
      const isStaff = (type === "staff" || type === "admin" || type === "agent");
      
      // Structural class alignment triggers
      const structuralRowClass = isStaff ? "staff-sent" : "client-sent";
      const dataSenderToken = isStaff ? "staff" : "client";

      // 🟢 AVATAR GENERATION LOGIC HINGE
      let avatarHtml = "";
      if (isStaff) {
        // Force admin profiles to render brand fav image [INDEX]
        avatarHtml = `<img src="images/fav.png" class="chat-bubble-avatar" alt="Admin Avatar" onerror="this.outerHTML='<div class=\'avatar-fallback-circle small\'>🛠️</div>'">`;
      } else {
        // Look up client profile photo link
        if (msg.avatar_url) {
          avatarHtml = `<img src="${msg.avatar_url}" class="chat-bubble-avatar" alt="Client Avatar" onerror="this.outerHTML='<div class=\'avatar-fallback-circle small\'>👤</div>'">`;
        } else {
          const initials = ((msg.first_name ? msg.first_name : '') + (msg.last_name ? msg.last_name : '')).toUpperCase() || '👤';
          avatarHtml = `<div class="avatar-fallback-circle small">${initials}</div>`;
        }
      }

      const cleanText = window.escapeChatTextMarkup(msg.message_content);
      const timeFormatted = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Returns layout templates formatting avatars relative to bubble edges
      return `
        <div class="msg-row ${structuralRowClass}" data-sender="${dataSenderToken}">
          ${avatarHtml}
          <div class="msg-bubble">
            ${cleanText}
            <span class="msg-timestamp">${timeFormatted}</span>
          </div>
        </div>
      `;
    }).join('');

    // Auto-scroll timeline feed view down to latest entry node
    messageLogContainer.scrollTop = messageLogContainer.scrollHeight;

    // Reset read flags inside the DB tracking framework
    await client.from('chat_messages').update({ is_read_by_admin: true }).eq('id', clientId).eq('sender_type', 'client');

  } catch (err) {
    console.error("✕ Timeline download failure:", err.message);
    messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:#ef4444; font-size:0.85rem; font-weight:700;">⚠️ Error fetching message logs.</div>`;
  }
};

// Initial runtime execute loop anchor on screen load
await window.synchronizeChatThreadsRoster();


// --- STAGE 3: THE MAIN VIEWPORT TIMELINE CORE ENGINE ---
window.loadActiveThreadViewportPanel = async function(clientId) {
  window.activeSelectedClientId = clientId;
  
  // Rerender sidebar selection highlight row state safely
  if (typeof window.synchronizeChatThreadsRoster === 'function') {
    // If you have a cached state layout running, update selection visuals
    const cachedData = window.masterCrmThreadsCache || [];
    if (cachedData.length > 0) window.renderChatSidebarList(cachedData);
  }

  const messageLogContainer = document.getElementById("adminChatMessagesLog");
  const inputField = document.getElementById("adminChatMessageInputField");
  const sendButton = document.getElementById("adminChatSendButton");
  const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;

  if (!messageLogContainer || !client) return;

  // Wake up structural entry forms fields
  if (inputField) { inputField.disabled = false; inputField.placeholder = "Write a response to client..."; }
  if (sendButton) { sendButton.disabled = false; }

  try {
    messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Opening conversation nodes...</div>`;

    // Pull down historical transcripts belonging exclusively to this row ID context
    const { data: messages, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('id', clientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Timeline empty. No historical logs recorded.</div>`;
      return;
    }

    // Build operational timeline markup string array data maps
    messageLogContainer.innerHTML = messages.map(msg => {
      const type = String(msg.sender_type || '').trim().toLowerCase();
      
      // 🟢 DETECT SENDER TYPE AND ASSIGN PROPER STRUCTURAL STYLING WRAPPERS
      let structuralRowClass = "client-sent"; // Fallback default
      let dataSenderToken = "client";

      if (type === "staff" || type === "admin" || type === "agent") {
        structuralRowClass = "staff-sent"; // ADMIN GOES TO RIGHT
        dataSenderToken = "staff";
      }

      const cleanText = window.escapeChatTextMarkup(msg.message_content);
      const timestamp = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Return explicit node row injection templates carrying hard data attribute overrides
      return `
        <div class="msg-row ${structuralRowClass}" data-sender="${dataSenderToken}">
          <div class="msg-bubble">
            ${cleanText}
            <span class="msg-timestamp">${timestamp}</span>
          </div>
        </div>
      `;
    }).join('');

    // Force viewport layout containers down to the latest tracking nodes
    messageLogContainer.scrollTop = messageLogContainer.scrollHeight;

    // Reset unread column matrices flags inside backend storage tables automatically
    await client.from('chat_messages').update({ is_read_by_admin: true }).eq('id', clientId).eq('sender_type', 'client');

  } catch (err) {
    console.error("✕ Viewport engine execution crash:", err.message);
    messageLogContainer.innerHTML = `<div style="text-align:center; padding-top:20%; color:#ef4444; font-size:0.85rem; font-weight:700;">⚠️ Failed to load message timeline stream.</div>`;
  }
};



// --- STAGE 3: SEARCH CLIENTS BY EMAIL ADDRESS OR NAME (Bypasses long IDs) ---
window.filterUsersFeed = function() {
  const searchBox = document.getElementById("userFeedFilterField");
  if (!searchBox || !window.masterCrmThreadsCache) return;

  const parsingToken = String(searchBox.value || '').toLowerCase().trim();

  const filtered = window.masterCrmThreadsCache.filter(row => {
    if (!row) return false;
    
    // 🟢 FIXED LOOKUP PROPERTIES: Scans direct table field structures matching your mirror table
    const matchClientEmail = String(row.email_address || '').toLowerCase();
    const matchLastMsg = String(row.message_content || '').toLowerCase();
    
    // Derive customer name exactly like the sidebar list builder to keep lookups accurate
    const fName = String(row.first_name || '').toLowerCase();
    const lName = String(row.last_name || '').toLowerCase();
    const matchClientName = `${fName} ${lName}`.trim();

    return matchClientEmail.includes(parsingToken) || matchClientName.includes(parsingToken) || matchLastMsg.includes(parsingToken);
  });

  window.renderChatSidebarList(filtered);
};

// --- STAGE 4: MAIN THREAD RENDERING HANDLER (CORRECTED METADATA CACHE) ---
window.loadActiveThreadViewportPanel = async function(stringClientUuid) {
  const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;
  const textarea = document.getElementById("adminChatMessageInputField");
  const sendButton = document.getElementById("adminChatSendButton");
  const msgLogBox = document.getElementById("adminChatMessagesLog");

  if (!client || !textarea || !sendButton || !msgLogBox) return;

  // Enforce consistent token storage parameters (Maps directly onto the profile id column)
  window.activeSelectedClientId = String(stringClientUuid).trim().toLowerCase();

  // Wipe out historic cache contexts to block crossover data mapping leakage
  window.activeSelectedClientEmail = "";
  window.activeSelectedClientFirstName = "";
  window.activeSelectedClientLastName = "";
  window.activeSelectedClientCompany = "";

  textarea.disabled = false;
  sendButton.disabled = false;
  textarea.placeholder = `Type response to Client...`;
  textarea.focus();

  if (window.realtimeChatSubscriptionChannel) {
    console.log("🔌 [Real-time Engine] Clearing duplicate thread listener streams...");
    await client.removeChannel(window.realtimeChatSubscriptionChannel);
    window.realtimeChatSubscriptionChannel = null;
  }

  try {
    console.log(`📡 [Chat Engine] Updating read state metrics for user: [${window.activeSelectedClientId}]`);
    
    // 🟢 FIXED: Changed 'client_id' targeting parameter directly to 'id'
    await client
      .from('chat_messages')
      .update({ is_read_by_admin: true })
      .eq('id', window.activeSelectedClientId);

    if (typeof window.synchronizeChatThreadsRoster === "function") {
      window.synchronizeChatThreadsRoster();
    }

    // 🟢 FIXED: Changed 'client_id' filter lookup key targeting parameter to 'id'
    const { data: messages, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('id', window.activeSelectedClientId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 🟢 FIXED METADATA CAPTURE: Explicitly scans the thread rows to preserve the original profile metadata cells
    if (messages && messages.length > 0) {
      const parentRowSample = messages.find(m => m.sender_type === 'client' && m.email_address);
      if (parentRowSample) {
        window.activeSelectedClientEmail = String(parentRowSample.email_address || '').trim().toLowerCase();
        window.activeSelectedClientFirstName = parentRowSample.first_name || "";
        window.activeSelectedClientLastName = parentRowSample.last_name || "";
        window.activeSelectedClientCompany = parentRowSample.company_name || "Not Specified";
      } else {
        // Fallback: If no client row holds data cells, fall back onto the grid properties natively
        const alternativeRow = messages[0];
        window.activeSelectedClientEmail = alternativeRow.email_address || "";
        window.activeSelectedClientFirstName = alternativeRow.first_name || "";
        window.activeSelectedClientLastName = alternativeRow.last_name || "";
        window.activeSelectedClientCompany = alternativeRow.company_name || "Not Specified";
      }
    }

    msgLogBox.innerHTML = "";
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        window.appendSingleChatMessageBubbleToUI(msg);
      });
    } else {
      msgLogBox.innerHTML = `<div style="text-align:center; padding-top:20%; color:#64748b; font-style:italic; font-size:0.85rem;">No messages exchanged with this user yet.</div>`;
    }

    if (typeof window.scrollTerminalTimelineToAbsoluteBottom === "function") {
      window.scrollTerminalTimelineToAbsoluteBottom();
    }

    if (typeof window.initializeAdminRealtimeMessagingPipeline === "function") {
      window.initializeAdminRealtimeMessagingPipeline();
    }

  } catch (err) {
    console.error("✕ Timeline retrieval failed:", err.message);
    msgLogBox.innerHTML = `<div style="text-align:center; padding-top:20%; color:#ef4444; font-weight:700; font-size:0.85rem;">⚠️ Timeline Connection Offline.</div>`;
  }
};

// --- STAGE 5: VISUAL NOTIFICATION BADGE FLASH ENGINE ---
window.triggerActiveBrowserTabFlashAlert = function(clientLabel) {
  if (window.f4uTabNotificationIntervalInstance) return;
  let toggleAlertFlag = true;
  const shortIdLabel = String(clientLabel || '').substring(0, 8).toUpperCase();
  window.originalBrowserTabTitleString = document.title || "Sales Chat Terminal";
  window.f4uTabNotificationIntervalInstance = setInterval(() => {
    document.title = toggleAlertFlag ? `🚨 NEW CHAT (#${shortIdLabel})` : `💬 ${window.originalBrowserTabTitleString}`;
    toggleAlertFlag = !toggleAlertFlag;
  }, 1000);
};

document.addEventListener("click", () => {
  const inputEl = document.getElementById("adminChatMessageInputField");
  if (document.activeElement === inputEl && window.f4uTabNotificationIntervalInstance) {
    clearInterval(window.f4uTabNotificationIntervalInstance);
    window.f4uTabNotificationIntervalInstance = null;
    document.title = window.originalBrowserTabTitleString || "Sales Chat Terminal";
  }
});

// --- STAGE 6: APPEND CHAT TEXT BUBBLES DYNAMICALLY ONTO WORKSPACE CANVAS ---
window.appendSingleChatMessageBubbleToUI = function(msgRow) {
  const msgLogBox = document.getElementById("adminChatMessagesLog");
  if (!msgLogBox || !msgRow) return;

  const currentSender = String(msgRow.sender_type || '').toLowerCase();
  const isMyOwnMessage = currentSender === 'admin' || currentSender === 'agent' || currentSender === 'staff';

  const rowWrapper = document.createElement("div");
  
  // 🟢 FIXED VISUAL ALIGNMENT: Swapped the class outputs to perfectly match your viewport presentation styles
  rowWrapper.className = isMyOwnMessage ? "msg-row client-sent" : "msg-row staff-sent";

  const readableTime = msgRow.created_at ? new Date(msgRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let secureCleanText = window.escapeChatTextMarkup(msgRow.message_content || "");

  rowWrapper.innerHTML = `
    <div class="msg-bubble">
      <div class="bubble-text-content">${secureCleanText}</div>
      <span class="msg-timestamp" style="display:block; font-size:0.68rem; color:#94a3b8; margin-top:4px; font-weight:500;">${readableTime}</span>
    </div>
  `;

  msgLogBox.appendChild(rowWrapper);

  if (typeof window.scrollTerminalTimelineToAbsoluteBottom === "function") {
    window.scrollTerminalTimelineToAbsoluteBottom();
  }
};

// --- STAGE 7: SYNTAX-CORRECTED OUTBOUND MESSAGE TRANSMISSION ENGINE (ALIGNED) ---
window.dispatchAdminResponseChatMessage = async function() {
  const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;
  const textarea = document.getElementById("adminChatMessageInputField") || document.getElementById("adminSprintInputField");
  
  if (!client || !textarea || !window.activeSelectedClientId) {
    console.warn("🔕 Transmission halted: Missing active database client instance or user target metrics.");
    return;
  }

  const rawText = textarea.value.trim();
  if (!rawText) return;

  textarea.disabled = true;

  try {
    console.log("🚀 [Chat Desk] Pushing single clean outbound payload message to client thread...");
    
    // 🛡️ UUID SANITIZATION: Clean whitespace without changing character casing rules for the UUID string
    const cleanClientId = String(window.activeSelectedClientId).trim();

    const payloadRowData = {
      id: cleanClientId, 
      message_content: rawText,
      sender_type: 'admin',
      is_read_by_admin: true,
      is_read_by_client: false,
      email_address: window.activeSelectedClientEmail ? String(window.activeSelectedClientEmail).trim().toLowerCase() : null,
      first_name: window.activeSelectedClientFirstName || null,
      last_name: window.activeSelectedClientLastName || null,
      company_name: window.activeSelectedClientCompany || "Not Specified"
    };

    // 🟢 FIXED PAYLOAD: Inserts data and pulls it back instantly for immediate DOM manipulation rendering
    const { data: insertedRows, error } = await client
      .from('chat_messages')
      .insert([payloadRowData])
      .select();

    if (error) throw error;
    
    textarea.value = ""; 

    // ⚡ INSTANT OPTIMIZATION: Render message locally on the RIGHT side right away instead of waiting on the database channel
    if (insertedRows && insertedRows[0] && typeof renderSingleChatMessageRow === 'function') {
      renderSingleChatMessageRow(insertedRows[0]);
    } else if (typeof renderSingleChatMessageRow === 'function') {
      // Fallback object composition if returning modifiers are locked out
      renderSingleChatMessageRow({
        ...payloadRowData,
        message_id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        created_at: new Date().toISOString()
      });
    }

    // Silently notify sidebar roster records to match the fresh message text
    if (typeof window.synchronizeChatThreadsRoster === 'function') {
      await window.synchronizeChatThreadsRoster();
    }

    // 📬 BACKGROUND NOTIFICATION DISPATCH ROUTINE (Hooks directly to your Resend Edge function engine)
    if (payloadRowData.email_address) {
      fetch('https://supabase.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: {
            email_address: payloadRowData.email_address,
            sender_type: 'admin',
            message_content: rawText
          }
        })
      }).catch(err => console.error("✕ Resend Notification pipeline background crash:", err));
    }

  } catch (err) {
    console.error("✕ Outbound transmission crash:", err.message || err);
    const savedPlaceholder = textarea.placeholder;
    textarea.placeholder = `✕ Transmission Failed: ${err.message || 'Database Write Rejection'}`;
    setTimeout(() => {
      textarea.placeholder = savedPlaceholder;
    }, 4000);
  } finally {
    textarea.disabled = false;
    textarea.focus();
  }
};


// --- STAGE 8: KEYBOARD ACCELERATORS & UI TIMELINE SCROLL MANAGEMENT ---
window.handleAdminChatKeyOptions = function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    window.dispatchAdminResponseChatMessage();
  }
};

window.scrollTerminalTimelineToAbsoluteBottom = function() {
  const msgLogBox = document.getElementById("adminChatMessagesLog");
  if (msgLogBox) {
    msgLogBox.scrollTop = msgLogBox.scrollHeight;
  }
};

// --- STAGE 9: ACCORDION INTERACTION CONTROLS & SESSION PURGING ---
function toggleSidebarAccordion(buttonElement) {
  if (!buttonElement) return;
  buttonElement.classList.toggle('active');
  const panel = buttonElement.nextElementSibling;
  if (panel) {
    if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
      panel.style.maxHeight = "0px";
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  }
}
window.toggleSidebarAccordion = toggleSidebarAccordion;

document.getElementById("sidebarFallbackLogoutBtn")?.addEventListener("click", () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.location.replace("admin-login.html");
});

// --- STAGE 10: REAL-TIME WEBSOCKET PIPELINE (ALIGNED EMAIL BOUNDARIES) ---
window.initializeAdminRealtimeMessagingPipeline = function() {
  const client = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;
  if (!client) return;

  console.log("📡 [Real-time Engine] Binding global workspace listener channel...");
  
  if (window.realtimeChatSubscriptionChannel) {
    client.removeChannel(window.realtimeChatSubscriptionChannel);
  }

  window.realtimeChatSubscriptionChannel = client
    .channel('admin_master_chat_stream')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
      console.log("📡 [Inbound Live Broadcast Caught]:", payload.new);
      
      const incomingEmail = String(payload.new.email_address || '').trim().toLowerCase();
      const currentSelectedEmail = String(window.activeSelectedClientEmail || '').trim().toLowerCase();
      const isClientMsg = String(payload.new.sender_type).toLowerCase() === 'client';

      if (isClientMsg) {
        try {
          new Audio("assets/sounds/notification.mp3").play().catch(() => {});
        } catch(e) {}
        if (typeof window.triggerActiveBrowserTabFlashAlert === "function") {
          window.triggerActiveBrowserTabFlashAlert(incomingEmail);
        }
      }

      // 🟢 FIXED: Compares email address trackers to render bubbles inside the current admin pane viewport
      if (currentSelectedEmail !== "" && incomingEmail === currentSelectedEmail) {
        window.appendSingleChatMessageBubbleToUI(payload.new);
        
        if (isClientMsg) {
          // 🟢 VERIFIED: Targeting the 'id' profile link column correctly here to mark incoming messages read
          await client
            .from('chat_messages')
            .update({ is_read_by_admin: true })
            .eq('id', payload.new.id);
        }
      }
      
      await window.synchronizeChatThreadsRoster();
    })
    .subscribe((status) => {
      console.log(`🔌 [Real-time Pipeline Status Switch]: ${status}`);
    });
};

// --- STAGE 11: ENGINE LIFE-CYCLE INITIALIZATION ---
const clientInstanceHook = window.supabaseInstance || window.supabaseClient || window.chatAdminCoreClient;
if (clientInstanceHook) {
  (async () => {
    if (typeof window.activeSelectedClientId === "undefined") window.activeSelectedClientId = null;
    if (typeof window.realtimeChatSubscriptionChannel === "undefined") window.realtimeChatSubscriptionChannel = null;
    
    await window.synchronizeChatThreadsRoster();
    window.initializeAdminRealtimeMessagingPipeline();
  })();
}
});