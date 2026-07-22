/**
 * 📁 FILE PATH: assets/js/admin-push-alerts.js
 * Responsibility: Account profile dropdown serialization and notification dispatch management
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeAlertSystemPipeline();
  });

  async function initializeAlertSystemPipeline() {
    const dropdownSelect = document.getElementById("adminClientDropdown");
    const alertForm      = document.getElementById("adminAlertForm");
    const alertStatusDiv = document.getElementById("alertStatus");

    let client = window.supabaseInstance || window.supabaseClient;
    if (!client || typeof client.from !== 'function') {
      setTimeout(initializeAlertSystemPipeline, 200);
      return;
    }

    // ============================================================================ //
    // 👥 STAGE 1: READ ACTIVE EMAILS AND HYDRATE ACCOUNT SELECTION INPUTS          //
    // ============================================================================ //
    try {
      const { data: profileMatrix, error: fetchError } = await client
        .from('orders')
        .select('email')
        .order('email', { ascending: true });

      if (fetchError) throw fetchError;

      if (dropdownSelect && profileMatrix) {
        dropdownSelect.innerHTML = `<option value="">-- Choose Target Account Profile --</option>`;
        
        // Extract distinct non-nullable user email arrays
        const cleanDistinctEmails = [...new Set(profileMatrix.map(row => row.email).filter(Boolean))];
        
        cleanDistinctEmails.forEach(userEmailString => {
          const optElement = document.createElement("option");
          optElement.value = userEmailString;
          optElement.textContent = userEmailString;
          dropdownSelect.appendChild(optElement);
        });
      }
    } catch (hydrateErr) {
      console.error("✕ Dropdown Population Exception Intercepted:", hydrateErr.message);
    }

    // ============================================================================ //
    // 🚀 STAGE 2: PROCESS FORM SUBMISSIONS & SAVE SYSTEM ALERT NOTICES             //
    // ============================================================================ //
    if (!alertForm) return;

    alertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!dropdownSelect || !alertStatusDiv) return;

      const targetAccountEmail = dropdownSelect.value;
      const notificationTitle  = document.getElementById("alertTitle")?.value || "";
      const notificationBody   = document.getElementById("alertMessage")?.value || "";

      // Basic input sanitation checks
      if (!targetAccountEmail || !notificationTitle || !notificationBody) {
        alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = "✕ Validation Error: All fields are required.";
        return;
      }

      alertStatusDiv.style.cssText = "color: var(--text-dark); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
      alertStatusDiv.textContent = "Processing dispatch matrix hooks...";

      try {
        // Appends custom alerts into your notifications table
        const { error: insertError } = await client
          .from('notifications')
          .insert([
            {
              recipient_email: targetAccountEmail,
              title: notificationTitle,
              message: notificationBody,
              is_unread: true,
              created_at: new Date().toISOString()
            }
          ]);

        if (insertError) throw insertError;

        alertStatusDiv.style.cssText = "color: var(--emerald); font-size: 0.8rem; margin-top: 10px; font-weight: 700;";
        alertStatusDiv.textContent = "✓ Real-Time Alert Pushed Successfully!";
        alertForm.reset();

      } catch (postFault) {
        console.error("✕ Notification Dispatch Interruption:", postFault.message);
        alertStatusDiv.style.cssText = "color: var(--staff-red); font-size: 0.8rem; margin-top: 10px; font-weight: 600;";
        alertStatusDiv.textContent = `✕ Dispatch Failed: ${postFault.message}`;
      }
    });
  }
})();
