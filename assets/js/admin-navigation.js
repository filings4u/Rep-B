/**
 * 📁 FILE PATH: assets/js/admin-navigation.js (Part 1)
 * Responsibility: Mobile Header CSS Styles & Core Layout Overrides
 */
(function() {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initializeAccordionMobileNavigationRow();
  });

  function initializeAccordionMobileNavigationRow() {
    const portalSidebar = document.querySelector(".portal-sidebar");
    if (!portalSidebar) return;

    // Inject the responsive stylesheet overrides directly into the page head
    const inlineMobileStyles = document.createElement("style");
    inlineMobileStyles.textContent = `
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
      .mobile-logo-box { display: flex !important; align-items: center !important; }
      .mobile-logo-box img { height: 32px !important; width: auto !important; }
      
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
        gap: 8px !important;
      }
      .hamburger-icon-lines {
        display: flex; flex-direction: column; justify-content: space-between;
        width: 14px; height: 10px;
      }
      .hamburger-icon-lines span {
        display: block; width: 100%; height: 2px;
        background-color: #ffffff; border-radius: 1px;
      }
      .mobile-expanded-links-wrapper {
        display: none; position: fixed !important;
        top: 70px !important; left: 0 !important; width: 100vw !important;
        height: calc(100vh - 70px) !important; background: #ffffff !important;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important;
        z-index: 1999 !important; padding: 16px 20px !important;
        box-sizing: border-box !important; overflow-y: auto !important;
      }
      .mobile-expanded-links-wrapper.active { display: block !important; }
      
      /* Mobile Accordion Component Framework Elements Layout */
      .mobile-expanded-links-wrapper .accordion-trigger {
        width: 100% !important; background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important; padding: 10px 14px !important;
        font-size: 0.72rem !important; font-weight: 700 !important;
        color: #475569 !important; text-transform: uppercase !important;
        display: flex !important; align-items: center !important;
        justify-content: space-between !important; cursor: pointer !important;
        border-radius: 6px !important; margin-top: 10px !important; outline: none !important;
      }
      .mobile-expanded-links-wrapper .accordion-panel {
        max-height: 0; overflow: hidden !important;
        transition: max-height 0.25s ease-out !important;
        padding-left: 8px !important; box-sizing: border-box !important;
      }
      .mobile-expanded-links-wrapper .nav-item {
        display: flex !important; align-items: center !important; gap: 8px !important;
        padding: 10px 12px !important; color: #475569 !important; text-decoration: none !important;
        font-size: 0.85rem !important; font-weight: 600 !important;
        border-radius: 6px !important; margin-top: 4px !important;
      }
      .mobile-expanded-links-wrapper .nav-item.active {
        background: rgba(16, 185, 129, 0.08) !important; color: #10b981 !important;
      }
      @media (max-width: 991px) {
        .mobile-navbar-row { display: flex !important; }
        .portal-sidebar, .portal-header { display: none !important; }
        .portal-main { margin-left: 0 !important; margin-top: 70px !important; width: 100% !important; }
      }
    `;
    document.head.appendChild(inlineMobileStyles);
    // ============================================================================ //
    // 🏗️ STAGE 2: ASSEMBLE COMPONENT ROW TREE AND CLONE DESKTOP LINKS OVER        //
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

    // 4. Build mobile drop-down menu container wrapper panel grid
    const linksDropdownStack = document.createElement("div");
    linksDropdownStack.className = "mobile-expanded-links-wrapper";

    // Clone the menu cluster directly to preserve the accordion nodes tree
    const sidebarNavMenuSource = portalSidebar.querySelector(".sidebar-accordion-menu");
    if (sidebarNavMenuSource) {
      const clonedNavMenu = sidebarNavMenuSource.cloneNode(true);
      linksDropdownStack.appendChild(clonedNavMenu);

      // Re-bind click handlers inside the cloned layout stream to close the panel on select
      const mobileNavItems = clonedNavMenu.querySelectorAll(".nav-item");
      mobileNavItems.forEach(item => {
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
    // 🎛️ STAGE 3: BIND ACCORDIONS DIRECTLY & ATTACH MENU TOGGLE SWITCH RUNTIMES    //
    // ============================================================================ //
    if (sidebarNavMenuSource) {
      const mobileTriggers = linksDropdownStack.querySelectorAll(".accordion-trigger");
      
      mobileTriggers.forEach(triggerBtn => {
        // Strip out old desktop parameters to stop function collisions
        triggerBtn.removeAttribute("onclick");
        
        const chevron = triggerBtn.querySelector(".chevron");
        if (chevron) chevron.textContent = "▼";

        triggerBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          this.classList.toggle("active");
          
          const panel = this.nextElementSibling;
          const indicator = this.querySelector(".chevron");
          
          if (panel && panel.style) {
            if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
              panel.style.maxHeight = "0px";
              if (indicator) indicator.textContent = "▼";
            } else {
              panel.style.maxHeight = panel.scrollHeight + "px";
              if (indicator) indicator.textContent = "▲";
            }
          }
        });
      });
    }

    // Toggle menu dropdown open or closed on far-right header button clicks
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
      document.body.style.overflow = ""; 
    }

    function setToggleButtonToActiveCloseState(btn) {
      const label = btn.querySelector(".toggle-button-label-text");
      if (label) label.textContent = "Close";
      btn.style.background = "#c15254"; 
      document.body.style.overflow = "hidden"; 
    }

    // Auto-close dropdown if you click outside the open container
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

    console.log("✅ Mobile navigation row compiled completely with active accordions.");
  }
})();
