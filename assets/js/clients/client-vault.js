document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchVaultStoredDocuments(session.user.id);
    setupDirectVaultUploadListener(session.user.id);
});

// Load Vault Records Matching Schema Parameters
async function fetchVaultStoredDocuments(userId) {
    const outputTarget = document.getElementById("vaultDocumentsContainerTarget");
    if (!outputTarget) return;

    // Queries your precise columns: document_display_name, storage_path, file_size_bytes, mime_type
    const { data: documents, error } = await supabase
        .from('client_documents_vault')
        .select('id, document_display_name, storage_path, file_size_bytes, mime_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        outputTarget.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:red; font-size:0.85rem;">Failed to read file repository indices: ${error.message}</p>`;
        return;
    }

    if (!documents || documents.length === 0) {
        outputTarget.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); font-size:0.85rem;">
                🗄️ Your secure folder archive is currently empty.
            </div>
        `;
        return;
    }

    outputTarget.innerHTML = documents.map(doc => {
        // Convert raw numeric bytes integers into clear human-readable string values
        const computedSizeString = doc.file_size_bytes > 1024 * 1024 
            ? `${(parseFloat(doc.file_size_bytes) / (1024 * 1024)).toFixed(2)} MB` 
            : `${(parseFloat(doc.file_size_bytes) / 1024).toFixed(1)} KB`;

        // Create secure signed URLs on the fly to prevent public link access exploits
        const uniqueTriggerFunctionString = `triggerSecureAssetDownload('${doc.storage_path}')`;

        return `
            <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 18px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 140px !important; box-shadow:0 1px 3px rgba(0,0,0,0.01);">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span style="font-size: 1.6rem;">📄</span>
                        <span style="font-size:0.6rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
                            ${doc.mime_type.split('/').pop()}
                        </span>
                    </div>
                    <strong style="display: block; font-size: 0.85rem; color: var(--text-dark); word-break: break-all; margin-top:8px;">
                        ${doc.document_display_name}
                    </strong>
                    <small style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 4px;">
                        Weight Metric: <strong>${computedSizeString}</strong>
                    </small>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 0.68rem; color: #94a3b8;">
                    <span>${new Date(doc.created_at).toLocaleDateString()}</span>
                    <button onclick="${uniqueTriggerFunctionString}" style="background:transparent; border:none; padding:0; color: var(--emerald); text-decoration: none; font-weight: 800; font-size: 0.75rem; cursor:pointer;">
                        Download ➔
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Upload Listener Pipeline Matching Storage Paths Configurations
function setupDirectVaultUploadListener(userId) {
    const fileSelectorNode = document.getElementById("directVaultUploadInput");
    if (!fileSelectorNode) return;

    fileSelectorNode.addEventListener("change", async (e) => {
        const rawFiles = e.target.files;
        if (!rawFiles || rawFiles.length === 0) return;

        const workingTargetFile = rawFiles[0];
        
        // Assemble folder routes using your exact database path layout styles
        const computedObjectStoragePath = `vault/${userId}/${Date.now()}_${workingTargetFile.name}`;
        
        // Upload the raw binary stream to your storage bucket container
        const { data: bucketUploadRes, error: storageBucketErr } = await supabase.storage
            .from('client_documents_vault')
            .upload(computedObjectStoragePath, workingTargetFile);

        if (storageBucketErr) {
            alert(`File transfer canceled by bucket security rules: ${storageBucketErr.message}`);
            return;
        }

        // Save a clean record row to your tracking table using your exact schema columns
        const { error: dbInsertErr } = await supabase
            .from('client_documents_vault')
            .insert([{
                user_id: userId,
                document_display_name: workingTargetFile.name,
                storage_path: computedObjectStoragePath,
                file_size_bytes: workingTargetFile.size,
                mime_type: workingTargetFile.type || 'application/pdf'
            }]);

        if (dbInsertErr) {
            console.error("Failed to save database metadata log:", dbInsertErr.message);
        }

        // Refresh the file layout view automatically
        fetchVaultStoredDocuments(userId);
        fileSelectorNode.value = "";
    });
}

// Download Trigger Generation: Requests short-lived tokens for secure asset downloads
async function triggerSecureAssetDownload(storagePathString) {
    // Generates a secure, signed temporary link that expires in 60 seconds
    const { data: preSignedAssetNode, error } = await supabase.storage
        .from('client_documents_vault')
        .createSignedUrl(storagePathString, 60);

    if (error) {
        alert("Failed to create download token. Please verify bucket privileges or contact support.");
        return;
    }

    if (preSignedAssetNode && preSignedAssetNode.signedUrl) {
        // Open file down to downstream layout processing target frames
        window.open(preSignedAssetNode.signedUrl, '_blank');
    }
}
