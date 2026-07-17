// ============================================================================ //
// 📁 LEDGER MODULAR COMPONENT: GLOBAL CORPORATE SALES PRICING MATRIX           //
// ============================================================================ //
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        syncGlobalSalesPricingLedger();
    });

    async function syncGlobalSalesPricingLedger() {
    const targetBox = document.getElementById("admin-global-sales-target-box");
    if (!targetBox) return;

    // 🎯 CRITICAL ALIGNMENT: Direct lookup to your authentic running instance
    const client = window.supabaseInstance || window.supabase || window.supabaseClient;

    if (!client || typeof client.from !== 'function') {
        console.warn("⚠️ Sales Ledger Intercept: Active client system instance not ready.");
        return;
    }

    try {
        // Fetch every active order entry row cleanly using the verified client
        const { data: salesLedger, error } = await client
            .from('orders')
            .select('company_name, service_title, plan_tier, total_fee, tracking_number, collected_payload_metadata')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!salesLedger || salesLedger.length === 0) {
            targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No corporate sales records discovered inside data layers.</td></tr>`;
            return;
        }

        targetBox.innerHTML = ""; // Wipe loading indicators placeholder safely

        salesLedger.forEach(row => {
            const tr = document.createElement("tr");
            tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem;";

            const metadata = row.collected_payload_metadata || {};
            const clientEmailAddress = metadata.wiz_client_email || metadata.email || "Not Provided";

            tr.innerHTML = `
                <td style="padding: 12px; font-weight: 700; color: var(--text-dark);">${row.company_name || 'Filing Profile Target'}</td>
                <td style="padding: 12px; color: var(--text-muted); font-family: monospace;">${clientEmailAddress}</td>
                <td style="padding: 12px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); font-size: 0.75rem;">
                    ${row.service_title || 'Compliance Filing'} 
                    <span style="color: var(--staff-red);">(${row.plan_tier || 'Starter'})</span>
                </td>
                <td style="padding: 12px; font-weight: 700; color: var(--emerald);">$${parseFloat(row.total_fee || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right;">
                    <button type="button" onclick="executeAdminActionReview('${row.tracking_number}')" style="cursor: pointer; background: var(--text-dark); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
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
