// ============================================================================
// 🎯 MODULAR ASSET: SIDEBAR ACCORDION OPEN/CLOSE INTERACTION ENGINES
// ============================================================================
(function() {
  "use strict";

  window.toggleSidebarAccordion = function(buttonElement) {
    if (!buttonElement) return;

    const targetPanel = buttonElement.nextElementSibling;
    if (!targetPanel || !targetPanel.classList.contains("accordion-panel")) return;

    const chevronIcon = buttonElement.querySelector(".chevron");
    const isExpanded = buttonElement.classList.contains("active");

    const parentNavContainer = buttonElement.parentElement;
    if (parentNavContainer) {
      const allTriggers = parentNavContainer.querySelectorAll(".accordion-trigger");
      allTriggers.forEach(otherButton => {
        // 🟢 FIXED ALIGNMENT: Renamed typo variable to match parent argument mapping cleanly
        if (otherButton !== buttonElement) {
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

    if (isExpanded) {
      buttonElement.classList.remove("active");
      if (chevronIcon) chevronIcon.textContent = "▼";
      targetPanel.style.maxHeight = null;
    } else {
      buttonElement.classList.add("active");
      targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
    }
  };
})();
