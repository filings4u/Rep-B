document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    let allInvoices = [];
    let adminProfilesById = new Map();
    let currentFilter = "all";
    let currentInvoice = null;
    /*
     * Use the initialized Supabase client already provided by the site.
     * supabase-config.js is intentionally not changed.
     */
    const supabaseClient =
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function" &&
        window.supabaseClient.auth
            ? window.supabaseClient
            : (
                window.supabase &&
                typeof window.supabase.from === "function" &&
                window.supabase.auth
                    ? window.supabase
                    : null
            );

    let tableContainer = null;
    let searchField = null;
    let modal = null;
    let preview = null;

    let refreshButton = null;
    let closeModalButton = null;
    let printInvoiceButton = null;

    function findElementByIdOrSelector(id, selectors) {
        const byId = document.getElementById(id);
        if (byId) return byId;

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        return null;
    }

    function resolveInvoicePageElements() {
        /*
         * Prefer the exact IDs used by the invoice page.
         * The fallbacks make the script tolerant of the page being rendered
         * by the admin navigation system with slightly different markup.
         */
        tableContainer = findElementByIdOrSelector(
            "invoiceTableContainer",
            [
                ".table-wrap",
                ".invoice-table-wrap",
                "[data-invoice-table]",
                ".console-card .table-container"
            ]
        );

        searchField = findElementByIdOrSelector(
            "invoiceSearch",
            [
                'input[placeholder*="Search invoice" i]',
                'input[placeholder*="Search" i].search-input',
                ".search-input"
            ]
        );

        modal = findElementByIdOrSelector(
            "invoiceModal",
            [
                ".invoice-modal",
                "[data-invoice-modal]"
            ]
        );

        preview = findElementByIdOrSelector(
            "invoicePreview",
            [
                ".invoice-preview",
                "[data-invoice-preview]"
            ]
        );

        refreshButton = findElementByIdOrSelector(
            "refreshInvoicesBtn",
            [
                '[data-action="refresh-invoices"]',
                '.filter-row .refresh-btn',
                'button.refresh-btn'
            ]
        );

        closeModalButton = findElementByIdOrSelector(
            "closeInvoiceModal",
            [
                '[data-action="close-invoice"]',
                ".invoice-modal .modal-close"
            ]
        );

        printInvoiceButton = findElementByIdOrSelector(
            "printInvoiceBtn",
            [
                '[data-action="print-invoice"]',
                ".invoice-modal .modal-btn.primary"
            ]
        );

        /*
         * If the table wrapper exists but lacks its expected ID, give it the
         * ID so all remaining functions can use one consistent reference.
         */
        if (tableContainer && !tableContainer.id) {
            tableContainer.id = "invoiceTableContainer";
        }

        if (searchField && !searchField.id) {
            searchField.id = "invoiceSearch";
        }

        if (modal && !modal.id) {
            modal.id = "invoiceModal";
        }

        if (preview && !preview.id) {
            preview.id = "invoicePreview";
        }

        return Boolean(
            tableContainer &&
            searchField &&
            modal &&
            preview
        );
    }

    function waitForInvoicePageElements(timeoutMs = 15000) {
        return new Promise(resolve => {
            if (resolveInvoicePageElements()) {
                resolve(true);
                return;
            }

            if (!document.body) {
                resolve(false);
                return;
            }

            let finished = false;

            const finish = result => {
                if (finished) return;
                finished = true;
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(result);
            };

            const observer = new MutationObserver(() => {
                if (resolveInvoicePageElements()) {
                    finish(true);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            const timeoutId = setTimeout(() => {
                finish(resolveInvoicePageElements());
            }, timeoutMs);
        });
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function money(value) {
        return Number(value || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD"
        });
    }

    function formatDate(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString("en-US", {
            month:"short", day:"numeric", year:"numeric"
        });
    }

    function effectiveStatus(invoice) {
        const raw = String(invoice.status || "draft").toLowerCase();
        if (raw === "sent" && invoice.due_date) {
            const due = new Date(invoice.due_date + "T23:59:59");
            if (due.getTime() < Date.now() && invoice.payment_status !== "paid") {
                return "overdue";
            }
        }
        if (invoice.payment_status === "paid") return "paid";
        return raw;
    }

    function startClock() {
        const clock = document.getElementById("portal-clock");
        if (!clock) return;

        const tick = () => {
            const now = new Date();
            clock.textContent =
                now.toLocaleDateString("en-US") +
                " | " +
                now.toLocaleTimeString("en-US", {
                    hour:"2-digit",
                    minute:"2-digit",
                    second:"2-digit"
                });
        };
        tick();
        setInterval(tick, 1000);
    }

    function withTimeout(promise, milliseconds, message) {
        let timeoutId;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
        });

        return Promise.race([
            Promise.resolve(promise).finally(() => clearTimeout(timeoutId)),
            timeoutPromise
        ]);
    }

    async function verifyAdmin() {
        if (
            !supabaseClient ||
            !supabaseClient.auth ||
            typeof supabaseClient.auth.getSession !== "function" ||
            typeof supabaseClient.from !== "function"
        ) {
            throw new Error(
                "The existing Supabase client is unavailable to invoice-management.js."
            );
        }

        const { data: sessionData, error: sessionError } =
            await withTimeout(
                supabaseClient.auth.getSession(),
                15000,
                "Supabase authentication request timed out after 15 seconds."
            );

        if (sessionError) throw sessionError;
        if (!sessionData?.session) {
            window.location.href = "admin-login.html";
            return false;
        }

        const { data: admin, error } = await supabaseClient
            .from("admin_profiles")
            .select("id,role")
            .eq("id", sessionData.session.user.id)
            .maybeSingle();

        if (error) throw error;
        if (!admin || admin.role !== "admin") {
            window.location.href = "admin-login.html";
            return false;
        }

        return true;
    }

    async function loadInvoices() {
        const elementsReady = await waitForInvoicePageElements();

        if (!elementsReady) {
            console.error(
                "[Invoice View] Invoice page elements were not found after waiting."
            );
            return;
        }

        tableContainer.innerHTML =
            '<div class="loading-state">Loading invoice registry...</div>';

        try {
            if (!await verifyAdmin()) return;

            const invoiceQuery = supabaseClient
                .from("invoices")
                .select(`
                    id,
                    document_type,
                    client_email,
                    line_item_description,
                    total_amount,
                    due_date,
                    token_hash,
                    created_at,
                    invoice_number,
                    client_profile_id,
                    order_id,
                    dashboard_order_id,
                    status,
                    currency,
                    subtotal_amount,
                    discount_amount,
                    tax_rate,
                    tax_amount,
                    shipping_amount,
                    payment_status,
                    stripe_checkout_session_id,
                    payment_url,
                    customer_notes,
                    payment_terms,
                    sent_at,
                    paid_at,
                    created_by,
                    updated_at,
                    stripe_customer_id,
                    stripe_invoice_id,
                    tracking_number,
                    client_profiles (
                        id,
                        email_address,
                        first_name,
                        last_name,
                        phone_number,
                        street_address,
                        city,
                        state,
                        zip_code,
                        tracking_number,
                        company_name,
                        stripe_customer_id
                    )
                `)
                .order("created_at", { ascending: false });

            const invoiceResult = await withTimeout(
                invoiceQuery,
                15000,
                "Invoice database request timed out after 15 seconds."
            );

            const { data, error } = invoiceResult;

            if (error) throw error;

            allInvoices = Array.isArray(data) ? data : [];

            /*
             * invoices.created_by points to auth.users.id.
             * admin_profiles.id also points to auth.users.id.
             * Therefore the admin must be resolved in a second query.
             */
            const adminIds = [
                ...new Set(
                    allInvoices
                        .map(invoice => invoice.created_by)
                        .filter(Boolean)
                )
            ];

            adminProfilesById = new Map();

            if (adminIds.length) {
                const adminQuery = supabaseClient
                    .from("admin_profiles")
                    .select(`
                        id,
                        email_address,
                        first_name,
                        last_name,
                        phone_number,
                        role,
                        avatar_url
                    `)
                    .in("id", adminIds);

                const adminResult = await withTimeout(
                    adminQuery,
                    15000,
                    "Admin profile database request timed out after 15 seconds."
                );

                const {
                    data: adminProfiles,
                    error: adminError
                } = adminResult;

                if (adminError) throw adminError;

                (adminProfiles || []).forEach(admin => {
                    adminProfilesById.set(admin.id, admin);
                });
            }

            updateStats();
            renderInvoices();
        } catch (error) {
            console.error("[Invoice View] Load failed:", error);

            const message =
                error && error.message
                    ? error.message
                    : String(error || "Unknown database error.");

            tableContainer.innerHTML =
                '<div class="error-state">' +
                    '<strong>Invoice registry could not be loaded.</strong><br>' +
                    escapeHtml(message) +
                '</div>';
        }
    }

    function updateStats() {
        const statTotal = document.getElementById("statTotal");
        const statOutstanding = document.getElementById("statOutstanding");
        const statPaid = document.getElementById("statPaid");
        const statOverdue = document.getElementById("statOverdue");

        const outstanding = allInvoices
            .filter(i => effectiveStatus(i) !== "paid" && effectiveStatus(i) !== "cancelled" && effectiveStatus(i) !== "void")
            .reduce((sum,i) => sum + Number(i.total_amount || 0), 0);

        const paid = allInvoices
            .filter(i => effectiveStatus(i) === "paid")
            .reduce((sum,i) => sum + Number(i.total_amount || 0), 0);

        const overdue = allInvoices
            .filter(i => effectiveStatus(i) === "overdue")
            .length;

        if (statTotal) statTotal.textContent = allInvoices.length;
        if (statOutstanding) statOutstanding.textContent = money(outstanding);
        if (statPaid) statPaid.textContent = money(paid);
        if (statOverdue) statOverdue.textContent = overdue;
    }

    function getAdminProfile(invoice) {
        if (!invoice || !invoice.created_by) return null;
        return adminProfilesById.get(invoice.created_by) || null;
    }

    function getAdminName(invoice) {
        const admin = getAdminProfile(invoice);

        if (!admin) {
            return invoice && invoice.created_by
                ? "Admin Profile Unavailable"
                : "System / Unassigned";
        }

        const name = [
            admin.first_name,
            admin.last_name
        ].filter(Boolean).join(" ").trim();

        return name || admin.email_address || "Admin";
    }

    function getAdminEmail(invoice) {
        const admin = getAdminProfile(invoice);
        return admin?.email_address || "";
    }

    function getFilteredInvoices() {
        const query = String(searchField.value || "").trim().toLowerCase();

        return allInvoices.filter(invoice => {
            const status = effectiveStatus(invoice);

            if (currentFilter !== "all" && status !== currentFilter) {
                return false;
            }

            if (!query) return true;

            const profile = invoice.client_profiles || {};
            const name = [
                profile.first_name,
                profile.last_name,
                profile.company_name
            ].filter(Boolean).join(" ");

            return [
                invoice.invoice_number,
                invoice.client_email,
                invoice.tracking_number,
                profile.tracking_number,
                name,
                getAdminName(invoice),
                getAdminEmail(invoice),
                invoice.created_by,
                invoice.line_item_description,
                invoice.stripe_invoice_id
            ].some(value =>
                String(value || "").toLowerCase().includes(query)
            );
        });
    }

    function renderInvoices() {
        const invoices = getFilteredInvoices();

        if (!invoices.length) {
            tableContainer.innerHTML =
                '<div class="empty-state"><strong>No invoices found.</strong><br>Try another filter or search term.</div>';
            return;
        }

        const rows = invoices.map(invoice => {
            const profile =
                invoice.client_profiles &&
                !Array.isArray(invoice.client_profiles)
                    ? invoice.client_profiles
                    : {};

            const customerName =
                [
                    profile.first_name,
                    profile.last_name
                ].filter(Boolean).join(" ") ||
                profile.company_name ||
                invoice.client_email ||
                "Unknown Client";

            const tracking =
                invoice.tracking_number ||
                profile.tracking_number ||
                "Not assigned";

            const status = effectiveStatus(invoice);
            const adminName = getAdminName(invoice);
            const adminEmail = getAdminEmail(invoice);

            return `
                <tr>
                    <td>
                        <div class="invoice-number">
                            ${escapeHtml(invoice.invoice_number || "F4U-INVOICE")}
                        </div>
                        <div style="font-size:.68rem;color:#94a3b8;margin-top:3px;">
                            ${escapeHtml(invoice.stripe_invoice_id || "")}
                        </div>
                    </td>

                    <td>
                        <strong>${escapeHtml(customerName)}</strong>
                        <div style="font-size:.72rem;color:#64748b;margin-top:3px;">
                            ${escapeHtml(invoice.client_email || profile.email_address || "")}
                        </div>
                    </td>

                    <td>
                        <span class="tracking-number">
                            ${escapeHtml(tracking)}
                        </span>
                    </td>

                    <td>
                        <strong>${escapeHtml(adminName)}</strong>
                        ${
                            adminEmail
                                ? `<div style="font-size:.68rem;color:#64748b;margin-top:3px;">
                                    ${escapeHtml(adminEmail)}
                                   </div>`
                                : ""
                        }
                    </td>

                    <td>
                        ${escapeHtml(invoice.line_item_description || "Invoice")}
                    </td>

                    <td class="amount">
                        ${money(invoice.total_amount)}
                    </td>

                    <td>
                        ${formatDate(invoice.due_date)}
                    </td>

                    <td>
                        <span class="status ${escapeHtml(status)}">
                            ${escapeHtml(status)}
                        </span>
                    </td>

                    <td>
                        <button
                            class="action-btn"
                            type="button"
                            data-view-invoice="${escapeHtml(invoice.id)}"
                        >
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        tableContainer.innerHTML = `
            <table class="invoice-table" style="min-width:1100px;">
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Client</th>
                        <th>Tracking</th>
                        <th>Created By</th>
                        <th>Primary Service</th>
                        <th>Total</th>
                        <th>Due</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        tableContainer
            .querySelectorAll("[data-view-invoice]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    openInvoice(button.dataset.viewInvoice);
                });
            });
    }

    async function openInvoice(invoiceId) {
        currentInvoice =
            allInvoices.find(invoice => invoice.id === invoiceId) || null;

        if (!currentInvoice) return;

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");

        document.getElementById("modalInvoiceTitle").textContent =
            currentInvoice.invoice_number || "Invoice";

        preview.innerHTML =
            '<div class="modal-loading">Loading invoice details...</div>';

        /*
         * invoice_line_items is optional. The supplied schema for this page
         * defines invoices, client_profiles, and admin_profiles. If a
         * line-item table is not present, the invoice's own
         * line_item_description is used instead.
         */
        let items = [];

        try {
            const lineItemQuery = supabaseClient
                .from("invoice_line_items")
                .select(
                    "line_number,description,quantity,unit_price,line_total"
                )
                .eq("invoice_id", invoiceId)
                .order("line_number", { ascending: true });

            const lineItemResult = await withTimeout(
                lineItemQuery,
                10000,
                "Invoice line-item request timed out after 10 seconds."
            );

            const {
                data: lineItems,
                error: lineItemError
            } = lineItemResult;

            if (!lineItemError) {
                items = lineItems || [];
            } else {
                console.warn(
                    "[Invoice View] Optional invoice_line_items query failed:",
                    lineItemError
                );
            }
        } catch (error) {
            console.warn(
                "[Invoice View] Optional line-item query failed:",
                error
            );
        }

        renderInvoicePreview(currentInvoice, items);
    }

    function renderInvoicePreview(invoice, items) {
        const profile =
            invoice.client_profiles &&
            !Array.isArray(invoice.client_profiles)
                ? invoice.client_profiles
                : {};

        const customerName =
            [
                profile.first_name,
                profile.last_name
            ].filter(Boolean).join(" ") ||
            profile.company_name ||
            invoice.client_email ||
            "Unknown Client";

        const clientEmail =
            profile.email_address ||
            invoice.client_email ||
            "Not provided";

        const tracking =
            invoice.tracking_number ||
            profile.tracking_number ||
            "Not assigned";

        const admin = getAdminProfile(invoice);
        const adminName = getAdminName(invoice);
        const adminEmail = getAdminEmail(invoice);

        const clientAddress = [
            profile.street_address,
            [profile.city, profile.state, profile.zip_code]
                .filter(Boolean)
                .join(", ")
        ].filter(Boolean).join("<br>");

        const lineRows = items.length
            ? items.map(item => `
                <tr>
                    <td>${escapeHtml(item.description || "Service")}</td>
                    <td class="right">${escapeHtml(item.quantity ?? 1)}</td>
                    <td class="right">${money(item.line_total)}</td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td>${escapeHtml(invoice.line_item_description || "Invoice")}</td>
                    <td class="right">1</td>
                    <td class="right">${money(invoice.total_amount)}</td>
                </tr>
            `;

        preview.innerHTML = `
            <div class="invoice-paper" id="printableInvoice">
                <div class="invoice-paper-header">
                    <div>
                        <img
                            class="invoice-paper-logo"
                            src="https://lrbimrlbskjweynxlgas.supabase.co/storage/v1/object/public/public-assets/logo.png"
                            alt="filings4u"
                        >
                    </div>

                    <div class="invoice-paper-title">
                        <h1>INVOICE</h1>
                        <p>${escapeHtml(invoice.invoice_number || "F4U-INVOICE")}</p>
                    </div>
                </div>

                <div class="invoice-paper-body">
                    <div class="client-box">
                        <div>
                            <span class="detail-label">Bill To</span>
                            <div class="detail-value">
                                ${escapeHtml(customerName)}
                            </div>

                            ${
                                profile.company_name
                                    ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">
                                        ${escapeHtml(profile.company_name)}
                                       </div>`
                                    : ""
                            }

                            <div style="font-size:12px;color:#64748b;margin-top:4px;">
                                ${escapeHtml(clientEmail)}
                            </div>

                            ${
                                clientAddress
                                    ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">
                                        ${clientAddress}
                                       </div>`
                                    : ""
                            }

                            ${
                                profile.phone_number
                                    ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">
                                        ${escapeHtml(profile.phone_number)}
                                       </div>`
                                    : ""
                            }
                        </div>

                        <div>
                            <span class="detail-label">Created By</span>
                            <div class="detail-value">
                                ${escapeHtml(adminName)}
                            </div>

                            ${
                                adminEmail
                                    ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">
                                        ${escapeHtml(adminEmail)}
                                       </div>`
                                    : ""
                            }

                            ${
                                admin?.role
                                    ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;text-transform:uppercase;">
                                        ${escapeHtml(admin.role)}
                                       </div>`
                                    : ""
                            }

                            <div style="font-size:12px;color:#64748b;margin-top:10px;">
                                Invoice Created: ${formatDate(invoice.created_at)}
                            </div>
                        </div>
                    </div>

                    <div class="client-box" style="margin-bottom:22px;">
                        <div>
                            <span class="detail-label">Tracking Number</span>
                            <div
                                class="detail-value"
                                style="font-family:monospace;color:#047857;"
                            >
                                ${escapeHtml(tracking)}
                            </div>
                        </div>

                        <div>
                            <span class="detail-label">Invoice Status</span>
                            <div class="detail-value">
                                ${escapeHtml(effectiveStatus(invoice))}
                            </div>

                            <div style="font-size:12px;color:#64748b;margin-top:5px;">
                                Due: ${formatDate(invoice.due_date)}
                            </div>
                        </div>
                    </div>

                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>Service / Description</th>
                                <th class="right">Qty</th>
                                <th class="right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>${lineRows}</tbody>
                    </table>

                    <div class="totals">
                        <div class="total-line">
                            <span>Subtotal</span>
                            <strong>${money(invoice.subtotal_amount)}</strong>
                        </div>

                        ${
                            Number(invoice.discount_amount || 0) > 0
                                ? `
                                    <div class="total-line">
                                        <span>Discount</span>
                                        <strong>-${money(invoice.discount_amount)}</strong>
                                    </div>
                                  `
                                : ""
                        }

                        ${
                            Number(invoice.tax_amount || 0) > 0
                                ? `
                                    <div class="total-line">
                                        <span>
                                            Tax (${Number(invoice.tax_rate || 0).toFixed(2)}%)
                                        </span>
                                        <strong>${money(invoice.tax_amount)}</strong>
                                    </div>
                                  `
                                : ""
                        }

                        ${
                            Number(invoice.shipping_amount || 0) > 0
                                ? `
                                    <div class="total-line">
                                        <span>Shipping</span>
                                        <strong>${money(invoice.shipping_amount)}</strong>
                                    </div>
                                  `
                                : ""
                        }

                        <div class="total-line final">
                            <span>Total Due</span>
                            <strong>${money(invoice.total_amount)}</strong>
                        </div>
                    </div>

                    ${
                        invoice.customer_notes
                            ? `
                                <div class="preview-notes">
                                    <strong>Note From filings4u</strong><br>
                                    ${escapeHtml(invoice.customer_notes)}
                                </div>
                              `
                            : ""
                    }
                </div>

                <div class="invoice-paper-footer">
                    © 2026 filings4u, LLC. All rights reserved.<br>
                    A Subsidiary of Roseland Companies, LLC
                </div>
            </div>
        `;
    }

    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        currentInvoice = null;
    }

    function printCurrentInvoice() {
        if (!currentInvoice) return;

        const printable = document.getElementById("printableInvoice");
        if (!printable) return;

        const win = window.open("", "_blank", "width=900,height=900");
        if (!win) {
            alert("Your browser blocked the print window. Please allow pop-ups for this admin site.");
            return;
        }

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${escapeHtml(currentInvoice.invoice_number || "Invoice")}</title>
                <style>
                    *{box-sizing:border-box}
                    body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#0f172a}
                    .invoice-paper{max-width:760px;margin:0 auto;background:#fff}
                    .invoice-paper-header{padding:30px 34px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between}
                    .invoice-paper-logo{height:38px;width:auto}
                    .invoice-paper-title{text-align:right}
                    .invoice-paper-title h1{margin:0;font-size:26px;color:#0a1f44}
                    .invoice-paper-title p{margin:5px 0 0;color:#64748b;font-family:monospace;font-size:12px}
                    .invoice-paper-body{padding:34px}
                    .client-box{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
                    .detail-label{display:block;font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:800;margin-bottom:5px}
                    .detail-value{font-size:13px;font-weight:700;color:#0a1f44}
                    .preview-table{width:100%;border-collapse:collapse;margin-top:10px}
                    .preview-table th{padding:10px 0;border-bottom:1px solid #cbd5e1;color:#64748b;font-size:10px;text-transform:uppercase;text-align:left}
                    .preview-table td{padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:12px}
                    .right{text-align:right}
                    .totals{width:300px;max-width:100%;margin:20px 0 0 auto}
                    .total-line{display:flex;justify-content:space-between;padding:7px 0;font-size:12px;color:#64748b}
                    .total-line.final{border-top:2px solid #0a1f44;margin-top:6px;padding-top:13px;font-size:16px;font-weight:800;color:#0a1f44}
                    .preview-notes{margin-top:25px;padding:15px;border-radius:8px;background:#fffbeb;border:1px solid #fef3c7;color:#92400e;font-size:12px;line-height:1.5}
                    .invoice-paper-footer{background:#0a1f44;color:#94a3b8;text-align:center;padding:25px;font-size:10px}
                    @media print { @page { margin: .45in; } }
                </style>
            </head>
            <body>${printable.outerHTML}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
        }, 300);
    }

    let invoiceViewInitialized = false;

    async function initializeInvoiceView() {
        if (invoiceViewInitialized) return;

        const elementsReady = await waitForInvoicePageElements();

        if (!elementsReady) {
            /*
             * Do not kill the script. The admin navigation system may replace
             * the page body after this script starts. Leave the observer-based
             * retry path active and report the actual missing elements.
             */
            console.warn(
                "[Invoice View] Invoice DOM is not available yet; waiting for the page view to render."
            );
            return;
        }

        invoiceViewInitialized = true;

        if (refreshButton) {
            refreshButton.addEventListener("click", loadInvoices);
        }

        if (closeModalButton) {
            closeModalButton.addEventListener("click", closeModal);
        }

        if (printInvoiceButton) {
            printInvoiceButton.addEventListener("click", printCurrentInvoice);
        }

        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && modal.classList.contains("open")) {
                closeModal();
            }
        });

        searchField.addEventListener("input", renderInvoices);

        document.querySelectorAll(".filter-btn").forEach(button => {
            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".filter-btn")
                    .forEach(btn => btn.classList.remove("active"));

                button.classList.add("active");
                currentFilter = button.dataset.filter || "all";
                renderInvoices();
            });
        });

        startClock();
        await loadInvoices();
    }

    /*
     * Support both normal page loads and dynamically injected admin views.
     * If DOMContentLoaded already happened, initialize immediately.
     */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeInvoiceView, {
            once: true
        });
    } else {
        initializeInvoiceView();
    }
});