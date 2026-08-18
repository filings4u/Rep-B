
/* ========================================================================== 
   FILINGS4U ADMIN PAGE BOOTSTRAP
   Shared shell behavior; page functionality remains below.
   ========================================================================== */
(function adminPageBootstrap() {
  "use strict";
  document.documentElement.classList.add("admin-page-loading");

  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const path = window.location.pathname.toLowerCase();
  const isAdminPage = path.includes("/admin-") || /admin-[^/]+$/.test(path);

  let authenticated = false;
  let role = null;

  try {
    const raw = localStorage.getItem(sessionTokenKey);
    if (raw) {
      const session = JSON.parse(raw);
      if (session && session.access_token) {
        authenticated = true;
        role = session.user?.user_metadata?.role || null;
        if (!role && session.user?.email?.toLowerCase().endsWith("@filings4u.com")) {
          role = "admin";
        }
      }
    }
  } catch (error) {
    console.error("Admin session parsing failed:", error);
  }

  if (!authenticated) {
    window.location.replace(isAdminPage ? "admin-login.html" : "portal-login.html");
    return;
  }

  if (isAdminPage && role !== "admin") {
    window.location.replace("client-dashboard.html");
    return;
  }

  document.documentElement.classList.remove("admin-page-loading");
})();

function initializeAdminPageClock() {
  const clock = document.getElementById("portal-clock");
  if (!clock) return;
  const render = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    clock.textContent = `${date} | ${time}`;
  };
  render();
  window.setInterval(render, 1000);
}

document.addEventListener("DOMContentLoaded", initializeAdminPageClock);


/**
 * Filings4U Enterprise Admin
 * Billing & Financials Controller
 *
 * File:
 *   assets/js/admin-billing.js
 *
 * Page:
 *   admin-billing.html
 *
 * Source:
 *   public.orders
 *
 * Existing fields used by the original billing page:
 *   email_address
 *   selected_service
 *   tracking_number
 *   total_paid_amount
 *   stripe_payment_id
 *   created_at
 *
 * This controller intentionally does not create or assume
 * additional billing database columns.
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const state = {
        client: null,
        orders: [],
        searchTerm: "",
        channel: null
    };

    const el = {
        tableBody:
            document.getElementById(
                "admin-billing-audit-rows-target"
            ),

        search:
            document.getElementById(
                "billingLedgerFilterQuery"
            ),

        revenue:
            document.getElementById(
                "metric-total-revenue"
            ),

        checkouts:
            document.getElementById(
                "metric-total-checkouts"
            ),

        pending:
            document.getElementById(
                "metric-pending-audits"
            ),

        stream:
            document.getElementById(
                "metric-stream-status"
            )
    };

    init();

    async function init() {
        startClock();

        state.client =
            resolveSupabaseClient();

        bindEvents();

        if (!state.client) {
            setStreamStatus(false);
            renderError(
                "Supabase client is unavailable."
            );
            return;
        }

        try {
            await loadBillingLedger();
            subscribeToBillingChanges();
        } catch (error) {
            console.error(
                "Billing initialization failed:",
                error
            );

            setStreamStatus(false);
            renderError(
                error?.message ||
                "Unable to load billing records."
            );
        }
    }

    function resolveSupabaseClient() {
        if (window.supabaseInstance) {
            return window.supabaseInstance;
        }

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            typeof window.supabase.createClient ===
                "function" &&
            window.SUPABASE_URL &&
            window.SUPABASE_ANON_KEY
        ) {
            const client =
                window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_ANON_KEY,
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true
                        }
                    }
                );

            window.supabaseInstance = client;
            window.supabaseClient = client;

            return client;
        }

        return null;
    }

    function bindEvents() {
        el.search?.addEventListener(
            "input",
            () => {
                state.searchTerm =
                    String(
                        el.search.value || ""
                    )
                        .trim()
                        .toLowerCase();

                renderBillingRows(
                    getFilteredOrders()
                );
            }
        );
    }

    async function loadBillingLedger() {
        renderLoading();

        const {
            data,
            error
        } = await state.client
            .from("orders")
            .select(
                [
                    "email_address",
                    "selected_service",
                    "tracking_number",
                    "total_paid_amount",
                    "stripe_payment_id",
                    "created_at"
                ].join(", ")
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            throw error;
        }

        state.orders =
            Array.isArray(data)
                ? data
                : [];

        calculateMetrics();
        renderBillingRows(
            getFilteredOrders()
        );

        setStreamStatus(true);
    }

    function calculateMetrics() {
        const totalCheckouts =
            state.orders.length;

        const grossRevenue =
            state.orders.reduce(
                (sum, order) => {
                    return (
                        sum +
                        parseMoney(
                            order.total_paid_amount
                        )
                    );
                },
                0
            );

        if (el.revenue) {
            el.revenue.textContent =
                formatCurrency(
                    grossRevenue
                );
        }

        if (el.checkouts) {
            el.checkouts.textContent =
                String(
                    totalCheckouts
                );
        }

        /*
         * The original page displayed this as a static zero.
         * There is no audit-status column in the supplied query,
         * so we intentionally preserve zero rather than invent
         * a pending-audit calculation.
         */
        if (el.pending) {
            el.pending.textContent = "0";
        }
    }

    function getFilteredOrders() {
        if (!state.searchTerm) {
            return [
                ...state.orders
            ];
        }

        return state.orders.filter(
            (order) => {
                const email =
                    safeLower(
                        order.email_address
                    );

                const service =
                    safeLower(
                        order.selected_service
                    );

                const tracking =
                    safeLower(
                        order.tracking_number
                    );

                return (
                    email.includes(
                        state.searchTerm
                    ) ||
                    service.includes(
                        state.searchTerm
                    ) ||
                    tracking.includes(
                        state.searchTerm
                    )
                );
            }
        );
    }

    function renderLoading() {
        if (!el.tableBody) {
            return;
        }

        el.tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="admin-empty-state">
                    Reconciling billing records...
                </td>
            </tr>
        `;
    }

    function renderError(message) {
        if (!el.tableBody) {
            return;
        }

        el.tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="admin-empty-state admin-empty-state-error">
                    Unable to load billing records.
                    <span>
                        ${escapeHtml(message)}
                    </span>
                </td>
            </tr>
        `;
    }

    function renderBillingRows(
        billingArray
    ) {
        if (!el.tableBody) {
            return;
        }

        if (
            !billingArray ||
            billingArray.length === 0
        ) {
            el.tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="admin-empty-state">
                        ${
                            state.searchTerm
                                ? "No billing records match your search."
                                : "No accounting rows were found."
                        }
                    </td>
                </tr>
            `;

            return;
        }

        el.tableBody.innerHTML = "";

        billingArray.forEach(
            (order) => {
                el.tableBody.appendChild(
                    createBillingRow(
                        order
                    )
                );
            }
        );
    }

    function createBillingRow(
        order
    ) {
        const row =
            document.createElement("tr");

        const email =
            safeValue(
                order.email_address
            ) ||
            "Direct Walk-In Checkout";

        const service =
            safeValue(
                order.selected_service
            ) ||
            "Corporate Asset Filing Package";

        const tracking =
            safeValue(
                order.tracking_number
            ) ||
            "F4U-REF-KEY";

        const amount =
            parseMoney(
                order.total_paid_amount
            );

        const stripeId =
            safeValue(
                order.stripe_payment_id
            ) ||
            "Not Recorded";

        row.innerHTML = `
            <td>
                <span class="admin-mono-value">
                    ${escapeHtml(email)}
                </span>
            </td>

            <td>
                <strong>
                    ${escapeHtml(service)}
                </strong>
            </td>

            <td>
                <span class="admin-mono-value">
                    ${escapeHtml(tracking)}
                </span>
            </td>

            <td>
                <span class="billing-paid-badge">
                    ${escapeHtml(
                        formatCurrency(
                            amount
                        )
                    )}
                </span>
            </td>

            <td>
                <span class="admin-mono-value admin-stripe-value">
                    ${escapeHtml(stripeId)}
                </span>
            </td>
        `;

        return row;
    }

    function subscribeToBillingChanges() {
        if (!state.client) {
            return;
        }

        if (state.channel) {
            state.client.removeChannel(
                state.channel
            );
        }

        /*
         * The original page reads public.orders.
         * Realtime refresh is therefore attached to that table.
         */
        state.channel =
            state.client
                .channel(
                    "admin-billing-orders"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "orders"
                    },
                    async () => {
                        try {
                            await loadBillingLedger();
                        } catch (error) {
                            console.error(
                                "Billing realtime refresh failed:",
                                error
                            );

                            setStreamStatus(
                                false
                            );
                        }
                    }
                )
                .subscribe();
    }

    function setStreamStatus(
        connected
    ) {
        if (!el.stream) {
            return;
        }

        el.stream.textContent =
            connected
                ? "100%"
                : "Offline";

        el.stream.classList.toggle(
            "success-status-color",
            Boolean(connected)
        );

        el.stream.classList.toggle(
            "urgency-alert-color",
            !connected
        );
    }

    function startClock() {
        const clock =
            document.getElementById(
                "adminClock"
            );

        if (!clock) {
            return;
        }

        const update = () => {
            clock.textContent =
                new Intl.DateTimeFormat(
                    undefined,
                    {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                ).format(
                    new Date()
                );
        };

        update();

        window.setInterval(
            update,
            1000
        );
    }

    function parseMoney(value) {
        const numeric =
            Number(
                String(
                    value ?? ""
                ).replace(
                    /[$,\s]/g,
                    ""
                )
            );

        return Number.isFinite(
            numeric
        )
            ? numeric
            : 0;
    }

    function formatCurrency(
        value
    ) {
        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(
            Number(value) || 0
        );
    }

    function safeValue(value) {
        return String(
            value ?? ""
        ).trim();
    }

    function safeLower(value) {
        return safeValue(
            value
        ).toLowerCase();
    }

    function escapeHtml(value) {
        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    /*
     * Compatibility export for older scripts that may
     * still reference the billing refresh function.
     */
    window.refreshBillingLedger =
        loadBillingLedger;
});
