// ============================================================================
// 📁 MODULE CARD: REAL-TIME NOTIFICATION PACKET DISPATCHER CONTROLLER
// ============================================================================
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeNotificationDispatcherEngine();
  });

  function initializeNotificationDispatcherEngine() {
    const alertForm = document.getElementById('adminAlertForm');
    if (!alertForm) return;

    alertForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Safely link with your Unified Engine's client declarations
      const client = window.supabaseClient || window.supabase || window.masterAdminGatewayClient;
      const statusBox = document.getElementById('alertStatus');
      const submitBtn = e.target.querySelector('button[type="submit"]');

      // 🛡️ PERIMETER GUARD LAYER: Isolate elements securely
      const dropdownMenu = document.getElementById('adminClientDropdown');
      const titleField = document.getElementById('alertTitle');
      const messageField = document.getElementById('alertMessage');

      if (!statusBox || !submitBtn || !dropdownMenu || !titleField || !messageField) {
        console.error("DOM Matrix Error: Essential input nodes missing from active layout map.");
        return;
      }

      // 🛡️ PERIMETER REPAIR MATRIX: Secure check for dropdown index bounds to protect selection states
      if (dropdownMenu.selectedIndex === -1 || !dropdownMenu.options[dropdownMenu.selectedIndex]) {
        statusBox.style.color = "var(--staff-red, #c15254)";
        statusBox.innerText = "Validation Warning: Wait for the client roster to finish loading.";
        return;
      }

      const chosenUserUuid = dropdownMenu.value;
      const noticeTitle = titleField.value.trim();
      const noticeMessage = messageField.value.trim();

      // Prevent submission on placeholder option
      if (!chosenUserUuid) {
        statusBox.style.color = "var(--staff-red, #c15254)";
        statusBox.innerText = "Validation Warning: Please select a target corporate entity.";
        return;
      }

      if (!noticeTitle || !noticeMessage) {
        statusBox.style.color = "var(--staff-red, #c15254)";
        statusBox.innerText = "Validation Warning: Complete all notice parameters fields.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = "Transmitting Wave Packet...";

      try {
        if (!client) throw new Error("Database core driver missing from active memory window context.");

        // 🚀 BACKEND PACKET INSERTION SYNCHRONIZED DIRECTLY TO YOUR user_notifications SCHEMA
        const { error } = await client
          .from('user_notifications')
          .insert({
            user_id: chosenUserUuid,
            title: noticeTitle,
            message: noticeMessage,
            is_read: false
          });

        if (error) throw error;

        // Flash message safely into your Communications Stream monitor box
        const liveCommsBox = document.getElementById("admin-inbox-live-stream-box");
        if (liveCommsBox) {
          const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
          });
          
          // Safe extraction of text node value to prevent runtime layout compilation crashes
          const clientEmailLabel = dropdownMenu.options[dropdownMenu.selectedIndex].text;
          
          // Injects clean html log history line down the dashboard stream
          liveCommsBox.innerHTML = `
            <p style="margin: 0 0 8px 0; color: #10b981; font-size: 0.82rem; line-height: 1.4; text-align: left;">
              <strong>[${currentTime}] Dispatched:</strong> To ${clientEmailLabel} - "${noticeTitle}"
            </p>
          ` + liveCommsBox.innerHTML;
        }

        statusBox.style.color = "var(--emerald, #10b981)";
        statusBox.innerText = "🎉 Broadcast locked! Pushed live to customer screen.";
        alertForm.reset();

      } catch (err) {
        console.error("Alert broadcast failed:", err.message);
        statusBox.style.color = "var(--staff-red, #c15254)";
        statusBox.innerText = `Dispatch Failed: ${err.message}`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Push Real-Time Alert →";
      }
    });
  }
})();
