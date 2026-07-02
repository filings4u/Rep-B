// ============================================================================
// 🎯 MODULAR ASSET: SIDEBAR ACCORDION OPEN/CLOSE INTERACTION ENGINES
// ============================================================================
(function() {
  // Bind your accordion function explicitly to the window ecosystem
  window.toggleSidebarAccordion = function(buttonElement) {
    if (!buttonElement) return;

    // Discover the panel immediately following the clicked button row
    const targetPanel = buttonElement.nextElementSibling;
    if (!targetPanel || !targetPanel.classList.contains("accordion-panel")) return;

    const chevronIcon = buttonElement.querySelector(".chevron");
    const isExpanded = buttonElement.classList.contains("active");

    // Close all other accordion groups to preserve clear sidebar real estate
    const parentNavContainer = buttonElement.parentElement;
    if (parentNavContainer) {
      const allTriggers = parentNavContainer.querySelectorAll(".accordion-trigger");
      allTriggers.forEach(otherButton => {
        if (otherTriggerButton !== buttonElement) {
          otherButton.classList.remove("active");
          
          const otherChevron = otherButton.querySelector(".chevron");
          if (otherChevron) otherChevron.textContent = "▼";
          
          const otherPanel = otherButton.nextElementSibling;
          if (otherPanel && otherPanel.classList.contains("accordion-panel")) {
            otherPanel.style.maxHeight = null;
          }
        }
      });
    }

    // Toggle current group states smoothly
    if (isExpanded) {
      buttonElement.classList.remove("active");
      if (chevronIcon) chevronIcon.textContent = "▼";
      targetPanel.style.maxHeight = null;
    } else {
      buttonElement.classList.add("active");
      if (chevronIcon) chevronIcon.textContent = "▲";
      // Force programmatic pixel heights dynamically based on actual child elements size
      targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
    }
  };
})();
