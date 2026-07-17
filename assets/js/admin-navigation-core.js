// ============================================================================
// 📁 MODULE CARD: CORE NAVIGATION, SIDEBAR INTERACTION, & SELECTION LOADER
// ============================================================================
(function() {
  "use strict";

  // --- 1. ACCESS COMPATIBLE SINGLE CORE CLIENT CONTEXT AREA ---
  const masterAdminGatewayClient = window.supabaseClient || window.supabase;

  /**
   * 📁 SIDEBAR ACCORDION COLLAPSIBLE NAVIGATION HANDLERS
   */
  window.toggleSidebarAccordion = function(buttonElement) {
    if (!buttonElement) return;
    
    buttonElement.classList.toggle('active');
    const panel = buttonElement.nextElementSibling;
    const chevronIcon = buttonElement.querySelector(".chevron");
    
    if (panel && panel.style) {
      if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
        panel.style.maxHeight = "0px";
        if (chevronIcon) chevronIcon.textContent = "▼";
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        if (chevronIcon) chevronIcon.textContent = "▲";
      }
    }
  };

  /**
   * 📱 PORTAL MOBILE SIDEBAR LAYOUT OVERLAY INTERACTORS
   */
  window.toggleMobileSidebarMenuOverlay = function() {
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
  };

  // --- 2. UNIFIED LIFECYCLE CONTROLLER ENGINE ---
  document.addEventListener("DOMContentLoaded", () => {
    // 50ms defensive delay check ensures central script completes bootstrapping
    setTimeout(async () => {
      const client = window.supabaseClient || window.supabase || masterAdminGatewayClient;
      if (!client) {
        console.error("Critical Failure: Administrative database bridge is offline.");
        return;
      }
      
      // Hydrate metrics, dropdown lists, and real-time transaction logs populateAdminClientDropdown(client);
      if (typeof window.populateAdminClientDropdown === "function") {
        window.populateAdminClientDropdown(client);
      }
      if (typeof window.hydrateAdminDashboardMetrics === "function") {
        window.hydrateAdminDashboardMetrics(client);
      }
      if (typeof window.streamLiveOperationalLedgers === "function") {
        window.streamLiveOperationalLedgers(client);
      }
    }, 50);

    // Attach responsive closing triggers to mobile navigation links
    document.querySelectorAll(".nav-item").forEach(link => {
      link.addEventListener("click", () => {
        const sidebar = document.querySelector(".portal-sidebar");
        if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains("mobile-revealed")) {
          window.toggleMobileSidebarMenuOverlay();
        }
      });
    });
  });

  // --- 3. DYNAMIC SELECTION LOADER: POPULATE REGISTERED PROFILES ---
  window.populateAdminClientDropdown = async function(client) {
    const dropdown = document.getElementById("adminClientDropdown");
    if (!dropdown) return;
    
    try {
      // Extracts active corporate users directly from your client registry table
      const { data: profiles, error } = await client
        .from('orders')
        .select('user_id, company_name')
        .order('company_name', { ascending: true });
        
      if (error) throw error;
      
      if (!profiles || profiles.length === 0) {
        dropdown.innerHTML = `<option value="">No active client accounts found on server</option>`;
        return;
      }

      // Filter out duplicate user rows to keep options neat
      const unifiedMap = new Map();
      profiles.forEach(p => {
        if (p.user_id) unifiedMap.set(p.user_id, p.company_name || 'Unnamed Corporate Entity');
      });

      let dropdownOptionsMarkup = '<option value="">-- Choose Target Customer Account --</option>';
      unifiedMap.forEach((companyName, userId) => {
        // 🟢 FIXED SYSTEM CRASH: Guard against undefined IDs to protect substring parsing
        const safeUserIdString = userId || "";
        const sliceToken = safeUserIdString ? ` [ID: ${safeUserIdString.slice(0, 6).toUpperCase()}]` : "";
        dropdownOptionsMarkup += `<option value="${safeUserIdString}">${companyName}${sliceToken}</option>`;
      });
      
      dropdown.innerHTML = dropdownOptionsMarkup;
      
    } catch (err) {
      console.warn("Dropdown profiles extraction failure:", err.message);
      dropdown.innerHTML = `<option value="">Error pulling system accounts</option>`;
    }
  };
})();
