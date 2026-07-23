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
    .portal-sidebar { 
        width: 260px;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, border-right 0.3s ease !important; 
        overflow-y: auto !important; 
        overflow-x: hidden !important; 
        box-sizing: border-box;
    }
    .portal-sidebar.sidebar-collapsed-hidden {
        width: 0px !important;
        padding: 0px !important;
        border-right: none !important;
    }
    .portal-main { 
        margin-left: 260px;
        width: calc(100% - 260px);
        transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; 
        box-sizing: border-box;
    }
    .portal-main.main-stretched-full {
        margin-left: 0px !important;
        width: 100% !important;
    }
    #f4uSidebarCollapseToggleHandle { 
        width: 100%; 
        background: #f1f5f9; 
        color: var(--text-dark); 
        border: 1px solid var(--border-color); 
        padding: 10px; 
        border-radius: 6px; 
        font-size: 0.8rem; 
        font-weight: 700; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 6px; 
        outline: none; 
        margin-bottom: 10px; 
        box-sizing: border-box; 
        transition: all 0.15s ease; 
    }
    #f4uSidebarCollapseToggleHandle:hover { 
        background: #e2e8f0; 
    }
    /* Floating Widget Toggle Trigger Button (Appears pinned on left edge when Sidebar is closed) */
    #f4uSidebarFloatingRestoreWidget { 
        position: fixed; 
        bottom: 25px; 
        left: -80px; 
        width: 50px; 
        height: 50px; 
        background: #10b981; 
        color: #ffffff; 
        border: none; 
        border-radius: 50%; 
        font-size: 1.3rem; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        cursor: pointer; 
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); 
        z-index: 1500; 
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease; 
        outline: none; 
    }
    #f4uSidebarFloatingRestoreWidget:hover { 
        transform: scale(1.08); 
        background: #94a3b8; 
    }
    #f4uSidebarFloatingRestoreWidget.widget-visible-active { 
        left: 25px !important; 
    }
    /* ========================================== Mobile Navigation Dropdown Overlay Panels ========================================== */
    #f4uBrandedMobileNavToggleBar { 
        display: none; 
        width: 100%; 
        align-items: center; 
        justify-content: space-between; 
        padding: 15px 20px; 
        background: #ffffff; 
        border-bottom: 1px solid #e2e8f0; 
        box-sizing: border-box; 
        height: 70px; 
    }
    #f4uMobileDropdownContainerTray { 
        display: none; 
        position: absolute !important; 
        top: 75px !important; 
        left: 15px !important; 
        width: calc(100% - 30px) !important; 
        background: #ffffff !important; 
        border: 1px solid #e2e8f0 !important; 
        border-radius: 12px !important; 
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) !important; 
        padding: 20px !important; 
        box-sizing: border-box !important; 
        z-index: 2100 !important; 
    }
    #f4uMobileDropdownContainerTray.tray-active-revealed { 
        display: block !important; 
    }
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
    const headerNode = document.querySelector(".portal-header") || document.querySelector("header");

    if (headerNode && headerNode.parentNode) {
        const mobileBrandedBar = document.createElement("div");
        mobileBrandedBar.id = "f4uBrandedMobileNavToggleBar";
        mobileBrandedBar.innerHTML = `
        <img src="images/logo.png" alt="filings4u" style="height: 28px; width: auto; object-fit: contain;">
        <button id="f4uMobileMenuTextTriggerBtn" style="background: #e6f4ea; color: #0a1f44; border: 1px solid rgba(37, 99, 235, 0.15); display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 700; cursor: pointer; outline: none; padding: 8px 14px; border-radius: 6px;">
            <span>☰</span>
            <span style="text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px;">Menu</span>
        </button>
        `;

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

        headerNode.parentNode.insertBefore(mobileBrandedBar, headerNode);
        headerNode.parentNode.insertBefore(mobileDropdownTray, headerNode);

        mobileBrandedBar.querySelector("#f4uMobileMenuTextTriggerBtn").addEventListener("click", () => {
            mobileDropdownTray.classList.toggle("tray-active-revealed");
        });
    }

    // --- STAGE E: ATTACH ATOMIC INTERCEPTORS FOR GEOMETRIC DISPLACEMENTS ---
    const executePortalCanvasLayoutShift = (collapseFlag) => {
        if (collapseFlag) {
            // Apply new classes to slide out the menu and stretch the content container
            desktopSidebarNode.classList.add("sidebar-collapsed-hidden");
            if (portalMain) portalMain.classList.add("main-stretched-full");
            floatingWidgetNode.classList.add("widget-visible-active");
        } else {
            // Restore regular layout alignment borders and parameters
            desktopSidebarNode.classList.remove("sidebar-collapsed-hidden");
            if (portalMain) portalMain.classList.remove("main-stretched-full");
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
            linkItem.style.cssText = "background: rgba(37, 99, 235, 0.08) !important; color: #0a1f44 !important; font-weight: 700 !important;";
            
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
    // --- STAGE G: ACCORDION INTERACTION CONTROLS ---
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

    // --- STAGE H: UNIFIED GLOBAL LOGOUT PROCESSOR ROUTINES ---
    const clearPortalIdentitySessionCaches = () => {
        console.log("[Portal Session] Purging identity metadata and storage token pools...");
        
        // Wipe local browser data stores instantly
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        // Invoke client auth removal signature if client driver object is globalized
        const activeClientInstance = window.supabaseInstance || window.supabaseClient;
        if (activeClientInstance && activeClientInstance.auth) {
            activeClientInstance.auth.signOut().then(() => {
                window.location.replace("portal-login.html");
            }).catch(() => {
                window.location.replace("portal-login.html");
            });
        } else {
            window.location.replace("portal-login.html");
        }
    };

    // Attach unified handlers to both responsive layout escape routes
    document.getElementById("desktopPortalLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
    document.getElementById("mobilePortalDrawerLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
});
