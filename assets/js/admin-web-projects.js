
function enforceAdminPageAccess(){
  const key="sb-lrbimrlbskjweynxlgas-auth-token";
  try{
    const raw=localStorage.getItem(key);
    const session=raw?JSON.parse(raw):null;
    const email=String(session?.user?.email||"").toLowerCase();
    const role=session?.user?.user_metadata?.role;
    if(!session?.access_token){ window.location.replace("admin-login.html"); return false; }
    if(role!=="admin" && !email.endsWith("@filings4u.com")){ window.location.replace("client-dashboard.html"); return false; }
    return true;
  }catch(e){ console.error("Admin access verification failed:",e); window.location.replace("admin-login.html"); return false; }
}

function updateAdminPageClock(){ const el=document.getElementById("portal-clock"); if(el) el.textContent=new Date().toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}); }

document.addEventListener("DOMContentLoaded",()=>{ if(!enforceAdminPageAccess()) return; updateAdminPageClock(); setInterval(updateAdminPageClock,1000); });


/**
 * filings4u Platform Architecture
 * Module: admin-split-cockpit-engine.js (Dedicated Web Chat Synchronization)
 */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const recipientSelect = document.getElementById("adminProjectTargetEmail");
  const chatHistoryBox = document.getElementById("adminSprintChatHistoryBox");
  const chatForm = document.getElementById("adminSprintMessageForm");
  const chatInput = document.getElementById("adminSprintInputField");
  const chatSendBtn = document.getElementById("adminSprintSendBtn");
  const projectForm = document.getElementById("adminWebProjectForm");
  const formStatus = document.getElementById("admin-project-form-status");
  const submitBtn = document.getElementById("adminProjectSubmitBtn");

  // Form Field Node Mapping
  const projectTitleInput = document.getElementById("adminProjectTitle");
  const projectTrackingInput = document.getElementById("adminProjectTrackingRef");
  const projectStatusInput = document.getElementById("adminProjectStatusLabel");
  const projectProgressInput = document.getElementById("adminProjectProgressPct");
  const projectStagingInput = document.getElementById("adminProjectStagingUrl");
  const projectActionInput = document.getElementById("adminProjectActionText");

  let activeClientEmail = null;
  let activeChatChannel = null;

  // Establish Supabase Connection Engine
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }

  if (!client) {
    console.error("✕ Core initialization failure: Supabase Engine instance unavailable.");
    return;
  }

  // 1. POPULATE UNIQUE CLIENT RECIPIENT EMAILS BY MULTI-TABLE AGGREGATION
  async function populateClientDropdown() {
    try {
      console.log("📡 [Ingestion Matrix] Compiling dual-source email arrays from orders & dashboard_orders...");
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

  // 2. CONTEXTUAL RE-ROUTING ENGINE: SELECTION ACTION TRIGGERS (Web Chat Ingestion)
  window.switchAdminWorkspaceChatContext = async function() {
    const targetEmail = recipientSelect.value ? recipientSelect.value.trim().toLowerCase() : '';
    
    if (activeChatChannel) {
      console.log(`📴 Unsubscribing from historical channel stream context...`);
      client.removeChannel(activeChatChannel);
      activeChatChannel = null;
    }

    if (!targetEmail) {
      chatHistoryBox.innerHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.8rem; font-style:italic; padding:48px 12px;">Select a target customer profile on the left to activate historical feed streaming logs.</div>`;
      if (chatInput) chatInput.disabled = true;
      if (chatSendBtn) chatSendBtn.disabled = true;
      activeClientEmail = null;
      projectForm.reset();
      return;
    }

    activeClientEmail = targetEmail;
    if (chatInput) chatInput.disabled = false;
    if (chatSendBtn) chatSendBtn.disabled = false;

    // A. Fetch existing project schema configurations to auto-populate form
    try {
      const { data: projectData } = await client
        .from('web_projects')
        .select('*')
        .eq('client_email', activeClientEmail)
        .maybeSingle();

      if (projectData) {
        projectTitleInput.value = projectData.project_title || "";
        projectTrackingInput.value = projectData.tracking_ref || "";
        projectStatusInput.value = projectData.status_label || "";
        projectProgressInput.value = projectData.progress_pct ?? 35;
        projectStagingInput.value = projectData.staging_url || "";
        projectActionInput.value = projectData.action_required_text || "";
      } else {
        projectForm.reset();
        recipientSelect.value = activeClientEmail; // Preserve selection context
      }
    } catch (err) {
      console.warn("⚠️ Non-fatal profile parsing error:", err);
    }

    // B. Query existing chat logs matching active client email context parameters
    try {
      const { data: messages, error: chatQueryError } = await client
        .from('web_projects_chat')
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

    // C. Re-bind subscription channels using standard Supabase naming constraints
    const safeChannelID = `sprint_${activeClientEmail.replace(/[^a-zA-Z0-9]/g, '_')}`.substring(0, 80);
    
    activeChatChannel = client
      .channel(safeChannelID)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'web_projects_chat', 
        filter: `client_email=eq.${activeClientEmail}` 
      }, payload => {
        console.log("✓ [Admin Feed Sync] Real-time message row intercepted:", payload.new);
        const placeholder = chatHistoryBox.querySelector('div[style*="text-align:center"]');
        if (placeholder) chatHistoryBox.innerHTML = "";
        appendSprintMessageRow(payload.new);
      })
      .subscribe((status) => {
        console.log(`📡 [Realtime Pipeline Status]: ${status} for channel ${safeChannelID}`);
      });
  };

  // 3. PERSISTENT REVISIONS AND SPRINT MESSAGE DISPATCH CHANNELS
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeClientEmail || !chatInput.value.trim()) return;

      const outgoingMessageText = chatInput.value.trim();
      chatInput.value = ""; // Immediate UI response optimization

      try {
        const { error: sendError } = await client
          .from('web_projects_chat')
          .insert([{ 
            client_email: activeClientEmail, 
            sender_type: 'admin', 
            message_content: outgoingMessageText 
          }]);

        if (sendError) throw sendError;

        // Dynamic hook into Edge Notification function pipeline built in first step
        fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/web-intakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record: {
              email_address: activeClientEmail,
              sender_type: 'admin',
              message_content: outgoingMessageText
            }
          })
        }).catch(err => console.error("✕ Notification runner error:", err));

      } catch (fault) {
        console.error("✕ Reply dispatch rejected by server database layers:", fault);
      }
    });
  }

  function appendSprintMessageRow(msg) {
    if (!chatHistoryBox) return;
    
    // Prevent duplicated appends from rapid client fires
    const uniqueRowMsgId = `msg-${msg.id}`;
    if (document.getElementById(uniqueRowMsgId)) return;

    const div = document.createElement("div");
    div.id = uniqueRowMsgId;
    const isAdmin = String(msg.sender_type || '').toLowerCase() === 'admin';
    
    div.style.cssText = `background: ${isAdmin ? "#f8fafc" : "#ffffff"}; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 0.78rem; line-height: 1.4; border-left: 3px solid ${isAdmin ? "#0a1f44" : "#10b981"}; margin-top: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.01);`;
    div.innerHTML = `<strong style="color: #0f172a; display: block; font-size: 0.72rem; margin-bottom: 2px;">${isAdmin ? "Desk Note [System Architect]" : "Client Note"}:</strong> ${escapeSprintHtml(msg.message_content)}`;
    
    chatHistoryBox.appendChild(div);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
  }

  // 4. CORE DATA INTERCEPTOR FOR PROJECT SANDBOX FORM SUBMISSIONS
  if (projectForm) {
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const targetEmail = recipientSelect.value;
      const title = projectTitleInput.value.trim();
      const trackingRef = projectTrackingInput.value.trim();
      const statusLabel = projectStatusInput.value.trim();
      const progressPct = parseInt(projectProgressInput.value, 10);
      const stagingUrl = projectStagingInput.value.trim();
      const actionText = projectActionInput.value.trim();

      if (!targetEmail || !title || !stagingUrl) {
        showStatus("✕ Input Validation Mismatch: Missing core required profile fields.", true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing Changes...";
      }

      try {
        const payloadData = {
          client_email: targetEmail,
          project_title: title,
          tracking_ref: trackingRef || "F4U-W3B99",
          status_label: statusLabel || "In Production",
          progress_pct: isNaN(progressPct) ? 35 : progressPct,
          staging_url: stagingUrl,
          action_required_text: actionText || null,
          updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await client
          .from('web_projects')
          .upsert(payloadData, { onConflict: 'client_email' });

        if (upsertError) throw upsertError;

        // Dispatches structural update payload to your edge worker context
        fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/web-intakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record: {
              email_address: targetEmail,
              sender_type: 'admin',
              subject: `Project Updated: ${payloadData.project_title}`,
              description: `Status updated to [${payloadData.status_label}] (${payloadData.progress_pct}% Completed). Preview at: ${payloadData.staging_url}`
            }
          })
        }).catch(err => console.error("✕ Notification runner error:", err));

        showStatus("✓ Success! Web development workspace configurations successfully synchronized.", false);
      } catch (fault) {
        showStatus(`✕ Operation Aborted: ${fault.message}`, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Push Staging Sandbox Updates ➔";
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
    setTimeout(() => {
      formStatus.style.display = "none";
    }, 5000);
  }

  function escapeSprintHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 🏁 INITIALIZATION BOOTSTRAP TRIGGERS
  await populateClientDropdown();
});