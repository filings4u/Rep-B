/**
 * 📁 FILE PATH: assets/js/admin-push-alerts.js
 * Responsibility: Dropdown Hydration and Customer Notification Dispatch Matrix
 */
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        initializeAdminNotificationSystem();
    });

    async function initializeAdminNotificationSystem() {
        if (!window.supabaseInstance || typeof window.supabaseInstance.from !== 'function') {
            setTimeout(initializeAdminNotificationSystem, 200);
            return;
        }

        const clientDropdown = document.getElementById("adminClientDropdown");
        const alertForm = document.getElementById("adminAlertForm");
        const feedbackStatus = document.getElementById("alertStatus");

        if (!alertForm) return;
        const client = window.supabaseInstance;

        // 1. POPULATE DROPDOWN FIELD WITH AUTHENTIC USER IDs FROM YOUR RECORDS
        try {
            const { data: profiles, error: fetchError } = await client
                .from('orders')
                .select('company_name, user_id, email')
                .not('user_id', 'is', null)
                .order('company_name', { ascending: true });

            if (fetchError) throw fetchError;

            if (clientDropdown) {
                clientDropdown.innerHTML = '<option value="">-- Choose Target Customer Account --</option>';
                const registeredTrackersMap = new Set();

                if (profiles) {
                    profiles.forEach(record => {
                        const uid = record.user_id;
                        if (uid && !registeredTrackersMap.has(uid)) {
                            registeredTrackersMap.add(uid);
                            const option = document.createElement("option");
                            option.value = uid;
                            option.setAttribute('data-email', record.email || '');
                            option.textContent = `${record.company_name || 'Filing Entity'} [${uid.substring(0, 6).toUpperCase()}]`;
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
            const selectedOption = clientDropdown.options[clientDropdown.selectedIndex];
            const targetUserEmail = selectedOption ? selectedOption.getAttribute('data-email') : '';
            const titleValue = document.getElementById("alertTitle")?.value || document.querySelector("input[placeholder*='Annual report']").value.trim();
            const messageValue = document.getElementById("alertMessage")?.value || document.querySelector("textarea").value.trim();
            const submitBtn = alertForm.querySelector("button[type='submit']");

            if (!targetUserId || !titleValue || !messageValue) {
                alert("Input Verification Error: Please provide an active title and message body text.");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching Broadcast Payload...';
            }

            try {
                // Exact alignment mapping matching your system schema properties
                const notificationPayload = {
                    user_id: targetUserId,
                    title: titleValue,
                    message: messageValue,
                    is_read: false,
                    is_archived: false,
                    recipient_email: targetUserEmail || null,
                    created_at: new Date().toISOString()
                };

                const { error: insertNotificationError } = await client
                    .from('portal_notifications')
                    .insert([notificationPayload]);

                if (insertNotificationError) throw insertNotificationError;

                // Fire an air-broadcast trigger over WebSockets if active real-time channels are live
                if (window.realtimeTelemetryChannel) {
                    await window.realtimeTelemetryChannel.send({
                        type: 'broadcast',
                        event: 'pipeline_mutation',
                        payload: { title: titleValue, message: messageValue, timestamp: new Date().toISOString() }
                    });
                }

                if (feedbackStatus) {
                    feedbackStatus.style.cssText = "color: #10b981; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block;";
                    feedbackStatus.innerHTML = "✓ Notification packet successfully broadcasted inside active client dashboard arrays.";
                }

                // Reset fields cleanly
                if (document.getElementById("alertTitle")) document.getElementById("alertTitle").value = "";
                if (document.getElementById("alertMessage")) document.getElementById("alertMessage").value = "";
                clientDropdown.value = "";

            } catch (pushException) {
                console.error("[Fatal Alert Gateway Exception Caught]", pushException);
                if (feedbackStatus) {
                    feedbackStatus.style.cssText = "color: #ef4444; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block;";
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
