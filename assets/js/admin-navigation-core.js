/**
 * 📁 FILE PATH: assets/js/admin-navigation-core.js
 * Responsibility: Expose Global Sanitizers and Populate Admin Client Dropdown Menus
 */

// ✅ REPAIRED: Expose the critical string sanitizer to the admin global namespace window scope
window.escapeTimelineHTML = window.escapeTimelineHTML || function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.populateAdminClientDropdown = async function() {
    const dropdown = document.getElementById("adminClientDropdown") || document.getElementById("globalNavClientSelect");
    if (!dropdown) return;

    // Intercept timing lags by polling for the live instance safely
    if (!window.supabaseInstance || typeof window.supabaseInstance.from !== 'function') {
        setTimeout(window.populateAdminClientDropdown, 150);
        return;
    }

    const client = window.supabaseInstance;

    try {
        // Query rows directly out of your master entities table
        const { data: records, error } = await client
            .from('entities')
            .select('entity_name, owner_id')
            .not('owner_id', 'is', null)
            .order('entity_name', { ascending: true });

        if (error) throw error;
        
        if (dropdown) {
            dropdown.innerHTML = '<option value="">-- Select Active Target Customer --</option>';
            const uniqueOwnersTracker = new Set();

            // ✅ REPAIRED: Changed broken variable 'profiles' to match your real query dataset 'records'
            if (records && records.length > 0) {
                records.forEach(record => {
                    const uid = record.owner_id;
                    if (uid && !uniqueOwnersTracker.has(uid)) {
                        uniqueOwnersTracker.add(uid);
                        const option = document.createElement("option");
                        option.value = uid;
                        option.textContent = `${record.entity_name || 'Filing Entity'} [${uid.substring(0, 6).toUpperCase()}]`;
                        dropdown.appendChild(option);
                    }
                });
            }
        }
    } catch (dropdownErr) {
        console.warn("Dropdown population loop pass failed:", dropdownErr.message || dropdownErr);
        dropdown.innerHTML = '<option value="">✕ Failed to load system profiles.</option>';
    }
};

// Fire dropdown hydration pass on DOM compilation mount
document.addEventListener("DOMContentLoaded", () => {
    window.populateAdminClientDropdown();
});
