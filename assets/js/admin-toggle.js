
  /**
   * 📱 PORTAL MOBILE SIDEBAR LAYOUT OVERLAY INTERACTORS
   */
  function toggleMobileSidebarMenuOverlay() {
      if (window.innerWidth > 992) return;
      const sidebar = document.querySelector(".portal-sidebar");
      const icon = document.getElementById("mobileNavTriggerIcon");
      if (!sidebar) return;
      sidebar.classList.toggle("mobile-revealed");
      if (sidebar.classList.contains("mobile-revealed")) {
          if (icon) icon.textContent = "✕";
      } else {
          if (icon) icon.textContent = "☰";
      }
  }