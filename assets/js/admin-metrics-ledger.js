// ============================================================================
// 📁 MODULE CARD: CORE METRICS DATA MAPPING & INSPECTOR MODALS CONTROLLER
// ============================================================================
(function() {
  "use strict";

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
})();
