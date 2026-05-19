// assets/js/admin-search.js
document.addEventListener("DOMContentLoaded", () => {
    const searchField = document.getElementById('adminGlobalSearchField') || document.getElementById('crmSearchField') || document.getElementById('billingLedgerSearchField');
    if (!searchField) return;

    searchField.addEventListener("input", (e) => {
        const queryText = e.target.value.toLowerCase().trim();
        // Dynamic DOM scanner filters cards and table rows simultaneously
        const itemsToScan = document.querySelectorAll('.admin-table-ledger tbody tr, .ticket-row, .log-entry-row, .stat-card, .portal-card');

        itemsToScan.forEach(item => {
            const innerContent = item.innerText.toLowerCase();
            if (innerContent.includes(queryText) || queryText === "") {
                item.style.display = ""; // Matches query parameter conditions
            } else {
                item.style.display = "none"; /* Hides elements that don't match query parameters */
            }
        });
    });
});
