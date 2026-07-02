// ============================================================================
// 📁 ALERTS MODULAR COMPONENT: DYNAMIC USER NOTIFICATION MANAGEMENT
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeAdminNotificationSystem();
  });

  async function initializeAdminNotificationSystem() {
    const clientDropdown = document.getElementById("adminClientDropdown");
    const alertForm = document.getElementById("adminAlertForm");
    const feedbackStatus = document.getElementById("alertStatus");

    let supabaseClient = window.supabase || window.supabaseClient || window.sb;
    if (!supabaseClient || !alertForm) return;

    // 1. POPULATE DROPDOWN FIELD WITH PAID ACCOUNT ENTRIES AUTOMATICALLY
    try {
      const { data: profileRecords, error: fetchError } = await supabaseClient
        .from('orders')
        .select('company_name, collected_payload_metadata')
        .order('company_name', { ascending: true });

      if (fetchError) throw fetchError;

      if (clientDropdown) {
        clientDropdown.innerHTML = '<option value="">-- Choose Target Customer Account Profile --</option>';
        
        const registeredTrackersMap = new Set();

        if (profileRecords) {
          profileRecords.forEach(record => {
            const meta = record.collected_payload_metadata || {};
            const email = meta.email;
            
            if (email && !registeredTrackersMap.has(email)) {
              registeredTrackersMap.add(email);
              const option = document.createElement("option");
              option.value = email;
              option.textContent = `${record.company_name} (${email})`;
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

      const chosenEmail = clientDropdown.value;
      const titleValue = document.getElementById("alertTitle").value.trim();
      const messageValue = document.getElementById("alertMessage").value.trim();
      const submitBtn = alertForm.querySelector("button[type='submit']");

      if (!chosenEmail || !titleValue || !messageValue) {
        alert("Input Validation Failed: Please select a client target account and fill out all details.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Broadcasting Notification Alert...';
      }

      try {
        // Prepare data package to push notifications into your central system messaging matrix rows
        const notificationPayload = {
          email: chosenEmail,
          title: titleValue,
          content: messageValue,
          is_unread: true,
          dispatched_at: new Date().toISOString()
        };

        // 🟢 INJECTION PASSTHROUGH: Inserts alert details securely inside your database channels
        const { error: insertNotificationError } = await supabaseClient
          .from('user_notifications') // Uses your active notification log channel table
          .insert([notificationPayload]);

        if (insertNotificationError) throw insertNotificationError;

        if (feedbackStatus) {
          feedbackStatus.style.cssText = "color: var(--emerald); font-size: 0.85rem; font-weight: 700; margin-bottom: 12px; text-align: left;";
          feedbackStatus.innerHTML = "✓ Notification packet successfully broadcasted inside active client dashboard arrays.";
        }

        // Clean text spaces cleanly
        document.getElementById("alertTitle").value = "";
        document.getElementById("alertMessage").value = "";
        clientDropdown.value = "";

      } catch (pushException) {
        console.error("[Fatal Alert Gateway Exception Caught]", pushException);
        if (feedbackStatus) {
          feedbackStatus.style.cssText = "color: #ef4444; font-size: 0.85rem; font-weight: 700; margin-bottom: 12px; text-align: left;";
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
