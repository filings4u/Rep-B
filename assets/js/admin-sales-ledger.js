// ============================================================================ //
// 📁 LEDGER MODULAR COMPONENT: GLOBAL CORPORATE SALES PRICING MATRIX          //
// ============================================================================ //
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        syncGlobalSalesPricingLedger();
    });

async function syncGlobalSalesPricingLedger() {
    const targetBox = document.getElementById("admin-global-sales-target-box");
    if (!targetBox) return;

    // 🚀 FAIL-SAFE INITIALIZATION BYPASS CHANNEL
    let client = window.supabaseInstance || window.supabaseClient;

    if (!client || typeof client.from !== 'function') {
        const currentLibrary = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        
        if (currentLibrary && typeof currentLibrary.createClient === 'function') {
            console.log("🔧 [Admin Ledger] Building fresh database fail-safe connection inline...");
            
            const targetUrl = "https://lrbimrlbskjweynxlgas.supabase.co";
            const targetKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU";
            
            client = currentLibrary.createClient(targetUrl, targetKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "filings4u_secure_session_token" }
            });

            // Hydrate the global namespaces immediately to unlock sister dashboard scripts
            window.supabaseInstance = client;
            window.supabaseClient = client;
        }
    }

    // Fall back to polling interval loop if the factory library completely failed to load on the network
    if (!client || typeof client.from !== 'function') {
        console.warn("⚠️ Sales Ledger Intercept: Active client system instance not ready. Retrying loop...");
        setTimeout(syncGlobalSalesPricingLedger, 150);
        return;
    }

    try {
        const { data: salesLedger, error } = await client
            .from('orders')
            .select('company_name, service_title, plan_tier, total_fee, tracking_number, collected_payload_metadata')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!salesLedger || salesLedger.length === 0) {
            targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No corporate sales records discovered inside data layers.</td></tr>`;
            return;
        }

        targetBox.innerHTML = "";
        
        salesLedger.forEach(row => {
            const tr = document.createElement("tr");
            tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem;";
            
            const metadata = row.collected_payload_metadata || {};
            const clientEmailAddress = metadata.wiz_client_email || metadata.email || "Not Provided";

            // Inside your admin row generation loop:
tr.innerHTML = `
    <td style="padding: 12px; font-weight: 700; color: var(--text-dark);">${row.company_name || 'Filing Profile Target'}</td>
    <td style="padding: 12px; color: var(--text-muted); font-family: monospace;">${clientEmailAddress}</td>
    <td style="padding: 12px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); font-size: 0.75rem;">
        ${row.service_title || 'Compliance Filing'} <span style="color: var(--staff-red);">(${row.plan_tier || 'Starter'})</span>
    </td>
    <td style="padding: 12px; font-weight: 700; color: var(--emerald);">$${parseFloat(row.total_fee || 0).toFixed(2)}</td>
    <td style="padding: 12px; text-align: right;">
        <!-- ✅ MAP ATTRIBUTES TO INLINE LINK HANDLER -->
        <button type="button" 
            onclick="window.executeAdminInspectorFlyoutRowLink(this)" 
            data-title="${row.service_title || 'General Filing'}"
            data-token="${row.tracking_number || ''}"
            data-company="${row.company_name || 'Filing Target'}"
            data-amount="${parseFloat(row.total_fee || 0)}"
            style="cursor: pointer; background: var(--text-dark); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
            <i class="fa-solid fa-folder-open"></i> View Row
        </button>
    </td>
`;

            targetBox.appendChild(tr);
        });

    } catch (ledgerError) {
        console.error("[Fatal Sales Ledger Execution Interception]", ledgerError);
        targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #ef4444; font-weight: 600;">✕ Data sync failed to hydrate rows.</td></tr>`;
    }
}

})();

// ============================================================================ //
// 📁 MODULE CARD: CORE METRICS DATA MAPPING & INSPECTOR MODALS CONTROLLER      //
// ============================================================================ //

// --- MODAL DISPLAY SYSTEM CONTROL LOGIC ---
window.executeAdminInspectorFlyoutRowLink = function(buttonNode) {
    // 🟢 FIXED ALIGNMENT: Removed non-existent buttonElement lookup to clean crash trace loops
    if (!buttonNode) return;
    
    const title = buttonNode.getAttribute("data-title");
    const token = buttonNode.getAttribute("data-token");
    const company = buttonNode.getAttribute("data-company");
    const amount = parseFloat(buttonNode.getAttribute("data-amount")) || 0;
    
    window.revealFilingDetailModal(title, token, company, amount);
};

window.revealFilingDetailModal = function(title, trackingNum, company, amount) {
    const modal = document.getElementById("filingDetailModal");
    const targetHeader = document.getElementById("modalHeaderFilingTitle");
    const displayTarget = document.getElementById("modalMetadataDisplayTarget");
    
    if (!modal || !displayTarget) return;
    if (targetHeader) targetHeader.textContent = company;
    
    displayTarget.innerHTML = `
        <div style="line-height: 1.6; display: flex; flex-direction: column; gap: 10px; text-align: left;">
            <div><strong>Target Corporate Client:</strong> <span style="font-weight: 600; color: var(--text-dark);">${company}</span></div>
            <div><strong>Fulfillment Descriptor Line:</strong> <span>${title}</span></div>
            <div><strong>F4U Processing Token:</strong> <span style="font-family: monospace; font-weight: 700;">${trackingNum}</span></div>
            <div><strong>Settled Price Value:</strong> <span style="color: #10b981; font-weight: 700;">$${amount.toFixed(2)}</span></div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">This operational database object payload is compiled, synchronized, and mirrored live from your production ledger architecture.</div>
        </div>
    `;
    modal.style.display = "flex";
};

window.closeFilingDetailModal = function() {
    const modal = document.getElementById("filingDetailModal");
    if (modal) modal.style.display = "none";
};
