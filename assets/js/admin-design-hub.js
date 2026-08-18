
(function () {
  "use strict";
  const projectUrlHash = "lrbimrlbskjweynxlgas";
  const sessionTokenKey = `sb-${projectUrlHash}-auth-token`;
  const rawSessionJson = localStorage.getItem(sessionTokenKey);
  let isAuthenticated = false;
  let userRole = null;

  if (rawSessionJson) {
    try {
      const sessionData = JSON.parse(rawSessionJson);
      if (sessionData && sessionData.access_token) {
        isAuthenticated = true;
        if (sessionData.user && sessionData.user.user_metadata) {
          userRole = sessionData.user.user_metadata.role;
        }
        if (sessionData.user && !userRole && sessionData.user.email) {
          if (String(sessionData.user.email).toLowerCase().endsWith("@filings4u.com")) {
            userRole = "admin";
          }
        }
      }
    } catch (error) {
      console.error("Security parsing failure:", error);
    }
  }

  const pagePathString = window.location.pathname.toLowerCase();
  const isAdminViewPage = pagePathString.includes("/admin-");

  if (!isAuthenticated) {
    document.documentElement.style.display = "none";
    window.location.replace(isAdminViewPage ? "admin-login.html" : "portal-login.html");
    throw new Error("Authentication required.");
  }

  if (isAdminViewPage && userRole !== "admin") {
    document.documentElement.style.display = "none";
    window.location.replace("client-dashboard.html");
    throw new Error("Administrator role required.");
  }
})();


document.addEventListener("DOMContentLoaded", async () => {
      "use strict";

      // 1. Resolve Document Spreadsheet Target Containers
      const webTableBody = document.getElementById("admin-web-intakes-target-box");
      const logoTableBody = document.getElementById("admin-logo-intakes-target-box");

      if (!webTableBody || !logoTableBody) {
        throw new Error("✕ Critical UI Error: Multi-intake dashboard target spreadsheet tables are absent from document layouts.");
      }

      // 2. Fetch Global Database Instance Connections
      const client = window.supabaseInstance || window.supabaseClient;
      if (!client || typeof client.from !== 'function') {
        webTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--staff-red); font-weight:700;">✕ System Error: Supabase client infrastructure missing.</td></tr>`;
        logoTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--staff-red); font-weight:700;">✕ System Error: Supabase client infrastructure missing.</td></tr>`;
        throw new Error("✕ Initialization Error: Active connection layers are unassigned.");
      }

      // --- STAGE 1: READ AND STREAM LIVE WEBSITE INTAKE PAYLOADS ---
      async function populateWebIntakesTable() {
        try {
          console.log("📡 [Design Hub] Loading rows from public.web_intakes...");
          const { data: webData, error: fetchError } = await client
            .from('web_intakes')
            .select('*')
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;

          if (!webData || webData.length === 0) {
            webTableBody.innerHTML = `<tr><td colspan="5" style="padding:30px; text-align:center; color:var(--text-muted); font-size:0.85rem; font-weight:600;">No customer website specification entries logged inside the ledger.</td></tr>`;
            return;
          }

          webTableBody.innerHTML = "";

          webData.forEach(row => {
            const tr = document.createElement("tr");
            tr.style.cssText = "border-bottom:1px solid var(--border-color); font-size:0.85rem; background:#ffffff; color:var(--text-dark);";

            const trackingKey = row.tracking_number || "GUEST-REF";
            const domain      = row.desired_domain || "N/A";
            const tone        = row.aesthetic_tone || "Not Specified";
            const features    = row.required_features || "Portfolio";
            const notes       = row.architectural_notes || "No extra specs noted.";

            tr.innerHTML = `
              <td style="padding:14px 12px; font-family:monospace; color:var(--text-muted); font-weight:700;">${escapeDesignHub(trackingKey)}</td>
              <td style="padding:14px 12px; font-weight:700; color:#0f172a;">${escapeDesignHub(domain)}</td>
              <td style="padding:14px 12px; color:var(--text-muted); font-weight:600;">${escapeDesignHub(tone)}</td>
              <td style="padding:14px 12px;"><span style="font-size:10px; padding:3px 6px; border-radius:4px; font-weight:700; background:#f1f5f9; color:#475569; letter-spacing:0.5px;">${escapeDesignHub(features)}</span></td>
              <td style="padding:14px 12px; text-align:right; color:var(--text-muted);" class="text-truncate-cell" title="${escapeDesignHub(notes)}">${escapeDesignHub(notes)}</td>
            `;
            webTableBody.appendChild(tr);
          });
        } catch (err) {
          console.error("✕ Web Intakes Hydration Exception:", err.message);
          webTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--staff-red); font-weight:700;">✕ Synchronization Failure: Check browser developer logs.</td></tr>`;
        }
      }

      // --- STAGE 2: READ AND STREAM LIVE LOGO INTAKE PAYLOADS ---
      async function populateLogoIntakesTable() {
        try {
          console.log("📡 [Design Hub] Loading rows from public.logo_intakes...");
          const { data: logoData, error: fetchError } = await client
            .from('logo_intakes')
            .select('*')
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;

          if (!logoData || logoData.length === 0) {
            logoTableBody.innerHTML = `<tr><td colspan="5" style="padding:30px; text-align:center; color:var(--text-muted); font-size:0.85rem; font-weight:600;">No customer branding specification entries logged inside the ledger.</td></tr>`;
            return;
          }

          logoTableBody.innerHTML = "";

          logoData.forEach(row => {
            const tr = document.createElement("tr");
            tr.style.cssText = "border-bottom:1px solid var(--border-color); font-size:0.85rem; background:#ffffff; color:var(--text-dark);";

            const trackingKey = row.tracking_number || "GUEST-REF";
            const textDisplay = row.logo_text || "N/A";
            const tagline     = row.tagline || "N/A";
            const preference  = row.style_preference || "Minimalist";
            const guidelines  = row.concept_description || "No concept notes provided.";

            tr.innerHTML = `
              <td style="padding:14px 12px; font-family:monospace; color:var(--text-muted); font-weight:700;">${escapeDesignHub(trackingKey)}</td>
              <td style="padding:14px 12px; font-weight:700; color:#0f172a;">${escapeDesignHub(textDisplay)}</td>
              <td style="padding:14px 12px; color:var(--text-muted); font-weight:600; font-style:italic;">"${escapeDesignHub(tagline)}"</td>
              <td style="padding:14px 12px;"><span style="font-size:10px; padding:3px 6px; border-radius:4px; font-weight:700; background:#f1f5f9; color:#334155; letter-spacing:0.5px;">${escapeDesignHub(preference)}</span></td>
              <td style="padding:14px 12px; text-align:right; color:var(--text-muted);" class="text-truncate-cell" title="${escapeDesignHub(guidelines)}">${escapeDesignHub(guidelines)}</td>
            `;
            logoTableBody.appendChild(tr);
          });
        } catch (err) {
          console.error("✕ Logo Intakes Hydration Exception:", err.message);
          logoTableBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--staff-red); font-weight:700;">✕ Alignment Interrupted: Failed to extract branding parameters.</td></tr>`;
        }
      }

      function escapeDesignHub(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }

      // Execute both monitoring data pipelines concurrently across thread pools
      await Promise.all([
        populateWebIntakesTable(),
        populateLogoIntakesTable()
      ]);
    });
