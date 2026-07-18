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

    if (!alertForm) return;

    // 🚀 FAIL-SAFE INITIALIZATION BYPASS CHANNEL
    let client = window.supabaseInstance || window.supabaseClient;

    if (!client || typeof client.from !== 'function') {
        const currentLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        
        if (currentLibrary && typeof currentLibrary.createClient === 'function') {
            console.log("🔧 [Admin Alerts] Building fresh database fail-safe connection inline...");
            
            const targetUrl = "https://lrbimrlbskjweynxlgas.supabase.co";
            const targetKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
            
            client = currentLibrary.createClient(targetUrl, targetKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "filings4u_secure_session_token" }
            });

            window.supabaseInstance = client;
            window.supabaseClient = client;
        }
    }

    if (!client || typeof client.from !== 'function') {
        console.warn("⚠️ Alerts Engine Intercept: Target client initialization lagging. Polling system context...");
        setTimeout(initializeAdminNotificationSystem, 150);
        return;
    }

    // 1. POPULATE DROPDOWN FIELD WITH ACTIVE REVENUE ACCOUNT ENTRIES
    try {
        const { data: profileRecords, error: fetchError } = await client
            .from('orders')
            .select('company_name, user_id, email')
            .not('user_id', 'is', null)
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
                        option.value = uid;
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
            alert("Input Verification Error: Please select a corporate user target account profile.");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Broadcast Dispatch...';
        }

        try {
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

            if (feedbackStatus) {
                feedbackStatus.style.cssText = "color: #10b981; font-size: 0.85rem; font-weight: 700; margin-top: 12px; display: block; text-align: left;";
                feedbackStatus.innerHTML = "✓ Notification packet successfully broadcasted inside active client dashboard arrays.";
            }

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
