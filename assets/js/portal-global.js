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
