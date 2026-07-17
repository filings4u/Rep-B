// Mobile Viewport Structural Adaptability Handlers
document.addEventListener("DOMContentLoaded", () => {
    createMobileNavbarControls();
});

function createMobileNavbarControls() {
    const headerWrapper = document.querySelector(".portal-header");
    if (!headerWrapper) return;
    
    // Create highly optimized mobile menu button container
    const structuralToggle = document.createElement("button");
    structuralToggle.id = "mobilePortalNavTrigger";
    structuralToggle.className = "mobile-toggle-btn";
    structuralToggle.innerHTML = "☰";
    structuralToggle.setAttribute("aria-label", "Toggle Application Navigation Menu Layer");
    
    // Inject node at head of layout controls execution
    headerWrapper.insertBefore(structuralToggle, headerWrapper.firstChild);
    
    structuralToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const dynamicSidebar = document.querySelector(".portal-sidebar");
        if (dynamicSidebar) {
            dynamicSidebar.classList.toggle("mobile-open");
        }
    });
    
    // Click outside handler to dismiss navigation panel overlay
    document.addEventListener("click", (e) => {
        const dynamicSidebar = document.querySelector(".portal-sidebar");
        if (dynamicSidebar && dynamicSidebar.classList.contains("mobile-open")) {
            if (!dynamicSidebar.contains(e.target) && e.target.id !== "mobilePortalNavTrigger") {
                dynamicSidebar.classList.remove("mobile-open");
            }
        }
    });
}
