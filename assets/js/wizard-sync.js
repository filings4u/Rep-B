// assets/js/wizard-sync.js
(async function initializeWizardSynchronizer() {
    "use strict";

    // 🚀 GLOBAL SYNC: Safely align naming schemes with centralized production infrastructure
    function waitForSupabaseClientEngine() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve(window.supabaseClient);
            const trackingInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(trackingInterval);
                    resolve(window.supabaseClient);
                }
            }, 10); // Polling tightened to 10ms to eliminate Cloudflare delivery race cycles
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

                // 🎯 FIXED SYNTAX BUG: Removed rogue 'windows' text string to allow execution flow
                if (typeof window.currentStepIndex !== 'undefined') {
                    window.currentStepIndex = data.current_step;
                    if (typeof window.renderStepContents === 'function') {
                        window.renderStepContents();
                    }
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

            // Build the record payload to match your exact database fields
            const recordPayload = {
                service_key: serviceKey,
                payload_data: finalStepPayload, // Exact target path map
                current_step: parseInt(currentStepIdx) || 1,
                status: 'draft',
                user_id: session.user.id,
                updated_at: new Date().toISOString()
            };

            // 🎯 FIXED PRIMARY KEY CONSTRAINT:
            // Only attach an ID field if we have a valid, pre-existing record ID.
            if (recordDatabaseId) {
                recordPayload.id = recordDatabaseId;
            } else {
                recordPayload.created_at = new Date().toISOString();
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
                console.error("Database persistence stalled:", error ? error.message : "Empty payload returned");
            }
        } catch (err) {
            console.error("Sync cloud task error runtime crash:", err);
        }
    };

    // Final operations for terminal transitions inside order.html checkout window
    window.updateFilingToPaidStatus = async function(stripeInvoiceIdStr, paymentIntentStr, amountPaidNum) {
        if (!recordDatabaseId) return;
        try {
            // 🎯 FIXED: Synchronized directly with your table columns layout metrics
            const { error } = await client
                .from('user_filings_workspace')
                .update({
                    status: 'paid',
                    stripe_invoice_id: stripeInvoiceIdStr || null,
                    stripe_payment_intent: paymentIntentStr || null,
                    amount_paid: parseFloat(amountPaidNum) || 149.00,
                    checkout_completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', recordDatabaseId);

            if (error) throw error;
            console.log("✓ Transaction ledger state switched to PAID.");
        } catch (err) {
            console.error("Failed to update status parameters:", err.message);
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
        const targetBase = window.productionRootUrl || window.location.origin;
        window.location.assign(`${targetBase}/portal-dashboard.html`);
    };

})();