/* ==========================================================================
   ⚡ HIGH-PERFORMANCE ADMINISTRATIVE RUNTIME CONTROLLER (admin-engine.js)
   ========================================================================== */

// 1. FAST ASYNC CLOCK TICK SUB-ROUTINE (Fires immediately to prevent interface lag)
(function() {
    function runImmediateDashboardClock() {
        const clockBox = document.getElementById('portal-clock');
        if (clockBox) {
            const currentTimeNode = new Date();
            clockBox.innerText = currentTimeNode.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: false 
            });
        }
    }
    // Fire instantly before waiting for document layout loops
    setTimeout(runImmediateDashboardClock, 50);
    setInterval(runImmediateDashboardClock, 1000);
})();

// 2. Centralized Database Initialization State Controllers
var adminSupabaseClient = window.adminSupabaseInstance || window.supabase || window.portalSupabaseInstance;
let cachedMasterRecordsArray = [];

document.addEventListener("DOMContentLoaded", () => {
    if (!adminSupabaseClient && typeof supabase !== 'undefined') {
        adminSupabaseClient = supabase.createClient(
            'https://lrbimrlbskjweynxlgas.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmltcmxic2tqd2V5bnhsZ2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ0NTYsImV4cCI6MjA5NDEwMDQ1Nn0.I8fQ6ZjA9oaTqJCF-7Z7vUboXC8zv2cogBv4PC_1ihU'
        );
        window.adminSupabaseInstance = adminSupabaseClient;
        window.portalSupabaseInstance = adminSupabaseClient;
    }

    if (adminSupabaseClient) {
        // PARALLEL LOADING UPGRADES: Loads views in parallel rather than blocking the rendering pipeline
        Promise.all([
            syncAdminSalesLedger(),
            populateClientSelectorDropdown(),
            initializeOperationalFormHandlers()
        ]).then(() => {
            console.log("⚡ Administrative workspace metrics loaded in parallel successfully.");
        }).catch(err => {
            console.error("Initialization loop exception caught:", err);
        });
    }
});

/* ==========================================================================
   📊 HIGH-SPEED TRANSACTIONS RECONCILIATION LEDGER
   ========================================================================== */
async function syncAdminSalesLedger() {
    const targetBox = document.getElementById('admin-global-sales-target-box');
    const revenueDisplay = document.getElementById('stat-total-revenue');
    const usersDisplay = document.getElementById('stat-active-users');
    const pendingDisplay = document.getElementById('stat-pending-filings');
    const systemDisplay = document.getElementById('stat-completed-filings');

    if (!targetBox) return;

    try {
        // Extract recent sales streams directly using localized performance keys
        const { data: records, error } = await adminSupabaseClient
            .from('orders')
            .select('id, created_at, company_name, customer_email, price_paid, plan')
            .order('created_at', { ascending: false });

        if (error) throw error;
        cachedMasterRecordsArray = records || [];

        let totalRevenueSum = 0;
        let pendingAuditsCount = 0;
        let systemHealthCount = 0;

        cachedMasterRecordsArray.forEach(order => {
            const price = parseFloat(order.price_paid) || 0;
            totalRevenueSum += price;

            // Sort status distribution counters safely based on data payloads
            const currentPlan = (order.plan || 'compliance').toLowerCase();
            if (currentPlan.includes('starter')) {
                pendingAuditsCount++;
            } else {
                systemHealthCount++;
            }
        });

        // Fast DOM population updates bypass standard layout layout lag loops
        if (revenueDisplay) revenueDisplay.innerText = `$${totalRevenueSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (usersDisplay) usersDisplay.innerText = cachedMasterRecordsArray.length;
        if (pendingDisplay) pendingDisplay.innerText = pendingAuditsCount;
        if (systemDisplay) systemDisplay.innerText = systemHealthCount;

        if (cachedMasterRecordsArray.length === 0) {
            targetBox.innerHTML = `<tr><td colspan='5' style='text-align:center; padding:40px; color:#64748b;'>No corporate sales logs captured inside cloud repositories.</td></tr>`;
            return;
        }

        targetBox.innerHTML = cachedMasterRecordsArray.map(sale => {
            const displayDate = new Date(sale.created_at).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
            });
            const formattedAmount = parseFloat(sale.price_paid || 0).toFixed(2);

            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 14px 16px; font-size: 0.9rem; color: #0a1f44; font-weight: 600;">${sale.company_name}</td>
                    <td style="padding: 14px 16px; font-size: 0.85rem; color: #4a5568;">${sale.customer_email}</td>
                    <td style="padding: 14px 16px; font-size: 0.85rem; color: #64748b;">${displayDate}</td>
                    <td style="padding: 14px 16px; font-size: 0.9rem; font-weight: 700; color: #10b981;">$${formattedAmount}</td>
                    <td style="padding: 14px 16px;">
                        <a href="receipt-viewer.html?id=${sale.id}" target="_blank" style="background:#0a1f44; color:#ffffff; padding:6px 12px; border-radius:4px; font-size:0.75rem; text-decoration:none; font-weight:700;">Audit Receipt 📥</a>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Ledger rendering pipeline failed:", err);
        targetBox.innerHTML = `<tr><td colspan='5' style='color:#e53e3e; text-align:center; padding:20px;'>Failed to fetch ledger logs.</td></tr>`;
    }
}

/* ==========================================================================
   👥 DROPDOWN CLIENT SELECTOR MODULATOR
   ========================================================================== */
async function populateClientSelectorDropdown() {
    const dropdown = document.getElementById('adminClientDropdown');
    if (!dropdown) return;

    try {
        const { data: profiles, error } = await adminSupabaseClient
            .from('orders')
            .select('user_id, customer_email');

        if (error) throw error;

        dropdown.innerHTML = '<option value="">-- Choose Active Client Target --</option>';
        const distinctEmailsCacheSet = new Set();

        (profiles || []).forEach(p => {
            if (p.user_id && p.customer_email && !distinctEmailsCacheSet.has(p.customer_email)) {
                distinctEmailsCacheSet.add(p.customer_email);
                const option = document.createElement('option');
                option.value = p.user_id;
                option.setAttribute('data-customer-email', p.customer_email);
                option.innerText = `${p.customer_email}`;
                dropdown.appendChild(option);
            }
        });
    } catch (err) {
        console.error("Client selection parsing map failed:", err);
    }
}

/* ==========================================================================
   🛠️ FORMS ACTION SUBMISSION OPERATORS
   ========================================================================== */
function initializeOperationalFormHandlers() {
    // A. Dynamic Notifications Messaging Form Channel Pipeline
    const alertForm = document.getElementById('adminAlertForm');
    if (alertForm) {
        alertForm.replaceWith(alertForm.cloneNode(true)); // Flushes lingering duplicate events arrays listeners
        document.getElementById('adminAlertForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const selector = document.getElementById('adminClientDropdown');
            const user = selector.value;
            const email = selector.options[selector.selectedIndex]?.getAttribute('data-customer-email');
            
            const status = document.getElementById('alertStatus');
            const btn = document.getElementById('alertSubmitBtn');

            if (!user || !email) { alert("Please target a specific user handle option profile first."); return; }

            btn.disabled = true; status.innerText = "Processing server transmission lines...";

            try {
                const { error } = await adminSupabaseClient.from('messages').insert({
                    sender_email: 'support@filings4u.com',
                    recipient_email: email,
                    message_text: `[${document.getElementById('alertTitle').value.trim()}] - ${document.getElementById('alertMessage').value.trim()}`,
                    is_read: false
                });

                if (error) throw error;
                status.style.color = "#48bb78"; status.innerText = "Success: Communication packet deployed live.";
                document.getElementById('adminAlertForm').reset();
            } catch (err) {
                status.style.color = "var(--danger-red)"; status.innerText = `Fault: ${err.message}`;
            } finally { btn.disabled = false; }
        });
    }

    // B. Binary Document Vault Bucket System Uplink
    const uploadForm = document.getElementById('adminUploadForm');
    if (uploadForm) {
        uploadForm.replaceWith(uploadForm.cloneNode(true));
        document.getElementById('adminUploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const targetUser = document.getElementById('adminClientDropdown').value;
            const fileField = document.getElementById('uploadFileInput');
            const status = document.getElementById('uploadStatus');
            const btn = document.getElementById('uploadSubmitBtn');

            if (!targetUser) { alert("Please assign a Client Profile identifier before issuing vault uploads."); return; }
            if (!fileField.files || fileField.files.length === 0) return;

            const targetFile = fileField.files[0];
            btn.disabled = true; status.innerText = "Deploying object to encrypted vault bucket...";

            try {
                const computedFilepath = `${targetUser}/${Date.now()}_${targetFile.name}`;
                const { error: uploadErr } = await adminSupabaseClient.storage
                    .from('vault_documents')
                    .upload(computedFilepath, targetFile);

                if (uploadErr) throw uploadErr;

                const { data: urlData } = adminSupabaseClient.storage
                    .from('vault_documents')
                    .getPublicUrl(computedFilepath);

                const { error: dbErr } = await adminSupabaseClient.from('user_documents').insert({
                    user_id: targetUser,
                    file_name: targetFile.name,
                    file_url: urlData.publicUrl,
                    file_size: `${(targetFile.size / 1024).toFixed(1)} KB`
                });

                if (dbErr) throw dbErr;
                status.style.color = "#48bb78"; status.innerText = "Success: Binary locked inside client repository slot.";
                document.getElementById('adminUploadForm').reset();
            } catch (err) {
                status.style.color = "var(--danger-red)"; status.innerText = `Fault: ${err.message}`;
            } finally { btn.disabled = false; }
        });
    }

    // C. Global Dynamic Insights Blog Publishing Engine
    const blogForm = document.getElementById('adminBlogForm');
    if (blogForm) {
        blogForm.replaceWith(blogForm.cloneNode(true));
        document.getElementById('adminBlogForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('blogStatus');
            const btn = document.getElementById('blogSubmitBtn');

            btn.disabled = true; status.innerText = "Broadcasting article metrics parameters globally...";

            try {
                const { error } = await adminSupabaseClient.from('blogs').insert({
                    author_email: 'compliance-team@filings4u.com',
                    title: document.getElementById('blogTitle').value.trim(),
                    summary: document.getElementById('blogSummary').value.trim(),
                    content: document.getElementById('blogSummary').value.trim(),
                    category: document.getElementById('blogCategory').value,
                    thumbnail_url: 'images/blog-default.jpg'
                });

                if (error) throw error;
                status.style.color = "#48bb78"; status.innerText = "Success: Article published live to front-end landing sections.";
                document.getElementById('adminBlogForm').reset();
            } catch (err) {
                status.style.color = "var(--danger-red)"; status.innerText = `Fault: ${err.message}`;
            } finally { btn.disabled = false; }
        });
    }
}

/* ==========================================================================
   🔒 LOGOUT SESSION TERMINATION CONTROLLER
   ========================================================================== */
window.handleAdminSignOutLogout = async function() {
    if (confirm("Are you sure you want to terminate your administrative session logs profile guidelines?")) {
        if (adminSupabaseClient?.auth) {
            try { await adminSupabaseClient.auth.signOut(); } catch (e) {}
        }
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
};

/**
 * 💬 EXTRACT AND DISPLAY REAL-TIME CUSTOMER MESSAGE REPLIES
 */
async function syncAdminIncomingInboxMessages() {
    const inboxTarget = document.getElementById('admin-inbox-live-stream-box');
    const countTarget = document.getElementById('admin-unread-msg-count');
    if (!inboxTarget) return;

    try {
        const { data: inboundChat, error } = await adminSupabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Filter out items sent by support to isolate pure customer inquiries
        const customerReplies = (inboundChat || []).filter(m => m.sender_email !== 'support@filings4u.com');
        const unreadCount = customerReplies.filter(m => m.is_read === false).length;
        
        if (countTarget) countTarget.innerText = unreadCount;

        if (customerReplies.length === 0) {
            inboxTarget.innerHTML = `<p style="color:#64748b; font-size:0.82rem; text-align:center; padding:20px;">No inbound customer messages recorded.</p>`;
            return;
        }

        inboxTarget.innerHTML = customerReplies.map(msg => `
            <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; background: ${msg.is_read ? '#ffffff' : '#fffaf0'}; border-radius: 6px; margin-bottom: 6px; border: 1px solid ${msg.is_read ? '#e2e8f0' : '#feebc8'};">
                <strong style="font-size:0.82rem; color:#0a1f44; display:block;">✉️ ${msg.sender_email}</strong>
                <p style="margin:4px 0 0 0; font-size:0.85rem; color:#4a5568; line-height:1.4;">${msg.message_text}</p>
                <small style="color:#94a3b8; font-size:0.7rem; display:block; margin-top:4px;">${new Date(msg.created_at).toLocaleString()}</small>
            </div>
        `).join('');

    } catch (err) {
        console.error("Inbox rendering engine faulted:", err);
    }
}
// Push message loading routines into the parallel Promise loop inside your engine file

// Dynamic sales ledger population function mapping into your DOM target box
async function fetchAndSyncAdministrativeSalesLedger() {
    const targetBox = document.getElementById('admin-global-sales-target-box');
    if (!targetBox) return;

    try {
        // Query database via your globally mounted Supabase script SDK
        const { data: orders, error } = await window.supabase
            .from('document_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            targetBox.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No corporate document purchases found.</td></tr>`;
            return;
        }

        targetBox.innerHTML = "";

        // Loop through purchases and build real-time interactive rows
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.style.borderBottom = "1px solid #e2e8f0";
            
            // Format form fields into an easily readable diagnostic label string
            const formSummary = Object.entries(order.form_responses)
                .map(([key, val]) => `${key}: ${val}`).join(' | ');

            row.innerHTML = `
                <td style="padding: 12px 16px; font-weight: 700; color: #0a1f44;">${order.entity_name}</td>
                <td style="padding: 12px 16px; color: #4a5568;">${order.customer_email}</td>
                <td style="padding: 12px 16px;"><span class="tier-pill" style="background:#edf2f7; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">${order.pricing_tier.toUpperCase()}</span></td>
                <td style="padding: 12px 16px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; color: #64748b;" title="${formSummary}">${formSummary}</td>
                <td style="padding: 12px 16px; color: #4a5568;">${new Date(order.created_at).toLocaleDateString()}</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #10b981;">$${order.amount_paid.toFixed(2)}</td>
                <td style="padding: 12px 16px;">
                    <div style="display: flex; gap: 8px;">
                        ${order.word_file_url ? `<a href="${order.word_file_url}" target="_blank" style="text-decoration:none; font-size:0.85rem;" title="Download Docx">📝 DOCX</a>` : ''}
                        ${order.pdf_file_url ? `<a href="${order.pdf_file_url}" target="_blank" style="text-decoration:none; font-size:0.85rem; color:#e53e3e;" title="Download PDF">📕 PDF</a>` : ''}
                        ${!order.word_file_url && !order.pdf_file_url ? `<span style="color:#dd6b20; font-size:0.8rem; font-weight:700;">⚙️ Generating...</span>` : ''}
                    </div>
                </td>
            `;
            targetBox.appendChild(row);
        });

    } catch (err) {
        console.error("Dashboard failed to map transaction records safely:", err.message);
        targetBox.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#e53e3e;">Failed to populate sales synchronization logs.</td></tr>`;
    }
}

// Call inside your existing initialization system checks
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchAndSyncAdministrativeSalesLedger);
} else {
    fetchAndSyncAdministrativeSalesLedger();
}
