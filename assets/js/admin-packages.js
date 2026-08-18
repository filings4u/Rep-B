
function enforceAdminAccess() {
  const hash = "lrbimrlbskjweynxlgas";
  const key = `sb-${hash}-auth-token`;
  try {
    const raw = localStorage.getItem(key);
    const session = raw ? JSON.parse(raw) : null;
    const email = String(session?.user?.email || "").toLowerCase();
    const role = session?.user?.user_metadata?.role;
    if (!session?.access_token) {
      document.documentElement.style.display = "none";
      window.location.replace("admin-login.html");
      return false;
    }
    if (role !== "admin" && !email.endsWith("@filings4u.com")) {
      document.documentElement.style.display = "none";
      window.location.replace("client-dashboard.html");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Admin access verification failed:", error);
    document.documentElement.style.display = "none";
    window.location.replace("admin-login.html");
    return false;
  }
}

function getAdminSupabaseClient() {
  if (window.supabaseInstance && typeof window.supabaseInstance.from === "function") return window.supabaseInstance;
  if (window.supabaseClient && typeof window.supabaseClient.from === "function") return window.supabaseClient;
  if (window.supabase && typeof window.supabase.createClient === "function") {
    const client = window.supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsdWJpbXJsYnNramV5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU", {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.supabaseInstance = client;
    window.supabaseClient = client;
    return client;
  }
  return null;
}

function updateAdminClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function escapeAdminHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


/**
 * filings4u Platform Architecture
 * Module: admin-freight-packages-engine.js (Fixed Track Switcher Matrix)
 */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  if (!enforceAdminAccess()) return;
  "use strict";

  const recipientSelect = document.getElementById("adminFreightTargetEmail");
  const freightForm = document.getElementById("adminFreightPackageForm");
  const formStatus = document.getElementById("admin-freight-form-status");
  const submitBtn = document.getElementById("adminFreightSubmitBtn");
  const trackSelect = document.getElementById("adminFreightTrackSelect");
  const textTemplateCanvas = document.getElementById("freightPdfTextTemplateCanvas");

  // Establish Supabase Connection Handshake
  let client = window.supabaseInstance || window.supabaseClient;
  if (!client && typeof supabase !== 'undefined') {
    client = supabase.createClient("https://lrbimrlbskjweynxlgas.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU");
  }
  if (!client) return;

  // 1. DYNAMIC INPUT INTERCEPTOR VISIBILITY SWITCHER (Fixed Tracking Selection Case Matching)
  window.toggleFreightTrackInputsContext = function() {
    const rawValue = trackSelect ? trackSelect.value : "";
    
    // Defensive check matching selector metrics
    let parsedTrack = "Broker Shipper";
    if (rawValue.toLowerCase().includes("carrier") && rawValue.toLowerCase().includes("broker")) {
      parsedTrack = "Broker Carrier";
    } else if (rawValue.toLowerCase().includes("operator") || rawValue.toLowerCase().includes("owner")) {
      parsedTrack = "Owner Operator";
    }

    const blockShipper = document.getElementById("fieldsBlockBrokerShipper");
    const blockCarrier = document.getElementById("fieldsBlockBrokerCarrier");
    const blockOperator = document.getElementById("fieldsBlockOwnerOperator");
    const introMsgField = document.querySelector(".id-field-broker-shipper");

    if (!blockShipper || !blockCarrier || !blockOperator) return;

    // Reset element views cleanly
    blockShipper.style.setProperty("display", "none", "important");
    blockCarrier.style.setProperty("display", "none", "important");
    blockOperator.style.setProperty("display", "none", "important");
    if (introMsgField) introMsgField.style.setProperty("display", "none", "important");

    // Open active template nodes instantly
    if (parsedTrack === "Broker Shipper") {
      blockShipper.style.setProperty("display", "grid", "important");
      if (introMsgField) introMsgField.style.setProperty("display", "block", "important");
    } else if (parsedTrack === "Broker Carrier") {
      blockCarrier.style.setProperty("display", "grid", "important");
    } else if (parsedTrack === "Owner Operator") {
      blockOperator.style.setProperty("display", "grid", "important");
    }
  };

  // 2. POPULATE UNIQUE CLIENT RECIPIENT EMAILS BY MULTI-TABLE AGGREGATION
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
      console.error("✕ Dropdown sync aggregation crashed:", e);
    }
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  // 3. MAIN BUILD ENGINE: COMPILES TEXT SECTIONS & MERGES FILE BINARIES
  if (freightForm) {
    freightForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const targetEmail = recipientSelect.value;
      const rawValue = trackSelect.value;
      const coverHeadline = document.getElementById("adminFreightCoverHeadline").value.trim();
      const infoCompany = document.getElementById("adminFreightInfoCompany").value.trim();

      let trackType = "Broker Shipper";
      if (rawValue.toLowerCase().includes("carrier") && rawValue.toLowerCase().includes("broker")) {
        trackType = "Broker Carrier";
      } else if (rawValue.toLowerCase().includes("operator") || rawValue.toLowerCase().includes("owner")) {
        trackType = "Owner Operator";
      }

      if (!targetEmail || !coverHeadline || !infoCompany) {
        showStatus("✕ Input Validation Mismatch: Recipient, Headline, and Business Name are required.", true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Compiling & Merging Document Tracks...";
      }

      try {
        const cleanEmailDir = targetEmail.replace(/[^a-z0-9]/gi, '_');
        const masterMergedPdf = await PDFLib.PDFDocument.create();

        // 🖼️ STEP A: PARSE CLIENT LOGO LAYER
        const logoField = document.getElementById("adminFileClientLogo");
        let logoDataUrl = "";
        if (logoField && logoField.files && logoField.files[0]) {
          logoDataUrl = await readFileAsDataURL(logoField.files[0]);
        }

        // 📝 STEP B: ASSEMBLE TEXT COVER PAGES
        let templateHtml = "";
        if (logoDataUrl) {
          templateHtml += `<img src="${logoDataUrl}" style="max-height: 80px; width: auto; display: block; margin: 0 auto 30px auto; object-fit: contain;">`;
        }
        templateHtml += `
          <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 40px; margin-bottom: 10px; text-transform: uppercase;">${coverHeadline}</h1>
          <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin-bottom: 60px;">Prepared Specially For: ${infoCompany}</h3>
          <div style="border-top: 2px solid #e2e8f0; margin-bottom: 4px;"></div>
        `;

        if (trackType === "Broker Shipper") {
          const introText = document.getElementById("adminFreightIntroBody").value.trim();
          templateHtml += `
            <div style="page-break-before: always; padding-top: 20px; text-align: left;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Corporate Introduction</h2>
              <p style="font-size: 14px; color: #334155; white-space: pre-wrap; margin-top: 16px;">${introText}</p>
            </div>
          `;
        }

        textTemplateCanvas.innerHTML = templateHtml;

        const generatedHtmlPdfBuffer = await html2pdf().from(textTemplateCanvas).set({
          margin: 0,
          filename: 'generated_sections.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).outputPdf('arraybuffer');

        const loadedGeneratedDoc = await PDFLib.PDFDocument.load(generatedHtmlPdfBuffer);
        const copiedGenPages = await masterMergedPdf.copyPages(loadedGeneratedDoc, loadedGeneratedDoc.getPageIndices());
        copiedGenPages.forEach(page => masterMergedPdf.addPage(page));

        // 📂 STEP C: COLLECT CONTEXTUAL FILES MATCHING THE SYSTEM LAYOUT IDS EXCLUSIVELY
        let targetFieldIds = [];
        if (trackType === "Broker Shipper") {
          targetFieldIds = ["adminFileMcCert", "adminFileBmcBond", "adminFileW9", "adminFileLiabilityInsurance", "adminFileScacCode", "adminFileUcrFiling", "adminFileContactsPage"];
        } else if (trackType === "Broker Carrier") {
          // 🟢 FIXED LOOKUPS: Aligned with your specific uppercase letters exactly
          targetFieldIds = ["adminFileBrokerCarrierAgreement", "adminFileCarrierProfile", "adminFileW9_B", "adminFileMcCert_B", "adminFileContactsPage_B", "adminFileQuickPayDoc"];
        } else if (trackType === "Owner Operator") {
          targetFieldIds = ["adminFileMcCert_O", "adminFileW9_O", "adminFileBipdCargoInsurance", "adminFileUcrFiling_O", "adminFileScacCode_O", "adminFileBillingPage", "adminFileInformationPage", "adminFileContactsPage_O"];
        }

        for (const id of targetFieldIds) {
          const fileInput = document.getElementById(id);
          if (fileInput && fileInput.files && fileInput.files[0]) {
            const bufferBytes = await readFileAsArrayBuffer(fileInput.files[0]);
            const externalDocNode = await PDFLib.PDFDocument.load(bufferBytes);
            const externalCopiedPages = await masterMergedPdf.copyPages(externalDocNode, externalDocNode.getPageIndices());
            externalCopiedPages.forEach(page => masterMergedPdf.addPage(page));
          }
        }

        const finalCompiledMergedPdfBytes = await masterMergedPdf.save();
        const masterFinalFileBlobTarget = new Blob([finalCompiledMergedPdfBytes], { type: 'application/pdf' });

        // 🚀 STEP D: TRANSMIT MASTER FILE DIRECTLY TO STORAGE BUCKETSFOLDER
        const cloudUploadPath = `broker_packages/${cleanEmailDir}/compiled_freight_portfolio_${Date.now()}.pdf`;
        const { error: storageError } = await client.storage
          .from("client_documents_vault")
          .upload(cloudUploadPath, masterFinalFileBlobTarget, { cacheControl: "3600", upsert: true, contentType: 'application/pdf' });

        if (storageError) throw storageError;

        const publicDistributedPacketUrl = client.storage.from("client_documents_vault").getPublicUrl(cloudUploadPath).data.publicUrl;

        // 💾 STEP E: UPSERT METADATA MAPPING RECORD LIVE
        const { error: upsertError } = await client
          .from('freight_packages')
          .upsert({
            client_email: targetEmail,
            package_track: trackType,
            status_label: "Ready for Execution",
            tracking_ref: `F4U-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            cover_headline: coverHeadline,
            info_company_name: infoCompany,
            compiled_packet_url: publicDistributedPacketUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'client_email' });

        if (upsertError) throw upsertError;

        showStatus("✓ Success! Brokerage packet dynamically compiled and pushed to client portal.", false);
        freightForm.reset();
        toggleFreightTrackInputsContext();
      } catch (fault) {
        console.error(fault);
        showStatus(`✕ Compilation Failure: ${fault.message || "Exception caught inside compiler loops."}`, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Generate, Compile & Push Unified Packet ➔";
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

  // 🏁 BOOTSTRAP MOUNT RUNTIME EXECUTIONS
  await populateClientDropdown();
  toggleFreightTrackInputsContext();
});
