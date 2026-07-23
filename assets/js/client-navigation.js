/**
 * filings4u Client Portal Unified Layout & Navigation Lifecycle Engine
 * Handles collapsible static desktop sidebars and non-disruptive mobile absolute dropdowns.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. Locate primary platform geometric parent containers
  const portalMain = document.querySelector(".portal-main");
  const dashboardWrapper = document.querySelector(".dashboard-wrapper");
  
  if (!portalMain || !dashboardWrapper) {
    console.warn("✕ Navigation Interrupted: Core structural layout targets '.portal-main' or '.dashboard-wrapper' missing.");
    return;
  }

  // 2. Identify the active page path name string to apply instant highlight styles
  const activePagePath = window.location.pathname.split("/").pop() || "client-dashboard.html";

  // --- STAGE A: INJECT SYSTEM RESPONSIVE CSS STYLING OVERRIDES ---
  const structuralNavigationStyles = document.createElement("style");
  structuralNavigationStyles.innerHTML = `
    /* ========================================== Desktop Layout Transitions ========================================== */
    .portal-sidebar { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, border-right 0.3s ease !important; overflow-y: auto !important; overflow-x: hidden !important; }
    .portal-main { transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    
    #f4uSidebarCollapseToggleHandle { width: 100%; background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; outline: none; margin-bottom: 10px; box-sizing: border-box; transition: all 0.15s ease; }
    #f4uSidebarCollapseToggleHandle:hover { background: #e2e8f0; color: #c15254; }
    
    /* Floating Widget Toggle Trigger Button (Appears only when Sidebar is fully closed) */
    #f4uSidebarFloatingRestoreWidget { position: fixed; bottom: 25px; left: -80px; width: 50px; height: 50px; background: #10b981; color: #ffffff; border: none; border-radius: 50%; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); z-index: 1500; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease; outline: none; }
    #f4uSidebarFloatingRestoreWidget:hover { transform: scale(1.08); background: #059669; }
    #f4uSidebarFloatingRestoreWidget.widget-visible-active { left: 25px !important; }

    /* ========================================== Mobile Navigation Dropdown Overlay Panels ========================================== */
    #f4uBrandedMobileNavToggleBar { display: none; width: 100%; align-items: center; justify-content: space-between; padding: 15px 20px; background: #ffffff; border-bottom: 1px solid #e2e8f0; box-sizing: border-box; height: 70px; }
    
    /* FIXED OVERLAY TRAY: Uses rounded corners, a smooth shadow, and absolute positioning to avoid page shifting */
    #f4uMobileDropdownContainerTray { display: none; position: absolute !important; top: 75px !important; left: 15px !important; width: calc(100% - 30px) !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) !important; padding: 20px !important; box-sizing: border-box !important; z-index: 2100 !important; }
    #f4uMobileDropdownContainerTray.tray-active-revealed { display: block !important; }

    @media (max-width: 991px) {
      #f4uBrandedMobileNavToggleBar { display: flex !important; }
      .portal-sidebar { display: none !important; }
      .portal-main { margin-left: 0 !important; width: 100% !important; }
      .portal-header { padding: 20px !important; flex-direction: column !important; gap: 14px !important; height: auto !important; align-items: flex-start !important; }
      .header-actions-wrapper { width: 100% !important; flex-wrap: wrap !important; justify-content: space-between !important; gap: 10px !important; }
      .search-input { width: 100% !important; }
      #f4uSidebarFloatingRestoreWidget { display: none !important; }
    }
  `;
  document.head.appendChild(structuralNavigationStyles);
  // --- STAGE B: INJECT STATIC COLLAPSIBLE DESKTOP SIDEBAR MENU ---
  const desktopSidebarNode = document.createElement("aside");
  desktopSidebarNode.className = "portal-sidebar";
  desktopSidebarNode.id = "f4uDesktopStaticSidebar";
  
  desktopSidebarNode.innerHTML = `
    <div class="sidebar-brand-block">
      <img src="images/logo.png" alt="filings4u" style="height: 35px !important; width: auto !important; object-fit: contain !important; display: block !important; margin: 0 auto !important;">
      <div><div class="admin-badge">Client Account</div></div>
    </div>
    <nav class="sidebar-accordion-menu">
      <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="account"> My Account <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="account">
          <a href="client-dashboard.html" class="nav-item d-link" data-page="client-dashboard.html">📊 Dashboard Home</a>
          <a href="client-entities.html" class="nav-item d-link" data-page="client-entities.html">🏢 My Registered Entities</a>
          <a href="client-services.html" class="nav-item d-link" data-page="client-services.html">🛠️ Order New Services</a>
        </div>
      </div>
      <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="compliance"> Filings & Compliance <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="compliance">
          <a href="client-filings.html" class="nav-item d-link" data-page="client-filings.html">⚙️ Active Orders</a>
          <a href="client-compliance.html" class="nav-item d-link" data-page="client-compliance.html">🛡️ Compliance Tracker</a>
          <a href="client-vault.html" class="nav-item d-link" data-page="client-vault.html">📂 Document Vault</a>
        </div>
      </div>
      <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="support"> Billing & Support <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="support">
          <a href="client-account.html" class="nav-item d-link" data-page="client-account.html">💰 My Account</a>
          <a href="client-order-history.html" class="nav-item d-link" data-page="client-order-history.html">💸 Order History</a>
          <a href="client-chat.html" class="nav-item d-link" data-page="client-chat.html">💬 Live Chat Support</a>
          <a href="client-ticket.html" class="nav-item d-link" data-page="client-ticket.html">🎫 Support Tickets</a>
          <a href="client-knowledgebase.html" class="nav-item d-link" data-page="client-knowledgebase.html">📰 Help Resources</a>
        </div>
      </div>
    </nav>
    <div class="sidebar-footer-lock" style="padding-top:10px !important;">
      <button id="f4uSidebarCollapseToggleHandle" title="Hide Navigation Sidebar Workspace Layout Bounds">◀ Hide Sidebar Menu</button>
      <button id="desktopPortalLogoutBtn" class="logout-btn">Log Out</button>
    </div>
  `;
  dashboardWrapper.prepend(desktopSidebarNode);

  // --- STAGE C: INJECT FLOATING RE-OPEN BALLOON WIDGET BUTTON ---
  const floatingWidgetNode = document.createElement("button");
  floatingWidgetNode.id = "f4uSidebarFloatingRestoreWidget";
  floatingWidgetNode.innerHTML = "☰";
  floatingWidgetNode.title = "Expand Side Navigation Menu Layout Canvas";
  document.body.appendChild(floatingWidgetNode);
  // --- STAGE D: INJECT BRANDED MOBILE HEADER BAR & DROPDOWN ACCORDION MENU ---
  if (headerNode) {
    // 1. Create the top bar interface toggle system
    const mobileBrandedBar = document.createElement("div");
    mobileBrandedBar.id = "f4uBrandedMobileNavToggleBar";
    mobileBrandedBar.innerHTML = `
      <img src="images/logo.png" alt="filings4u" style="height: 28px; width: auto; object-fit: contain;">
      <button id="f4uMobileMenuTextTriggerBtn" style="background: #e6f4ea; color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 700; cursor: pointer; outline: none; padding: 8px 14px; border-radius: 6px;">
        <span>☰</span> <span style="text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px;">Menu</span>
      </button>
    `;
    
    // 2. Create the standalone dropdown panel overlay tray with standard rounded corner variables
    const mobileDropdownTray = document.createElement("div");
    mobileDropdownTray.id = "f4uMobileDropdownContainerTray";
    mobileDropdownTray.innerHTML = `
      <nav class="sidebar-accordion-menu" style="padding: 0 !important;">
        <div class="accordion-group">
          <button class="accordion-trigger m-trigger" data-group="m-account"> My Account <span class="chevron">▼</span> </button>
          <div class="accordion-panel m-panel" data-group="m-account">
            <a href="client-dashboard.html" class="nav-item m-link" data-page="client-dashboard.html">📊 Dashboard Home</a>
            <a href="client-entities.html" class="nav-item m-link" data-page="client-entities.html">🏢 My Registered Entities</a>
            <a href="client-services.html" class="nav-item m-link" data-page="client-services.html">🛠️ Order New Services</a>
          </div>
        </div>
        <div class="accordion-group">
          <button class="accordion-trigger m-trigger" data-group="m-compliance"> Filings & Compliance <span class="chevron">▼</span> </button>
          <div class="accordion-panel m-panel" data-group="m-compliance">
            <a href="client-filings.html" class="nav-item m-link" data-page="client-filings.html">⚙️ Active Orders</a>
            <a href="client-compliance.html" class="nav-item m-link" data-page="client-compliance.html">🛡️ Compliance Tracker</a>
            <a href="client-vault.html" class="nav-item m-link" data-page="client-vault.html">📂 Document Vault</a>
          </div>
        </div>
        <div class="accordion-group">
          <button class="accordion-trigger m-trigger" data-group="m-support"> Billing & Support <span class="chevron">▼</span> </button>
          <div class="accordion-panel m-panel" data-group="m-support">
            <a href="client-account.html" class="nav-item m-link" data-page="client-account.html">💰 My Account</a>
            <a href="client-order-history.html" class="nav-item m-link" data-page="client-order-history.html">💸 Order History</a>
            <a href="client-chat.html" class="nav-item m-link" data-page="client-chat.html">💬 Live Chat Support</a>
            <a href="client-ticket.html" class="nav-item m-link" data-page="client-ticket.html">🎫 Support Tickets</a>
            <a href="client-knowledgebase.html" class="nav-item m-link" data-page="client-knowledgebase.html">📰 Help Resources</a>
          </div>
        </div>
        <button id="mobilePortalDrawerLogoutBtn" class="logout-btn" style="background:#0a1f44; color:#ffffff; width:100%; padding:12px; font-weight:700; border:none; border-radius:8px; cursor:pointer; margin-top:15px;">Log Out Session</button>
      </nav>
    `;

    // Inject mobile layers directly into the layout tree without disruption
    headerNode.parentNode.insertBefore(mobileBrandedBar, headerNode);
    headerNode.parentNode.insertBefore(mobileDropdownTray, headerNode);

    // Toggle Dropdown Panel visibility state smoothly on Menu button click
    mobileBrandedBar.querySelector("#f4uMobileMenuTextTriggerBtn").addEventListener("click", () => {
      mobileDropdownTray.classList.toggle("tray-active-revealed");
    });
  }
  // --- STAGE E: ATTACH ATOMIC INTERCEPTORS FOR GEOMETRIC DISPLACEMENTS ---
  const executePortalCanvasLayoutShift = (collapseFlag) => {
    if (collapseFlag) {
      // Direct string modifications bypass class registration delays completely
      desktopSidebarNode.style.width = "0px";
      desktopSidebarNode.style.padding = "0px";
      desktopSidebarNode.style.borderRight = "none";
      
      portalMain.style.marginLeft = "0px";
      portalMain.style.width = "100%";
      
      floatingWidgetNode.classList.add("widget-visible-active");
    } else {
      desktopSidebarNode.style.width = "260px";
      desktopSidebarNode.style.padding = "";
      desktopSidebarNode.style.borderRight = "1px solid var(--border-color)";
      
      portalMain.style.marginLeft = "260px";
      portalMain.style.width = "calc(100% - 260px)";
      
      floatingWidgetNode.classList.remove("widget-visible-active");
    }
  };

  document.getElementById("f4uSidebarCollapseToggleHandle")?.addEventListener("click", () => {
    executePortalCanvasLayoutShift(true);
  });
  
  floatingWidgetNode.addEventListener("click", () => {
    executePortalCanvasLayoutShift(false);
  });

  // --- STAGE F: HYDRATE INTERACTIVE LINK STATES AND ACCORDIONS ---
  const allPlatformLinks = document.querySelectorAll(".d-link, .m-link");
  allPlatformLinks.forEach(linkItem => {
    if (linkItem.getAttribute("data-page") === activePagePath) {
      linkItem.classList.add("active");
      linkItem.style.cssText = "background: rgba(16, 185, 129, 0.08) !important; color: #10b981 !important; font-weight: 700 !important;";
      
      const desktopPanel = linkItem.closest(".d-panel");
      if (desktopPanel) {
        desktopPanel.style.maxHeight = desktopPanel.scrollHeight + "px";
        const groupKey = desktopPanel.getAttribute("data-group");
        const matchingTrigger = document.querySelector(`.d-trigger[data-group="${groupKey}"]`);
        if (matchingTrigger) matchingTrigger.classList.add("active");
      }

      const mobilePanel = linkItem.closest(".m-panel");
      if (mobilePanel) {
        mobilePanel.style.maxHeight = mobilePanel.scrollHeight + "px";
        const mGroupKey = mobilePanel.getAttribute("data-group");
        const matchingMTrigger = document.querySelector(`.m-trigger[data-group="${mGroupKey}"]`);
        if (matchingMTrigger) matchingMTrigger.classList.add("active");
      }
    }
  });

  document.querySelectorAll(".d-trigger").forEach(accordionBtn => {
    accordionBtn.addEventListener("click", function() {
      this.classList.toggle("active");
      const categoryKey = this.getAttribute("data-group");
      const groupPanel = document.querySelector(`.d-panel[data-group="${categoryKey}"]`);
      if (groupPanel) {
        if (groupPanel.style.maxHeight && groupPanel.style.maxHeight !== "0px") {
          groupPanel.style.maxHeight = "0px";
        } else {
          groupPanel.style.maxHeight = groupPanel.scrollHeight + "px";
        }
      }
    });
  });

  document.querySelectorAll(".m-trigger").forEach(accordionBtn => {
    accordionBtn.addEventListener("click", function() {
      this.classList.toggle("active");
      const categoryKey = this.getAttribute("data-group");
      const groupPanel = document.querySelector(`.m-panel[data-group="${categoryKey}"]`);
      if (groupPanel) {
        if (groupPanel.style.maxHeight && groupPanel.style.maxHeight !== "0px") {
          groupPanel.style.maxHeight = "0px";
        } else {
          groupPanel.style.maxHeight = groupPanel.scrollHeight + "px";
        }
      }
    });
  });

  // Unified global logout processor routines
  const clearPortalIdentitySessionCaches = () => {
    console.log("[Portal Session] Purging identity metadata and storage token pools...");
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.location.replace("portal-login.html");
  };

  document.getElementById("desktopPortalLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
  document.getElementById("mobilePortalDrawerLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
});
