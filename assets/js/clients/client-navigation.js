function toggleSidebarAccordion(buttonElement) {
    const isCurrentlyActive = buttonElement.classList.contains("active");
    const activeGroupContainer = buttonElement.closest(".accordion-group");
    const structuralPanel = activeGroupContainer.querySelector(".accordion-panel");
    
    // Mutual Exclusion Implementation: Collapse all open siblings
    document.querySelectorAll(".accordion-trigger").forEach(trigger => {
        trigger.classList.remove("active");
        const panel = trigger.closest(".accordion-group").querySelector(".accordion-panel");
        if (panel) panel.style.maxHeight = null;
    });

    // Expand targeted selection if it wasn't open before
    if (!isCurrentlyActive) {
        buttonElement.classList.add("active");
        structuralPanel.style.maxHeight = structuralPanel.scrollHeight + "px";
    }
}

// Track and resolve current navigation active visual nodes
document.addEventListener("DOMContentLoaded", () => {
    const browserPath = window.location.pathname.split("/").pop();
    const targetedLink = document.querySelector(`.sidebar-accordion-menu a[href="${browserPath}"]`);
    
    if (targetedLink) {
        // Enforce parent element open properties
        targetedLink.classList.add("active");
        const matchingAccordionGroup = targetedLink.closest(".accordion-group");
        const matchingTrigger = matchingAccordionGroup.querySelector(".accordion-trigger");
        
        if (matchingTrigger) {
            matchingTrigger.classList.add("active");
            const structuralPanel = matchingAccordionGroup.querySelector(".accordion-panel");
            structuralPanel.style.maxHeight = structuralPanel.scrollHeight + "px";
        }
    }
});
