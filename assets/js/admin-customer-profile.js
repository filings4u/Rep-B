
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
 * Customer Profile Controller
 *
 * File:
 *   assets/js/admin-customer-profile.js
 *
 * Page:
 *   admin-customer-profile.html
 *
 * Data source:
 *   public.client_profiles
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const state = {
        client: null,
        targetEmail: "",
        profileId: null,
        profile: null,
        saving: false,
        realtimeChannel: null
    };

    const el = {
        pageTitle: document.getElementById("profPageTitle"),
        pageSubtitle: document.getElementById("profPageSubtitle"),

        saveButton: document.getElementById("profSaveMasterChangesBtn"),
        saveBanner: document.getElementById("profSaveBannerAlert"),

        avatar: document.getElementById("profAvatarDisplayNode"),
        summaryTitle: document.getElementById("profAccountSummaryTitle"),
        email: document.getElementById("profEmailLabelField"),
        tracking: document.getElementById("profTrackingLabelField"),
        stripe: document.getElementById("profStripeLabelField"),
        statusLabel: document.getElementById("profStatusLabelField"),

        form: document.getElementById("profMasterOperationsForm"),
        firstName: document.getElementById("profFirstNameField"),
        lastName: document.getElementById("profLastNameField"),
        company: document.getElementById("profCompanyField"),
        phone: document.getElementById("profPhoneField"),
        street: document.getElementById("profStreetField"),
        city: document.getElementById("profCityField"),
        state: document.getElementById("profStateField"),
        zip: document.getElementById("profZipField"),
        status: document.getElementById("profStatusField")
    };

    init();

    async function init() {
        startClock();

        const params = new URLSearchParams(window.location.search);

        state.targetEmail = String(
            params.get("email") || ""
        ).trim().toLowerCase();

        if (!state.targetEmail) {
            renderMissingTarget();
            return;
        }

        state.client = resolveSupabaseClient();

        if (!state.client) {
            renderPageError("Supabase client is unavailable.");
            return;
        }

        bindEvents();

        try {
            await loadTargetProfile();
            subscribeToProfileChanges();
        } catch (error) {
            console.error(
                "Customer profile initialization failed:",
                error
            );

            renderPageError(
                error?.message ||
                "Unable to load the customer profile."
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

        /*
         * supabase-config.js should provide the shared client.
         * No project credentials are duplicated in this page controller.
         */
        if (
            window.supabase &&
            typeof window.supabase.createClient === "function" &&
            window.SUPABASE_URL &&
            window.SUPABASE_ANON_KEY
        ) {
            return window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY
            );
        }

        return null;
    }

    function bindEvents() {
        el.form?.addEventListener("submit", (event) => {
            event.preventDefault();
            saveProfile();
        });

        el.saveButton?.addEventListener(
            "click",
            saveProfile
        );
    }

    async function loadTargetProfile() {
        showLoadingState();

        const { data: profile, error } = await state.client
            .from("client_profiles")
            .select("*")
            .eq(
                "email_address",
                state.targetEmail
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!profile) {
            renderProfileNotFound();
            return;
        }

        state.profile = profile;
        state.profileId = profile.id;

        populateProfile(profile);
    }

    function populateProfile(profile) {
        const firstName = safeValue(profile.first_name);
        const lastName = safeValue(profile.last_name);

        const fullName =
            `${firstName} ${lastName}`.trim() ||
            "Valued Customer";

        const email =
            safeValue(profile.email_address) ||
            state.targetEmail;

        const status =
            safeValue(profile.sync_encryption_status) ||
            "Active";

        el.pageTitle.textContent =
            `Customer Profile: ${fullName}`;

        el.pageSubtitle.textContent =
            `Administrative profile record for ${email}.`;

        el.summaryTitle.textContent = fullName;
        el.email.textContent = email;

        el.tracking.textContent =
            safeValue(profile.tracking_number) ||
            "Not Provisioned";

        el.stripe.textContent =
            safeValue(profile.stripe_customer_id) ||
            "Not Connected";

        el.statusLabel.textContent = status;

        setStatusVisual(status);

        if (profile.avatar_url) {
            el.avatar.src = profile.avatar_url;
        } else {
            el.avatar.src = "images/fav.png";
        }

        el.avatar.onerror = () => {
            el.avatar.src = "images/fav.png";
        };

        el.firstName.value = firstName;
        el.lastName.value = lastName;
        el.company.value =
            safeValue(profile.company_name);

        el.phone.value =
            safeValue(profile.phone_number);

        el.street.value =
            safeValue(profile.street_address);

        el.city.value =
            safeValue(profile.city);

        el.state.value =
            safeValue(profile.state);

        el.zip.value =
            safeValue(profile.zip_code);

        setSelectValue(
            el.status,
            status
        );
    }

    async function saveProfile() {
        if (!state.client || !state.profileId) {
            showSaveBanner(
                "No customer profile is currently loaded.",
                true
            );
            return;
        }

        if (state.saving) {
            return;
        }

        const firstName =
            safeValue(el.firstName.value);

        const lastName =
            safeValue(el.lastName.value);

        if (!firstName || !lastName) {
            showSaveBanner(
                "First name and last name are required.",
                true
            );
            return;
        }

        const updatePayload = {
            first_name: firstName,
            last_name: lastName,
            company_name:
                safeValue(el.company.value),

            phone_number:
                safeValue(el.phone.value),

            street_address:
                safeValue(el.street.value),

            city:
                safeValue(el.city.value),

            state:
                safeValue(el.state.value),

            zip_code:
                safeValue(el.zip.value),

            sync_encryption_status:
                safeValue(el.status.value) ||
                "Active",

            updated_at:
                new Date().toISOString()
        };

        state.saving = true;
        setSaveButtonState(true);

        try {
            const { data, error } =
                await state.client
                    .from("client_profiles")
                    .update(updatePayload)
                    .eq("id", state.profileId)
                    .select("*")
                    .maybeSingle();

            if (error) {
                throw error;
            }

            if (data) {
                state.profile = data;
                populateProfile(data);
            }

            showSaveBanner(
                "Profile changes saved successfully.",
                false
            );

        } catch (error) {
            console.error(
                "Customer profile save failed:",
                error
            );

            showSaveBanner(
                error?.message ||
                "Unable to save profile changes.",
                true
            );

        } finally {
            state.saving = false;
            setSaveButtonState(false);
        }
    }

    function subscribeToProfileChanges() {
        if (!state.client || !state.profileId) {
            return;
        }

        if (state.realtimeChannel) {
            state.client.removeChannel(
                state.realtimeChannel
            );
        }

        state.realtimeChannel = state.client
            .channel(
                `admin-customer-profile-${state.profileId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "client_profiles",
                    filter: `id=eq.${state.profileId}`
                },
                async () => {
                    try {
                        await loadTargetProfile();
                    } catch (error) {
                        console.error(
                            "Customer profile realtime refresh failed:",
                            error
                        );
                    }
                }
            )
            .subscribe();
    }

    function setStatusVisual(status) {
        const normalized =
            normalize(status);

        if (!el.statusLabel) {
            return;
        }

        if (normalized === "active") {
            el.statusLabel.style.color =
                "var(--admin-success, #138a67)";
        } else {
            el.statusLabel.style.color =
                "var(--admin-danger, #b4232b)";
        }
    }

    function setSelectValue(select, value) {
        if (!select) {
            return;
        }

        const normalized =
            normalize(value);

        const matchingOption =
            Array.from(select.options)
                .find(
                    (option) =>
                        normalize(option.value) ===
                        normalized
                );

        if (matchingOption) {
            select.value =
                matchingOption.value;
        } else {
            select.value = "Active";
        }
    }

    function setSaveButtonState(isSaving) {
        if (!el.saveButton) {
            return;
        }

        el.saveButton.disabled = isSaving;

        el.saveButton.textContent = isSaving
            ? "Saving Profile..."
            : "Save Profile Changes";
    }

    function showSaveBanner(message, isError) {
        if (!el.saveBanner) {
            return;
        }

        el.saveBanner.hidden = false;
        el.saveBanner.textContent = message;
        el.saveBanner.classList.toggle(
            "error",
            Boolean(isError)
        );
        el.saveBanner.classList.toggle(
            "success",
            !isError
        );

        window.clearTimeout(
            showSaveBanner.timer
        );

        showSaveBanner.timer =
            window.setTimeout(() => {
                if (el.saveBanner) {
                    el.saveBanner.hidden = true;
                }
            }, 5000);
    }

    function showLoadingState() {
        if (el.summaryTitle) {
            el.summaryTitle.textContent =
                "Loading Profile...";
        }

        if (el.pageSubtitle) {
            el.pageSubtitle.textContent =
                "Retrieving customer account data...";
        }

        if (el.saveButton) {
            el.saveButton.disabled = true;
        }
    }

    function renderMissingTarget() {
        if (el.pageTitle) {
            el.pageTitle.textContent =
                "Customer Profile";
        }

        if (el.pageSubtitle) {
            el.pageSubtitle.textContent =
                "No customer account was selected.";
        }

        if (el.summaryTitle) {
            el.summaryTitle.textContent =
                "No Target Account";
        }

        if (el.email) {
            el.email.textContent =
                "Return to the CRM directory.";
        }

        if (el.saveButton) {
            el.saveButton.disabled = true;
        }

        disableForm();

        showSaveBanner(
            "No customer email parameter was supplied in the page URL.",
            true
        );
    }

    function renderProfileNotFound() {
        if (el.pageTitle) {
            el.pageTitle.textContent =
                "Customer Profile Not Found";
        }

        if (el.pageSubtitle) {
            el.pageSubtitle.textContent =
                `No profile matched ${state.targetEmail}.`;
        }

        if (el.summaryTitle) {
            el.summaryTitle.textContent =
                "Record Not Found";
        }

        if (el.email) {
            el.email.textContent =
                state.targetEmail;
        }

        if (el.saveButton) {
            el.saveButton.disabled = true;
        }

        disableForm();

        showSaveBanner(
            "No customer profile matched the supplied account email.",
            true
        );
    }

    function renderPageError(message) {
        if (el.pageTitle) {
            el.pageTitle.textContent =
                "Customer Profile Error";
        }

        if (el.pageSubtitle) {
            el.pageSubtitle.textContent =
                "The profile could not be loaded.";
        }

        if (el.summaryTitle) {
            el.summaryTitle.textContent =
                "Unable to Load Profile";
        }

        if (el.email) {
            el.email.textContent =
                "Database connection error";
        }

        if (el.saveButton) {
            el.saveButton.disabled = true;
        }

        disableForm();

        showSaveBanner(
            message,
            true
        );
    }

    function disableForm() {
        if (!el.form) {
            return;
        }

        el.form
            .querySelectorAll("input, select, button")
            .forEach((control) => {
                control.disabled = true;
            });
    }

    function startClock() {
        const clock =
            document.getElementById("adminClock");

        if (!clock) {
            return;
        }

        const updateClock = () => {
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
                ).format(new Date());
        };

        updateClock();

        window.setInterval(
            updateClock,
            1000
        );
    }

    function safeValue(value) {
        return String(value ?? "").trim();
    }

    function normalize(value) {
        return safeValue(value).toLowerCase();
    }
});
