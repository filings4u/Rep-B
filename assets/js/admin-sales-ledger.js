/**
 * 📁 FILE PATH: admin-sales-ledger.js
 * Responsibility: Fetch Production Entity Records globally and control flyout detail modals
 */
(function() {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        syncGlobalSalesPricingLedger();
    });

    async function syncGlobalSalesPricingLedger() {
        // 🚀 Poll live against the window namespace until your connection driver is active
        if (!window.supabaseInstance || typeof window.supabaseInstance.from !== 'function') {
            setTimeout(syncGlobalSalesPricingLedger, 150);
            return;
        }

        const targetBox = document.getElementById("admin-global-sales-target-box");
        if (!targetBox) return;

        const client = window.supabaseInstance;

        try {
            // Fetch every corporate entity row globally across the platform
            const { data: entities, error } = await client
                .from('entities')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!entities || entities.length === 0) {
                targetBox.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">No corporate entity master records found inside database layers.</td></tr>`;
                return;
            }

            targetBox.innerHTML = ""; // Clear out stale interface elements securely
            
            entities.forEach(row => {
                const tr = document.createElement("tr");
                tr.style.cssText = "border-bottom: 1px solid var(--border-color); font-size: 0.85rem;";
                
                // Set standing structural status badges matching your admin styling parameters
                let badgeBg = '#e2e8f0';
                let badgeColor = '#475569';
                if (row.status === 'Active' || row.status === 'Good Standing') {
                    badgeBg = '#e6f4ea';
                    badgeColor = '#137333';
                }

                tr.innerHTML = `
                    <td style="padding: 12px; font-weight: 700; color: var(--text-dark);">${window.escapeTimelineHTML(row.entity_name || 'Filing Target')}</td>
                    <td style="padding: 12px; color: var(--text-muted); font-family: monospace; text-transform: uppercase; font-weight: bold;">
                        ${window.escapeTimelineHTML(row.state_jurisdiction || 'DE')}
                    </td>
                    <td style="padding: 12px; font-weight: 600; color: var(--text-muted);">
                        ${window.escapeTimelineHTML(row.structure_type || 'LLC')}
                    </td>
                    <td style="padding: 12px;"><span style="background:${badgeBg}; color:${badgeColor}; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">${window.escapeTimelineHTML(row.status || 'Active')}</span></td>
                    <td style="padding: 12px; text-align: right;">
                        
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

    // --- MODAL DISPLAY SYSTEM CONTROL LOGIC ---
    window.executeAdminInspectorFlyoutRowLink = function(buttonNode) {
        if (!buttonNode) return;
        
        const company = buttonNode.getAttribute("data-company");
        const jurisdiction = buttonNode.getAttribute("data-jurisdiction");
        const structure = buttonNode.getAttribute("data-structure");
        const status = buttonNode.getAttribute("data-status");
        const entityId = buttonNode.getAttribute("data-entity-id");
        
        window.revealFilingDetailModal(company, jurisdiction, structure, status, entityId);
    };

    window.revealFilingDetailModal = function(company, jurisdiction, structure, status, entityId) {
        const modal = document.getElementById("filingDetailModal");
        const targetHeader = document.getElementById("modalHeaderFilingTitle");
        const displayTarget = document.getElementById("modalMetadataDisplayTarget");
        
        if (!modal || !displayTarget) return;
        if (targetHeader) targetHeader.textContent = company;
        
        displayTarget.innerHTML = `
            <div style="line-height: 1.6; display: flex; flex-direction: column; gap: 10px; text-align: left; font-family: sans-serif;">
                <div><strong>Target Corporate Client:</strong> <span style="font-weight: 600; color: var(--text-dark);">${window.escapeTimelineHTML(company)}</span></div>
                <div><strong>State Jurisdiction Area:</strong> <span style="text-transform: uppercase; font-weight: 700;">${window.escapeTimelineHTML(jurisdiction)}</span></div>
                <div><strong>Fulfillment Entity Structure:</strong> <span>${window.escapeTimelineHTML(structure)}</span></div>
                <div><strong>Standing Profile Status:</strong> <span style="font-weight: 700; color: #10b981;">${window.escapeTimelineHTML(status)}</span></div>
                <div><strong>Database Reference Token:</strong> <span style="font-family: monospace; font-size: 0.75rem; color: #64748b;">${entityId}</span></div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
                <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">This operational database object payload is compiled, synchronized, and mirrored live from your production public.entities schema architecture.</div>
            </div>
        `;
        modal.style.display = "flex";
    };

    window.closeFilingDetailModal = function() {
        const modal = document.getElementById("filingDetailModal");
        if (modal) modal.style.display = "none";
    };
})();
