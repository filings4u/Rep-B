/**
 * 📁 FILE PATH: assets/js/admin-navigation.js
 * Responsibility: Mobile Navbar Row (Far-Left Logo, Far-Right Toggle with 3 Lines)
 * Supporting: Full Accordion Collapsible Logic preservation in Mobile View
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeAccordionMobileNavigationRow();
  });

  function initializeAccordionMobileNavigationRow() {
    const portalSidebar = document.querySelector(".portal-sidebar");
    
    if (!portalSidebar) {
      console.error("✕ Navigation Error: Missing core '.portal-sidebar' layout template wrapper node.");
      return;
    }

    // ============================================================================ //
    // 🧱 STAGE 1: INJECT CLEAN ROW CSS STYLES WITH ACCORDION PRESERVATION        //
    // ============================================================================ //
    const inlineMobileStyles = document.createElement("style");
    inlineMobileStyles.textContent = `
      /* Clear mobile navbar row wrapper layout styles */
      .mobile-navbar-row {
        display: none;
        width: 100% !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        border-bottom: 1px solid #e2e8f0 !important;
        padding: 16px 20px !important;
        align-items: center !important;
        justify-content: space-between !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 2000 !important;
        height: 70px !important;
      }

      .mobile-logo-box {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }

      .mobile-logo-box img {
        height: 32px !important;
        width: auto !important;
      }

      /* Clean far-right same-row menu toggle button action with 3 lines */
      .mobile-menu-action-toggle {
        background: #0f172a !important;
        color: #ffffff !important;
        border: none !important;
        padding: 8px 16px !important;
        font-size: 0.82rem !important;
        font-weight: 700 !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        height: 38px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        gap: 8px !important;
      }

      /* Structural 3-line hamburger layout icon grid box */
      .hamburger-icon-lines {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 14px;
        height: 10px;
      }

      .hamburger-icon-lines span {
        display: block;
        width: 100%;
        height: 2px;
        background-color: #ffffff;
        border-radius: 1px;
        transition: transform 0.2s, opacity 0.2s;
      }

      /* Mobile drop-down vertical stack wrapper grid */
      .mobile-expanded-links-wrapper {
        display: none;
        position: fixed !important;
        top: 70px !important;
        left: 0 !important;
        width: 100vw !important;
        height: calc(100vh - 70px) !important;
        background: #ffffff !important;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important;
        z-index: 1999 !important;
        padding: 16px 20px !important;
        box-sizing: border-box !important;
        overflow-y: auto !important;
      }

      .mobile-expanded-links-wrapper.active {
        display: block !important;
      }

      /* Reinject native layout styles for accordion elements inside mobile view */
      .mobile-expanded-links-wrapper .accordion-trigger {
        margin-top: 8px !important;
        background: #f8fafc !important;
      }

      .mobile-expanded-links-wrapper .accordion-panel {
        padding-left: 8px !important;
      }

      /* 📱 STRICT Breakpoint: Override layout scaling rules under 991px screen width */
      @media (max-width: 991px) {
        .mobile-navbar-row {
          display: flex !important;
        }
        .portal-sidebar {
          display: none !important;
        }
        .portal-header {
          display: none !important;
        }
        .portal-main {
          margin-left: 0 !important;
          margin-top: 70px !important; /* Displaces content cleanly below fixed row header */
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(inlineMobileStyles);

    // ============================================================================ //
    // 🏗️ STAGE 2: ASSEMBLE COMPONENT ROW TREE AND CLONE SIDEBAR NAV CLUSTER       //
    // ============================================================================ //
    // 1. Build main mobile header navigation parent row element wrapper
    const mobileNavbarRow = document.createElement("div");
    mobileNavbarRow.className = "mobile-navbar-row";

    // 2. Build and mount far-left logo box container elements layout
    const logoBox = document.createElement("div");
    logoBox.className = "mobile-logo-box";
    
    const logoImg = document.createElement("img");
    logoImg.src = "images/logo.png";
    logoImg.alt = "filings4u Logo";
    
    logoBox.appendChild(logoImg);
    mobileNavbarRow.appendChild(logoBox);

    // 3. Build far-right menu button action switch component with 3 horizontal lines
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "mobile-menu-action-toggle";
    toggleButton.innerHTML = `
      <div class="hamburger-icon-lines">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="toggle-button-label-text">Menu</span>
    `;
    mobileNavbarRow.appendChild(toggleButton);

    // 4. Build mobile drop-down menu container wrapper
    const linksDropdownStack = document.createElement("div");
    linksDropdownStack.className = "mobile-expanded-links-wrapper";

    // ✅ FIXED ACTION: Pull and clone the original nav element cluster to preserve accordion logic completely
    const sidebarNavMenuSource = portalSidebar.querySelector(".sidebar-accordion-menu");
    if (sidebarNavMenuSource) {
      const clonedNavMenu = sidebarNavMenuSource.cloneNode(true);
      linksDropdownStack.appendChild(clonedNavMenu);

      // Re-bind the layout link active triggers inside the cloned node element structure
      const clonedNavItems = clonedNavMenu.querySelectorAll(".nav-item");
      clonedNavItems.forEach(item => {
        item.addEventListener("click", () => {
          linksDropdownStack.classList.remove("active");
          resetToggleButtonToDefaultState(toggleButton);
        });
      });
    }

    // Append built nodes securely to your body container wrapper layers
    document.body.appendChild(mobileNavbarRow);
    document.body.appendChild(linksDropdownStack);

    // ============================================================================ //
    // 🎛️ STAGE 3: ATTACH CLICK STATE EVENT SWITCH TO TOGGLE MENU BUTTONS          //
    // ============================================================================ //
    toggleButton.addEventListener("click", (e) => {
      e.stopPropagation();
      
      if (linksDropdownStack.classList.contains("active")) {
        linksDropdownStack.classList.remove("active");
        resetToggleButtonToDefaultState(toggleButton);
      } else {
        linksDropdownStack.classList.add("active");
        setToggleButtonToActiveCloseState(toggleButton);
      }
    });

    function resetToggleButtonToDefaultState(btn) {
      const label = btn.querySelector(".toggle-button-label-text");
      if (label) label.textContent = "Menu";
      btn.style.background = "#0f172a";
      document.body.style.overflow = ""; // Restores scroll
    }

    function setToggleButtonToActiveCloseState(btn) {
      const label = btn.querySelector(".toggle-button-label-text");
      if (label) label.textContent = "Close";
      btn.style.background = "#c15254"; // Matches admin dashboard accent styling
      document.body.style.overflow = "hidden"; // Locks screen background scroll
    }

    // Close the navigation drop area automatically if general desktop layout canvas area is clicked
    document.addEventListener("click", (e) => {
      if (!linksDropdownStack.contains(e.target) && !toggleButton.contains(e.target)) {
        linksDropdownStack.classList.remove("active");
        resetToggleButtonToDefaultState(toggleButton);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 991) {
        linksDropdownStack.classList.remove("active");
        resetToggleButtonToDefaultState(toggleButton);
      }
    }, { passive: true });

    console.log("✅ Mobile accordion navigation row compiled with three horizontal line icons.");
  }
})();
