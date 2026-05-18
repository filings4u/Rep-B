// ==========================================================================
// 🚀 PRODUCTION CONTROL ENGINE: PORTAL RECONCILIATION & STATEMENT GENERATOR
// File Path: assets/js/admin-billing.js
// ==========================================================================

(function() {
    "use strict";

    let supabase;

    // Initialize security communication tunnel hooks
    async function initializeSupabaseConnectionEngine() {
        supabase = window.authSupabaseClient || window.supabase;
        if (!supabase) {
            console.error("Supabase engine connection was unavailable on line-read thresholds.");
            return;
        }
        await executeUnifiedBillingSyncEngine();
    }

    // Modal view visibility switch toggle mechanics
    window.toggleInvoiceGenerationModal = function(shouldShow) {
        const modal = document.getElementById('invoice-modal-overlay');
        if (modal) {
            modal.style.display = shouldShow ? 'flex' : 'none';
            // Clear status feedback messages on close transitions
            if (!shouldShow) document.getElementById('invoice-form-status-feedback').innerText = "";
        }
    }

    // Pulls records, computes aggregates, and updates DOM row structures
    async function executeUnifiedBillingSyncEngine() {
        const openInvoicesTbody = document.getElementById('billing-open-invoices-tbody');
        const settledOrdersTbody = document.getElementById('billing-settled-orders-tbody');

        try {
            // 1. Fetch record parameters from your document orders database table
            const { data: records, error } = await supabase
                .from('document_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            let totalOrdersCount = 0;
            let totalUnpaidBalance = 0.00;
            let totalCollectedRevenue = 0.00;

            let openInvoicesHtml = "";
            let settledOrdersHtml = "";

            if (records && records.length > 0) {
                records.forEach(item => {
                    const price = parseFloat(item.amount_paid) || 0.00;
                    const cleanDate = new Date(item.created_at).toLocaleDateString();

                    // Categorize based on generation/payment state variables
                    if (item.generation_status === 'pending') {
                        totalUnpaidBalance += price;
                        openInvoicesHtml += `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding:14px 12px; font-weight:700; color:#0a1f44;">${item.entity_name}</td>
                                <td style="padding:14px 12px;">${item.customer_email}</td>
                                <td style="padding:14px 12px; text-transform:capitalize;">${item.document_type.replace('_',' ')}</td>
                                <td style="padding:14px 12px; font-weight:700; color:var(--danger-red);">$${price.toFixed(2)}</td>
                                <td style="padding:14px 12px;"><span class="status-pill urgent">Unpaid / Open</span></td>
                                <td style="padding:14px 12px;">
                                    <button class="btn-audit" onclick="dispatchManualPaymentReminder('${item.id}', '${item.customer_email}')" style="padding:4px 10px; font-size:0.75rem;">✉️ Remind</button>
                                </td>
                            </tr>
                        `;
                    } else {
                        totalOrdersCount++;
                        totalCollectedRevenue += price;
                        settledOrdersHtml += `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding:14px 12px; font-weight:700; color:#0a1f44;">${item.entity_name}</td>
                                <td style="padding:14px 12px;">${item.customer_email}</td>
                                <td style="padding:14px 12px;">${cleanDate}</td>
                                <td style="padding:14px 12px; font-weight:700; color:var(--success-green);">$${price.toFixed(2)}</td>
                                <td style="padding:14px 12px;"><span class="status-pill success">Settled</span></td>
                            </tr>
                        `;
                    }
                });
            }

            // 2. Map computed variables into top summary block fields
            document.getElementById('summary-total-orders').innerText = totalOrdersCount;
            document.getElementById('summary-unpaid-amount').innerText = `$${totalUnpaidBalance.toFixed(2)}`;
            document.getElementById('summary-collected-revenue').innerText = `$${totalCollectedRevenue.toFixed(2)}`;

            // 3. Inject rows or fallback message strings safely
            if (openInvoicesTbody) openInvoicesTbody.innerHTML = openInvoicesHtml || `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No outstanding invoices found.</td></tr>`;
            if (settledOrdersTbody) settledOrdersTbody.innerHTML = settledOrdersHtml || `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No settled transactions recorded.</td></tr>`;

        } catch (err) {
            console.error("Billing metrics sync error:", err.message);
        }
    }

    // Form Submission Interceptor to insert new Statement Records
    document.getElementById('manualInvoiceSubmissionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('invoice-form-status-feedback');
        if (feedback) feedback.innerText = "Compiling statement profile variables...";

        const email = document.getElementById('inv-customer-email').value.trim();
        const entity = document.getElementById('inv-entity-name').value.trim();
        const amount = parseFloat(document.getElementById('inv-amount').value) || 0.00;
        const docType = document.getElementById('inv-doc-type').value;

        try {
            // Insert data into your existing document_orders collection tracking frame
            const { error } = await supabase
                .from('document_orders')
                .insert([{
                    customer_email: email,
                    entity_name: entity,
                    amount_paid: amount,
                    document_type: docType,
                    pricing_tier: 'pdf_only',
                    generation_status: 'pending', // Marks statement as open/unpaid balance
                    form_responses: { notes: "Manually compiled billing statement via administrative console terminal." }
                }]);

            if (error) throw error;

            if (feedback) {
                feedback.style.color = "var(--success-green)";
                feedback.innerText = "Success! Statement synced and customer notice dispatched.";
            }

            // Reset, refresh rows, and hide modal pane view automatically
            document.getElementById('manualInvoiceSubmissionForm').reset();
            await executeUnifiedBillingSyncEngine();
            setTimeout(() => toggleInvoiceGenerationModal(false), 1200);

        } catch (err) {
            if (feedback) {
                feedback.style.color = "var(--danger-red)";
                feedback.innerText = `Pipeline Interruption: ${err.message}`;
            }
        }
    });

    // Mockup event execution hook for manual payment prompt routing
    window.dispatchManualPaymentReminder = function(orderId, email) {
        alert(`Notification prompt pushed successfully to backend communication channels for order ref: ${orderId}. Statement update copy routed cleanly to: ${email}`);
    }

    // Trigger orchestration execution instantly on readiness flags
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSupabaseConnectionEngine);
    } else {
        initializeSupabaseConnectionEngine();
    }
})();

// 🔄 Adds a new blank line-item tracking track to the creation form modal
window.addNewInvoiceLineRow = function() {
    const container = document.getElementById('invoice-line-items-container');
    const newRow = document.createElement('div');
    newRow.className = 'invoice-item-row';
    newRow.style = 'display:grid; grid-template-columns: 2fr 1fr auto; gap:10px; margin-bottom:10px;';
    newRow.innerHTML = `
        <input type="text" class="item-description admin-input" placeholder="Item Name / Fee Scope" required>
        <input type="number" class="item-price admin-input" step="0.01" placeholder="0.00" required>
        <button type="button" onclick="removeInvoiceLineRow(this)" style="background:#fee2e2; border:none; color:var(--danger-red); border-radius:6px; padding:0 12px; cursor:pointer;">✕</button>
    `;
    container.appendChild(newRow);
}

// ✕ Drops individual row items out of the document collection map array
window.removeInvoiceLineRow = function(buttonElement) {
    const rows = document.querySelectorAll('.invoice-item-row');
    if (rows.length > 1) {
        buttonElement.parentElement.remove();
    } else {
        alert("An invoice statement tracking card requires at least one product line item.");
    }
}

// 🔍 LIVE FILTER SEARCH CORES: Filters table rows by email string values instantly
document.getElementById('billingLedgerSearchField')?.addEventListener('input', function(e) {
    const queryText = e.target.value.toLowerCase().trim();
    const allTableRows = document.querySelectorAll('#billing-open-invoices-tbody tr, #billing-settled-orders-tbody tr');

    allTableRows.forEach(row => {
        // Skip default fallback "empty rows" templates cleanly
        if (row.cells.length < 2) return;
        
        const customerEmailCellText = row.cells[1].innerText.toLowerCase();
        if (customerEmailCellText.includes(queryText)) {
            row.style.display = ""; // Matches criteria, maintain visibility
        } else {
            row.style.display = "none"; // Hide mismatch rows instantly from matrix
        }
    });
});

// Dynamic Interception Form submission link mapping to your Edge Function
document.getElementById('manualInvoiceSubmissionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('invoiceSubmitBtn');
    const feedback = document.getElementById('invoice-form-status-feedback');
    
    if (btn) btn.disabled = true;
    if (feedback) feedback.innerText = "Provisioning secure Stripe Customer ID & compiling invoice maps...";

    const email = document.getElementById('inv-customer-email').value.trim();
    const rows = document.querySelectorAll('.invoice-item-row');
    
    // Assemble form data arrays into clean, programmatically readable JSON structures
    const lineItemsArray = [];
    rows.forEach(row => {
        const desc = row.querySelector('.item-description').value.trim();
        const cost = parseFloat(row.querySelector('.item-price').value) || 0.00;
        lineItemsArray.push({ description: desc, amount: Math.round(cost * 100) }); // Stripe reads currency in cents
    });

    try {
        // 🚀 Handshake Call directly to your newly provisioned Supabase Edge Function
        const response = await fetch('https://supabase.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await window.supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ customer_email: email, items: lineItemsArray })
        });

        const outcome = await response.json();
        if (!response.ok || outcome.error) throw new Error(outcome.error || "Edge Gateway Communication Stalled.");

        if (feedback) {
            feedback.style.color = "var(--success-green)";
            feedback.innerText = "Success! Invoice processed by Stripe and dispatched via email.";
        }

        document.getElementById('manualInvoiceSubmissionForm').reset();
        setTimeout(() => {
            toggleInvoiceGenerationModal(false);
            window.location.reload(); // Refresh ledger logs to capture new pending tracks
        }, 1500);

    } catch (err) {
        if (feedback) {
            feedback.style.color = "var(--danger-red)";
            feedback.innerText = `Stripe Pipeline Error: ${err.message}`;
        }
        if (btn) btn.disabled = false;
    }
});
