
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


document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const recipientSelect = document.getElementById("adminEntityTargetEmail");
  const entityForm = document.getElementById("adminCorporateEntityForm");
  const formStatusBanner = document.getElementById("admin-entity-form-status-banner");
  const submitBtn = document.getElementById("adminEntitySubmitBtn");
  const resetFormBtn = document.getElementById("adminEntityResetFormBtn");
  const tableRowsQueue = document.getElementById("adminEntitiesQueueContainerRows");
  const formCardTitle = document.getElementById("adminFormCardTitleLabel");

  let liveAdminEntitiesSubscription = null;
  let cachedFilingDocumentUrl = null;

  // 🟢 1. LIVE TICKING DIGITAL CLOCK ENGINEFOR ADMIN BAR
  function initializeAdminEntitiesClock() {
    const clockElement = document.getElementById("portal-entities-clock");
    if (!clockElement) {
      console.warn("⚠️ Clock container element [#portal-entities-clock] not found.");
      return;
    }

    function updateClockTime() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      
      hours = hours % 12;
      hours = hours ? hours : 12; // Normalizes hour '0' directly to '12'

      clockElement.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
    }

    updateClockTime();
    setInterval(updateClockTime, 1000);
    console.log("✓ [Clock Engine] Admin workspace clock attached and ticking.");
  }

  // Fire the clock immediately on launch
  initializeAdminEntitiesClock();

  // Establish Supabase Connection Handshake
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }
  if (!client) return;

  // 🟢 THE FIX: Aggregates client emails using the validated email_address schema columns explicitly
  async function populateClientDropdown() {
    try {
      const [ordersRes, dashOrdersRes] = await Promise.all([
        client.from('orders').select('email_address, first_name, last_name'),
        client.from('dashboard_orders').select('email_address, first_name, last_name')
      ]);

      const emailMatrixMap = new Map();

      if (ordersRes.data) {
        ordersRes.data.forEach(row => {
          const email = (row.email_address || '').trim().toLowerCase();
          if (email && email != 'anonymous@unknown.com') {
            const compiledName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            emailMatrixMap.set(email, compiledName || 'Valued Client');
          }
        });
      }

      if (dashOrdersRes.data) {
        dashOrdersRes.data.forEach(row => {
          const email = (row.email_address || '').trim().toLowerCase();
          if (email && email != 'anonymous@unknown.com' && !emailMatrixMap.has(email)) {
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
      console.error("✕ Dropdown email aggregation crashed:", e);
    }
  }

  // 3. FETCH AND LIVE-RENDER THE COMPREHENSIVE BACK-OFFICE ENTITIES LEDGER
  async function reloadAdminEntitiesLedgerFeed() {
    try {
      const { data: entities, error } = await client
        .from('client_entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!entities || entities.length === 0) {
        tableRowsQueue.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:40px 10px; font-style:italic;">No corporate entity records located in database system.</td></tr>`;
        return;
      }

      tableRowsQueue.innerHTML = "";
      entities.forEach(entity => {
        const tr = document.createElement("tr");
        tr.style.cssText = "border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s;";
        tr.onmouseover = () => tr.style.backgroundColor = "#f8fafc";
        tr.onmouseout = () => tr.style.backgroundColor = "";

        const status = String(entity.standing_status || 'ACTIVE').toUpperCase();
        let badgeBg = "#d1fae5"; let badgeColor = "#065f46";
        if (status.includes('PENDING')) { badgeBg = "#fef3c7"; badgeColor = "#92400e"; }
        else if (status.includes('SUSPENDED') || status.includes('INACTIVE')) { badgeBg = "#fee2e2"; badgeColor = "#991b1b"; }

       // 🟢 REPAIRED MATRIX ROWS: Clean data stream mapping across exactly 4 column layout zones
tr.innerHTML = `
  <td style="padding:12px 10px; font-weight:700; color:#0f172a;">${escapeAdminEntitiesHtml(entity.entity_name)}</td>
  <td style="padding:12px 10px; color:#475569; font-weight:600;">${escapeAdminEntitiesHtml(entity.state_of_formation)}</td>
  <td style="padding:12px 10px; color:#64748b; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${entity.client_email}</td>
  <td style="padding:12px 10px; text-align:right;">
    <span style="background:${badgeBg}; color:${badgeColor}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>
  </td>
`;


        tr.addEventListener("click", () => populateActiveEntityRowIntoWorkspaceFields(entity));
        tableRowsQueue.appendChild(tr);
      });
    } catch (fault) {
      console.error("✕ Failed to compile back-office ledger line nodes:", fault);
    }
  }

  // 4. SELECTION ROUTINE: MAPS RECORD DETAILS STRAIGHT TO WORKSPACE FIELDS FOR REVISIONS
  window.populateActiveEntityRowIntoWorkspaceFields = function(entity) {
    if (!entity) return;

    document.getElementById("adminEntityRowHiddenUuid").value = entity.id;
    if (recipientSelect) recipientSelect.value = entity.client_email;
    document.getElementById("adminEntityLegalName").value = entity.entity_name;
    document.getElementById("adminEntityFilingClass").value = entity.filing_description;
    document.getElementById("adminEntityPlanPrice").value = entity.plan_tier;
    document.getElementById("adminEntityEinNumber").value = entity.ein_number || "";
    document.getElementById("adminEntityStateOrigin").value = entity.state_of_formation;
    document.getElementById("adminEntityStatusSelect").value = entity.standing_status || "ACTIVE";
    document.getElementById("adminEntityFormationDate").value = entity.formation_date || "";

    cachedFilingDocumentUrl = entity.registry_document_url;
    const docLabel = document.getElementById("adminCurrentDocLabelLink");
    if (docLabel && entity.registry_document_url) {
      docLabel.innerHTML = `📄 Current Linked State-Stamped Certificate</a>`;
      docLabel.style.display = "block";
    } else if (docLabel) {
      docLabel.style.display = "none";
    }

    if (formCardTitle) formCardTitle.textContent = "Modify Company Parameters";
    if (submitBtn) submitBtn.textContent = "Update Company Registry ➔";
    if (resetFormBtn) resetFormBtn.style.display = "inline-block";
  };

  // 5. WORKSPACE FORM CLEANUP RESET STATE CONFIGURE
  window.resetAdminEntitiesWorkspaceForm = function() {
    if (entityForm) entityForm.reset();
    document.getElementById("adminEntityRowHiddenUuid").value = "";
    cachedFilingDocumentUrl = null;
    
    const docLabel = document.getElementById("adminCurrentDocLabelLink");
    if (docLabel) docLabel.style.display = "none";

    if (formCardTitle) formCardTitle.textContent = "Establish Company Registry";
    if (submitBtn) submitBtn.textContent = "Commit Company Parameters ➔";
    if (resetFormBtn) resetFormBtn.style.display = "none";
    if (formStatusBanner) formStatusBanner.style.display = "none";
  };

  // 6. INTERCEPT SUBMISSION LAYER, ENGAGE SECURE VAULT PROCESSING & RE-ROUTE DATA
  if (entityForm) {
    entityForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rowId = document.getElementById("adminEntityRowHiddenUuid").value;
      const targetEmail = recipientSelect.value;
      const legalName = document.getElementById("adminEntityLegalName").value.trim();
      const filingClass = document.getElementById("adminEntityFilingClass").value.trim();
      const planPrice = document.getElementById("adminEntityPlanPrice").value.trim();
      const einNum = document.getElementById("adminEntityEinNumber").value.trim();
      const stateOrigin = document.getElementById("adminEntityStateOrigin").value.trim();
      const activeStatus = document.getElementById("adminEntityStatusSelect").value;
      const formationDate = document.getElementById("adminEntityFormationDate").value;
      const fileField = document.getElementById("adminEntityRegistryFileField");

      if (!targetEmail || !legalName || !stateOrigin) {
        showAdminEntitiesBanner("✕ Input Validation Mismatch: Recipient, Name, and State are required entries.", true);
        return;
      }
      const submitBtnText = rowId ? "Update Company Registry ➔" : "Commit Company Parameters ➔";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing Storage & Ledger Layers... 📡";
      }

      try {
        let finalDocumentPublicUrl = cachedFilingDocumentUrl;
        const cleanEmailPath = targetEmail.replace(/[^a-z0-9]/gi, '_');

        if (fileField && fileField.files && fileField.files.length > 0) {
          const fileObj = fileField.files[0];
          const fileExtension = fileObj.name.split('.').pop();
          const storagePath = `state_formations/${cleanEmailPath}/formation_cert_${Date.now()}.${fileExtension}`;

          const { error: uploadError } = await client.storage
            .from("client_documents_vault")
            .upload(storagePath, fileObj, { cacheControl: "3600", upsert: true, contentType: 'application/pdf' });

          if (uploadError) throw uploadError;

          finalDocumentPublicUrl = client.storage.from("client_documents_vault").getPublicUrl(storagePath).data.publicUrl;
        }

        let resolvedClientUserIdUid = null;
        const [dashOrderMatch, orderMatch] = await Promise.all([
          client.from('dashboard_orders').select('client_id').eq('email_address', targetEmail.toLowerCase()).maybeSingle(),
          client.from('orders').select('client_id').eq('client_email', targetEmail.toLowerCase()).maybeSingle()
        ]);

        if (dashOrderMatch.data && dashOrderMatch.data.client_id) {
          resolvedClientUserIdUid = dashOrderMatch.data.client_id;
        } else if (orderMatch.data && orderMatch.data.client_id) {
          resolvedClientUserIdUid = orderMatch.data.client_id;
        }

        if (!resolvedClientUserIdUid) {
          const { data: sessionData } = await client.auth.getSession();
          resolvedClientUserIdUid = sessionData?.session?.user?.id || null;
        }

        const currentIsoTimestamp = new Date().toISOString().split('T')[0];

        // 🟢 ADMIN CROSS-LINK SWEEP: Packages and pushes matching records to public.admin_compliance_audit
        const auditPayload = {
          user_email: targetEmail.toLowerCase(),
          entity_name: legalName,
          filing_type: filingClass || 'Premium Corporate Suite',
          renewal_date: formationDate ? new Date(new Date(formationDate).setFullYear(new Date(formationDate).getFullYear() + 1)).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          state_jurisdiction: String(stateOrigin).substring(0, 10), // Safeguards table VARCHAR(10) bounds constraints
          fulfillment_slug: finalDocumentPublicUrl || 'vault',
          audit_status: activeStatus === 'ACTIVE' ? 'Active' : (activeStatus === 'SUSPENDED' ? 'Expired' : 'Pending'),
          asset_vault_category: 'vault',
          framework_scope: filingClass || 'Standard Company Formation'
        };

        // Check if an audit row already exists for this client + company combo to prevent duplications
        const { data: existingAudit } = await client
          .from('admin_compliance_audit')
          .select('admin_audit_id')
          .eq('user_email', targetEmail.toLowerCase())
          .eq('entity_name', legalName)
          .maybeSingle();

        if (existingAudit && existingAudit.admin_audit_id) {
          // Sync changes downstream to your matching compliance row
          const { error: auditUpdateError } = await client
            .from('admin_compliance_audit')
            .update(auditPayload)
            .eq('admin_audit_id', existingAudit.admin_audit_id);
          if (auditUpdateError) throw auditUpdateError;
        } else {
          // Inject a net new compliance audit tracking layer entry line
          const { error: auditInsertError } = await client
            .from('admin_compliance_audit')
            .insert([auditPayload]);
          if (auditInsertError) throw auditInsertError;
        }

        // Trigger automatic cross-turn system direct user notification alerts inside the dashboard channel metrics
        if (typeof window.dispatchGlobalSystemNotification === 'function') {
          await window.dispatchGlobalSystemNotification(
            targetEmail, 
            'Company Ledger Update', 
            `${legalName} Status Verification`, 
            `Administrative parameters for your corporate entity "${legalName}" have been processed and set to state: [${activeStatus}].`
          );
        }

        resetAdminEntitiesWorkspaceForm();
        await reloadAdminEntitiesLedgerFeed();

      } catch (fault) {
        console.error(fault);
        showAdminEntitiesBanner(`✕ Cloud Operations Aborted: ${fault.message || "Database validation constraints exception caught."}`, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtnText;
        }
      }
    });
  }


  function showAdminEntitiesBanner(text, isError) {
    if (!formStatusBanner) return;
    formStatusBanner.textContent = text;
    formStatusBanner.style.display = "block";
    formStatusBanner.style.background = isError ? "#fee2e2" : "#ecfdf5";
    formStatusBanner.style.color = isError ? "#991b1b" : "#047857";
    setTimeout(() => { if (formStatusBanner) formStatusBanner.style.display = "none"; }, 5000);
  }

  function escapeAdminEntitiesHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 7. INITIALIZE REPLICATION BROADCAST BACK-END SYNC INTERCEPTORS
  async function bindLiveAdminEntitiesRealtimeFeed() {
    if (liveAdminEntitiesSubscription) liveAdminEntitiesSubscription.unsubscribe();

    liveAdminEntitiesSubscription = client
      .channel('admin-global-corporate-formations-ledger-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_entities' }, async () => {
        console.log("⚡ [Admin Core ledger stream] Real-time mutation intercepted. Synchronizing rows...");
        await reloadAdminEntitiesLedgerFeed();
      })
      .subscribe();
  }

  // 🏁 INITIALIZATION INITIAL RUNTIME INSTANT BOOTSTRAPS
  await populateClientDropdown();
  await reloadAdminEntitiesLedgerFeed();
  await bindLiveAdminEntitiesRealtimeFeed();
});
