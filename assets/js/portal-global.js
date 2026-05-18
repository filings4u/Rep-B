// 🚀 FIXED: Global safety synchronization layer to align variable naming schemes across runtime contexts
if (!window.supabase && window.portalSupabaseInstance) {
    window.supabase = window.portalSupabaseInstance;
}

// Keep track of database synchronization states
let recordDatabaseId = null;

// Initialize continuous background operations
document.addEventListener("DOMContentLoaded", () => {
    initializePortalClock();
    attemptRestoreSessionDraft();
});

function initializePortalClock() {
    const clockNode = document.getElementById('portal-clock');
    if (!clockNode) return;
    setInterval(() => {
        const now = new Date();
        clockNode.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }, 1000);
}

// Automatically pulls historical data if an uncompleted draft exists in Supabase
async function attemptRestoreSessionDraft() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceKey = urlParams.get("service") || "llc-formation";
    sessionStorage.setItem("checkout_service_key", serviceKey);
    
    if (!window.supabase) {
        console.warn("Database connection unavailable to restore session drafts.");
        return;
    }
    
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session || !session.user) return;

        const { data, error } = await window.supabase
            .from('user_filings_workspace')
            .select('id, payload_data, current_step')
            .eq('service_key', serviceKey)
            .eq('status', 'draft')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (data && !error) {
            recordDatabaseId = data.id;
            sessionStorage.setItem("collected_wizard_payload", JSON.stringify(data.payload_data));
            if (typeof currentStepIndex !== 'undefined') {
                currentStepIndex = data.current_step;
                if (typeof renderStepContents === 'function') renderStepContents();
            }
        }
    } catch (err) {
        console.error("Failed to restore session tracking state layers:", err);
    }
}

// Executed instantly on every "Save & Continue" or "Save & Exit" click
async function synchronizeStepToCloud(currentStepIdx, finalStepPayload) {
    const serviceKey = sessionStorage.getItem("checkout_service_key");
    sessionStorage.setItem("collected_wizard_payload", JSON.stringify(finalStepPayload));
    
    if (!window.supabase) return;
    
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session || !session.user) return; // public sandbox mode fallback

        const recordPayload = {
            service_key: serviceKey,
            payload_data: finalStepPayload,
            current_step: currentStepIdx,
            status: 'draft',
            user_id: session.user.id
        };

        if (recordDatabaseId) recordPayload.id = recordDatabaseId;

        const { data, error } = await window.supabase
            .from('user_filings_workspace')
            .upsert(recordPayload)
            .select('id')
            .single();

        if (!error && data) {
            recordDatabaseId = data.id;
        } else {
            console.error("Database persistence stalled:", error);
        }
    } catch (err) {
        console.error("Sync cloud task error runtime crash:", err);
    }
}

// Final operations for terminal transitions inside order.html checkout
async function updateFilingToPaidStatus() {
    if (!window.supabase || !recordDatabaseId) return;
    try {
        await window.supabase
            .from('user_filings_workspace')
            .update({ status: 'paid' })
            .eq('id', recordDatabaseId);
    } catch (err) {
        console.error("Failed to update status parameters:", err);
    }
}

function handleSaveExit() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        executePortalExit();
    }
}

function closeSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) modal.style.display = 'none';
}

function executePortalExit() {
    // 🚀 FIXED: Redirects to your actual single-page dashboard filename, preventing 404s
    window.location.href = "portal-dashboard.html"; 
}


/* ==========================================================================
   📱 FILINGS4U GLOBAL RESPONSIVE ARCHITECTURE MEDIA QUERIES
   ========================================================================== */

/* 💻 Medium Screens & Tablets (Max Width: 1024px) */
@media screen and (max-width: 1024px) {
    .split-container {
        flex-direction: column; /* Stacks the hero image panel on top of the form panel */
        height: auto;
        overflow-y: auto;
    }

    .image-side {
        flex: none;
        height: 40vh; /* Limits the hero space on smaller viewports */
        padding: 40px;
    }

    .image-content h1 {
        font-size: 2.2rem;
    }

    .form-side {
        flex: none;
        height: auto;
        padding: 40px 20px;
    }

    /* Admin Action Grids & Statistics Layouts */
    .stats-row {
        grid-template-columns: repeat(2, 1fr) !important; /* Forces cards into a 2x2 grid */
        gap: 15px !important;
    }

    .admin-action-grid, .portal-grid {
        grid-template-columns: 1fr !important; /* Packs forms vertically */
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .admin-console-card {
        flex: none !important;
        width: 100% !important;
    }
}

/* 📱 Smartphones & Small Displays (Max Width: 768px) */
@media screen and (max-width: 768px) {
    body, html {
        overflow: auto !important; /* Enables smooth finger-scrolling on mobile devices */
    }

    /* Sidebars transform into a dynamic responsive top bar banner block */
    .split-container {
        display: flex;
        flex-direction: column;
    }

    .portal-sidebar {
        position: relative !important;
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        padding: 15px !important;
        border-right: none !important;
        border-bottom: 1px solid #e2e8f0;
    }

    .sidebar-nav-container, .sidebar-clock-bar, .sidebar-footer-lock p {
        display: none !important; /* Hides internal desktop sidebar text lists on phones */
    }
    
    .portal-sidebar style, .admin-badge {
        margin-bottom: 0 !important;
    }

    /* Expands the main app working canvases to take up the full phone screen */
    .portal-main {
        margin-left: 0 !important;
        width: 100% !important;
        padding: 15px !important;
    }

    .portal-header {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 15px;
    }

    .header-search-stack {
        width: 100% !important;
        align-items: stretch !important;
    }

    .search-input {
        width: 100% !important;
    }

    /* Forces data metrics cards to drop into a single single-file column stream */
    .stats-row {
        display: flex;
        flex-direction: column;
        gap: 12px !important;
    }

    /* Form Layout Elements */
    .login-card {
        padding: 20px 15px;
        box-shadow: none;
        border: none;
        background: transparent; /* Seamless clean layout framing on mobile screens */
    }

    /* Flattens transaction ledger tables so they slide sideways instead of shrinking squished */
    .portal-card, #admin-master-sales-panel {
        padding: 15px !important;
        margin: 20px 0 !important;
    }
    
    table {
        display: block;
        overflow-x: auto; /* Adds a clean horizontal swiping gesture to wide grids */
        white-space: nowrap;
    }
}
