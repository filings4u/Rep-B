/**
 * 📱 MOBILE RESPONSIVE ADAPTABILITY MATRIX DRIVER
 * Synchronized with filings4u customer portal core architecture frameworks.
 */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // Dispatch responsive view initialization sequences
  createMobileNavbarControls();
});

/**
 * 🛠️ DOM STRUCTURE METRICS CONTROL ASSEMBLY
 * Programmatically constructs interaction toggles and intercepts event paths cleanly.
 */
function createMobileNavbarControls() {
  "use strict";

  const headerWrapper = document.querySelector(".portal-header");
  if (!headerWrapper) {
    // Throw an explicit system error if layout files are built without standard administrative headers
    throw new Error("Viewport Structure Exception: Mandatory layout element .portal-header missing from active view tree.");
  }

  // Verify if a toggle node asset instance was already compiled to prevent duplicates
  if (document.getElementById("mobilePortalNavTrigger")) return;

  // Create optimized interaction button element containers programmatically
  const structuralToggle = document.createElement("button");
  structuralToggle.id = "mobilePortalNavTrigger";
  structuralToggle.className = "mobile-toggle-btn";
  structuralToggle.innerHTML = "☰";
  structuralToggle.setAttribute("aria-label", "Toggle Application Navigation Menu Layer");

  // Inject structural interaction trigger node element at head of active header layout wrapper
  headerWrapper.insertBefore(structuralToggle, headerWrapper.firstChild);

  structuralToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    
    const dynamicSidebar = document.querySelector(".portal-sidebar");
    if (!dynamicSidebar) {
      throw new Error("Viewport Structure Exception: Core navigation asset .portal-sidebar missing from current template compilation.");
    }

    // Toggle multi-class attributes cleanly to align across various device viewports
    dynamicSidebar.classList.toggle("mobile-open");
    dynamicSidebar.classList.toggle("mobile-revealed");
  });

  // Structural Interception: Click outside tracking handler loop to safely dismiss overlay drawers
  document.addEventListener("click", function (e) {
    const dynamicSidebar = document.querySelector(".portal-sidebar");
    if (!dynamicSidebar) return;

    const navIsOpen = dynamicSidebar.classList.contains("mobile-open") || dynamicSidebar.classList.contains("mobile-revealed");

    if (navIsOpen) {
      // If click falls outside navigation limits, strip classes to retract side views immediately
      if (!dynamicSidebar.contains(e.target) && e.target.id !== "mobilePortalNavTrigger") {
        dynamicSidebar.classList.remove("mobile-open");
        dynamicSidebar.classList.remove("mobile-revealed");
      }
    }
  });
}
