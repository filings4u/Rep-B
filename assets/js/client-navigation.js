/**
 * 🏢 INTERFACE NAVIGATION MATRIX DRIVER
 * Manages sidebars, layout accordion tabs, and navigation highlighting.
 */
(function initializeNavigationFramework() {
  "use strict";

  // Expose toggle logic directly to inline onclick parameters cleanly
  window.toggleSidebarAccordion = function (buttonElement) {
    if (!buttonElement) return;
    const isTargetAlreadyOpen = buttonElement.classList.contains('active');
    const menuSidebarRoot = buttonElement.closest('.sidebar-accordion-menu');

    // Retract any open sibling accordion panels safely
    if (menuSidebarRoot) {
      menuSidebarRoot.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.classList.remove('active');
        const chevronNode = trigger.querySelector('.chevron');
        if (chevronNode) chevronNode.textContent = "▼";
        const openPanel = trigger.nextElementSibling;
        if (openPanel && openPanel.classList.contains('accordion-panel')) {
          openPanel.style.maxHeight = "0px";
        }
      });
    }

    // Expand the selected sidebar folder if it wasn't already open
    if (!isTargetAlreadyOpen) {
      buttonElement.classList.add('active');
      const targetChevron = buttonElement.querySelector('.chevron');
      if (targetChevron) targetChevron.textContent = "▲";
      const targetPanel = buttonElement.nextElementSibling;
      if (targetPanel && targetPanel.classList.contains('accordion-panel')) {
        targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
      }
    }
  };

  // Expose mobile responsive overlay layout toggle parameters
  window.toggleMobileSidebarMenuOverlay = function () {
    if (window.innerWidth > 992) return;
    const sidebar = document.querySelector(".portal-sidebar");
    const icon = document.getElementById("mobileNavTriggerIcon");
    if (!sidebar) return;

    sidebar.classList.toggle("mobile-revealed");
    if (icon) {
      icon.textContent = sidebar.classList.contains("mobile-revealed") ? "✕" : "☰";
    }
  };

  // Sync menu link highlights with current route on document compile
  document.addEventListener("DOMContentLoaded", function () {
    const rawPath = window.location.pathname.replace(/\/$/, "");
    const baseName = rawPath.split("/").pop() || "client-dashboard.html";
    const currentRouteToken = baseName.split("?")[0].split("#")[0];

    document.querySelectorAll(`.sidebar-accordion-menu a[href="${CSS.escape(currentRouteToken)}"]`).forEach(link => {
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      link.classList.add('active');

      const matchingPanel = link.closest('.accordion-panel');
      if (matchingPanel) {
        matchingPanel.style.maxHeight = matchingPanel.scrollHeight + "px";
        const folderTrigger = matchingPanel.previousElementSibling;
        if (folderTrigger && folderTrigger.classList.contains('accordion-trigger')) {
          folderTrigger.classList.add('active');
          const chevronSpan = folderTrigger.querySelector('.chevron');
          if (chevronSpan) chevronSpan.textContent = "▲";
        }
      }
    });
  });
})();


