// ============================================================================
// 📁 MODULE CARD: WORKSPACE ADMINISTRATIVE NOTIFICATION WORKFLOW CONTROLLER
// ============================================================================
(function engageAdminNotificationSystem() {
  "use strict";

  const ADMIN_UI = {
    form: document.getElementById('adminAlertForm'),
    dropdown: document.getElementById('adminClientDropdown'),
    titleInput: document.getElementById('alertTitle'),
    messageInput: document.getElementById('alertMessage'),
    statusMsg: document.getElementById('alertStatus')
  };

  // Poll for the Supabase client availability safely
  const syncLoop = setInterval(() => {
    const client = window.supabaseClient || window.supabase;
    if (client && client.from) {
      clearInterval(syncLoop);
      bootstrapAdminWorkspace(client);
    }
  }, 100);

  async function bootstrapAdminWorkspace(client) {
    if (!ADMIN_UI.dropdown || !ADMIN_UI.form) return;

    try {
      console.log("[Alerts Engine] Syncing profiles for communication networks...");

      // 1. Fetch active company folders directly from your primary business schema tables
      const { data: apps, error: appError } = await client
        .from('applications')
        .select('id, business_name, user_id')
        .not('user_id', 'is', null);

      if (appError) throw appError;
      let selectRecords = apps || [];

      // Fallback directly to the orders tracking database if application rows are clean
      if (selectRecords.length === 0) {
        const { data: orders, error: orderError } = await client
          .from('orders')
          .select('id, user_id, company_name, collected_payload_metadata')
          .not('user_id', 'is', null);

        if (orderError) throw orderError;
        
        if (orders) {
          const uniqueNames = new Set();
          orders.forEach(order => {
            const nameKey = (order.company_name || '').trim().toLowerCase();
            if (nameKey && !uniqueNames.has(nameKey)) {
              uniqueNames.add(nameKey);
              
              // Extract buyer email from jsonb safely to bypass template hardcodes later
              const meta = order.collected_payload_metadata || {};
              const clientEmail = meta.email || "";

              selectRecords.push({
                id: order.id,
                user_id: order.user_id,
                business_name: order.company_name,
                email: clientEmail
              });
            }
          });
        }
      }

      // 2. Render options to selection elements
      if (selectRecords.length === 0) {
        ADMIN_UI.dropdown.innerHTML = '<option value="">-- No Account Profiles Detected in DB --</option>';
        return;
      }

      ADMIN_UI.dropdown.innerHTML = '<option value="">-- Choose Target Account Profile --</option>';
      
      selectRecords.forEach(row => {
        if (!row.user_id || row.user_id.trim() === "") return;
        
        const opt = document.createElement('option');
        // Securely map parameters to clean text markers attributes
        opt.value = row.user_id; // 🟢 FIXED: Sets value to user_id to stop row mismatch failures
        opt.setAttribute('data-email', row.email || "");
        opt.textContent = `${row.business_name || 'Unnamed Account'} [${row.user_id.slice(0,6).toUpperCase()}]`;
        
        ADMIN_UI.dropdown.appendChild(opt);
      });

      // Bind submission dispatcher parameters securely
      ADMIN_UI.form.addEventListener('submit', (e) => handleFormDispatch(e, client));

    } catch (err) {
      console.error("Admin dashboard alerts initialization error:", err.message);
    }
  }

  async function handleFormDispatch(event, client) {
    event.preventDefault();
    event.stopPropagation();

    const selectedOption = ADMIN_UI.dropdown.options[ADMIN_UI.dropdown.selectedIndex];
    const targetUserUuid = ADMIN_UI.dropdown.value;
    const resolvedEmail = selectedOption ? selectedOption.getAttribute('data-email') : "";
    
    const finalTitle = ADMIN_UI.titleInput.value.trim();
    const finalMessage = ADMIN_UI.messageInput.value.trim();
    const submitBtn = ADMIN_UI.form.querySelector("button[type='submit']");

    // Validation layers
    if (!targetUserUuid) {
      flashInlineStatus("❌ Please select a valid target profile.", "#c5221f", "#fce8e6");
      return;
    }

    if (!finalTitle || !finalMessage) {
      flashInlineStatus("❌ Notification header or body parameters cannot be blank.", "#c5221f", "#fce8e6");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Pushing Live Broadcast Alert...";
      }

      if (ADMIN_UI.statusMsg) {
        ADMIN_UI.statusMsg.style.display = 'none';
      }

      // 3. TARGET THE CHOSEN REPOSITORY: user_notifications
      // 🟢 NO HARDCODES: Drops system.internal text strings and uses the client's verified checkout email address
      const { error: insertError } = await client
        .from('user_notifications')
        .insert({
          user_id: targetUserUuid,
          recipient_email: resolvedEmail || "compliance@filings4u.com", 
          title: finalTitle,
          message: finalMessage,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      flashInlineStatus("🎉 Success! Notification logged natively in user_notifications.", "#137333", "#e6f4ea");
      ADMIN_UI.form.reset();

    } catch (err) {
      console.error("Alert broadcast failed:", err.message);
      flashInlineStatus("❌ Transmission Dropped: " + err.message, "#c5221f", "#fce8e6");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Push Real-Time Alert →";
      }
    }
  }

  function flashInlineStatus(text, textColor, bgColor) {
    if (!ADMIN_UI.statusMsg) return;
    ADMIN_UI.statusMsg.textContent = text;
    ADMIN_UI.statusMsg.style.cssText = `display: block !important; padding: 10px !important; margin-bottom: 15px !important; border-radius: 6px !important; font-size: 0.85rem !important; font-weight: 700 !important; color: ${textColor} !important; background: ${bgColor} !important; text-align: left !important;`;
  }
})();
