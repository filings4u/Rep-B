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

        // 🎯 CRITICAL FIX 1: Add window.supabaseInstance to establish the active database connection
        let supabaseClient = window.supabaseInstance || window.supabase || window.supabaseClient || window.window.sb;

        // Validation check: Stops crashes if the setup script sequence experiences latency delays
        if (!supabaseClient || typeof supabaseClient.from !== 'function') {
            console.warn("⚠️ Sales Ledger Intercept: Database pipeline connectivity layer not ready yet.");
            return;
        }

        try {
            // Fetch every active order entry row cleanly
            const { data: salesLedger, error } = await supabaseClient
                .from('orders')
                .select('company_name, service_title, plan_tier, total_fee, tracking_number, collected_payload_metadata')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!salesLedger || salesLedger.length === 0) {
                targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No corporate sales records discovered inside data layers.</td></tr>`;
                return;
            }

            targetBox.innerHTML = ""; // Wipe loading indicators placeholder safely

            // Render items matching your original layout boundaries precisely
            salesLedger.forEach(row => {
                const tr = document.createElement("tr");
                tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem;";

                // 🎯 CRITICAL FIX 2: Swap row.collected_payload_metadata.email for your true wiz_client_email schema key name
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

            // Bind a global fallback function for the click buttons pass
            window.executeAdminActionReview = function(trackingToken) {
                if (!trackingToken) return;
                console.log(`[Admin Desk Action Triggered] Reviewing tracking number: ${trackingToken}`);
                // Redirect cleanly to details card panels or audit workspace folders
                window.location.href = `admin-service-manager.html?token=${encodeURIComponent(trackingToken)}`;
            };

        } catch (ledgerError) {
            console.error("[Fatal Sales Ledger Execution Interception]", ledgerError);
            targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #ef4444; font-weight: 600;">✕ Data sync failed to hydrate rows.</td></tr>`;
        }
    }
})();
