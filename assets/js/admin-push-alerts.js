/**
 * 📁 FILE PATH: admin-push-alerts.js
 * Responsibility: Dropdown Client Hydration and Customer Notification Dispatch Panel Matrix
 */
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        initializeAdminNotificationSystem();
    });

    async function initializeAdminNotificationSystem() {
        if (!window.supabaseInstance || typeof window.supabaseInstance.from !== 'function') {
            setTimeout(initializeAdminNotificationSystem, 150);
            return;
        }

        const clientDropdown = document.getElementById("adminClientDropdown");
        const alertForm = document.getElementById("adminAlertForm");
        const feedbackStatus = document.getElementById("alertStatus");

        if (!alertForm) return;
        const client = window.supabaseInstance;

        // 1. POPULATE DROPDOWN FIELD WITH AUTHENTIC USER IDs FROM THE ENTITIES SCHEMA
        try {
            const { data: records, error: fetchError } = await client
                .from('entities')
                .select('entity_name, owner_id')
                .not('owner_id', 'is', null)
                .order('entity_name', { ascending: true });

            if (fetchError) throw fetchError;

            if (clientDropdown) {
                clientDropdown.innerHTML = '<option value="">-- Choose Target Customer Account --</option>';
                const registeredTrackersMap = new Set();

                if (records) {
                    records.forEach(record => {
                        const uid = record.owner_id;
                        // Avoid duplicates if a single user identity owner manages multiple corporate entity entries
                        if (uid && !registeredTrackersMap.has(uid)) {
                            registeredTrackersMap.add(uid);
                            const option = document.createElement("option");
                            option.value = uid;
                            option.textContent = `${record.entity_name || 'Filing Entity'} [${uid.substring(0, 6).toUpperCase()}]`;
                            clientDropdown.appendChild(option);
                        }
                    });
                }
            }
        } catch (dropdownErr) {
            console.warn("Dropdown population pass failed:", dropdownErr);
            if (clientDropdown) clientDropdown.innerHTML = '<option value="">✕ Failed to load system profiles.</option>';
        }

        // 2. DISPATCH LIVE MESSAGE PAYLOADS DOWNSTREAM INTO CUSTOMER DASHBOARDS
        alertForm.onsubmit = async function(e) {
            e.preventDefault();

            const targetUserId = clientDropdown.value;
            const titleField = document.getElementById("alertTitle") || alertForm.querySelector("input[type='text']");
            const messageField = document.getElementById("alertMessage") || alertForm.querySelector("textarea");
            const submitBtn = alertForm.querySelector("button[type='submit']");

            const titleValue = titleField ? titleField.value.trim() : "";
            const messageValue = messageField ? messageField.value.trim() : "";

            if (!targetUserId || !titleValue || !messageValue) {
                alert("Input Verification Error: Please select an active corporate user target account profile and provide message text.");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching Broadcast Payload...';
            }

            try {
                // Exact alignment mapping matching your system public.portal_notifications schema properties
                const notificationPayload = {
                    user_id: targetUserId,
                    title: titleValue,
                    message: messageValue,
                    is_read: false,
                    is_archived: false,
                    created_at: new Date().toISOString()
                };

                const { error: insertNotificationError } = await client
                    .from('portal_notifications')
                    .insert([notificationPayload]);

                if (insertNotificationError) throw insertNotificationError;

                // Fire a fast air-broadcast notification packet over WebSockets if active real-time channels are live
                if (window.realtimeTelemetryChannel) {
                    await window.realtimeTelemetryChannel.send({
                        type: 'broadcast',
                        event: 'pipeline_mutation',
                        payload: { title: titleValue, message: messageValue, timestamp: new Date().toISOString() }
                    });
                }

                if (feedbackStatus) {
                    feedbackStatus.style.cssText = "color: #10b981; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block; text-align: left;";
                    feedbackStatus.innerHTML = "✓ Notification packet successfully broadcasted inside active client dashboard arrays.";
                }

                // Clean input fields safely
                if (titleField) titleField.value = "";
                if (messageField) messageField.value = "";
                clientDropdown.value = "";

            } catch (pushException) {
                console.error("[Fatal Alert Gateway Exception Caught]", pushException);
                if (feedbackStatus) {
                    feedbackStatus.style.cssText = "color: #ef4444; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block; text-align: left;";
                    feedbackStatus.innerHTML = `✕ Transmission Failed: ${pushException.message || pushException}`;
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = "Push Real-Time Alert →";
                }
            }
        };
    }
})();
