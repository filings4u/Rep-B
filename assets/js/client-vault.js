/**
 * 📂 CLIENT SECURE DOCUMENT VAULT UTILITY DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
window.addEventListener("supabaseEngineReady", function (engineEvent) {
  "use strict";

  // Validate that the system broadcast payload structure is fully populated
  if (!engineEvent || !engineEvent.detail || !engineEvent.detail.session) {
    throw new Error("Core Handshake Exception: Secure document vault loader missing valid session validation.");
  }

  const session = engineEvent.detail.session;
  const currentUserId = session.user.id;

  // Initialize vault components securely
  fetchVaultStoredDocuments(currentUserId);
  setupDirectVaultUploadListener(currentUserId);
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH STORED DOCUMENTS
 * Gathers aggregate rows from file storage history and throws exceptions on validation anomalies.
 */
async function fetchVaultStoredDocuments(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Operation aborted due to unverified user credentials data.");
  }

  const outputTarget = document.getElementById("vaultDocumentsContainerTarget");
  if (!outputTarget) {
    throw new Error("Viewport Structure Exception: Required DOM insertion container #vaultDocumentsContainerTarget missing from layout.");
  }

  // Query secure vault table indexes directly using the initialized instance window shortcuts
  const { data: documents, error } = await window.supabaseInstance
    .from('client_documents_vault')
    .select('id, document_display_name, storage_path, file_size_bytes, mime_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // STRICT ERROR CHECKING: Intercept row transaction failures instantly to prevent silent masking
  if (error) {
    console.error("Vault Index Query Operational Failure:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty secure folder storage status via clear zero-state interface markers
  if (!documents || documents.length === 0) {
    outputTarget.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.85rem;">🗄️ Your secure folder archive is currently empty.</div>`;
    return;
  }

  // Construct data matrix item grids safely with programmatic metric conversions
  outputTarget.innerHTML = documents.map(doc => {
    if (!doc.id || !doc.document_display_name || !doc.storage_path || doc.file_size_bytes === undefined || !doc.mime_type) {
      throw new Error(`Data Integrity Exception: Failed compiling malformed database row asset match ID: ${doc.id || 'Unknown'}`);
    }

    const byteMetrics = parseFloat(doc.file_size_bytes);
    const computedSizeString = byteMetrics > 1024 * 1024 
      ? `${(byteMetrics / (1024 * 1024)).toFixed(2)} MB` 
      : `${(byteMetrics / 1024).toFixed(1)} KB`;

    const cleanMimeLabel = String(doc.mime_type).split('/').pop().toUpperCase();
    const formattedDate = new Date(doc.created_at).toLocaleDateString();

    return `
      <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 18px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 140px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.01); box-sizing: border-box !important;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span style="font-size: 1.6rem;">📄</span>
            <span style="font-size: 0.6rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 800; color: var(--text-muted);">${cleanMimeLabel}</span>
          </div>
          <strong style="display: block; font-size: 0.85rem; color: var(--text-dark); word-break: break-all; margin-top: 8px;">${doc.document_display_name}</strong>
          <small style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 4px;">Size: <strong>${computedSizeString}</strong></small>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 0.68rem; color: #94a3b8; box-sizing: border-box !important;">
          <span>${formattedDate}</span>
          <button onclick="triggerSecureAssetDownload('${encodeURIComponent(doc.storage_path)}')" style="background: transparent; border: none; padding: 0; color: var(--emerald); font-weight: 800; font-size: 0.75rem; cursor: pointer; display: inline-block;">Download ➔</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * ⚡ INTERACTION EVENT ENGINE
 * Attaches structural input upload listeners and handles secure download url processing.
 */
function setupDirectVaultUploadListener(userId) {
  "use strict";

  if (!userId) {
    throw new Error("Data Integrity Exception: Upload trigger assembly aborted due to missing identity variables.");
  }

  const fileSelectorNode = document.getElementById("directVaultUploadInput");
  if (!fileSelectorNode) return; // Exit cleanly if this layout input isn't present in active template view styles

  fileSelectorNode.addEventListener("change", async function (e) {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const workingTargetFile = rawFiles[0];
    
    // Generate a unique, structured pathname inside the bucket destination parameters
    const computedObjectStoragePath = `vault/${userId}/${Date.now()}_${workingTargetFile.name}`;
    
    console.log("📡 Streaming structural asset upload payload to storage layers...");

    // 1. Stream file directly into your dedicated Supabase Storage bucket block
    const { data: bucketUploadRes, error: storageBucketErr } = await window.supabaseInstance.storage
      .from('client_documents_vault')
      .upload(computedObjectStoragePath, workingTargetFile);

    if (storageBucketErr) {
      console.error("Storage Bucket Upload Interception Failure:", storageBucketErr);
      alert(`File transfer canceled: ${storageBucketErr.message}`);
      return;
    }

    console.log("📝 Registering file metadata context records in relational tables...");

    // 2. Insert metadata tracking columns into your query matrix
    const { error: databaseInsertErr } = await window.supabaseInstance
      .from('client_documents_vault')
      .insert([{ 
        user_id: userId, 
        document_display_name: workingTargetFile.name, 
        storage_path: computedObjectStoragePath, 
        file_size_bytes: workingTargetFile.size, 
        mime_type: workingTargetFile.type || 'application/pdf' 
      }]);

    if (databaseInsertErr) {
      console.error("Vault Relational Table Insert Failure:", databaseInsertErr);
      throw new Error(`Database Operation Exception: [${databaseInsertErr.code}] ${databaseInsertErr.message}`);
    }

    // Refresh layout display grids instantly and flush input file references safely
    fetchVaultStoredDocuments(userId);
    fileSelectorNode.value = "";
  });
}

/**
 * 📑 PROMPT SECURE ASSET DOWNLOAD
 * Generates temporary short-lived authentication signatures and forwards down to client.
 */
window.triggerSecureAssetDownload = async function (storagePathString) {
  "use strict";

  const cleanStoragePath = decodeURIComponent(storagePathString);
  if (!cleanStoragePath) {
    throw new Error("Interaction Exception: Target file path parameter missing.");
  }

  console.log("📡 Dispatching 60-second presigned URL extraction loop...");

  // Generate a valid short-lived download token signature valid for 60 seconds
  const { data: preSignedAssetNode, error } = await window.supabaseInstance.storage
    .from('client_documents_vault')
    .createSignedUrl(cleanStoragePath, 60);

  if (error) {
    console.error("Secure Presigned URL Generation Failure:", error);
    alert("Failed to create download token parameters.");
    return;
  }

  if (preSignedAssetNode && preSignedAssetNode.signedUrl) {
    // Open target download link inside a clean browser view frame seamlessly
    window.open(preSignedAssetNode.signedUrl, '_blank');
  }
};
