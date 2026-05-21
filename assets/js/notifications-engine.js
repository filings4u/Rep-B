/**
 * ==========================================================================
 * ⚡ FILINGS4U UNIFIED NOTIFICATIONS CENTER DISPATCH CONTROLLER ENGINE
 * ==========================================================================
 */

let activeLiveNotificationsCache = [];
let currentAccountEmailSessionStr = "";
let isSystemStaffSessionMode = false;

document.addEventListener("DOMContentLoaded", () => {
  // 🔐 SAFE INITIALIZATION RESILIENT LOOP: Polls until window.supabase is fully ready
  const initializationPoll = setInterval(async () => {
    if (window.supabase && typeof window.supabase.auth !== 'undefined' && typeof window.supabase.from === 'function') {
      clearInterval(initializationPoll);
      console.log("🚀 Supabase verified live inside notifications context engine.");
      
      // 1. Fire baseline user data extraction fetches immediately on load
      await verifyActiveSessionContext();
      await synchronizeNotificationsStreamData();
      
      // 2. Launch persistent live real-time WebSocket listening channel
      establishLiveRealTimeWebsocketChannel();

      // 3. 🛡️ BACKGROUND COMPLIANCE FALLBACK ENGINE
      // Regularly checks data streams to update badge integers if WebSockets drop out
      setInterval(async () => {
        console.log("🔄 Background delta sync analyzing notification states...");
        await synchronizeNotificationsStreamData();
      }, 10000); // Executed systematically every 10 seconds flat
    }
  }, 100);

  setTimeout(() => clearInterval(initializationPoll), 6000);
});


/**
 * 1. ACCOUNT SESSION SECURITY SENSOR
 */
async function verifyActiveSessionContext() {
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error || !user) return;

    currentAccountEmailSessionStr = user.email.toLowerCase().trim();
    
    // Auto-detect if user running session mode is Admin or client profile
    isSystemStaffSessionMode = user?.app_metadata?.is_admin === true || user?.app_metadata?.role === 'admin';
    console.log("👤 Active Session Authenticated: " + currentAccountEmailSessionStr + " (Admin: " + isSystemStaffSessionMode + ")");

  } catch (err) {
    console.error("Session verification layer context exception caught:", err);
  }
}

/**
 * 2. CHRONOLOGICAL DATA TABLE SYNC AGENT
 */
async function synchronizeNotificationsStreamData() {
  const listTarget = document.getElementById("notificationsStreamTimelineInjectionTarget");
  const loaderSpinner = document.getElementById("notificationsStreamLoadingSpinner");

  try {
    let schemaQuery = window.supabase.from("client_notifications").select("*");

    if (!isSystemStaffSessionMode) {
      // Client View Mode: Only track alert messages addressed to their own explicit account email
      schemaQuery = schemaQuery.eq("recipient_email", currentAccountEmailSessionStr);
    }

    const { data: records, error } = await schemaQuery.order("created_at", { ascending: false });
    if (error) throw error;

    activeLiveNotificationsCache = records || [];
    
    // Update navigation bell badges on page if element links exist inside view canvases
    refreshNavigationBellBadgeGraphics(activeLiveNotificationsCache);

    if (!listTarget) return; 
    if (loaderSpinner) loaderSpinner.remove();

    if (activeLiveNotificationsCache.length === 0) {
      listTarget.innerHTML = '<div style="text-align:center; padding:30px; color:#64748b;">No ongoing correspondence logs found under this channel.</div>';
      return;
    }

    renderNotificationsTimelineRows(activeLiveNotificationsCache, listTarget);

  } catch (err) {
    console.error("Filing notice loop synchronized processing failed:", err);
    if (loaderSpinner) loaderSpinner.innerHTML = '<span style="color:#ef4444;">Handshake tracking channel error.</span>';
  }
}

/**
 * 3. REAL-TIME ROW TIMELINE GRAPHICS BUILDER RENDERER
 */
function renderNotificationsTimelineRows(records, wrapperElement) {
  wrapperElement.innerHTML = "";

  records.forEach((notif) => {
    const timeString = new Date(notif.created_at).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const isItemUnread = notif.is_read === false;
    const itemRowNode = document.createElement("div");
    itemRowNode.className = "notification-stream-row " + (isItemUnread ? "unread-item" : "");
    
    let trackingIconAvatar = "✉️";
    const textSubject = String(notif.title).toLowerCase();
    if (textSubject.includes("success") || textSubject.includes("completed")) trackingIconAvatar = "✅";
    if (textSubject.includes("warning") || textSubject.includes("abort")) trackingIconAvatar = "⚠️";
    if (textSubject.includes("stripe") || textSubject.includes("payment")) trackingIconAvatar = "💰";

    itemRowNode.innerHTML = `
      <div class="notif-avatar-indicator">${trackingIconAvatar}</div>
      <div class="notif-text-block">
        <h3>${notif.title}</h3>
        <p>${notif.message}</p>
        <div class="notif-time-stamp">Logged Vector: ${timeString}</div>
      </div>
      ${isItemUnread ? `<button class="btn-mark-read-action" onclick="executeSingleNotificationMarkRead('${notif.id}')">Mark Read</button>` : ""}
    `;
    wrapperElement.appendChild(itemRowNode);
  });
}

/**
 * 4. DYNAMIC NAVIGATION BAR BADGE COMPILER COUNTER
 */
function refreshNavigationBellBadgeGraphics(records) {
  const badgeBubble = document.getElementById("globalNavUnreadCounterBadge");
  if (!badgeBubble) return;

  const unreadCount = records.filter(item => item.is_read === false).length;

  if (unreadCount > 0) {
    badgeBubble.innerText = unreadCount;
    badgeBubble.classList.add("has-unread");
  } else {
    badgeBubble.innerText = "0";
    badgeBubble.classList.remove("has-unread");
  }
}

/**
 * 5. READ STATE MUTATORS
 */
async function executeSingleNotificationMarkRead(recordId) {
  try {
    const { error } = await window.supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("id", recordId);

    if (error) throw error;
    await synchronizeNotificationsStreamData();
  } catch (err) {
    console.error("Data mutation read toggle failure:", err);
  }
}

async function executeMarkAllNotificationsAsRead() {
  if (activeLiveNotificationsCache.length === 0) return;
  try {
    let mutatorQuery = window.supabase.from("client_notifications").update({ is_read: true });

    if (!isSystemStaffSessionMode) {
      mutatorQuery = mutatorQuery.eq("recipient_email", currentAccountEmailSessionStr);
    }

    const { error } = await mutatorQuery.eq("is_read", false);
    if (error) throw error;

    await synchronizeNotificationsStreamData();
  } catch (err) {
    console.error("Bulk read parameters toggle exception caught:", err);
  }
}

/**
 * 6. WEBSOCKET PERSISTENT REAL-TIME CHANNELS CAPTURE HOOK
 */
function establishLiveRealTimeWebsocketChannel() {
  console.log("📡 Attaching real-time listening socket handle to notifications center...");
  
  window.supabase
    .channel("realtime-global-alerts-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "client_notifications" },
      (payload) => {
        console.log("🔔 Real-Time Table Mutation Packet Captured:", payload);
        synchronizeNotificationsStreamData();
      }
    )
    .subscribe();
}
