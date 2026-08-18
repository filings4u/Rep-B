
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


(function() { 
  const DB_URL = 'https://lrbimrlbskjweynxlgas.supabase.co'; 
  const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU'; 
  let dbClient = null; 

  async function initAdminVaultConsole() { 
    const recipientMenu = document.getElementById('transmitRecipientEmail'); 
    const explorerTable = document.getElementById('admin-vault-explorer-target-box'); 
    const uploadForm = document.getElementById('vaultTransmissionForm'); 

    try { 
      if (typeof supabase === 'undefined') throw new Error("Supabase script driver missing from template head headers."); 
      dbClient = supabase.createClient(DB_URL, DB_KEY); 

      if (explorerTable) { 
        explorerTable.innerHTML = '<tr><td colspan="5" style="padding:30px; text-align:center; color:#64748b; font-style:italic;">Querying multiple transaction datasets...</td></tr>'; 
      } 

      // 1. POPULATE CUSTOMERS AND ADMINISTRATIVE PROFILES IN PARALLEL 
      const [ordersRes, dashOrdersRes, adminProfilesRes, currentAdminRes] = await Promise.all([ 
        dbClient.from('orders').select('client_email, client_name, id'), 
        dbClient.from('dashboard_orders').select('email_address, first_name, last_name, id'), 
        dbClient.from('admin_profiles').select('id, first_name, last_name, email_address'), 
        dbClient.auth.getUser() 
      ]); 

      const uniqueClientsMap = new Map(); 
      const adminNamesMap = new Map(); 
      const adminEmailsMap = new Map(); 

      if (adminProfilesRes.data) { 
        adminProfilesRes.data.forEach(profile => { 
          // 🟢 FORMATTING ENGINE: Pre-compiles the admin display name as "Lastname, F." inside the maps
          const ln = (profile.last_name || '').trim();
          const fn = (profile.first_name || '').trim();
          let formattedName = "System Administrator";
          
          if (ln && fn) {
            formattedName = `${ln}, ${fn.charAt(0).toUpperCase()}.`;
          } else if (ln || fn) {
            formattedName = ln || fn;
          }

          if (formattedName) { 
            adminNamesMap.set(profile.id, formattedName); 
            if (profile.email_address) { 
              adminEmailsMap.set(String(profile.email_address).toLowerCase().trim(), formattedName); 
            } 
          } 
        }); 
      } 

      let activelyOperatingAdminName = "System Administrator"; 
      let activeAdminAuthId = null; 

      if (currentAdminRes.data && currentAdminRes.data.user) { 
        activeAdminAuthId = currentAdminRes.data.user.id; 
        const currentAdminEmail = String(currentAdminRes.data.user.email).toLowerCase().trim(); 

        if (adminNamesMap.has(activeAdminAuthId)) { 
          activelyOperatingAdminName = adminNamesMap.get(activeAdminAuthId); 
        } else if (adminEmailsMap.has(currentAdminEmail)) { 
          activelyOperatingAdminName = adminEmailsMap.get(currentAdminEmail); 
        } else { 
          const { data: fallbackProfile } = await dbClient 
            .from('admin_profiles') 
            .select('first_name, last_name') 
            .or(`id.eq.${activeAdminAuthId},email_address.eq.${currentAdminEmail}`) 
            .maybeSingle(); 

          if (fallbackProfile) { 
            const ln = (fallbackProfile.last_name || '').trim();
            const fn = (fallbackProfile.first_name || '').trim();
            if (ln && fn) {
              activelyOperatingAdminName = `${ln}, ${fn.charAt(0).toUpperCase()}.`;
            } else {
              activelyOperatingAdminName = ln || fn || "System Administrator";
            }
            adminNamesMap.set(activeAdminAuthId, activelyOperatingAdminName); 
          } 
        } 
      } 

      if (ordersRes.data) { 
        ordersRes.data.forEach(item => { 
          const email = (item.client_email || '').trim().toLowerCase(); 
          if (email && email !== 'anonymous@unknown.com') { 
            uniqueClientsMap.set(email, { authId: item.id, name: item.client_name || 'Valued Client' }); 
          } 
        }); 
      } 

      if (dashOrdersRes.data) { 
        dashOrdersRes.data.forEach(item => { 
          const email = (item.email_address || '').trim().toLowerCase(); 
          if (email && email !== 'anonymous@unknown.com') { 
            const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Valued Client'; 
            if (!uniqueClientsMap.has(email)) { 
              uniqueClientsMap.set(email, { authId: item.id, name: fullName }); 
            } 
          } 
        }); 
      } 

      if (recipientMenu) { 
        recipientMenu.innerHTML = '<option value="">-- Choose Target Customer Profile --</option>'; 
        Array.from(uniqueClientsMap.keys()).sort().forEach(email => { 
          const profile = uniqueClientsMap.get(email); 
          const opt = document.createElement('option'); 
          opt.value = profile.authId; 
          opt.setAttribute('data-email', email); 
          opt.textContent = `${email} (${profile.name})`; 
          recipientMenu.appendChild(opt); 
        }); 
      }
          // 2. QUERY MASTER VAULT STORAGE MATRIX RECORD LEDGERS 
      const { data: vaultRecords, error: vaultQueryFault } = await dbClient 
        .from('admin_vault') 
        .select('id, file_name, storage_bucket_path, file_size_bytes, created_at, content_type, uploaded_by, first_name, last_name, target_client_email') 
        .order('created_at', { ascending: false }); 

      if (vaultQueryFault) throw vaultQueryFault; 

      if (explorerTable) { 
        explorerTable.innerHTML = ''; 
        if (!vaultRecords || vaultRecords.length === 0) { 
          explorerTable.innerHTML = '<tr><td colspan="5" style="padding:30px; text-align:center; color:#64748b; font-style:italic;">No files uploaded inside the client documents vault repository yet.</td></tr>'; 
        } else { 
          for (const item of vaultRecords) { 
            const tr = document.createElement('tr'); 
            tr.style.cssText = 'border-bottom:1px solid #e2e8f0; background:#ffffff;'; 

            let calculatedSize = "0 KB"; 
            if (item.file_size_bytes > 0) { 
              const kb = item.file_size_bytes / 1024; 
              calculatedSize = kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(0) + " KB"; 
            } 

            const uploadDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'; 
            let directAssetUrl = "#"; 

            if (item.storage_bucket_path) { 
              let cleanStorageKey = String(item.storage_bucket_path) 
                .trim() 
                .replace(/^client_documents_vault\//i, '') 
                .replace(/^\//, ''); 
              try { 
                const { data, error } = await dbClient.storage 
                  .from('client_documents_vault') 
                  .createSignedUrl(cleanStorageKey, 900); 
                if (error) throw error; 
                if (data && data.signedUrl) directAssetUrl = data.signedUrl; 
              } catch (urlError) { 
                console.error("✕ Failed to sign secure download token:", urlError); 
              } 
            } 

            const matchedOwnerEmail = item.target_client_email || 'System Isolated Profile'; 

            // 🟢 FIXED: Compiles the dynamic on-screen render directly from standard table fields
            const ln = (item.last_name || '').trim(); 
            const fn = (item.first_name || '').trim(); 
            let displayAdminAuthor = "System Administrator"; 

            if (ln && fn) { 
              displayAdminAuthor = `${ln}, ${fn.charAt(0).toUpperCase()}.`; 
            } else if (ln || fn) { 
              displayAdminAuthor = ln || fn; 
            }
            tr.innerHTML = ` 
              <td style="padding:14px 12px; font-family:monospace; color:#475569; font-weight:600; font-size:0.8rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeAdminVaultHtml(matchedOwnerEmail)}</td> 
              <td style="padding:14px 12px; font-weight:700; color:#0f172a;"> 
                ${escapeAdminVaultHtml(item.file_name)} 
                <div style="font-size:0.72rem; color:#94a3b8; font-weight:500; margin-top:2px;">Size: ${calculatedSize} | Filed: ${uploadDate}</div> 
              </td> 
              <td style="padding:14px 12px; color:#475569; font-weight:600;"><span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:11px; white-space:nowrap;">👤 ${escapeAdminVaultHtml(displayAdminAuthor)}</span></td> 
              <td style="padding:14px 12px; color:#64748b; font-family:monospace; font-size:0.75rem; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeAdminVaultHtml(item.storage_bucket_path)}</td> 
              <td style="padding:14px 12px; text-align:right;"> 
                <button data-url="${directAssetUrl}" data-filename="${item.file_name}" class="btn-view-asset view-asset-trigger" style="border:none; cursor:pointer; text-decoration:none; background:#2563eb; color:#ffffff; font-weight:700; padding:6px 12px; border-radius:4px; font-size:11px; display:inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05); white-space:nowrap;">👁️ View Asset ➔</button> 
              </td> 
            `; 
            explorerTable.appendChild(tr); 
          } 
        } 
      }

       // 3. VAULT FORM SUBMISSION TRACKING CONTROLLER HANDLER INTERCEPTOR 
      if (uploadForm && !uploadForm.hasAttribute('data-live-listener')) { 
        uploadForm.addEventListener('submit', async (e) => { 
          e.preventDefault(); 
          const statusSlat = document.getElementById('vault-form-status'); 
          const submitBtn = document.getElementById('vaultSubmitBtn'); 
          const fileField = document.getElementById('transmitFileField'); 
          const categoryField = document.getElementById('transmitVaultCategory'); 

          // 🟢 FIXED: Selects your single combined document dropdown element target directly
          const slugSelectField = document.getElementById('formFulfillmentSlug'); 

          if (statusSlat) statusSlat.style.display = 'none'; 

          const targetProfileId = recipientMenu.value; 
          const targetOption = recipientMenu.options[recipientMenu.selectedIndex]; 
          const targetEmail = targetOption ? targetOption.getAttribute('data-email') : null;
          // 🟢 FIXED: Grabs the clean option text (e.g. "LLC Formation") to use as the document label text description
          const selectedOption = slugSelectField ? slugSelectField.options[slugSelectField.selectedIndex] : null;
          const documentLabel = selectedOption && slugSelectField.value ? selectedOption.textContent.trim() : ''; 
          const selectedVaultFolderTag = categoryField ? categoryField.value : ''; 

          if (!targetProfileId || !targetEmail) { 
            return showFormNotification(statusSlat, "✕ Selection Required: Please choose a valid target client profile recipient account.", true); 
          } 
          if (!documentLabel) { 
            return showFormNotification(statusSlat, "✕ Selection Required: Please choose a valid Document Classification Label choice option.", true); 
          } 
          if (!selectedVaultFolderTag) { 
            return showFormNotification(statusSlat, "✕ Selection Required: Please choose an explicit target vault folder directory segment.", true); 
          } 
          if (!fileField.files || fileField.files.length === 0) { 
            return showFormNotification(statusSlat, "✕ File Missing: Please select a local compliance document layout asset.", true); 
          } 

          const targetFile = fileField.files[0]; 
          const originalBtnLabel = submitBtn.textContent; 

          if (submitBtn) { 
            submitBtn.disabled = true; 
            submitBtn.textContent = 'Uploading & Transmitting Asset...'; 
          }
                    try { 
            // 1. RESOLVE EXECUTING ADMINISTRATOR DATA AND FORMAT TO: Lastname, F.
            let submitFirstName = "System"; 
            let submitLastName = "Administrator"; 
            let submitEmailAddress = ""; 
            let resolvedAdminUid = null; 

            const activeUserSession = await dbClient.auth.getUser(); 
            if (activeUserSession.data && activeUserSession.data.user) { 
              resolvedAdminUid = activeUserSession.data.user.id; 
              submitEmailAddress = String(activeUserSession.data.user.email).toLowerCase().trim(); 

              // 🟢 THE FIX: Query lookups check BOTH the ID string and the lowercase email index parameter
              const { data: profileNode } = await dbClient 
                .from('admin_profiles') 
                .select('first_name, last_name, email_address') 
                .or(`id.eq.${resolvedAdminUid},email_address.eq.${submitEmailAddress}`) 
                .maybeSingle(); 

              if (profileNode) { 
                submitFirstName = (profileNode.first_name || "System").trim(); 
                submitLastName = (profileNode.last_name || "Administrator").trim(); 
                if (profileNode.email_address) { 
                  submitEmailAddress = String(profileNode.email_address).toLowerCase().trim(); 
                } 
              } else {
                // Secondary recovery rule: Parse user metadata if database table sync hasn't populated yet
                const meta = activeUserSession.data.user.user_metadata || {};
                if (meta.first_name || meta.last_name) {
                  submitFirstName = (meta.first_name || "System").trim();
                  submitLastName = (meta.last_name || "Administrator").trim();
                }
              }
            }


            // 2. DISPATCH PHYSICAL FILE TO STORAGE ASSETS DISK
            const folderEmailKey = String(targetEmail).trim().toLowerCase(); 
            const cleanFileName = String(targetFile.name).replace(/[^a-z0-9.]/gi, '_').toLowerCase(); 
            const uniquePathToken = Date.now() + "_" + cleanFileName; 
            const fullStorageBucketPath = `compliance_audits/${folderEmailKey}/${uniquePathToken}`; 

            const { error: storageError } = await dbClient 
              .storage 
              .from('client_documents_vault') 
              .upload(fullStorageBucketPath, targetFile, { cacheControl: '3600', upsert: false }); 

            if (storageError) throw storageError; 

            const finalLabelName = documentLabel || targetFile.name;

            // 3. COMPILE METADATA LOG PAYLOAD AND WRITE TO BOTH DIRECT RELATIONAL TABLES
            const sharedBasePayload = { 
              uploaded_by: resolvedAdminUid, 
              target_client_email: folderEmailKey, 
              file_name: finalLabelName, 
              storage_bucket_path: fullStorageBucketPath, 
              storage_path: `client_documents_vault/${fullStorageBucketPath}`, 
              file_size_bytes: parseInt(targetFile.size, 10), 
              content_type: targetFile.type || 'application/pdf', 
              bucket_id: 'client_documents_vault', 
              asset_vault_category: selectedVaultFolderTag, 
              // 🟢 FIXED: Binds the standard database column layout parameters cleanly
              first_name: submitFirstName,
              last_name: submitLastName,
              email_address: submitEmailAddress
            }; 

            const { error: adminInsertError } = await dbClient 
              .from('admin_vault') 
              .insert([sharedBasePayload]); 
            if (adminInsertError) throw adminInsertError; 

            const { error: clientInsertError } = await dbClient 
              .from('client_vault') 
              .insert([sharedBasePayload]); 
            if (clientInsertError) throw clientInsertError; 

            const dynamicEdgePath = "https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/document-notification"; 
            await dispatchDocumentNotification(targetProfileId, finalLabelName, dynamicEdgePath); 

            showFormNotification(statusSlat, "✓ Success! Vault document asset successfully logged in admin history, distributed to client dashboard, and client notified.", false); 
            uploadForm.reset(); 
            initAdminVaultConsole();

          } catch (fault) { 
            console.error("✕ Document transmission stream failed:", fault); 
            showFormNotification(statusSlat, `✕ Execution Blocked: ${fault.message || "Cloud processing exception caught."}`, true); 
          } finally { 
            if (submitBtn) { 
              submitBtn.disabled = false; 
              submitBtn.textContent = originalBtnLabel; 
            } 
          } 
        }); 
        uploadForm.setAttribute('data-live-listener', 'true'); 
      } 

    } catch (err) { 
      console.error('System Vault Explorer Initialization Crash:', err); 
    } 
  }



  function showFormNotification(elem, text, isError) { 
    if (!elem) return; 
    elem.textContent = text; 
    elem.style.cssText = `display:block; margin-bottom:20px; padding:12px; border-radius:8px; font-size:0.85rem; font-weight:700; text-align:left; background: ${isError ? "#fee2e2" : "#ecfdf5"}; color: ${isError ? "#991b1b" : "#047857"}; border: 1px solid ${isError ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)"};`; 
  } 

  function escapeAdminVaultHtml(s) { 
    if (!s) return ""; 
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "'"); 
  } 

  async function dispatchDocumentNotification(ownerId, documentLabel, relativePath) { 
    try { 
      console.log("📡 [Network Relay] Transmitting secure metrics payload to background edge system..."); 
      const edgeRouteEndpoint = "https://lrbimrlbskjweynxlgas.supabase.co"; 
      const projectBearerToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU"; 
      
      const response = await fetch(edgeRouteEndpoint, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": projectBearerToken 
        }, 
        body: JSON.stringify({ 
          account_owner_id: ownerId, 
          document_classification_label: documentLabel, 
          storage_path_uri: relativePath, 
          dispatched_at_timestamp: new Date().toISOString() 
        }) 
      }); 
      if (!response.ok) throw new Error(`Edge channel submission rejected with status error: ${response.status}`); 
      console.log("✓ [Notification Engine] Live transmission payload confirmed and distributed."); 
    } catch (error) { 
      console.error("✕ Document upload edge signal connection failure caught:", error); 
    } 
  } 

  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', initAdminVaultConsole); 
  } else { 
    initAdminVaultConsole(); 
  } 
})(); 

// IFRAME PREVIEW MODAL UTILITY MODULE HANDLER 
(() => { 
  document.addEventListener('DOMContentLoaded', () => { 
    const modal = document.getElementById("assetPopupModal") || document.getElementById("asset-preview-modal"); 
    const closeCross = document.getElementById("closeModalCross") || document.getElementById("modal-close-top"); 
    const closeBtn = document.getElementById("closeModalBtn") || document.getElementById("modal-close-btn"); 
    const downloadBtn = document.getElementById("downloadAssetBtn") || document.getElementById("modal-download-btn"); 
    const iframeViewer = document.getElementById("modalIframeViewer"); 
    const modalName = document.getElementById("modalAssetName"); 
    const fieldOwner = document.getElementById('modal-field-owner'); 
    const fieldPath = document.getElementById('modal-field-path'); 
    const explorerTarget = document.getElementById('admin-vault-explorer-target-box'); 

    if (!explorerTarget || !modal) return; 

    explorerTarget.addEventListener("click", (e) => { 
      const triggerBtn = e.target.closest(".view-asset-trigger"); 
      if (!triggerBtn) return; 
      e.preventDefault(); 

      const fileUrl = triggerBtn.getAttribute("data-url"); 
      const fileName = triggerBtn.getAttribute("data-filename"); 
      const dynamicRow = triggerBtn.closest('tr'); 
      const accountOwnerData = dynamicRow?.cells[0]?.textContent?.trim() || 'Unknown'; 
      const storagePathData = dynamicRow?.cells[3]?.textContent?.trim() || '#'; 

      if (modalName) modalName.textContent = `Inspecting: ${fileName}`; 
      if (fieldOwner) fieldOwner.textContent = `Client Node: ${accountOwnerData}`; 
      if (fieldPath) fieldPath.textContent = storagePathData; 
      if (iframeViewer) iframeViewer.setAttribute("src", fileUrl); 

      if (downloadBtn) { 
        downloadBtn.setAttribute("href", fileUrl); 
        downloadBtn.setAttribute("download", fileName || 'download'); 
      } 
      if (modal.style.display !== undefined) { 
        modal.style.display = 'flex'; 
      } 
      modal.classList.add("active"); 
    }); 

    const deactivateModalView = () => { 
      modal.classList.remove("active"); 
      if (modal.style.display) modal.style.display = 'none'; 
      if (iframeViewer) iframeViewer.setAttribute("src", ""); 
    }; 

    if (closeCross) closeCross.addEventListener("click", deactivateModalView); 
    if (closeBtn) closeBtn.addEventListener("click", deactivateModalView); 
    
    modal.addEventListener("click", (e) => { 
      if (e.target === modal) deactivateModalView(); 
    }); 
  }); 
})();
