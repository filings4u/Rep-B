// assets/js/admin-billing.js
(function initializeProductionBillingEngine() {
    "use strict";

    console.log("🚀 Production Billing and Transaction Engine mounted...");

    // ==========================================================================
    // 📊 1. FETCH & RENDER LIVE LEDGER TABLES FROM SUPABASE
    // ==========================================================================
    async function loadLiveBillingLedgers() {
        const client = window.supabaseClient;
        if (!client) return;

        const openTbody = document.getElementById('billing-open-invoices-tbody');
        const settledTbody = document.getElementById('billing-settled-orders-tbody');

        try {
            // Query your central workspace records
            const { data: records, error } = await client
                .from('user_filings_workspace')
                .select('id, user_id, service_key, status, amount_paid, checkout_completed_at, updated_at');

            if (error) throw error;

            if (!records || records.length === 0) {
                const emptyRow = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b; font-style:italic;">No corporate entity records found inside database clusters.</td></tr>';
                if (openTbody) openTbody.innerHTML = emptyRow;
                if (settledTbody) settledTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b; font-style:italic;">No captured transactions found.</td></tr>';
                return;
            }

            const registry = window.WIZARD_REGISTRY || {};

            // --- TRACK A: RENDER UNPAID / OPEN STATEMENT INVOICES QUEUE ---
            if (openTbody) {
                const draftRecords = records.filter(r => r.status === 'draft' || !r.status);
                
                if (draftRecords.length === 0) {
                    openTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b; font-style:italic;">🎉 Clear! Zero outstanding draft balances pending processing.</td></tr>';
                } else {
                    openTbody.innerHTML = draftRecords.map(item => {
                        const spec = registry[item.service_key] || { title: `Module: ${item.service_key.toUpperCase()}` };
                        return `
                            <tr>
                                <td><strong>#FIL-${item.id.substring(0,8).toUpperCase()}</strong></td>
                                <td>#USR-${item.user_id.substring(0,8).toUpperCase()}</td>
                                <td>${spec.title}</td>
                                <td style="font-weight:700; color:#c15254;">$149.00</td>
                                <td><span style="background:#fffbeb; color:#b45309; padding:4px 8px; border-radius:12px; font-size:0.72rem; font-weight:700; text-transform:uppercase;">Draft Estimate</span></td>
                                <td><button class="btn-audit" onclick="alert('Sending manual system alert follow-up token vector to client...')" style="padding:4px 10px; font-size:0.75rem;">Remind Client</button></td>
                            </tr>`;
                    }).join('');
                }
            }

            // --- TRACK B: RENDER SETTLED ORDERS HISTORY LEDGER ---
            if (settledTbody) {
                const paidRecords = records.filter(r => r.status === 'paid');

                if (paidRecords.length === 0) {
                    settledTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b; font-style:italic;">No active platform sales tracked in current cycle.</td></tr>';
                } else {
                    settledTbody.innerHTML = paidRecords.map(item => {
                        const spec = registry[item.service_key] || { title: `Module: ${item.service_key.toUpperCase()}` };
                        const verifiedCost = parseFloat(item.amount_paid) || 149.00;
                        const dateStamp = item.checkout_completed_at ? new Date(item.checkout_completed_at).toLocaleDateString() : new Date(item.updated_at).toLocaleDateString();
                        
                        return `
                            <tr>
                                <td><strong>#FIL-${item.id.substring(0,8).toUpperCase()}</strong></td>
                                <td>#USR-${item.user_id.substring(0,8).toUpperCase()}</td>
                                <td>${dateStamp}</td>
                                <td style="font-weight:800; color:#10b981;">$${verifiedCost.toFixed(2)}</td>
                                <td><span class="badge-active">Settled</span></td>
                            </tr>`;
                    }).join('');
                }
            }

        } catch (err) {
            console.error("Ledger rendering exception caught:", err.message);
        }
    }

    // ==========================================================================
    // 📨 2. STRIPE INVOICE COMPILATION SUBMISSION CONTROLLER
    // ==========================================================================
    const manualInvoiceForm = document.getElementById('manualInvoiceSubmissionForm');
    if (manualInvoiceForm) {
        manualInvoiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const feedbackBox = document.getElementById('invoice-form-status-feedback');
            const submitBtn = document.getElementById('invoiceSubmitBtn');
            const emailValue = document.getElementById('inv-customer-email').value.trim();

            if (!emailValue) return;

            submitBtn.disabled = true;
            submitBtn.innerText = "Provisioning Stripe Customer Accounts...";
            if (feedbackBox) feedbackBox.innerText = "";

            try {
                // Collect dynamic form row line items
                const itemRows = document.querySelectorAll('.invoice-item-row');
                const itemsPayloadArray = [];
                let totalInvoiceAmountCents = 0;

                itemRows.forEach(row => {
                    const desc = row.querySelector('.item-description').value.trim();
                    const price = parseFloat(row.querySelector('.item-price').value) || 0;
                    
                    if (desc && price > 0) {
                        totalInvoiceAmountCents += Math.round(price * 100);
                        itemsPayloadArray.push({ description: desc, amount_cents: Math.round(price * 100) });
                    }
                });

                if (itemsPayloadArray.length === 0) {
                    throw new Error("Validation Failed: You must add at least one line item with a positive value amount price.");
                }

                console.log("Transmitting compiled data packet payload to Edge execution pipelines...");

                // Call your live custom endpoint layer safely
                const response = await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/stripe-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create_manual_invoice', // Distinct programmatic endpoint action path instruction mapping
                        email: emailValue,
                        amount: totalInvoiceAmountCents,
                        line_items: itemsPayloadArray,
                        return_url: window.location.origin + '/admin-billing.html'
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error || `Edge engine returned connection status code ${response.status}`);
                }

                if (feedbackBox) {
                    feedbackBox.style.color = "var(--emerald)";
                    feedbackBox.innerText = `🎉 Invoice generated successfully! Sent directly to ${emailValue}.`;
                }
                
                manualInvoiceForm.reset();
                setTimeout(() => { if (typeof toggleInvoiceGenerationModal === 'function') toggleInvoiceGenerationModal(false); }, 2500);
                
                // Refresh data tables immediately
                loadLiveBillingLedgers();

            } catch (err) {
                console.error("Stripe verification transaction stalled:", err.message);
                if (feedbackBox) {
                    feedbackBox.style.color = "var(--staff-red)";
                    feedbackBox.innerText = `Stripe Transmission Error:\n${err.message}. Ensure customer profile email exists inside your live Stripe dashboard grid context.`;
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Compile Stripe Invoice & Email Client →";
            }
        });
    }

    // Dynamic Row Actions Mapping Controllers
    window.addNewInvoiceLineRow = function() {
        const container = document.getElementById('invoice-line-items-container');
        if (!container) return;

        const freshRow = document.createElement('div');
        freshRow.className = "invoice-item-row";
        freshRow.style.display = "grid";
        freshRow.style.gridTemplateColumns = "2fr 1fr auto";
        freshRow.style.gap = "10px";
        freshRow.style.marginBottom = "10px";
        
        freshRow.innerHTML = `
            <input type="text" class="item-description admin-input" placeholder="e.g., State Expedite Processing Fee" required>
            <input type="number" class="item-price admin-input" step="0.01" placeholder="50.00" required>
            <button type="button" onclick="removeInvoiceLineRow(this)" style="background:#fee2e2; border:none; color:var(--staff-red); border-radius:6px; padding:0 12px; cursor:pointer;">✕</button>
        `;
        container.appendChild(freshRow);
    };

    window.removeInvoiceLineRow = function(btnElement) {
        const row = btnElement.parentElement;
        const container = document.getElementById('invoice-line-items-container');
        if (container && container.children.length > 1) {
            row.remove();
        } else {
            alert("Mandatory item layout rule: Invoices require at least one structural parameter line item field.");
        }
    };

    // Safe background execution checking loops
    const clientCheckInterval = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(clientCheckInterval);
            loadLiveBillingLedgers();
        }
    }, 100);

    setTimeout(() => clearInterval(clientCheckInterval), 5000);

})();
