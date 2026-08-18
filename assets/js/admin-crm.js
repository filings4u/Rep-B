
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
 * Filings4U Enterprise Admin CRM
 * File: assets/js/admin-crm.js
 *
 * Page-specific controller for:
 *   admin-crm.html
 *
 * Database source:
 *   public.client_profiles
 *
 * This file intentionally contains CRM behavior only.
 * Shared navigation belongs to admin-navigation.js.
 * Shared visual styling belongs to admin-css.css.
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const state = {
        client: null,
        profiles: [],
        activeFilter: "all",
        searchTerm: "",
        realtimeChannel: null,
        deleteId: null,
        deleteEmail: null
    };

    const el = {
        tableBody: document.getElementById("admin-crm-target-box"),
        search: document.getElementById("crmGlobalSearchField"),
        resultCount: document.getElementById("crmResultCount"),

        total: document.getElementById("metric-total-clients"),
        active: document.getElementById("metric-registered-accounts"),
        suspended: document.getElementById("metric-guest-leads"),

        intakeDrawer: document.getElementById("intakeDrawer"),
        drawerOverlay: document.getElementById("drawerOverlay"),
        openIntake: document.getElementById("openCrmIntakeBtn"),
        closeIntake: document.getElementById("closeCrmIntakeBtn"),

        form: document.getElementById("crmQuickProvisionForm"),
        first: document.getElementById("crmNewFirst"),
        last: document.getElementById("crmNewLast"),
        email: document.getElementById("crmNewEmail"),
        phone: document.getElementById("crmNewPhone"),
        company: document.getElementById("crmNewCompany"),
        status: document.getElementById("crmNewStatus"),
        formStatus: document.getElementById("crmFormStatusText"),
        submit: document.getElementById("crmSubmitBtn"),

        deleteOverlay: document.getElementById("crmDeleteModalOverlay"),
        deleteTarget: document.getElementById("crmDeleteTargetEmail"),
        deleteConfirm: document.getElementById("crmModalConfirmDeleteBtn"),
        deleteCancel: document.getElementById("crmModalCancelDeleteBtn")
    };

    init();

    async function init() {
        try {
            state.client = resolveSupabaseClient();

            if (!state.client) {
                renderError("Supabase client is unavailable.");
                return;
            }

            bindEvents();
            startClock();

            await loadProfiles();
            subscribeToProfileChanges();
        } catch (error) {
            console.error("CRM initialization failed:", error);
            renderError(error?.message || "Unable to initialize the CRM.");
        }
    }

    function resolveSupabaseClient() {
        if (window.supabaseInstance) {
            return window.supabaseInstance;
        }

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        /*
         * supabase-config.js should normally expose the shared client.
         * We deliberately do not duplicate project credentials here.
         */
        if (window.supabase && typeof window.supabase.createClient === "function") {
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                return window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_ANON_KEY
                );
            }
        }

        return null;
    }

    function bindEvents() {
        el.search?.addEventListener("input", () => {
            state.searchTerm = String(el.search.value || "")
                .trim()
                .toLowerCase();

            render();
        });

        document.querySelectorAll("[data-crm-filter]").forEach((button) => {
            button.addEventListener("click", () => {
                state.activeFilter = button.dataset.crmFilter || "all";
                updateFilterButtons();
                render();
            });
        });

        el.openIntake?.addEventListener("click", openIntakeDrawer);
        el.closeIntake?.addEventListener("click", closeIntakeDrawer);
        el.drawerOverlay?.addEventListener("click", closeIntakeDrawer);

        el.form?.addEventListener("submit", handleCreateProfile);

        el.deleteCancel?.addEventListener("click", closeDeleteModal);
        el.deleteConfirm?.addEventListener("click", confirmDelete);

        el.deleteOverlay?.addEventListener("click", (event) => {
            if (event.target === el.deleteOverlay) {
                closeDeleteModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;

            if (isDrawerOpen()) {
                closeIntakeDrawer();
            }

            if (isDeleteModalOpen()) {
                closeDeleteModal();
            }
        });
    }

    async function loadProfiles() {
        renderLoading();

        const { data, error } = await state.client
            .from("client_profiles")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) {
            throw error;
        }

        state.profiles = Array.isArray(data) ? data : [];

        updateMetrics();
        render();
    }

    function updateMetrics() {
        const total = state.profiles.length;

        const active = state.profiles.filter((profile) => {
            return normalizeStatus(profile.sync_encryption_status) === "active";
        }).length;

        const suspended = state.profiles.filter((profile) => {
            return normalizeStatus(profile.sync_encryption_status) === "suspended";
        }).length;

        if (el.total) el.total.textContent = total;
        if (el.active) el.active.textContent = active;
        if (el.suspended) el.suspended.textContent = suspended;
    }

    function getFilteredProfiles() {
        let records = [...state.profiles];

        if (state.activeFilter === "active") {
            records = records.filter((profile) => {
                return normalizeStatus(profile.sync_encryption_status) === "active";
            });
        }

        if (state.activeFilter === "suspended") {
            records = records.filter((profile) => {
                return normalizeStatus(profile.sync_encryption_status) === "suspended";
            });
        }

        if (state.searchTerm) {
            records = records.filter((profile) => {
                const values = [
                    profile.first_name,
                    profile.last_name,
                    profile.email_address,
                    profile.company_name,
                    profile.tracking_number,
                    profile.city,
                    profile.state
                ];

                return values.some((value) => {
                    return String(value ?? "")
                        .toLowerCase()
                        .includes(state.searchTerm);
                });
            });
        }

        return records;
    }

    function render() {
        if (!el.tableBody) return;

        const records = getFilteredProfiles();

        if (el.resultCount) {
            el.resultCount.textContent =
                `${records.length} ${records.length === 1 ? "record" : "records"}`;
        }

        if (!records.length) {
            el.tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="padding:48px; text-align:center; color:var(--admin-text-muted);">
                        No customer profiles match the current filters.
                    </td>
                </tr>
            `;
            return;
        }

        el.tableBody.innerHTML = "";

        records.forEach((profile) => {
            el.tableBody.appendChild(createProfileRow(profile));
        });
    }

    function createProfileRow(profile) {
        const row = document.createElement("tr");

        const first = safeText(profile.first_name);
        const last = safeText(profile.last_name);
        const fullName = `${first} ${last}`.trim() || "Unnamed Customer";

        const email = safeText(profile.email_address) || "No email";
        const company = safeText(profile.company_name) || "Not specified";
        const tracking = safeText(profile.tracking_number) || "No reference";
        const city = safeText(profile.city);
        const region = safeText(profile.state);

        const location =
            city && region
                ? `${city}, ${region}`
                : city || region || "Awaiting input";

        const status = normalizeStatus(profile.sync_encryption_status) || "active";

        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px; min-width:220px;">
                    <img
                        src="${escapeAttribute(profile.avatar_url || "images/fav.png")}"
                        alt=""
                        width="34"
                        height="34"
                        style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--admin-border); background:#f4f6f8;">

                    <div style="min-width:0;">
                        <div style="font-weight:750; color:var(--admin-text);">
                            ${escapeHtml(fullName)}
                        </div>

                        <div style="font-size:10px; color:var(--admin-text-muted); word-break:break-all;">
                            ${escapeHtml(email)}
                        </div>
                    </div>
                </div>
            </td>

            <td>${escapeHtml(company)}</td>

            <td>
                <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; font-weight:700;">
                    ${escapeHtml(tracking)}
                </span>
            </td>

            <td>${escapeHtml(location)}</td>

            <td>
                <span class="crm-badge ${status === "suspended" ? "suspended" : "active"}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td style="text-align:right; white-space:nowrap;">
                <div style="display:inline-flex; align-items:center; gap:6px;">
                    <button
                        type="button"
                        class="crm-action-btn"
                        data-crm-view="${escapeAttribute(email)}">
                        View
                    </button>

                    <button
                        type="button"
                        class="crm-action-btn delete"
                        data-crm-delete-id="${escapeAttribute(profile.id || "")}"
                        data-crm-delete-email="${escapeAttribute(email)}">
                        Delete
                    </button>
                </div>
            </td>
        `;

        const viewButton = row.querySelector("[data-crm-view]");
        const deleteButton = row.querySelector("[data-crm-delete-id]");

        viewButton?.addEventListener("click", () => {
            navigateToProfile(email);
        });

        deleteButton?.addEventListener("click", () => {
            openDeleteModal(
                profile.id,
                email
            );
        });

        return row;
    }

    function navigateToProfile(email) {
        if (!email) return;

        window.location.href =
            `admin-customer-profile.html?email=${encodeURIComponent(
                String(email).trim().toLowerCase()
            )}`;
    }

    function openIntakeDrawer() {
        if (!el.intakeDrawer) return;

        el.intakeDrawer.classList.add("open");
        el.intakeDrawer.setAttribute("aria-hidden", "false");

        if (el.drawerOverlay) {
            el.drawerOverlay.hidden = false;
            el.drawerOverlay.classList.add("open");
        }

        setTimeout(() => {
            el.first?.focus();
        }, 50);
    }

    function closeIntakeDrawer() {
        if (!el.intakeDrawer) return;

        el.intakeDrawer.classList.remove("open");
        el.intakeDrawer.setAttribute("aria-hidden", "true");

        if (el.drawerOverlay) {
            el.drawerOverlay.classList.remove("open");
            el.drawerOverlay.hidden = true;
        }

        el.form?.reset();
        hideFormStatus();
    }

    async function handleCreateProfile(event) {
        event.preventDefault();

        const firstName = String(el.first?.value || "").trim();
        const lastName = String(el.last?.value || "").trim();
        const email = String(el.email?.value || "").trim().toLowerCase();
        const phone = String(el.phone?.value || "").trim();
        const company = String(el.company?.value || "").trim();
        const status = normalizeStatus(el.status?.value) || "active";

        if (!firstName || !lastName || !email) {
            showFormStatus(
                "First name, last name, and email address are required.",
                true
            );
            return;
        }

        if (!isValidEmail(email)) {
            showFormStatus(
                "Please enter a valid email address.",
                true
            );
            return;
        }

        setSubmitState(true);

        try {
            const record = {
                id: generateUuid(),
                email_address: email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone || "Not Provided",
                company_name: company || "Not Specified",
                sync_encryption_status: status,
                tracking_number:
                    "F4U-" +
                    Math.floor(100000 + Math.random() * 900000),
                updated_at: new Date().toISOString()
            };

            const { error } = await state.client
                .from("client_profiles")
                .insert([record]);

            if (error) {
                throw error;
            }

            showFormStatus(
                "Customer profile created successfully.",
                false
            );

            await loadProfiles();

            setTimeout(() => {
                closeIntakeDrawer();
            }, 900);

        } catch (error) {
            console.error("CRM profile creation failed:", error);

            showFormStatus(
                error?.message || "Unable to create the customer profile.",
                true
            );
        } finally {
            setSubmitState(false);
        }
    }

    function openDeleteModal(profileId, email) {
        if (!profileId || !email || !el.deleteOverlay) return;

        state.deleteId = profileId;
        state.deleteEmail = email;

        if (el.deleteTarget) {
            el.deleteTarget.textContent = email;
        }

        el.deleteOverlay.hidden = false;

        requestAnimationFrame(() => {
            el.deleteOverlay.classList.add("open");
        });

        setTimeout(() => {
            el.deleteCancel?.focus();
        }, 40);
    }

    function closeDeleteModal() {
        if (!el.deleteOverlay) return;

        el.deleteOverlay.classList.remove("open");

        setTimeout(() => {
            el.deleteOverlay.hidden = true;
        }, 180);

        state.deleteId = null;
        state.deleteEmail = null;
    }

    async function confirmDelete() {
        if (!state.deleteId || !state.client) return;

        setDeleteButtonState(true);

        try {
            const { error } = await state.client
                .from("client_profiles")
                .delete()
                .eq("id", state.deleteId);

            if (error) {
                throw error;
            }

            closeDeleteModal();
            await loadProfiles();

        } catch (error) {
            console.error("CRM deletion failed:", error);

            closeDeleteModal();

            showTransientMessage(
                error?.message || "Unable to delete the customer profile.",
                true
            );
        } finally {
            setDeleteButtonState(false);
        }
    }

    function subscribeToProfileChanges() {
        if (!state.client) return;

        if (state.realtimeChannel) {
            state.client.removeChannel(state.realtimeChannel);
        }

        state.realtimeChannel = state.client
            .channel("admin-crm-client-profiles")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "client_profiles"
                },
                async () => {
                    try {
                        await loadProfiles();
                    } catch (error) {
                        console.error(
                            "CRM realtime refresh failed:",
                            error
                        );
                    }
                }
            )
            .subscribe();
    }

    function updateFilterButtons() {
        document.querySelectorAll("[data-crm-filter]").forEach((button) => {
            const isActive =
                button.dataset.crmFilter === state.activeFilter;

            button.classList.toggle("active", isActive);
            button.setAttribute(
                "aria-selected",
                isActive ? "true" : "false"
            );
        });
    }

    function renderLoading() {
        if (!el.tableBody) return;

        el.tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="padding:48px; text-align:center; color:var(--admin-text-muted);">
                    Loading customer records...
                </td>
            </tr>
        `;
    }

    function renderError(message) {
        if (!el.tableBody) return;

        el.tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="padding:42px; text-align:center; color:var(--admin-danger); font-weight:700;">
                    Unable to load customer records.<br>
                    <span style="display:inline-block; margin-top:6px; font-size:11px; font-weight:500;">
                        ${escapeHtml(message)}
                    </span>
                </td>
            </tr>
        `;
    }

    function showFormStatus(message, isError) {
        if (!el.formStatus) return;

        el.formStatus.hidden = false;
        el.formStatus.textContent = message;

        el.formStatus.style.padding = "9px";
        el.formStatus.style.borderRadius = "7px";
        el.formStatus.style.fontSize = "11px";
        el.formStatus.style.fontWeight = "700";
        el.formStatus.style.textAlign = "center";

        if (isError) {
            el.formStatus.style.background = "var(--admin-danger-bg)";
            el.formStatus.style.color = "var(--admin-danger)";
            el.formStatus.style.border = "1px solid #f0c8cb";
        } else {
            el.formStatus.style.background = "var(--admin-success-bg)";
            el.formStatus.style.color = "var(--admin-success)";
            el.formStatus.style.border = "1px solid #c5eadc";
        }
    }

    function hideFormStatus() {
        if (!el.formStatus) return;

        el.formStatus.hidden = true;
        el.formStatus.textContent = "";
    }

    function setSubmitState(isBusy) {
        if (!el.submit) return;

        el.submit.disabled = isBusy;
        el.submit.textContent = isBusy
            ? "Creating Profile..."
            : "Create Customer Profile";
    }

    function setDeleteButtonState(isBusy) {
        if (!el.deleteConfirm) return;

        el.deleteConfirm.disabled = isBusy;
        el.deleteConfirm.textContent = isBusy
            ? "Deleting..."
            : "Delete Permanently";
    }

    function showTransientMessage(message, isError) {
        const existing = document.getElementById("crmTransientMessage");
        existing?.remove();

        const box = document.createElement("div");
        box.id = "crmTransientMessage";

        box.textContent = message;

        Object.assign(box.style, {
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: "3000",
            maxWidth: "min(420px, calc(100vw - 40px))",
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid",
            background: isError
                ? "var(--admin-danger-bg)"
                : "var(--admin-success-bg)",
            color: isError
                ? "var(--admin-danger)"
                : "var(--admin-success)",
            borderColor: isError
                ? "#f0c8cb"
                : "#c5eadc",
            boxShadow: "var(--admin-shadow-lg)",
            fontSize: "11px",
            fontWeight: "700"
        });

        document.body.appendChild(box);

        setTimeout(() => {
            box.remove();
        }, 4000);
    }

    function startClock() {
        const clock = document.getElementById("adminClock");
        if (!clock) return;

        const update = () => {
            clock.textContent = new Intl.DateTimeFormat(
                undefined,
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                }
            ).format(new Date());
        };

        update();
        window.setInterval(update, 1000);
    }

    function normalizeStatus(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function safeText(value) {
        return String(value ?? "").trim();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function generateUuid() {
        if (crypto?.randomUUID) {
            return crypto.randomUUID();
        }

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            (character) => {
                const random = Math.random() * 16 | 0;
                const value =
                    character === "x"
                        ? random
                        : (random & 0x3) | 0x8;

                return value.toString(16);
            }
        );
    }

    function isDrawerOpen() {
        return Boolean(
            el.intakeDrawer?.classList.contains("open")
        );
    }

    function isDeleteModalOpen() {
        return Boolean(
            el.deleteOverlay &&
            !el.deleteOverlay.hidden
        );
    }

    /*
     * Backwards-compatible public methods.
     * Existing code elsewhere on the admin portal can still call these.
     */
    window.openIntakeDrawer = openIntakeDrawer;
    window.closeIntakeDrawer = closeIntakeDrawer;
    window.filterCrmByTab = (filter) => {
        state.activeFilter = filter || "all";
        updateFilterButtons();
        render();
    };
    window.navigateToCustomerDetailedProfile = navigateToProfile;
    window.triggerCustomerProfileTermination = openDeleteModal;
    window.closeCrmDeleteModal = closeDeleteModal;
});
