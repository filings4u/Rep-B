// ============================================================================
// 📁 MODULE CARD: ADMINISTRATIVE DASHBOARD LAYOUT & CARD SANITIZER MATRIX
// ============================================================================
(function clearDuplicateAdminCards() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    executeAdministrativeLayoutSanitization();
  });

  function executeAdministrativeLayoutSanitization() {
    console.log("[Layout Sanitizer] Scanning active view template layers for duplicate nodes...");

    // 1. Target by explicit text content to avoid deleting your true operational panels
    const viewHeaders = document.querySelectorAll('h2');
    viewHeaders.forEach(headerNode => {
      if (headerNode.textContent && headerNode.textContent.includes("Enterprise Sync Operations Console")) {
        // Find the outermost card division layout element container securely
        const duplicateStretchedCard = headerNode.closest('.content-panel.visual-card') || 
                                       headerNode.closest('.console-card') || 
                                       headerNode.parentElement;
                                       
        if (duplicateStretchedCard) {
          console.warn("🧹 Layout Engine: Permanently removed duplicate stretched console card container block.");
          duplicateStretchedCard.remove();
        }
      }
    });

    // 2. Secondary cleanup pass matching layout style parameters
    const layoutDivs = document.querySelectorAll('div[style*="width"], .console-card, .content-container div');
    layoutDivs.forEach(elementNode => {
      if (elementNode.textContent && elementNode.textContent.includes("Filing Milestones")) {
        // Check if it's an accidental clone by evaluating its sibling positioning elements
        if (elementNode.style.width.includes("calc") || elementNode.parentElement.childElementCount > 4) {
          console.warn("🧹 Layout Engine: Erased extra milestone alignment elements block safely.");
          elementNode.remove();
        }
      }
    });
  }

  // Fallback direct execution loop check if DOM states complete early
  if (document.readyState !== 'loading') {
    executeAdministrativeLayoutSanitization();
  }
})();
