// assets/js/portal-global.js

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
    const serviceKey = urlParams.get("service") || "2290";
    sessionStorage.setItem("checkout_service_key", serviceKey);

    if (!window.supabase) return;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return; // Testing locally without auth session active

    const { data, error } = await window.supabase
        .from('user_filings_workspace')
        .select('id, payload_data, current_step')
        .eq('service_key', serviceKey)
        .eq('status', 'draft')
        .maybeSingle();

    if (data && !error) {
        recordDatabaseId = data.id;
        sessionStorage.setItem("collected_wizard_payload", JSON.stringify(data.payload_data));
        // If currentStepIndex is accessible globally in wizard-engine.html, sync it
        if (typeof currentStepIndex !== 'undefined') {
            currentStepIndex = data.current_step;
            if (typeof renderStepContents === 'function') renderStepContents();
        }
    }
}

// Executed instantly on every "Save & Continue" or "Save & Exit" click
async function synchronizeStepToCloud(currentStepIdx, finalStepPayload) {
    const serviceKey = sessionStorage.getItem("checkout_service_key");
    sessionStorage.setItem("collected_wizard_payload", JSON.stringify(finalStepPayload));

    if (!window.supabase) return;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return; // User is in public sandbox testing profile mode

    const recordPayload = {
        service_key: serviceKey,
        payload_data: finalStepPayload,
        current_step: currentStepIdx,
        status: 'draft',
        user_id: user.id
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
}

// Final operations for terminal transitions inside order.html checkout
async function updateFilingToPaidStatus() {
    const serviceKey = sessionStorage.getItem("checkout_service_key");
    if (!window.supabase || !recordDatabaseId) return;

    await window.supabase
        .from('user_filings_workspace')
        .update({ status: 'paid' })
        .eq('id', recordDatabaseId);
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
    window.location.href = "dashboard.html";
}
