
/* ========================================================================== 
   FILINGS4U ADMIN PAGE BOOTSTRAP
   Shared shell behavior; page functionality remains below.
   ========================================================================== */
(function adminPageBootstrap() {
  "use strict";
  document.documentElement.classList.add("admin-page-loading");

  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const path = window.location.pathname.toLowerCase();
  const isAdminPage = path.includes("/admin-") || /admin-[^/]+$/.test(path);

  let authenticated = false;
  let role = null;

  try {
    const raw = localStorage.getItem(sessionTokenKey);
    if (raw) {
      const session = JSON.parse(raw);
      if (session && session.access_token) {
        authenticated = true;
        role = session.user?.user_metadata?.role || null;
        if (!role && session.user?.email?.toLowerCase().endsWith("@filings4u.com")) {
          role = "admin";
        }
      }
    }
  } catch (error) {
    console.error("Admin session parsing failed:", error);
  }

  if (!authenticated) {
    window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
    return;
  }

  if (isAdminPage && role !== "admin") {
    window.location.replace("client-dashboard.html");
    return;
  }

  document.documentElement.classList.remove("admin-page-loading");
})();

function initializeAdminPageClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  const render = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    clock.textContent = `${date} | ${time}`;
  };
  render();
  window.setInterval(render, 1000);
}

document.addEventListener("DOMContentLoaded", initializeAdminPageClock);


(function() {
    "use strict";
    // Define the exact project storage lookup path signature
    const projectUrlHash = "lrbimrlbskjweynxlgas"; 
    const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
    
    // Synchronously check local storage cache arrays before browser can paint any HTML elements
    const rawSessionJson = localStorage.getItem(sessionTokenKey);
    let isAuthenticated = false;
    let userRole = null;

    if (rawSessionJson) {
      try {
        const sessionData = JSON.parse(rawSessionJson);
        if (sessionData && sessionData.access_token) {
          isAuthenticated = true;
          // Extract nested metadata flags out of JWT payload context securely
          if (sessionData.user && sessionData.user.user_metadata) {
            userRole = sessionData.user.user_metadata.role;
          }
          if (sessionData.user && !userRole && sessionData.user.email) {
            if (sessionData.user.email.toLowerCase().endsWith('@filings4u.com')) {
              userRole = 'admin';
            }
          }
        }
      } catch (e) {
        console.error("Security parsing failure:", e);
      }
    }

    // Determine current view file track rules path parameters
    const pagePathString = window.location.pathname.toLowerCase();
    const isAdminViewPage = pagePathString.includes('/admin-');

    if (!isAuthenticated) {
      // 🚨 CRITICAL REDIRECT: Halt thread and eject out-of-bounds requests immediately
      alert("🔒 Access Denied: Authentication required. Redirecting to secure login desk portal...");
      window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
      
      // Inject CSS rule to hide everything in case browser delays routing
      document.documentElement.style.display = "none";
      throw new Error("🔒 Execution Halted: Unauthorized navigation attempt terminated.");
    }

    // Role Enforcement Shield: Blocks non-admins from hitting administrative paths
    if (isAdminViewPage && userRole !== 'admin') {
      alert("🛡️ Security Exception: Restricted Administrative Territory. Access Refused.");
      window.location.replace("client-dashboard.html");
      document.documentElement.style.display = "none";
      throw new Error("🛡️ Execution Halted: Insufficient role permissions clearance.");
    }
  })();

(function() {
  "use strict";

  const DB_URL = 'https://lrbimrlbskjweynxlgas.supabase.co';
  const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU';
  let dbClient = null;

  async function initAdminConsole() {
    const tableElement = document.getElementById('admin-compliance-target-box');
    const clientMenu = document.getElementById('uploadTargetClientSelector');
    const uploadForm = document.getElementById('complianceUploadForm');

    try {
      // 🟢 SAFE CHECK FALLBACK Matrix: Check window cache instances first to eliminate type collisions
      if (window.supabaseInstance || window.supabaseClient) {
        dbClient = window.supabaseInstance || window.supabaseClient;
        console.log("🚀 [Compliance Engine] Connected cleanly using active window session instance.");
      } else if (window.supabase && typeof window.supabase.createClient === 'function') {
        dbClient = window.supabase.createClient(DB_URL, DB_KEY);
      } else if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        dbClient = supabase.createClient(DB_URL, DB_KEY);
      }

      if (!dbClient) {
        throw new Error("Supabase JS core library could not be resolved or initialized inside this context scope.");
      }

      // 1. POPULATE CUSTOMERS INTO DROPDOWN FROM ORDERS TABLES CONCURRENTLY
      console.log("📡 [Compliance Engine] Hydrating cross-table client profile registries...");
      const [ordersRes, dashOrdersRes] = await Promise.all([
        dbClient.from('orders').select('client_email, client_name, company_name, selected_service'),
        dbClient.from('dashboard_orders').select('email_address, first_name, last_name, company_name, selected_service')
      ]);

      const uniqueClientsMap = new Map();
      const clientMetadataMap = new Map();

      if (ordersRes.data) {
        ordersRes.data.forEach(item => {
          const email = (item.client_email || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com') {
            uniqueClientsMap.set(email, item.client_name || 'Valued Client');
            clientMetadataMap.set(email, { company: item.company_name, service: item.selected_service });
          }
        });
      }

      if (dashOrdersRes.data) {
        dashOrdersRes.data.forEach(item => {
          const email = (item.email_address || '').trim().toLowerCase();
          if (email && email !== 'anonymous@unknown.com') {
            const name = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Valued Client';
            uniqueClientsMap.set(email, name);
            if (!clientMetadataMap.has(email)) {
              clientMetadataMap.set(email, { company: item.company_name, service: item.selected_service });
            }
          }
        });
      }

      if (clientMenu) {
        clientMenu.innerHTML = '<option value="">-- Choose Target Account Profile Email --</option>';
        Array.from(uniqueClientsMap.keys()).sort().forEach(email => {
          const opt = document.createElement('option');
          opt.value = email;
          opt.textContent = `${email} (${uniqueClientsMap.get(email)})`;
          clientMenu.appendChild(opt);
        });

        // Clear out duplicates before re-binding to prevent memory leaks
        clientMenu.removeEventListener('change', handleClientDropdownChange);
        clientMenu.addEventListener('change', handleClientDropdownChange);
      }

      function handleClientDropdownChange() {
        const email = this.value;
        const meta = clientMetadataMap.get(email);
        
        const entityInput = document.getElementById('formEntityName');
        const filingInput = document.getElementById('formFilingType');
        
        if (meta) {
          if (entityInput) entityInput.value = meta.company || '';
          if (filingInput) filingInput.value = meta.service || '';
        }
      }


      // --- 2. QUERY AND PRINT DISPATCHED AUDITS MATCHING NEW 1:1 RESTRUCTURE ---
      try {
        console.log("📡 [Supervisor Matrix] Interrogating admin_compliance_audit rows...");
        
        // Resolve current operator authority metrics out of active browser token context layers
        const { data: { session }, error: sessionErr } = await dbClient.auth.getSession();
        if (sessionErr) throw sessionErr;

        const operatorUserMetadata = session?.user?.user_metadata || {};
        const operatorEmail = String(session?.user?.email || "").toLowerCase().trim();
        const isMasterAdminOperator = operatorUserMetadata.role === 'admin' || operatorEmail.endsWith('@filings4u.com');

        // 🟢 SECURE MULTI-ROLE DATA FETCH QUERY PIPELINE
        let queryEngine = dbClient.from('admin_compliance_audit').select('*');

        // If a regular client lands here accidentally, auto-filter rows down to match their own account context
        if (!isMasterAdminOperator) {
          console.warn("ℹ️ [Security Shield] Restricted profile context caught. Enforcing row level email filters.");
          queryEngine = queryEngine.eq('user_email', operatorEmail);
        }

        const { data: audits, error: auditError } = await queryEngine.order('created_at', { ascending: false });

        if (auditError) throw auditError;

        if (tableElement) {
          tableElement.innerHTML = '';
          if (!audits || audits.length === 0) {
            tableElement.innerHTML = `<tr><td colspan="6" style="padding:30px; text-align:center; color:#64748b; font-style:italic;">No active record rows found across any database compliance transaction matrices.</td></tr>`;
          } else {
            audits.forEach(item => {
              let statusStyle = 'background:#dcfce7; color:#166534;';
              if (item.audit_status === 'Active') statusStyle = 'background:#fef3c7; color:#b45309;';
              if (item.audit_status === 'Overdue') statusStyle = 'background:#fee2e2; color:#991b1b;';

              const displayDate = item.renewal_date ? new Date(item.renewal_date).toLocaleDateString() : 'N/A';
              
              const rowMarkup = `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                  <td style="padding:14px 12px; color: #475569; font-family: monospace;">${escapeDataString(item.user_email)}</td>
                  <td style="padding:14px 12px; color: #1e293b; font-weight: 600;">${escapeDataString(item.entity_name)}</td>
                  <td style="padding:14px 12px; color: #1e293b;">${escapeDataString(item.filing_type)}</td>
                  <td style="padding:14px 12px; color: #475569; font-weight: 700; text-transform: uppercase;">${escapeDataString(item.state_jurisdiction)}</td>
                  <td style="padding:14px 12px; color: #475569; font-family: monospace;">${displayDate}</td>
                  <td style="padding:14px 12px; text-align:right;">
                    <span style="padding:4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; ${statusStyle}">
                      ${escapeDataString(item.audit_status)}
                    </span>
                  </td>
                </tr>
              `;
              tableElement.insertAdjacentHTML('beforeend', rowMarkup);
            });
          }
        }
      } catch (syncException) {
        console.error("✕ Compliance table compilation rejected:", syncException.message);
        if (tableElement) {
          tableElement.innerHTML = `<tr><td colspan="6" style="padding:30px; text-align:center; color:#ef4444; font-weight:700; background:#fef2f2;">✕ Synchronization Failure: ${syncException.message}</td></tr>`;
        }
      }

      // --- STAGE D: INTELLIGENT ROUTING MATRIX & FORM SUBMISSION CONTROLLER ---
      if (uploadForm && !uploadForm.hasAttribute('data-live-listener')) {
        uploadForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const clientMenuSelector = document.getElementById('uploadTargetClientSelector');
          const targetEmail = clientMenuSelector.value;
          const entityName = document.getElementById('formEntityName').value.trim();
          const filingType = document.getElementById('formFilingType').value.trim();
          const renewalDate = document.getElementById('formRenewalDate').value;
          const stateJurisdiction = document.getElementById('formStateJurisdiction').value;
          const fulfillmentSlug = document.getElementById('formFulfillmentSlug').value;
          const auditStatus = document.getElementById('formAuditStatus').value;
          const fileInput = document.getElementById('uploadFileReference');

          if (!targetEmail || targetEmail === '') {
            return showCustomBlurModal('⚠️', 'Input Required', 'Please select a valid target client profile email from the option dropdown menu.');
          }
          if (!fileInput.files || fileInput.files.length === 0) {
            return showCustomBlurModal('⚠️', 'File Missing', 'Please attach an operational asset verification file.');
          }

          const targetFile = fileInput.files[0];
          if (targetFile.type !== 'application/pdf' && !targetFile.name.toLowerCase().endsWith('.pdf')) {
            return showCustomBlurModal('❌', 'Invalid File Type', 'Security Constraint Active: You can only commit official PDF documents into this storage vault repository.');
          }

          // 🟢 INTELLIGENT ROUTING MATRIX: Maps the 48 platform slugs automatically into the 4 frontend segments
          let computedVaultCategory = "formation";
          const slug = String(fulfillmentSlug).toLowerCase().trim();

          // Track 1 & 2: Formations & Core Structural Compliance
          if (['llc-formation', 'corporations', 'sole-proprietorship', 'dba-registration', 'nonprofits', 'series-llc', 'llc-reinstatement', 'foreign-qualification', 'dissolution'].includes(slug)) {
            computedVaultCategory = "formation";
          }
          // Track 3: Internal Governance Records
          else if (['operating-agreement', 'corporate-bylaws', 'certificate-of-good-standing', 'apostille-services'].includes(slug)) {
            computedVaultCategory = "governance";
          }
          // Track 4: Taxation Engines
          else if (['federal-tax', 'state-tax', 'franchise-tax', 'payroll-tax-940-941', 'sales-tax-registration', 'heavy-use-tax-2290', 'employer-id-ein'].includes(slug)) {
            computedVaultCategory = "tax";
          }
          // Track 5: Government Registrations, DOT, Broker & Commercial Logistics Infrastructure Fleet Operations
          else {
            computedVaultCategory = "logistics";
          }

          const submitBtn = uploadForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Syncing Vault Asset...';
          }

          try {
            // STEP 1: Insert parameters into admin_compliance_audit table matching new schema layouts 1:1
            const { data: newRow, error: dbError } = await dbClient
              .from('admin_compliance_audit')
              .insert([{
                user_email: targetEmail.toLowerCase().trim(),
                entity_name: entityName,
                filing_type: filingType,
                renewal_date: renewalDate,
                state_jurisdiction: stateJurisdiction,
                fulfillment_slug: slug,
                asset_vault_category: computedVaultCategory, 
                audit_status: auditStatus
              }])
              .select()
              .single();

            if (dbError) throw dbError;

            // STEP 2: Structure safe folder paths inside the physical bucket using clean subfolder tags
            const rawEmailFolder = targetEmail.toLowerCase().trim();
            const fileCleanName = targetFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            
            // Storage Path matches the folder layout requirements perfectly
            const secureStoragePath = `compliance_audits/${rawEmailFolder}/${newRow.admin_audit_id}_${fileCleanName}`;

            // STEP 3: Stream physical binary file payload straight to client_documents_vault storage bucket container
            const { error: vaultWriteError } = await dbClient
              .storage
              .from('client_documents_vault')
              .upload(secureStoragePath, targetFile, { cacheControl: '3600', upsert: false });

            if (vaultWriteError) throw vaultWriteError;

            // STEP 4: Send the webhook notification edge trigger packet
            try {
              await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/document-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  record: {
                    user_email: targetEmail,
                    entity_name: entityName,
                    filing_type: filingType,
                    renewal_date: renewalDate,
                    state_jurisdiction: stateJurisdiction,
                    asset_vault_category: computedVaultCategory,
                    audit_status: auditStatus
                  }
                })
              });
            } catch (emailErr) {
              console.error('Notification Edge API exception caught:', emailErr);
            }

            showCustomBlurModal('✅', 'Asset Synchronized', 'The compliance audit record was successfully cataloged and mapped into the target folder segment.');
            uploadForm.reset();
            initAdminConsole(); // Live data table refresh

          } catch (actionErr) {
            console.error('Processing transaction error trace caught:', actionErr);
            showCustomBlurModal('❌', 'Execution Interrupted', `System processing error verified: ${actionErr.message || actionErr}`);
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerText = 'Commit Vault Asset';
            }
          }
        });

        uploadForm.setAttribute('data-live-listener', 'true');
      }
    } catch (err) {
      console.error('System Engine Setup Failure:', err);
    }
  }

  // --- GLOBAL BLURRY ACCESSIBLE CONTEXT OVERLAY MODAL DISPLAY HANDLER FUNCTIONS ---
  window.showCustomBlurModal = function(icon, title, message) {
    const overlay = document.getElementById('complianceCustomModalOverlay');
    if (overlay) {
      const modalIconBox = document.getElementById('modalIconBox');
      const modalHeaderTitle = document.getElementById('modalHeaderTitle');
      const modalMessageContent = document.getElementById('modalMessageContent');

      if (modalIconBox) modalIconBox.textContent = icon;
      if (modalHeaderTitle) modalHeaderTitle.textContent = title;
      if (modalMessageContent) modalMessageContent.textContent = message;
      
      overlay.style.display = 'flex';
      setTimeout(() => {
        if (overlay.children[0]) overlay.children[0].style.transform = 'scale(1)';
      }, 10);
    }
  };

  window.closeComplianceModal = function() {
    const overlay = document.getElementById('complianceCustomModalOverlay');
    if (overlay) {
      if (overlay.children[0]) overlay.children[0].style.transform = 'scale(0.95)';
      overlay.style.display = 'none';
    }
  };

  function escapeDataString(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  // Safe baseline mounting initialization rules
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminConsole);
  } else {
    initAdminConsole();
  }
})();

// --- STAGE E: REGIONAL US JURISDICTIONS DATA DROPDOWN HYDRATOR ---
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const stateDropdown = document.getElementById("formStateJurisdiction");
  if (!stateDropdown) return;

  // 🟢 MASTER 50 US STATES MATRIX REGISTER
  const usStates = [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
  ];

  // Alphabetize the list by state name to maintain clean structural formatting
  usStates.sort((a, b) => a.name.localeCompare(b.name));

  // Initialize the clean dropdown template
  stateDropdown.innerHTML = '<option value="" disabled selected>Select Jurisdiction...</option>';

  // Mount the priority Federal/US option layer on top
  const fedOpt = document.createElement("option");
  fedOpt.value = "US";
  fedOpt.textContent = "Federal / United States [US]";
  stateDropdown.appendChild(fedOpt);

  // Append all 50 states dynamically into the option list tree
  usStates.forEach(state => {
    const opt = document.createElement("option");
    opt.value = state.code;
    opt.textContent = `${state.name} [${state.code}]`;
    stateDropdown.appendChild(opt);
  });

  console.log("✓ State Jurisdiction Dropdown fully hydrated with 50 sorted US states.");
});