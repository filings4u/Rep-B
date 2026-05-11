/**
 * filings4u Portal Switcher & Navigation Logic
 * Manages global entity switching and sidebar active states
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTOMATIC SIDEBAR ACTIVE STATE
    // Finds the current filename and highlights the matching nav-item
    const currentPath = window.location.pathname.split("/").pop();
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (currentPath === itemHref) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 2. ENTITY SWITCHER INITIALIZATION
    // Loads the last selected entity from localStorage if it exists
    const switcher = document.querySelector('.switcher-dropdown');
    if (switcher) {
        const savedEntity = localStorage.getItem('activeEntity');
        if (savedEntity) {
            switcher.value = savedEntity;
            updatePortalContext(savedEntity);
        }
    }
});

/**
 * Triggered when a user selects a different company in the sidebar
 * @param {string} entityName - The name of the selected company
 */
function switchEntity(entityName) {
    // Save selection for persistence across all 31 pages
    localStorage.setItem('activeEntity', entityName);
    
    // Add visual feedback (flash effect)
    const mainContent = document.querySelector('.portal-main');
    if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.transition = 'opacity 0.2s';
        
        setTimeout(() => {
            updatePortalContext(entityName);
            mainContent.style.opacity = '1';
            // Optional: Reload the page to refresh all company data
            // window.location.reload(); 
        }, 300);
    }
}

/**
 * Updates UI elements (like "Welcome back...") based on the active entity
 */
function updatePortalContext(name) {
    const welcomeBold = document.querySelector('.welcome-text p strong');
    const headerCompany = document.querySelector('.portal-header p strong');
    
    if (welcomeBold) welcomeBold.innerText = name;
    if (headerCompany) headerCompany.innerText = name;
    
    console.log(`Context Switched to: ${name}`);
}

/**
 * Logout Logic
 */
function handleLogout() {
    if (confirm("Are you sure you want to sign out?")) {
        localStorage.removeItem('activeEntity');
        window.location.href = 'index.html';
    }
}
