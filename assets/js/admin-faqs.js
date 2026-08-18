
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

      // 1. Resolve Strict DOM Target Selectors
      const faqForm        = document.getElementById("faqEntryForm");
      const faqCategorySel = document.getElementById("faqCategory");
      const faqQuestionIn  = document.getElementById("faqQuestion");
      const faqAnswerIn    = document.getElementById("faqAnswer");
      const formStatusDiv  = document.getElementById("faq-form-status");
      const submitButton   = document.getElementById("faqSubmitBtn");
      const faqTargetBox   = document.getElementById("admin-faq-target-box");

      if (!faqForm || !faqTargetBox || !formStatusDiv || !submitButton) {
        throw new Error("✕ Critical UI Error: Missing core layout template faq forms or status nodes.");
      }

      // 2. Fetch Master Client Initialization Instances
      const client = window.supabaseInstance || window.supabaseClient;
      if (!client || typeof client.from !== 'function') {
        faqTargetBox.innerHTML = `<div style="padding:20px; text-align:center; color:var(--staff-red); font-weight:700;">✕ System Error: Supabase client infrastructure missing.</div>`;
        throw new Error("✕ Initialization Error: Database configuration reference unassigned.");
      }

      // --- STAGE 1: READ AND FETCH ALL ACTIVE PUBLIC FAQS ---
      async function streamActiveFaqs() {
        try {
          console.log("📡 [FAQs Engine] Querying live entries from public.faqs...");
          
          const { data: faqs, error: fetchError } = await client
            .from('faqs')
            .select('id, category, question, answer, created_at')
            .order('created_at', { ascending: false });

          if (fetchError) {
            throw new Error(`Postgres Retrieval Failure [Code ${fetchError.code}]: ${fetchError.message}`);
          }

          if (!faqs || faqs.length === 0) {
            faqTargetBox.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:0.85rem; font-weight:600;">No active knowledge base rows discovered inside database archives.</div>`;
            return;
          }

          faqTargetBox.innerHTML = "";

          faqs.forEach(faqItem => {
            const rowWrapper = document.createElement("div");
            rowWrapper.className = "faq-item-row";

            rowWrapper.innerHTML = `
              <div class="faq-info-meta">
                <h4>${escapeFaqHtml(faqItem.question)}</h4>
                <p>${escapeFaqHtml(faqItem.answer)}</p>
                <span class="category-tag">${escapeFaqHtml(faqItem.category)}</span>
              </div>
              <button class="delete-row-btn" data-id="${faqItem.id}">Delete Entry</button>
            `;

            // Bind individual click listeners to the specific item delete button
            const deleteBtn = rowWrapper.querySelector(".delete-row-btn");
            deleteBtn.addEventListener("click", async function() {
              const targetFaqId = this.getAttribute("data-id");
              this.disabled = true;
              this.textContent = "Removing...";
              console.log(`📡 [FAQs Engine] Deleting entry row matching ID: [${targetFaqId}]`);

              try {
                const { error: deleteError } = await client
                  .from('faqs')
                  .delete()
                  .eq('id', targetFaqId);

                if (deleteError) throw deleteError;
                console.log("✓ [FAQs Engine] FAQ deletion verified by backend database server.");
                await streamActiveFaqs(); // Re-fetch rows instantly

              } catch (delFault) {
                console.error("✕ Database row deletion request refused:", delFault.message);
                alert(`✕ Deletion Refused: ${delFault.message}`);
                this.disabled = false;
                this.textContent = "Delete Entry";
              }
            });

            faqTargetBox.appendChild(rowWrapper);
          });

        } catch (queryFault) {
          console.error("✕ FAQs Inventory Synchronization Aborted:", queryFault.message);
          faqTargetBox.innerHTML = `<div style="padding:20px; text-align:center; color:var(--staff-red); font-weight:700;">✕ Synchronization Failure: Check browser developer logs.</div>`;
        }
      }

      // --- STAGE 2: HANDLE NEW FAQ ENTRY FORM COMPOSITION SUBMISSIONS ---
      faqForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        formStatusDiv.style.display = "none";
        formStatusDiv.textContent = "";

        const category = faqCategorySel.value;
        const question = faqQuestionIn.value.trim();
        const answer   = faqAnswerIn.value.trim();

        if (!category || !question || !answer) {
          formStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          formStatusDiv.textContent = "✕ Validation Error: All form fields are required.";
          return;
        }

        const originalBtnLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Broadcasting to Table Context...";

        try {
          console.log("📡 [FAQs Engine] Pushing new entry payload row to public.faqs...");
          
          const { error: insertError } = await client
            .from('faqs')
            .insert([
              { category, question, answer, created_at: new Date().toISOString() }
            ]);

          if (insertError) {
            throw new Error(`Postgres Insertion Failure [Code ${insertError.code}]: ${insertError.message}`);
          }

          console.log("✅ [FAQs Engine] Content successfully added to table layers.");
          formStatusDiv.style.cssText = "display:block; background:#ecfdf5; color:#047857;";
          formStatusDiv.textContent = "✓ FAQ entry successfully published live to production distribution pipelines!";
          
          faqForm.reset();
          await streamActiveFaqs(); // Hydrate inventory instantly

        } catch (postFault) {
          console.error("✕ FAQ entry publication chain broke:", postFault.message);
          formStatusDiv.style.cssText = "display:block; background:#fef2f2; color:#991b1b;";
          formStatusDiv.textContent = `✕ Publishing Aborted: ${postFault.message}`;
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnLabel;
        }
      });

      function escapeFaqHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }

      // Trigger structural execution cycle immediately on initial thread frame
      await streamActiveFaqs();
    });
