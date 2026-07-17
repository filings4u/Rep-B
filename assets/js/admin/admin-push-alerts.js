// ============================================================================ //
// 📁 ALERTS MODULAR COMPONENT: DYNAMIC USER NOTIFICATION MANAGEMENT            //
// ============================================================================ //
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        initializeAdminNotificationSystem();
    });

    async function initializeAdminNotificationSystem() {
        const clientDropdown = document.getElementById("adminClientDropdown");
        const alertForm = document.getElementById("adminAlertForm");
        const feedbackStatus = document.getElementById("alertStatus");

        // 🎯 Unified connection lookup maps straight to your live core system connection
        let supabaseClient = window.supabaseInstance || window.supabase || window.supabaseClient || window.sb;

        if (!supabaseClient || typeof supabaseClient.from !== 'function' || !alertForm) {
            console.warn("⚠️ Alerts Engine Intercept: Database transport node offline.");
            return;
        }

        // 1. POPULATE DROPDOWN FIELD WITH ACTIVE REVENUE ACCOUNT ENTRIES
        try {
            const { data: profileRecords, error: fetchError } = await supabaseClient
                .from('orders')
                .select('company_name, user_id, email')
                .not('user_id', 'is', null) // Only fetch valid activated user accounts
                .order('company_name', { ascending: true });

            if (fetchError) throw fetchError;

            if (clientDropdown) {
                clientDropdown.innerHTML = '<option value="">-- Choose Target Customer Account Profile --</option>';
                const registeredTrackersMap = new Set();

                if (profileRecords) {
                    profileRecords.forEach(record => {
                        const email = record.email;
                        const uid = record.user_id;

                        if (uid && !registeredTrackersMap.has(uid)) {
                            registeredTrackersMap.add(uid);
                            const option = document.createElement("option");
                            option.value = uid; // Save the real account User ID string directly to the option field value attribute
                            option.setAttribute('data-email', email || '');
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

        // 2. CORE PUSH MESSAGE HANDLER SUBMISSION PIPELINE
        alertForm.onsubmit = async function(e) {
            e.preventDefault();

            const targetUserId = clientDropdown.value;
            const selectedOption = clientDropdown.options[clientDropdown.selectedIndex];
            const targetUserEmail = selectedOption ? selectedOption.getAttribute('data-email') : '';
            
            const titleValue = document.getElementById("alertTitle").value.trim();
            const messageValue = document.getElementById("alertMessage").value.trim();
            const submitBtn = alertForm.querySelector("button[type='submit']");

            if (!targetUserId || !titleValue || !messageValue) {
                alert("Input Verification Error: Please select a corporate user target account profile and provide content.");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Broadcast Dispatch...';
            }

            try {
                // 🎯 Structure the object layout properties exactly to match your live schema parameters
                const notificationPayload = {
                    user_id: targetUserId, // Target customer user account UUID line link link
                    title: titleValue,
                    message: messageValue,
                    is_read: false,
                    is_archived: false,
                    recipient_email: targetUserEmail || null,
                    created_at: new Date().toISOString()
                };

                // Inserts data cleanly into your verified table structure layout channels
                const { error: insertNotificationError } = await supabaseClient
                    .from('portal_notifications')
                    .insert([notificationPayload]);

                if (insertNotificationError) throw insertNotificationError;

                if (feedbackStatus) {
                    feedbackStatus.style.cssText = "color: #10b981; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block; text-align: left;";
                    feedbackStatus.innerHTML = "✓ Notification packet successfully broadcasted inside active client dashboard arrays.";
                }

                // Clear layout input areas safely
                document.getElementById("alertTitle").value = "";
                document.getElementById("alertMessage").value = "";
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
