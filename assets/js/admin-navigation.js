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
        background: #c15254; 
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
        background: #0a1f44; 
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
    <div><div class="admin-badge" style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-top:4px; display:inline-block;">Admin Dashboard</div></div>
</div>
<nav class="sidebar-accordion-menu">
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="core" onclick="toggleSidebarAccordion(this)"> Control Systems <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="core">
            <a href="admin-dashboard.html" class="nav-item d-link" data-page="admin-dashboard.html"><span>📊</span> System Hub Home</a>
            <a href="admin-billing.html" class="nav-item d-link" data-page="admin-billing.html"><span>💰</span> Sales & Price Audit</a>
            <a href="admin-blog.html" class="nav-item d-link" data-page="admin-blog.html"><span>📰</span> Manage Insights Blog</a>
            <a href="admin-faqs.html" class="nav-item d-link" data-page="admin-faqs.html"><span>🚀</span> Manage FAQs Matrix</a>
            <a href="admin-faq-analytics.html" class="nav-item d-link" data-page="admin-faq-analytics.html" id="nav-analytics-link"><span>👍</span> FAQ Performance Insights</a>
        </div>
    </div>
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="crm" onclick="toggleSidebarAccordion(this)"> Operations & CRM <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="crm">
            <a href="admin-crm.html" class="nav-item d-link" data-page="admin-crm.html"><span>👥</span> Customer CRM</a>
            <a href="admin-customer-profile.html" class="nav-item d-link" data-page="admin-customer-profile.html"><span>👤</span> Client Profiler</a>
            <a href="admin-service-manager.html" class="nav-item d-link" data-page="admin-service-manager.html"><span>⚙️</span> Service Fulfillment</a>
            <a href="admin-compliance-audit.html" class="nav-item d-link" data-page="admin-compliance-audit.html"><span>🛡️</span> Compliance Audit</a>
            <a href="admin-entity-master.html" class="nav-item d-link" data-page="admin-entity-master.html"><span>🏢</span> Entity Master Ledger</a>
            <a href="admin-orders.html" class="nav-item d-link" data-page="admin-orders.html"><span>📦</span> Active Orders Queue</a>
        </div>
    </div>
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="finance" onclick="toggleSidebarAccordion(this)"> Financials & Health <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="finance">
            <a href="admin-revenue-reconciliation.html" class="nav-item d-link" data-page="admin-revenue-reconciliation.html"><span>⚖️</span> Revenue Recon</a>
            <a href="admin-portfolio-spend.html" class="nav-item d-link" data-page="admin-portfolio-spend.html"><span>💳</span> Portfolio Spend</a>
            <a href="invoice.html" class="nav-item d-link" data-page="invoice.html"><span>📑</span> Create Invoice Asset</a>
            <a href="pay-invoice.html" class="nav-item d-link" data-page="pay-invoice.html"><span>💳</span> Process Invoice Pay</a>
            <a href="admin-system-logs.html" class="nav-item d-link" data-page="admin-system-logs.html"><span>📋</span> System Event Logs</a>
        </div>
    </div>
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="tools" onclick="toggleSidebarAccordion(this)"> Communication & Tools <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="tools">
            <a href="admin-chat.html" class="nav-item d-link" data-page="admin-chat.html"><span>💬</span> Client Chat</a>
            <a href="admin-tickets.html" class="nav-item d-link" data-page="admin-tickets.html"><span>🎫</span> Desk Tickets</a>
            <a href="admin-documents.html" class="nav-item d-link" data-page="admin-documents.html"><span>📂</span> Document Vault</a>
            <a href="admin-calendar.html" class="nav-item d-link" data-page="admin-calendar.html"><span>📅</span> Calendar Matrix</a>
            <a href="admin-appointments.html" class="nav-item d-link" data-page="admin-appointments.html"><span>⏰</span> Session Allocations</a>
            <a href="admin-notifications.html" class="nav-item d-link" data-page="admin-notifications.html"><span>🔔</span> Alerts Log</a>
            <a href="admin-notifications-center.html" class="nav-item d-link" data-page="admin-notifications-center.html"><span>📡</span> Dispatch Broadcast</a>
        </div>
    </div>
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="intake" onclick="toggleSidebarAccordion(this)"> Intake & Design Hub <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="intake">
            <a href="admin-phone-intake.html" class="nav-item d-link" data-page="admin-phone-intake.html"><span>📞</span> Phone Orders</a>
            <a href="logodesign-intake.html" class="nav-item d-link" data-page="logodesign-intake.html"><span>🎨</span> Logo Design Form</a>
            <a href="webdesign-intake.html" class="nav-item d-link" data-page="webdesign-intake.html"><span>🌐</span> Web Ingestion Form</a>
            <a href="admin-design-hub.html" class="nav-item d-link" data-page="admin-design-hub.html"><span>🚀</span> Shared Design Hub</a>
        </div>
    </div>
    <div class="accordion-group">
        <button class="accordion-trigger d-trigger" data-group="hq" onclick="toggleSidebarAccordion(this)"> HQ Infrastructure <span class="chevron">▼</span> </button>
        <div class="accordion-panel d-panel" data-group="hq">
            <a href="admin-staff-roster.html" class="nav-item d-link" data-page="admin-staff-roster.html"><span>👔</span> Executive Roster</a>
            <a href="admin-status.html" class="nav-item d-link" data-page="admin-status.html"><span>🚦</span> System Status Tracker</a>
            <a href="admin-global-settings.html" class="nav-item d-link" data-page="admin-global-settings.html"><span>🔧</span> Global Config</a>
            <a href="admin-profile-view.html" class="nav-item d-link" data-page="admin-profile-view.html"><span>🔒</span> Security Settings</a>
        </div>
    </div>
</nav>
<div class="sidebar-footer-lock" style="padding-top:10px !important; text-align: center; width: 100%; box-sizing: border-box;">
   
    <button id="f4uSidebarCollapseToggleHandle" title="Hide Sidebar Menu" style="margin-bottom: 8px;">◀ Hide Sidebar Menu</button>
    <button id="desktopPortalLogoutBtn" class="logout-btn" style="background:#dc2626; color:#ffffff; width:100%; padding:10px; font-weight:700; border:none; border-radius:6px; cursor:pointer;">Exit Admin Session</button>
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
    <button id="f4uMobileMenuTextTriggerBtn" style="background: #fef2f2; color: #0a1f44; border: 1px solid rgba(220, 38, 38, 0.15); display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 700; cursor: pointer; outline: none; padding: 8px 14px; border-radius: 6px;">
        <span>☰</span>
        <span style="text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px;">Menu</span>
    </button>
    `;

    const mobileDropdownTray = document.createElement("div");
    mobileDropdownTray.id = "f4uMobileDropdownContainerTray";
    mobileDropdownTray.innerHTML = `
    <nav class="sidebar-accordion-menu" style="padding: 0 !important;">
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-core" onclick="toggleSidebarAccordion(this)"> Control Systems <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-core">
                <a href="admin-dashboard.html" class="nav-item m-link" data-page="admin-dashboard.html">System Hub Home</a>
                <a href="admin-billing.html" class="nav-item m-link" data-page="admin-billing.html">Sales & Price Audit</a>
                <a href="admin-blog.html" class="nav-item m-link" data-page="admin-blog.html">Manage Insights Blog</a>
                <a href="admin-faqs.html" class="nav-item m-link" data-page="admin-faqs.html">Manage FAQs Matrix</a>
                <a href="admin-faq-analytics.html" class="nav-item m-link" data-page="admin-faq-analytics.html">FAQ Performance Insights</a>
            </div>
        </div>
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-crm" onclick="toggleSidebarAccordion(this)"> Operations & CRM <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-crm">
                <a href="admin-crm.html" class="nav-item m-link" data-page="admin-crm.html">Customer CRM</a>
                <a href="admin-customer-profile.html" class="nav-item m-link" data-page="admin-customer-profile.html">Client Profiler</a>
                <a href="admin-service-manager.html" class="nav-item m-link" data-page="admin-service-manager.html">Service Fulfillment</a>
                <a href="admin-compliance-audit.html" class="nav-item m-link" data-page="admin-compliance-audit.html">Compliance Audit</a>
                Entity Master Ledger</a>
                <a href="admin-orders.html" class="nav-item m-link" data-page="admin-orders.html">Active Orders Queue</a>
            </div>
        </div>
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-finance" onclick="toggleSidebarAccordion(this)"> Financials & Health <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-finance">
                <a href="admin-revenue-reconciliation.html" class="nav-item m-link" data-page="admin-revenue-reconciliation.html">Revenue Recon</a>
                <a href="admin-portfolio-spend.html" class="nav-item m-link" data-page="admin-portfolio-spend.html">Portfolio Spend</a>
                <a href="invoice.html" class="nav-item m-link" data-page="invoice.html">Create Invoice Asset</a>
                <a href="pay-invoice.html" class="nav-item m-link" data-page="pay-invoice.html">Process Invoice Pay</a>
                <a href="admin-system-logs.html" class="nav-item m-link" data-page="admin-system-logs.html">System Event Logs</a>
            </div>
        </div>
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-tools" onclick="toggleSidebarAccordion(this)"> Communication & Tools <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-tools">
                <a href="admin-chat.html" class="nav-item m-link" data-page="admin-chat.html">Client Chat</a>
                <a href="admin-tickets.html" class="nav-item m-link" data-page="admin-tickets.html">Desk Tickets</a>
                <a href="admin-documents.html" class="nav-item m-link" data-page="admin-documents.html">Document Vault</a>
                <a href="admin-calendar.html" class="nav-item m-link" data-page="admin-calendar.html">Calendar Matrix</a>
                <a href="admin-appointments.html" class="nav-item m-link" data-page="admin-appointments.html">Session Allocations</a>
                <a href="admin-notifications.html" class="nav-item m-link" data-page="admin-notifications.html">Alerts Log</a>
                <a href="admin-notifications-center.html" class="nav-item m-link" data-page="admin-notifications-center.html">Dispatch Broadcast</a>
            </div>
        </div>
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-intake" onclick="toggleSidebarAccordion(this)"> Intake & Design Hub <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-intake">
                <a href="admin-phone-intake.html" class="nav-item m-link" data-page="admin-phone-intake.html">Phone Orders</a>
                <a href="logodesign-intake.html" class="nav-item m-link" data-page="logodesign-intake.html">Logo Design Form</a>
                <a href="webdesign-intake.html" class="nav-item m-link" data-page="webdesign-intake.html">Web Ingestion Form</a>
                <a href="admin-design-hub.html" class="nav-item m-link" data-page="admin-design-hub.html">Shared Design Hub</a>
            </div>
        </div>
        <div class="accordion-group">
            <button class="accordion-trigger m-trigger" data-group="m-hq" onclick="toggleSidebarAccordion(this)"> HQ Infrastructure <span class="chevron">▼</span> </button>
            <div class="accordion-panel m-panel" data-group="m-hq">
                <a href="admin-staff-roster.html" class="nav-item m-link" data-page="admin-staff-roster.html">Executive Roster</a>
                <a href="admin-status.html" class="nav-item m-link" data-page="admin-status.html">System Status Tracker</a>
                <a href="admin-global-settings.html" class="nav-item m-link" data-page="admin-global-settings.html">Global Config</a>
                <a href="admin-profile-view.html" class="nav-item m-link" data-page="admin-profile-view.html">Security Settings</a>
            </div>
        </div>
        <button id="mobilePortalDrawerLogoutBtn" class="logout-btn" style="background:#dc2626; color:#ffffff; width:100%; padding:12px; font-weight:700; border:none; border-radius:8px; cursor:pointer; margin-top:15px;">Exit Admin Session</button>
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
            desktopSidebarNode.classList.add("sidebar-collapsed-hidden");
            if (portalMain) portalMain.classList.add("main-stretched-full");
            floatingWidgetNode.classList.add("widget-visible-active");
        } else {
            desktopSidebarNode.classList.remove("sidebar-collapsed-hidden");
            if (portalMain) portalMain.classList.remove("main-stretched-full");
            floatingWidgetNode.classList.remove("widget-visible-active");
        }
    };

    // Attach controllers to your hide toggle button handles inside your layout
    document.getElementById("f4uSidebarCollapseToggleHandle")?.addEventListener("click", () => {
        executePortalCanvasLayoutShift(true);
    });

    floatingWidgetNode.addEventListener("click", () => {
        executePortalCanvasLayoutShift(false);
    });

    // --- STAGE F: HYDRATE INTERACTIVE LINK STATES AND ACCORDIONS ---
    const allPlatformLinks = document.querySelectorAll(".sidebar-accordion-menu a");
    allPlatformLinks.forEach(linkItem => {
        const pathTarget = linkItem.getAttribute("href") || linkItem.getAttribute("data-page");
        if (pathTarget === activePagePath) {
            linkItem.classList.add("active");
            linkItem.style.cssText = "background: rgba(220, 38, 38, 0.08) !important; color: #0a1f44 !important; font-weight: 700 !important;";
            
            // Auto-expand the desktop panels matching the active window route location
            const desktopPanel = linkItem.closest(".accordion-panel, .d-panel");
            if (desktopPanel) {
                desktopPanel.style.maxHeight = desktopPanel.scrollHeight + "px";
                const matchingTrigger = desktopPanel.previousElementSibling;
                if (matchingTrigger && matchingTrigger.classList.contains("accordion-trigger")) {
                    matchingTrigger.classList.add("active");
                    matchingTrigger.innerHTML = matchingTrigger.innerHTML.replace("▼", "▲");
                }
            }

            // Auto-expand the mobile overlay blocks matching the active location
            const mobilePanel = linkItem.closest(".m-panel");
            if (mobilePanel) {
                mobilePanel.style.maxHeight = mobilePanel.scrollHeight + "px";
                const matchingMTrigger = mobilePanel.previousElementSibling;
                if (matchingMTrigger) {
                    matchingMTrigger.classList.add("active");
                    matchingMTrigger.innerHTML = matchingMTrigger.innerHTML.replace("▼", "▲");
                }
            }
        }
    });
    // --- STAGE G: INTERACTIVE SIDEBAR UI CONTROLS ---
    function toggleSidebarAccordion(buttonElement) {
        if (!buttonElement) return;
        buttonElement.classList.toggle('active');
        const panel = buttonElement.nextElementSibling;
        if (panel) {
            if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
                panel.style.maxHeight = "0px";
                if (buttonElement.innerHTML.includes("▲")) {
                    buttonElement.innerHTML = buttonElement.innerHTML.replace("▲", "▼");
                }
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                if (buttonElement.innerHTML.includes("▼")) {
                    buttonElement.innerHTML = buttonElement.innerHTML.replace("▼", "▲");
                }
            }
        }
    }
    // Bind to the global window object so inline onclick attributes function perfectly
    window.toggleSidebarAccordion = toggleSidebarAccordion;

    // --- STAGE H: HEADER SYSTEM DIGITAL TICK CLOCK ---
    function runHeaderPortalClockTick() {
        const clock = document.getElementById("portal-clock");
        if (clock) clock.textContent = new Date().toLocaleString();
    }
    setInterval(runHeaderPortalClockTick, 1000);
    runHeaderPortalClockTick();

    // --- STAGE I: UNIFIED HQ LOGOUT PROCESSOR ROUTINES ---
    const clearPortalIdentitySessionCaches = () => {
        console.log("[Admin Session] Purging identity metadata and storage token pools...");
        
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        const activeClientInstance = window.supabaseInstance || window.supabaseClient;
        if (activeClientInstance && activeClientInstance.auth) {
            activeClientInstance.auth.signOut().then(() => {
                window.location.replace("admin-login.html");
            }).catch(() => {
                window.location.replace("admin-login.html");
            });
        } else {
            window.location.replace("admin-login.html");
        }
    };

    // Attach unified handlers to every explicit administration escape route button
    document.getElementById("sidebarFallbackLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
    document.getElementById("portalLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
    document.getElementById("desktopPortalLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
    document.getElementById("mobilePortalDrawerLogoutBtn")?.addEventListener("click", clearPortalIdentitySessionCaches);
});
