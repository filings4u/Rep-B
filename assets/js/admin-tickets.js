
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
 * Module: admin-tickets-cockpit-engine.js (Real-Time Supervisor Matrix) 
 * Aligned explicitly with public.after_hours_tickets and public.chat_messages schemas 
 */ 

// 🟢 GLOBAL VARIANCE MATRIX REGISTER (Scoped globally to prevent runtime memory isolation splits) 
let globallyActiveTicketIdKey = null; 
let globallyActiveClientEmailKey = null; 
let globallyActiveClientIdKey = null; 
let liveTicketsSubscriptionChannel = null; 

// Global instances 
let client = null; 
let selectStatus = null; 
let formStatusBanner = null; 

// Scoped globally to prevent ReferenceErrors across external execution contexts 
let queueContainer = null; 
let queueCountPill = null; 
let emptyStateView = null; 
let activeWorkbench = null; 
let labelTicketId = null; 
let labelPriorityPill = null; 
let labelUserEmail = null; 
let labelCompany = null; 
let labelPhone = null; 
let labelSubject = null; 
let textDescription = null; 
let boxAttachment = null; 
let linkAttachmentView = null; 
let windowHistoryChat = null; 
let responseForm = null; 
let submitBtn = null; 

// Safe visual markup input strings XSS sanitation helper utility function 
function escapeAdminHtml(str) { 
  if (!str) return ""; 
  return String(str) 
    .replace(/&/g, "&amp;") 
    .replace(/</g, "&lt;") 
    .replace(/>/g, "&gt;") 
    .replace(/"/g, "&quot;") 
    .replace(/'/g, "&#x27;"); 
} 

// 🟢 FIXED: Added 'async' modifier keyword to the DOM wrapper layout signature 
document.addEventListener("DOMContentLoaded", async () => { 
  "use strict"; 

  // Initializing elements globally without blocking them inside local block scopes 
  queueContainer = document.getElementById("adminTicketQueueContainerList"); 
  queueCountPill = document.getElementById("ticketQueueCountPill"); 
  emptyStateView = document.getElementById("adminTicketEmptyStateView"); 
  activeWorkbench = document.getElementById("adminTicketActiveWorkbench"); 
  labelTicketId = document.getElementById("workbenchTicketIdLabel"); 
  labelPriorityPill = document.getElementById("workbenchPriorityPill"); 
  labelUserEmail = document.getElementById("workbenchUserEmailLabel"); 
  labelCompany = document.getElementById("workbenchCompanyLabel"); 
  labelPhone = document.getElementById("workbenchPhoneLabel"); 
  labelSubject = document.getElementById("workbenchSubjectLabel"); 
  textDescription = document.getElementById("workbenchDescriptionText"); 
  boxAttachment = document.getElementById("workbenchAttachmentSectionBox"); 
  linkAttachmentView = document.getElementById("workbenchAttachmentViewLink"); 
  windowHistoryChat = document.getElementById("workbenchChatRepliesHistoryWindow"); 
  responseForm = document.getElementById("adminTicketDispatchForm"); 
  submitBtn = document.getElementById("adminTicketSubmitBtn"); 
  selectStatus = document.getElementById("workbenchStatusSelect"); 
  formStatusBanner = document.getElementById("workbench-form-status-banner"); 

  // Establish Supabase Connection Handshake 
  client = window.supabaseInstance || window.supabaseClient; 
  if (!client && typeof supabase !== 'undefined') { 
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"); 
  } 
  if (!client) return; 

  // --- 1. FETCH AND RENDER RECENT USER TICKETS QUEUES (WITH SESSION GUARDS) --- 
  window.reloadSupportQueueLedgerList = async function() { 
    try { 
      console.log("📡 [Ticket Engine] Confirming session token authenticity before rehydration..."); 
      
      const { data: { session }, error: authError } = await client.auth.getSession(); 
      if (authError || !session) { 
        console.error("✕ Session Invalid: Admin operator authentication token missing."); 
        if (queueContainer) { 
          queueContainer.innerHTML = `<div style="text-align:center; color:#ef4444; font-size:0.85rem; padding:48px 12px; font-weight:700;">✕ Access Locked: Please re-authenticate your admin session.</div>`; 
        } 
        return; 
      } 

      console.log("📡 [Ticket Engine] Extracting offline payloads with cross-profile structural joins..."); 
      const { data: tickets, error } = await client 
        .from('after_hours_tickets') 
        .select(` 
          ticket_id, 
          id, 
          ticket_message, 
          status, 
          created_at, 
          client_profiles ( 
            first_name, 
            last_name, 
            email_address, 
            company_name, 
            phone_number 
          ) 
        `) 
        .order('created_at', { ascending: false }); 

      if (error) throw error; 

      if (queueCountPill) { 
        queueCountPill.textContent = `${tickets ? tickets.length : 0} Tickets`; 
      } 

      if (!tickets || tickets.length === 0) { 
        if (queueContainer) { 
          queueContainer.innerHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.85rem; padding:48px 12px; font-style:italic;">No active intake help tickets documented.</div>`; 
        } 
        return; 
      } 

      queueContainer.innerHTML = ""; 
      tickets.forEach(ticket => { 
        const profile = ticket.client_profiles || {}; 
        const clientEmail = profile.email_address || "unknown@client.com"; 
        const isSelected = ticket.ticket_id === globallyActiveTicketIdKey; 
        const isPending = String(ticket.status).toLowerCase() === 'pending'; 
        const itemRow = document.createElement("div"); 
        
        itemRow.style.cssText = `padding: 14px; border: 1px solid ${isSelected ? "#0a1f44" : "#e2e8f0"}; background: ${isSelected ? "#f8fafc" : "#ffffff"}; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.01); transition: all 0.2s; border-left: 4px solid ${isPending ? "#ef4444" : "#cbd5e1"};`; 

        let cleanDisplayName = "Valued Member"; 
        if (profile.first_name || profile.last_name) { 
          cleanDisplayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim(); 
        } else if (clientEmail) { 
          cleanDisplayName = clientEmail.split('@')[0]; 
        } 

        let textPreview = ticket.ticket_message || "No text content."; 
        if (textPreview.length > 40) { 
          textPreview = textPreview.substring(0, 37) + "..."; 
        } 

        itemRow.innerHTML = ` 
          <div style="display:flex; justify-content:space-between; align-items:center;"> 
            <strong style="font-family:monospace; font-size:0.75rem; color:#64748b;">🆔 #${String(ticket.ticket_id).substring(0, 8).toUpperCase()}</strong> 
            <span style="font-size:10px; background:${isPending ? '#fef3c7' : '#d1fae5'}; color:${isPending ? '#92400e' : '#065f46'}; padding:2px 6px; border-radius:4px; font-weight:700;">${ticket.status || 'Pending'}</span> 
          </div> 
          <div style="font-size:0.8rem; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">👤 ${escapeAdminHtml(cleanDisplayName)}</div> 
          <div style="font-size:0.72rem; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-style:italic;">"${escapeAdminHtml(textPreview)}"</div> 
          <div style="font-size:0.68rem; color:#94a3b8; margin-top:2px;">✉️ ${escapeAdminHtml(clientEmail)}</div> 
        `; 

        itemRow.addEventListener("click", () => { 
          if (typeof window.activateTicketWorkspaceWorkbench === "function") { 
            window.activateTicketWorkspaceWorkbench(ticket); 
          } 
        }); 
        queueContainer.appendChild(itemRow); 
      }); 
    } catch (fault) { 
      console.error("✕ Queue rehydration crashed:", fault.message); 
    } 
  }; 

  // 🟢 FIXED: This root call now compiles safely because the outer function context has the 'async' header parameter
  await window.reloadSupportQueueLedgerList();


  // 🎯 FIXED: Safely attach the submit event handler to the globally initialised response form variable
  if (responseForm) {
    responseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!globallyActiveClientEmailKey) {
        if (typeof showWorkbenchBanner === "function") {
          showWorkbenchBanner("✕ Active target client customer email context tracking data is missing.", true);
        }
        return;
      }

      const replyInput = document.getElementById("adminWorkbenchReplyBody");
      const notesInput = document.getElementById("adminWorkbenchInternalNotes");
      
      const replyContent = replyInput?.value.trim();
      const internalNotes = notesInput ? notesInput.value.trim() : "";

      if (!replyContent) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Transmitting Reply Content... 📡";
      }

      try {
        console.log("🚀 [Ticket Engine] Dispatching operator answer straight into the unified admin pipeline...");
        
        // Dynamically track whether we are responding to an after-hours ticket or a live conversation thread
        const targetTicketReference = globallyActiveTicketIdKey || "chat_session";

        // 🟢 FIXED: Routes clean data parameters through the updated admin_tickets ledger table to fire triggers
        const { error: dispatchError } = await client
          .from('admin_tickets')
          .insert([{
            ticket_id: String(targetTicketReference),
            client_email: globallyActiveClientEmailKey.toLowerCase().trim(),
            admin_responder: 'Desk [Admin Operator]',
            reply_content: replyContent,
            internal_notes: internalNotes || null
          }]);

        if (dispatchError) throw dispatchError;

        // Auto-advance ticket status visually out of Pending locally if clicked
        if (selectStatus && selectStatus.value === "Pending") {
          selectStatus.value = "Resolved";
        }

        if (typeof showWorkbenchBanner === "function") {
          showWorkbenchBanner("✓ Success! Feedback response routed live and portal alerts updated successfully.", false);
        }

        if (replyInput) replyInput.value = "";
        if (notesInput) notesInput.value = "";

        if (typeof fetchHistoricalChatRepliesStream === "function") {
          await fetchHistoricalChatRepliesStream();
        }
        
        await window.reloadSupportQueueLedgerList();

      } catch (fault) {
        console.error("✕ Output submission rejected:", fault.message);
        if (typeof showWorkbenchBanner === "function") {
          showWorkbenchBanner(`✕ Transmission Failure: ${fault.message}`, true);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Dispatch Response & Sync Ledger ➔";
        }
      }
    });
  }

   // --- 2. ACTIVATE INTEGRATED WORKBENCH FOR SELECTED AFTER-HOURS TICKET ---
  window.activateTicketWorkspaceWorkbench = async function(ticket) {
    if (!ticket) return;

    // Safely resolve nested client profile parameters mapping from our backend SQL join structure
    const profile = ticket.client_profiles || {};

    // Synchronize current workbench global path identifiers
    globallyActiveTicketIdKey = ticket.ticket_id;
    globallyActiveClientEmailKey = String(profile.email_address || '').trim().toLowerCase();
    globallyActiveClientIdKey = ticket.id; 

    // Hide empty state placeholder card and unroll workbench controls layout
    if (emptyStateView) emptyStateView.style.display = "none";
    if (activeWorkbench) activeWorkbench.style.setProperty("display", "block", "important");

    // Unfold table row values straight into layout canvas display text elements
    if (labelTicketId) labelTicketId.textContent = `#${String(ticket.ticket_id).substring(0, 8).toUpperCase()}`;
    if (labelUserEmail) labelUserEmail.textContent = globallyActiveClientEmailKey;
    if (labelPhone) labelPhone.textContent = profile.phone_number || "Not Provided";
    if (labelCompany) labelCompany.textContent = profile.company_name || "Not Specified";
    if (selectStatus) selectStatus.value = ticket.status || "Pending";

    if (labelSubject) labelSubject.textContent = "After-Hours Support Request Inbound";
    if (textDescription) textDescription.textContent = ticket.ticket_message || "No text content provided.";

    // Converted priority indicators to handle your ticket table's "status" metrics natively
    if (labelPriorityPill) {
      const isPending = String(ticket.status).toLowerCase() === 'pending';
      labelPriorityPill.textContent = isPending ? "Action Required" : "Archived";
      labelPriorityPill.style.background = isPending ? "#fee2e2" : "#d1fae5";
      labelPriorityPill.style.color = isPending ? "#b91c1c" : "#065f46";
    }

    // ATTACHMENT FIX: Handles attached file URLs natively matching your schema column signatures
    if (ticket.attached_file_url) {
      if (boxAttachment) boxAttachment.style.setProperty("display", "flex", "important");
      if (linkAttachmentView) {
        linkAttachmentView.setAttribute("href", "javascript:void(0);");
        linkAttachmentView.onclick = (e) => {
          e.preventDefault();
          let cleanViewerUrl = String(ticket.attached_file_url).trim();
          if (!cleanViewerUrl.includes('?')) {
            cleanViewerUrl += `?t=${Date.now()}`;
          } else {
            cleanViewerUrl += `&t=${Date.now()}`;
          }
          
          if (typeof window.openAdminAttachmentModalWindow === "function") {
            window.openAdminAttachmentModalWindow(cleanViewerUrl);
          } else {
            window.open(cleanViewerUrl, '_blank');
          }
        };
      }
    } else {
      if (boxAttachment) boxAttachment.style.setProperty("display", "none", "important");
    }

    // Refresh active list state highlights locally and stream associated conversation items
    if (typeof window.fetchHistoricalChatRepliesStream === "function") {
      await window.fetchHistoricalChatRepliesStream();
    }
  };

  // --- 3. FETCH HISTORICAL ADMIN DISPATCH CHAT CHAINS FOR WORKBENCH ---
  window.fetchHistoricalChatRepliesStream = async function() {
    if (!globallyActiveClientIdKey || !windowHistoryChat) return;
    
    try {
      console.log(`📡 [Ticket Engine] Fetching database message timeline trace for client UUID: [${globallyActiveClientIdKey}]`);
      
      const { data: replies, error } = await client
        .from('chat_messages')
        .select('*')
        .eq('id', globallyActiveClientIdKey)
        .order('created_at', { ascending: true });

      if (error) throw error;

      windowHistoryChat.innerHTML = "";

      if (!replies || replies.length === 0) {
        windowHistoryChat.innerHTML = `<div style="text-align:center; color:#94a3b8; font-size:0.75rem; padding:12px; font-style:italic;">No corporate communications or layout replies documented on this file track yet.</div>`;
        return;
      }

      replies.forEach(reply => {
        const isClient = String(reply.sender_type).toLowerCase() === 'client';
        const div = document.createElement("div");
        div.style.cssText = `background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 0.78rem; line-height: 1.45; border-left: 3px solid ${isClient ? "#10b981" : "#0a1f44"}; margin-bottom: 8px;`;
        
        const timestamp = reply.created_at ? new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const senderLabel = isClient ? "Inbound Client" : `Desk [Admin Operator]`;

        let attachmentMarkup = "";
        if (reply.attached_file_url) {
          const bucket = reply.attached_file_url.includes('chat_attachments') ? 'chat_attachments' : 'chat_documents';
          const publicUrl = `${client.storage.from(bucket).getPublicUrl(reply.attached_file_url).data.publicUrl}`;
          
          if (bucket === 'chat_attachments') {
            attachmentMarkup = `<div style="margin-top:8px;"><img src="${publicUrl}" alt="Attachment" style="max-width:100%; max-height:150px; border-radius:6px; border:1px solid #cbd5e1; display:block;"/></div>`;
          } else {
            attachmentMarkup = `<div style="margin-top:6px;"><a href="${publicUrl}" target="_blank" style="color:#0284c7; text-decoration:underline; font-weight:500; font-size:0.72rem;">📎 View Uploaded Document</a></div>`;
          }
        }

        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.7rem; font-weight:700; color:#475569;">
            <span>${senderLabel}</span>
            <span style="font-family:monospace; font-weight:normal; color:#94a3b8;">${timestamp}</span>
          </div>
          <p style="margin:0; color:#1e293b; white-space:pre-wrap;">${escapeAdminHtml(reply.message_content)}</p>
          ${attachmentMarkup}
        `;
        
        windowHistoryChat.appendChild(div);
      });

      windowHistoryChat.scrollTop = windowHistoryChat.scrollHeight;
      
    } catch (err) {
      console.error("✕ Reply logs fetch exception:", err.message);
    }
  };


  // --- 4. CORRECTED DISPATCH SUBMISSION STRAT (Unified Table Target Fix) ---
  if (responseForm) {
    responseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Verify active workspace tracking parameters before writing payload parameters
      if (!globallyActiveClientEmailKey) {
        if (typeof window.showWorkbenchBanner === "function") {
          window.showWorkbenchBanner("✕ Unlocked Target Context Break: Client customer email context is empty.", true);
        }
        return;
      }

      const replyInput = document.getElementById("adminWorkbenchReplyBody");
      const notesInput = document.getElementById("adminWorkbenchInternalNotes");
      const replyContent = replyInput?.value.trim();
      const internalNotes = notesInput ? notesInput.value.trim() : "";

      if (!replyContent) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Transmitting Reply Content... 📡";
      }

      try {
        console.log("🚀 [Ticket Engine] Passing layout parameters through unified admin pipeline...");
        
        // We pass the ticket_id or user tracking data safely into our target table schema
        const targetTicketReference = globallyActiveTicketIdKey || "chat_session";

        const { error: dispatchError } = await client
          .from('admin_tickets')
          .insert([{
            ticket_id: String(targetTicketReference),
            client_email: globallyActiveClientEmailKey.toLowerCase().trim(),
            admin_responder: 'Desk [Admin Operator]',
            reply_content: replyContent,
            internal_notes: internalNotes || null
          }]);

        if (dispatchError) throw dispatchError;

        if (typeof window.showWorkbenchBanner === "function") {
          window.showWorkbenchBanner("✓ Success! Feedback response routed live and target statuses updated successfully.", false);
        }

        if (replyInput) replyInput.value = "";
        if (notesInput) notesInput.value = "";

        if (typeof window.fetchHistoricalChatRepliesStream === "function") {
          await window.fetchHistoricalChatRepliesStream();
        }
        
        if (typeof window.reloadSupportQueueLedgerList === "function") {
          await window.reloadSupportQueueLedgerList();
        }

      } catch (fault) {
        console.error("✕ Output submission rejected:", fault.message);
        if (typeof window.showWorkbenchBanner === "function") {
          window.showWorkbenchBanner(`✕ Transmission Failure: ${fault.message}`, true);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Dispatch Response & Sync Ledger ➔";
        }
      }
    });
  }

   // Keep track of active banner timers globally to prevent UI hide races
  window.bannerTimerInstance = null;
  // Prevent real-time echo loop races during local user updates
  window.isLocallyUpdatingStatus = false;

  // --- 5. UPDATE TICKET OPERATIONS LABELS STATUS ON WORKBENCH SELECTION SHIFTS ---
  window.updateActiveTicketStatusFromWorkbench = async function() {
    if (!globallyActiveTicketIdKey || !selectStatus) return;
    const nextStatusValue = selectStatus.value;

    try {
      window.isLocallyUpdatingStatus = true; 
      console.log(`💾 [Ticket Engine] Modifying operational state metadata to: [${nextStatusValue}]`);

      const { error: updateError } = await client
        .from('after_hours_tickets')
        .update({ status: nextStatusValue })
        .eq('ticket_id', globallyActiveTicketIdKey);

      if (updateError) throw updateError;

      if (typeof window.showWorkbenchBanner === "function") {
        window.showWorkbenchBanner(`✓ Case metrics updated to: [${nextStatusValue}]`, false);
      }
      
      await window.reloadSupportQueueLedgerList();

    } catch (err) {
      console.error("✕ Ticket status shift rejected:", err.message);
      if (typeof window.showWorkbenchBanner === "function") {
        window.showWorkbenchBanner(`✕ Status Lock Aborted: ${err.message}`, true);
      }
    } finally {
      window.isLocallyUpdatingStatus = false; 
    }
  };

  // Utility Banner Controller Matrix Lookups
  window.showWorkbenchBanner = function(text, isError) {
    if (!formStatusBanner) return;
    if (window.bannerTimerInstance) clearTimeout(window.bannerTimerInstance);

    formStatusBanner.textContent = text;
    formStatusBanner.style.display = "block";
    formStatusBanner.style.background = isError ? "#fee2e2" : "#ecfdf5";
    formStatusBanner.style.color = isError ? "#991b1b" : "#047857";

    window.bannerTimerInstance = setTimeout(() => {
      formStatusBanner.style.display = "none";
      window.bannerTimerInstance = null;
    }, 5000);
  };

  // --- 6. SETUP SYSTEM LIVE LIFECYCLE LISTENERS BROADCAST INTERCEPTORS ---
  window.bindLiveHelpDeskRealtimeChannels = async function() {
    if (liveTicketsSubscriptionChannel) {
      await liveTicketsSubscriptionChannel.unsubscribe();
    }
    
    console.log("📡 [Ticket Engine] Mounting real-time postgres changes channel adapters...");
    
    liveTicketsSubscriptionChannel = client
      .channel('admin-global-help-desk-matrix-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'after_hours_tickets' }, async payload => {
        console.log("✓ [Desk Live Queue] Structural intake modification intercepted:", payload);
        if (window.isLocallyUpdatingStatus) return;
        
        await window.reloadSupportQueueLedgerList();
        
        if (globallyActiveTicketIdKey && payload.new && payload.new.ticket_id === globallyActiveTicketIdKey) {
          if (selectStatus) selectStatus.value = payload.new.status || "Pending";
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async payload => {
        if (!globallyActiveClientIdKey || !payload.new || !payload.new.id) return;
        
        if (String(payload.new.id).trim().toLowerCase() === String(globallyActiveClientIdKey).trim().toLowerCase()) {
          await window.fetchHistoricalChatRepliesStream();
        }
      })
      .subscribe();
  };


   // --- MODAL OVERLAY LIGHTBOX METRIC FUNCTIONS CONTROLLER ---
  const attachmentModal = document.getElementById("adminAttachmentPreviewModal");
  const modalIframeTarget = document.getElementById("modalAttachmentIframeCanvasTarget");

  window.openAdminAttachmentModalWindow = function(targetAssetUrl) {
    if (!attachmentModal || !modalIframeTarget) return;
    modalIframeTarget.setAttribute("src", targetAssetUrl);
    attachmentModal.dataset.activeAssetUrl = targetAssetUrl;
    attachmentModal.style.setProperty("display", "flex", "important");
    document.body.style.overflow = "hidden";
  };

  window.closeAdminAttachmentModalWindow = function() {
    if (!attachmentModal || !modalIframeTarget) return;
    attachmentModal.style.setProperty("display", "none", "important");
    modalIframeTarget.setAttribute("src", "about:blank");
    attachmentModal.removeAttribute('data-active-asset-url');
    document.body.style.overflow = "";
  };

  window.triggerSecureAttachmentDownload = async function() {
    const targetUrl = attachmentModal.dataset.activeAssetUrl;
    if (!targetUrl || targetUrl === "about:blank") return;
    
    try {
      const rawEndSegment = targetUrl.split('/').pop() || 'compliance-evidence';
      const filename = rawEndSegment.split('?')[0]; 
      
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const hiddenAnchor = document.createElement('a');
      hiddenAnchor.style.display = 'none';
      hiddenAnchor.href = blobUrl;
      hiddenAnchor.download = filename;
      
      document.body.appendChild(hiddenAnchor);
      hiddenAnchor.click();
      
      window.URL.revokeObjectURL(blobUrl);
      hiddenAnchor.remove();
    } catch (error) {
      console.error("✕ Document download initialization failed:", error);
      window.open(targetUrl, '_blank');
    }
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && attachmentModal && attachmentModal.style.display === "flex") {
      window.closeAdminAttachmentModalWindow();
    }
  });

  // 🏁 BOOTSTRAP INITIAL WORKSPACE MATRIX INITIALIZATION RUNTIME QUEUES
  try {
    await window.reloadSupportQueueLedgerList();
    if (typeof window.bindLiveHelpDeskRealtimeChannels === 'function') {
      await window.bindLiveHelpDeskRealtimeChannels();
    }
  } catch (initError) {
    console.error("✕ Failed initializing HelpDesk workspace:", initError);
  }
});