       /**
         * 📁 ENGINE MECHANICS 1: ACCORDION INTERRUPTORS & EXPANSIONS (MUTUAL EXCLUSION LOCK)
         */
        function toggleSidebarAccordion(buttonElement) {
            if (!buttonElement) return;
            
            const isTargetAlreadyOpen = buttonElement.classList.contains('active');
            const menuSidebarRoot = buttonElement.closest('.sidebar-accordion-menu');
            
            // 🛑 MUTUAL EXCLUSION VALVE: Loop and completely retract any sibling dropdown panels
            if (menuSidebarRoot) {
                const allTriggers = menuSidebarRoot.querySelectorAll('.accordion-trigger');
                allTriggers.forEach(trigger => {
                    trigger.classList.remove('active');
                    const chevronNode = trigger.querySelector('.chevron');
                    if (chevronNode) chevronNode.textContent = "▼";
                    
                    const openPanel = trigger.nextElementSibling;
                    if (openPanel && openPanel.classList.contains('accordion-panel')) {
                        openPanel.style.maxHeight = "0px";
                    }
                });
            }
            
            // If the element clicked wasn't already active, rotate active indicators and compute height
            if (!isTargetAlreadyOpen) {
                buttonElement.classList.add('active');
                const targetChevron = buttonElement.querySelector('.chevron');
                if (targetChevron) targetChevron.textContent = "▲";
                
                const targetPanel = buttonElement.nextElementSibling;
                if (targetPanel && targetPanel.classList.contains('accordion-panel')) {
                    targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
                }
            }
        }

        function toggleMobileSidebarMenuOverlay() {
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
        }

        document.addEventListener("DOMContentLoaded", () => {
            const currentFileName = window.location.pathname.split("/").pop() || "client-dashboard.html";
            const activeLinks = document.querySelectorAll(`.sidebar-accordion-menu a[href="${currentFileName}"]`);
            
            activeLinks.forEach(link => {
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                link.classList.add('active');
                
                const matchingPanel = link.closest('.accordion-panel');
                if (matchingPanel) {
                    matchingPanel.style.maxHeight = matchingPanel.scrollHeight + "px";
                    const folderTriggerButton = matchingPanel.previousElementSibling;
                    if (folderTriggerButton && folderTriggerButton.classList.contains('accordion-trigger')) {
                        folderTriggerButton.classList.add('active');
                        const chevronSpan = folderTriggerButton.querySelector('.chevron');
                        if (chevronSpan) chevronSpan.textContent = "▲";
                    }
                }
            });

            // Live workspace system clock engine
            setInterval(() => {
                const clockNode = document.getElementById("portal-clock");
                if (clockNode) {
                    const now = new Date();
                    clockNode.textContent = now.toLocaleDateString() + " | " + now.toLocaleTimeString();
                }
            }, 1000);
        });

// Global pointer reference to expose method smoothly to core streams
window.refreshDashboardLiveActionLog = async function(userId) {
    const feedTarget = document.getElementById("realtimeNotificationFeedTarget");
    if (!feedTarget) return;

    const { data: list, error } = await supabase
        .from('portal_notifications')
        .select('id, title, message, ticket_id, is_read, created_at')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !list || list.length === 0) {
        feedTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">No active notification logging history found.</p>`;
        return;
    }

    feedTarget.innerHTML = list.map(n => {
        // Build clear target route strings if a ticket reference key is present
        const applicationRouteURI = n.ticket_id ? `client-ticket.html?id=${n.ticket_id}` : `javascript:void(0);`;
        const actionLabelTag = n.ticket_id ? `<span style="display:inline-block; margin-top:6px; font-weight:800; color:var(--emerald); font-size:0.7rem; text-transform:uppercase;">View Ticket Operations ➔</span>` : '';
        
        return `
            <a href="${applicationRouteURI}" onclick="markNotificationRecordAsRead('${n.id}')" style="text-decoration:none !important; display:block !important;">
                <div style="background:${n.is_read ? '#f8fafc' : '#ffffff'} !important; border-left:3px solid ${n.is_read ? '#cbd5e1' : 'var(--emerald)'} !important; border: 1px solid var(--border-color); padding:12px; border-radius:6px; font-size:0.8rem; box-shadow:0 1px 2px rgba(0,0,0,0.01);">
                    <div style="display:flex; justify-content:between; align-items:center;">
                        <strong style="flex:1; color:var(--text-dark);">${n.title}</strong>
                        ${!n.is_read ? `<span style="width:6px; height:6px; background:#ef4444; border-radius:50%;"></span>` : ''}
                    </div>
                    <span style="color:var(--text-muted); display:block; margin-top:4px; font-size:0.75rem; line-height:1.3;">${n.message}</span>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                        ${actionLabelTag}
                        <small style="color:#94a3b8; font-size:0.65rem;">${new Date(n.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
                    </div>
                </div>
            </a>
        `;
    }).join('');
};

async function markNotificationRecordAsRead(notificationId) {
    await supabase.from('portal_notifications').update({ is_read: true }).eq('id', notificationId);
}
