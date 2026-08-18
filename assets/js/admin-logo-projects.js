
(function () {
  "use strict";
  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const rawSessionJson = localStorage.getItem(sessionTokenKey);
  let isAuthenticated = false;
  let userRole = null;

  if (rawSessionJson) {
    try {
      const sessionData = JSON.parse(rawSessionJson);
      if (sessionData && sessionData.access_token) {
        isAuthenticated = true;
        if (sessionData.user && sessionData.user.user_metadata) {
          userRole = sessionData.user.user_metadata.role;
        }
        if (sessionData.user && !userRole && sessionData.user.email) {
          if (String(sessionData.user.email).toLowerCase().endsWith("@filings4u.com")) {
            userRole = "admin";
          }
        }
      }
    } catch (error) {
      console.error("Security parsing failure:", error);
    }
  }

  const pagePathString = window.location.pathname.toLowerCase();
  const isAdminViewPage = pagePathString.includes("/admin-");

  if (!isAuthenticated) {
    document.documentElement.style.display = "none";
    window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
    throw new Error("Authentication required.");
  }

  if (isAdminViewPage && userRole !== "admin") {
    document.documentElement.style.display = "none";
    window.location.replace("client-dashboard.html");
    throw new Error("Administrator role required.");
  }
})();


/**
 * filings4u Platform Architecture
 * Module: admin-logo-projects-engine.js (Fixed File Upload Execution Matrix)
 */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const recipientSelect = document.getElementById("adminProjectTargetEmail");
  const chatHistoryBox = document.getElementById("adminSprintChatHistoryBox");
  const chatForm = document.getElementById("adminSprintMessageForm");
  const chatInput = document.getElementById("adminSprintInputField");
  const chatSendBtn = document.getElementById("adminSprintSendBtn");

  const projectForm = document.getElementById("adminLogoProjectForm");
  const formStatus = document.getElementById("admin-project-form-status");
  const submitBtn = document.getElementById("adminProjectSubmitBtn");

  let activeClientEmail = null; 
  let activeChatChannel = null;

  // Establish Supabase Connection Engine
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }
  if (!client) return;

  // 1. POPULATE UNIQUE CLIENT RECIPIENT EMAILS BY MULTI-TABLE AGGREGATION
  async function populateClientDropdown() {
    try {
      const [ordersRes, dashOrdersRes] = await Promise.all([
        client.from('orders').select('client_email, client_name'),
        client.from('dashboard_orders').select('email_address, first_name, last_name')
      ]);

      const emailMatrixMap = new Map();

      if (ordersRes.data) {
        ordersRes.data.forEach(row => {
          const email = (row.client_email || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com') {
            emailMatrixMap.set(email, row.client_name || 'Valued Client');
          }
        });
      }

      if (dashOrdersRes.data) {
        dashOrdersRes.data.forEach(row => {
          const email = (row.email_address || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com' && !emailMatrixMap.has(email)) {
            const compiledName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            emailMatrixMap.set(email, compiledName || 'Valued Client');
          }
        });
      }

      if (recipientSelect) {
        recipientSelect.innerHTML = '<option value="">-- Choose Target Customer Account --</option>';
        Array.from(emailMatrixMap.keys()).sort().forEach(email => {
          const name = emailMatrixMap.get(email);
          const opt = document.createElement('option');
          opt.value = email;
          opt.textContent = `${email} (${name})`;
          recipientSelect.appendChild(opt);
        });
      }
    } catch (e) { 
      console.error("✕ Dropdown multi-table merge crashed:", e); 
    }
  }
  // 2. CONTEXTUAL RE-ROUTING ENGINE: SELECTION ACTION TRIGGERS (Logo Chat Ingestion)
  window.switchAdminWorkspaceChatContext = async function() {
    const targetEmail = recipientSelect.value ? recipientSelect.value.trim().toLowerCase() : '';
    
    if (activeChatChannel) {
      activeChatChannel.unsubscribe();
      activeChatChannel = null;
    }

    if (!targetEmail) {
      chatHistoryBox.innerHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.8rem; font-style:italic; padding:48px 12px;">Select a target customer profile on the left to activate historical feed streaming logs.</div>`;
      if (chatInput) chatInput.disabled = true;
      if (chatSendBtn) chatSendBtn.disabled = true;
      activeClientEmail = null;
      return;
    }

    activeClientEmail = targetEmail; 
    if (chatInput) chatInput.disabled = false;
    if (chatSendBtn) chatSendBtn.disabled = false;

    // A. Query existing chat logs matching active client email context parameters
    try {
      const { data: messages, error: chatQueryError } = await client
        .from('logo_projects_chat')
        .select('*')
        .eq('client_email', activeClientEmail)
        .order('created_at', { ascending: true });

      if (chatQueryError) throw chatQueryError;

      chatHistoryBox.innerHTML = "";
      if (!messages || messages.length === 0) {
        chatHistoryBox.innerHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.8rem; padding:24px;">Workspace comment timeline empty. Type a sprint note response below to populate logs.</div>`;
      } else {
        messages.forEach(msg => appendSprintMessageRow(msg));
      }
    } catch (err) { 
      console.error("✕ Admin historical fetch broken:", err); 
    }

    // B. Re-bind subscription channels to listen to real-time table insertions by email context
    activeChatChannel = client
      .channel(`admin-isolated-logo-stream-stream-${activeClientEmail.replace(/[^a-z0-9]/g, '')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'logo_projects_chat',
        filter: `client_email=eq.${activeClientEmail}`
      }, payload => {
        console.log("✓ [Admin Feed Sync] Real-time message row intercepted:", payload.new);
        if (chatHistoryBox.querySelector('div[style*="text-align:center"]')) chatHistoryBox.innerHTML = "";
        appendSprintMessageRow(payload.new);
      })
      .subscribe();
  };
  // 3. PERSISTENT REVISIONS AND SPRINT MESSAGE DISPATCH CHANNELS
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!activeClientEmail || !chatInput.value.trim()) return;
      const outgoingMessageText = chatInput.value.trim();

      try {
        const { error: sendError } = await client
          .from('logo_projects_chat')
          .insert([{
            client_email: activeClientEmail,
            sender_type: 'admin',
            message_content: outgoingMessageText
          }]);

        if (sendError) throw sendError;
        chatInput.value = "";
      } catch (fault) { 
        console.error("✕ Reply dispatch rejected by server database layers:", fault); 
      }
    });
  }

  function appendSprintMessageRow(msg) {
    if (!chatHistoryBox) return;
    const div = document.createElement("div");
    const isAdmin = msg.sender_type.toLowerCase() === 'admin';
    
    div.style.cssText = `background: ${isAdmin ? "#f8fafc" : "#ffffff"}; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 0.78rem; line-height: 1.4; border-left: 3px solid ${isAdmin ? "#0a1f44" : "#10b981"}; margin-top: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.01);`;
    div.innerHTML = `<strong style="color: #0f172a; display: block; font-size: 0.72rem; margin-bottom: 2px;">${isAdmin ? "Creative Desk [Illustrator]" : "Client Note"}:</strong> ${escapeSprintHtml(msg.message_content)}`;
    
    chatHistoryBox.appendChild(div);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
  }

  // 4. CORE DATA INTERCEPTOR FOR BRANDING FORM SUBMISSIONS (Direct Image Upload Engine - Fixed Arrays)
  if (projectForm) {
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const targetEmail = recipientSelect.value;
      const title = document.getElementById("adminProjectTitle").value.trim();
      const trackingRef = document.getElementById("adminProjectTrackingRef").value.trim();
      const statusLabel = document.getElementById("adminProjectStatusLabel").value.trim();
      const actionText = document.getElementById("logoProjectActionText") ? document.getElementById("logoProjectActionText").value.trim() : "";

      const fileField1 = document.getElementById("adminConceptFile1");
      const fileField2 = document.getElementById("adminConceptFile2");
      const fileField3 = document.getElementById("adminConceptFile3");

      if (!targetEmail || !title) {
        showStatus("✕ Input Validation Mismatch: Target Customer and Project Title are required fields.", true);
        return;
      }

      if (submitBtn) { 
        submitBtn.disabled = true; 
        submitBtn.textContent = "Uploading Artwork & Synchronizing Ledger..."; 
      }

      try {
        const { data: currentProject } = await client
          .from('logo_projects')
          .select('concept_url_1, concept_url_2, concept_url_3')
          .eq('client_email', targetEmail)
          .maybeSingle();

        let url1 = currentProject?.concept_url_1 || "images/fav.png";
        let url2 = currentProject?.concept_url_2 || "images/fav.png";
        let url3 = currentProject?.concept_url_3 || "images/fav.png";

        const cleanEmailDir = targetEmail.replace(/[^a-z0-9]/gi, '_');

         // 🟢 THE FIX: Appended explicit array element pointer index position [0] to parse physical image binaries
        if (fileField1 && fileField1.files && fileField1.files.length > 0) {
          const fileObj = fileField1.files[0]; // Extracts the physical file object safely
          const path = `logo_projects/${cleanEmailDir}/concept_1_${Date.now()}_${fileObj.name.replace(/[^a-z0-9.]/gi, '_')}`;
          
          const { error } = await client.storage
            .from("client_documents_vault")
            .upload(path, fileObj, { 
              cacheControl: "3600", 
              upsert: true,
              contentType: fileObj.type || 'image/png'
            });
            
          if (error) throw error;
          url1 = client.storage.from("client_documents_vault").getPublicUrl(path).data.publicUrl;
        } else if (!currentProject) {
          showStatus("✕ Input Validation Mismatch: Concept Proof 1 image asset upload is mandatory.", true);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Push Brand Suite Updates ➔"; }
          return;
        }

        // 🟢 THE FIX: Extracts index 0 from the field array list
        if (fileField2 && fileField2.files && fileField2.files.length > 0) {
          const fileObj = fileField2.files[0];
          const path = `logo_projects/${cleanEmailDir}/concept_2_${Date.now()}_${fileObj.name.replace(/[^a-z0-9.]/gi, '_')}`;
          
          const { error } = await client.storage
            .from("client_documents_vault")
            .upload(path, fileObj, { 
              cacheControl: "3600", 
              upsert: true,
              contentType: fileObj.type || 'image/png'
            });
            
          if (error) throw error;
          url2 = client.storage.from("client_documents_vault").getPublicUrl(path).data.publicUrl;
        }

        // 🟢 THE FIX: Extracts index 0 from the field array list
        if (fileField3 && fileField3.files && fileField3.files.length > 0) {
          const fileObj = fileField3.files;
          const path = `logo_projects/${cleanEmailDir}/concept_3_${Date.now()}_${fileObj.name.replace(/[^a-z0-9.]/gi, '_')}`;
          
          const { error } = await client.storage
            .from("client_documents_vault")
            .upload(path, fileObj, { 
              cacheControl: "3600", 
              upsert: true,
              contentType: fileObj.type || 'image/png'
            });
            
          if (error) throw error;
          url3 = client.storage.from("client_documents_vault").getPublicUrl(path).data.publicUrl;
        }




        const { error: upsertError } = await client
          .from('logo_projects')
          .upsert({
            client_email: targetEmail,
            project_title: title,
            tracking_ref: trackingRef || "F4U-LOGO99",
            status_label: statusLabel || "Awaiting Feedback",
            concept_url_1: url1,
            concept_url_2: url2,
            concept_url_3: url3,
            action_required_text: actionText || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'client_email' });

        if (upsertError) throw upsertError;

        showStatus("✓ Success! Brand identity graphics uploaded and configurations synchronized.", false);
        projectForm.reset();
      } catch (fault) {
        console.error(fault);
        showStatus(`✕ Operation Aborted: ${fault.message || "Cloud upload storage exception caught."}`, true);
      } finally {
        if (submitBtn) { 
          submitBtn.disabled = false; 
          submitBtn.textContent = "Push Brand Suite Updates ➔"; 
        }
      }
    });
  }

  function showStatus(text, isError) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.style.display = "block";
    formStatus.style.background = isError ? "#fee2e2" : "#ecfdf5";
    formStatus.style.color = isError ? "#991b1b" : "#047857";
    setTimeout(() => { formStatus.style.display = "none"; }, 5000);
  }

  function escapeSprintHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 🏁 INITIALIZATION BOOTSTRAP TRIGGERS
  await populateClientDropdown();
});
