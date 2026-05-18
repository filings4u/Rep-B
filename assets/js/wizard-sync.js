// assets/js/wizard-sync.js
(async function initializeWizardSynchronizer() {
    "use strict";

    // 🚀 FIXED GLOBAL SYNC: Safely align naming schemes with centralized production infrastructure
    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 30);
        });
    }

    const client = await waitForSupabaseClientEngine();

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

        try {
            const { data: { session }, error: sessionErr } = await client.auth.getSession();
            if (sessionErr || !session || !session.user) return;

            const { data, error } = await client
                .from('user_filings_workspace')
                .select('id, payload_data, current_step')
                .eq('service_key', serviceKey)
                .eq('status', 'draft')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (data && !error) {
                recordDatabaseId = data.id;
                sessionStorage.setItem("collected_wizard_payload", JSON.stringify(data.payload_data));
                
                // Expose indices back to the active rendering loop windows
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
    window.synchronizeStepToCloud = async function(currentStepIdx, finalStepPayload) {
        const serviceKey = sessionStorage.getItem("checkout_service_key") || "llc-formation";
        sessionStorage.setItem("collected_wizard_payload", JSON.stringify(finalStepPayload));

        try {
            const { data: { session } } = await client.auth.getSession();
            if (!session || !session.user) return;

            const recordPayload = {
                service_key: serviceKey,
                payload_data: finalStepPayload,
                current_step: currentStepIdx,
                status: 'draft',
                user_id: session.user.id
            };

            // 🎯 FIXED: Explicit constraint passing for upsert operations
            if (recordDatabaseId) {
                recordPayload.id = recordDatabaseId;
            }

            const { data, error } = await client
                .from('user_filings_workspace')
                .upsert(recordPayload, { onConflict: 'id' })
                .select('id')
                .maybeSingle();

            if (!error && data) {
                recordDatabaseId = data.id;
                console.log("✓ Wizard state saved to cloud matrix:", recordDatabaseId);
            } else {
                console.error("Database persistence stalled:", error);
            }
        } catch (err) {
            console.error("Sync cloud task error runtime crash:", err);
        }
    };

    // Final operations for terminal transitions inside order.html checkout
    window.updateFilingToPaidStatus = async function() {
        if (!recordDatabaseId) return;
        try {
            await client
                .from('user_filings_workspace')
                .update({ status: 'paid' })
                .eq('id', recordDatabaseId);
            console.log("✓ Transaction ledger state switched to PAID.");
        } catch (err) {
            console.error("Failed to update status parameters:", err);
        }
    };

    // Form modal controllers mapped globally
    window.handleSaveExit = function() {
        const modal = document.getElementById('save-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            window.executePortalExit();
        }
    };

    window.closeSaveModal = function() {
        const modal = document.getElementById('save-modal');
        if (modal) modal.style.display = 'none';
    };

    window.executePortalExit = function() {
        window.location.assign(`${window.productionRootUrl || window.location.origin}/portal-dashboard.html`);
    };

})();
