// ============================================================================
// assets/js/dashboards.js
// ============================================================================
(function() {
    "use strict";

    const supabase = window.supabaseInstance || window.supabaseClient;
    const clientTrackingId = localStorage.getItem("f4u_active_tracking_token");

    if (supabase && clientTrackingId) {
        console.log(`⏳ Activating Real-Time Portal Sync Engine for Token Reference: ${clientTrackingId}`);

        // Listen for database changes on the public orders schema channel
        supabase
            .channel('public:orders')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders',
                filter: `tracking_number=eq.${clientTrackingId}`
            }, (payload) => {
                const synchronizedRecord = payload.new;
                console.log("🌟 Database synchronization update caught:", synchronizedRecord);

                // Dynamically update portal interface values without breaking state matrix elements
                const statusViewNode = document.getElementById("portal-order-status-badge");
                if (statusViewNode) {
                    statusViewNode.textContent = synchronizedRecord.status;
                    statusViewNode.className = "status-badge-" + synchronizedRecord.status.toLowerCase();
                }

                // If step-6 dashboard elements match, navigate forward to the receipt layout
                if (synchronizedRecord.status === 'Paid') {
                    if (typeof window.switchWizardActiveViewLayout === "function") {
                        window.switchWizardActiveViewLayout(7);
                    }
                }
            })
            .subscribe();
    }
})();
