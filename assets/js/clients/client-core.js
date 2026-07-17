/**
 * 🚀 CENTRAL PORTAL INFRASTRUCTURE CORE PLATFORM ENGINE
 */

const SUPABASE_URL = "https://lrbimrlbskjweynxlgas.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    initializeGlobalPortalEngine();
});

async function initializeGlobalPortalEngine() {
    startPortalSystemClock();
    const runtimeSession = await verifySecureClientSession();
    if (runtimeSession) {
        setupGlobalSearchHook();
        setupGlobalLogoutAction();
        fetchLiveHeaderNotifications(runtimeSession.user.id);
    }
}

function startPortalSystemClock() {
    const clockContainer = document.getElementById("portal-clock");
    if (!clockContainer) return;
    setInterval(() => {
        const timestamp = new Date();
        clockContainer.textContent = timestamp.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + " | " + timestamp.toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
}

async function verifySecureClientSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) { window.location.replace("login.html"); return null; }
    
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single();
    const nameField = document.getElementById("clientNameField");
    if (nameField && profile) { nameField.textContent = `${profile.first_name} ${profile.last_name}`; }
    return session;
}

// 🔔 Real-Time Notification Stream Module
async function fetchLiveHeaderNotifications(userId) {
    const badge = document.getElementById("globalNavUnreadCounterBadge");
    if (!badge) return;

    // Query matches schema rules: is_read = false
    let { data: unreadAlerts } = await supabase
        .from('portal_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false);

    const count = unreadAlerts ? unreadAlerts.length : 0;
    if (count > 0) {
        badge.textContent = count;
        badge.style.setProperty('display', 'block', 'important');
    } else {
        badge.style.display = 'none';
    }

    // Refresh live stream channel on inserts or status updates
    supabase
        .channel(`public:portal_notifications:user=${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_notifications', filter: `user_id=eq.${userId}` }, () => {
            fetchLiveHeaderNotifications(userId);
            // If we are on the dashboard page, trigger the home feed element to reload as well
            if (typeof refreshDashboardLiveActionLog === "function") { refreshDashboardLiveActionLog(userId); }
        })
        .subscribe();
}

function setupGlobalSearchHook() {
    const searchField = document.getElementById("portalGlobalSearchField");
    if (!searchField) return;
    searchField.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && searchField.value.trim() !== "") {
            window.location.href = `client-filings.html?search=${encodeURIComponent(searchField.value.trim())}`;
        }
    });
}

function setupGlobalLogoutAction() {
    const logoutBtn = document.getElementById("portalLogoutBtn");
    if (logoutBtn) { logoutBtn.addEventListener("click", async () => { await supabase.auth.signOut(); window.location.replace("login.html"); }); }
}

/* ==========================================================================
   🛡️ ENGAGE GLOBAL DOM PROTECTION INTERCEPTOR
   ========================================================================== */
(function engageGlobalDOMProtectionInterceptor() {
    "use strict";
    const sensitiveDOMTargets = ['clientNameField', 'clientProfileIdDisplay', 'portal-client-id', 'countEntities', 'countPending', 'complianceStatus', 'countActions', 'client-managed-entities-table-body', 'filingTimeline', 'ticketStatusAlertSlot'];
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        const realElement = originalGetElementById.call(document, id);
        if (realElement) return realElement;
        if (document.readyState === 'loading' && sensitiveDOMTargets.includes(id)) {
            return { style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} }, set textContent(val) { this._value = val; }, get textContent() { return this._value || ''; }, set innerHTML(val) { this._html = val; }, get innerHTML() { return this._html || ''; }, appendChild: function(node) { return node; } };
        }
        return null;
    };
})();
