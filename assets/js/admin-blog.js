
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
 * Blog Management Controller
 *
 * File:
 *   assets/js/admin-blog.js
 *
 * Preserves the original blog editor workflow:
 * - Quill 2 rich-text editor
 * - Undo / redo
 * - Font selection
 * - Font sizes
 * - Bold / italic / underline / strike
 * - Links
 * - Colors / highlights
 * - Alignment
 * - Ordered / unordered lists
 * - Indentation
 * - Clean formatting
 * - Cover image upload
 * - Article create / edit / delete
 * - Article search
 * - Share metrics
 *
 * Database:
 *   public.blog_posts
 *
 * Storage:
 *   blog-media-vault
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const state = {
        client: null,
        posts: [],
        editingPostId: null,
        preservedImageUrl: "",
        quill: null,
        pendingModalAction: null
    };

    const el = {
        form: document.getElementById("masterLongBlogForm"),
        title: document.getElementById("blogTitle"),
        category: document.getElementById("blogCategory"),
        serviceSlug: document.getElementById("blogSlug"),
        summary: document.getElementById("blogSummary"),
        imageFile: document.getElementById("blogImageFile"),
        imagePreviewWrap: document.getElementById(
            "current-blog-image-preview"
        ),
        imagePreview: document.getElementById(
            "current-blog-image"
        ),
        seoTitle: document.getElementById(
            "seoMetaTitle"
        ),
        seoDescription: document.getElementById(
            "seoMetaDescription"
        ),
        summaryCount: document.getElementById(
            "blog-summary-current-count"
        ),
        summaryCounter: document.getElementById(
            "blog-summary-warn-pill"
        ),
        feedback: document.getElementById(
            "publishFeedbackMsg"
        ),
        submit: document.getElementById(
            "publishSubmitBtn"
        ),
        cancelEdit: document.getElementById(
            "btn-cancel-blog-edit"
        ),
        formTitle: document.getElementById(
            "publisher-form-title"
        ),
        catalog: document.getElementById(
            "live-blog-rows-target"
        ),
        metrics: document.getElementById(
            "metrics-leaderboard-rows-target"
        ),
        globalSearch: document.getElementById(
            "adminGlobalSearchField"
        ),
        clock: document.getElementById(
            "adminClock"
        ),
        modal: document.getElementById(
            "adminBlogModal"
        ),
        modalIcon: document.getElementById(
            "adminBlogModalIcon"
        ),
        modalTitle: document.getElementById(
            "adminBlogModalTitle"
        ),
        modalMessage: document.getElementById(
            "adminBlogModalMessage"
        ),
        modalClose: document.getElementById(
            "adminBlogModalClose"
        ),
        modalCancel: document.getElementById(
            "adminBlogModalCancel"
        ),
        modalConfirm: document.getElementById(
            "adminBlogModalConfirm"
        )
    };

    init();

    async function init() {
        startClock();
        bindEvents();
        configureQuill();

        state.client = resolveSupabaseClient();

        if (!state.client) {
            showFeedback(
                "Database connection is unavailable.",
                "error"
            );
            renderCatalogError(
                "Supabase client was not initialized."
            );
            return;
        }

        try {
            await verifyAdminSession();
            await loadBlogPosts();
            await loadAnalytics();
            subscribeToBlogChanges();
        } catch (error) {
            console.error(
                "Blog administration initialization failed:",
                error
            );

            showFeedback(
                error?.message ||
                "Unable to initialize the blog workspace.",
                "error"
            );
        }
    }

    function resolveSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.supabaseInstance) {
            return window.supabaseInstance;
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

            window.supabaseClient = client;
            window.supabaseInstance = client;

            return client;
        }

        return null;
    }

    async function verifyAdminSession() {
        const {
            data,
            error
        } = await state.client.auth.getSession();

        if (error) {
            throw error;
        }

        const session = data?.session;

        if (!session?.user) {
            window.location.replace(
                "admin-login.html"
            );
            throw new Error(
                "Administrative authentication required."
            );
        }

        const email =
            safeLower(
                session.user.email
            );

        const role =
            safeLower(
                session.user.user_metadata?.role
            );

        const isFilingsStaff =
            email.endsWith(
                "@filings4u.com"
            );

        if (
            role !== "admin" &&
            !isFilingsStaff
        ) {
            window.location.replace(
                "client-dashboard.html"
            );

            throw new Error(
                "Administrative access is restricted."
            );
        }
    }

    function configureQuill() {
        if (
            !window.Quill ||
            !document.getElementById(
                "editor-container"
            )
        ) {
            return;
        }

        const FontAttributor =
            Quill.import(
                "formats/font"
            );

        FontAttributor.whitelist = [
            "sans-serif",
            "serif",
            "monospace",
            "segoe-ui",
            "plus-jakarta-sans",
            "inter",
            "roboto",
            "open-sans",
            "montserrat",
            "georgia"
        ];

        Quill.register(
            FontAttributor,
            true
        );

        const SizeAttributor =
            Quill.import(
                "formats/size"
            );

        SizeAttributor.whitelist = [
            "small",
            "normal",
            "large",
            "huge"
        ];

        Quill.register(
            SizeAttributor,
            true
        );

        const icons =
            Quill.import(
                "ui/icons"
            );

        icons.undo =
            '<svg viewBox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 4.5 2 8.5 6 12.5 6 4.5"/><path class="ql-stroke" d="M2,8.5 C6.5,4.5 12.5,4.5 15,8.5 C17,11.5 16,14 16,14"/></svg>';

        icons.redo =
            '<svg viewBox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 4.5 16 8.5 12 12.5 12 4.5"/><path class="ql-stroke" d="M16,8.5 C11.5,4.5 5.5,4.5 3,8.5 C1,11.5 2,14 2,14"/></svg>';

        state.quill =
            new Quill(
                "#editor-container",
                {
                    theme: "snow",
                    modules: {
                        history: {
                            delay: 1000,
                            maxStack: 500,
                            userOnly: true
                        },
                        toolbar: [
                            ["undo", "redo"],
                            [
                                {
                                    font: [
                                        "sans-serif",
                                        "serif",
                                        "monospace",
                                        "segoe-ui",
                                        "plus-jakarta-sans",
                                        "inter",
                                        "roboto",
                                        "open-sans",
                                        "montserrat",
                                        "georgia"
                                    ]
                                }
                            ],
                            [
                                {
                                    size: [
                                        "small",
                                        "normal",
                                        "large",
                                        "huge"
                                    ]
                                }
                            ],
                            [
                                "bold",
                                "italic",
                                "underline",
                                "strike",
                                "link"
                            ],
                            [
                                {
                                    color: []
                                },
                                {
                                    background: []
                                }
                            ],
                            [
                                {
                                    align: []
                                }
                            ],
                            [
                                {
                                    list: "ordered"
                                },
                                {
                                    list: "bullet"
                                }
                            ],
                            [
                                {
                                    indent: "-1"
                                },
                                {
                                    indent: "+1"
                                }
                            ],
                            ["clean"]
                        ]
                    }
                }
            );

        const toolbar =
            state.quill.getModule(
                "toolbar"
            );

        if (toolbar) {
            toolbar.addHandler(
                "undo",
                () => {
                    state.quill.history.undo();
                }
            );

            toolbar.addHandler(
                "redo",
                () => {
                    state.quill.history.redo();
                }
            );
        }

        injectQuillFontStyles();
    }

    function injectQuillFontStyles() {
        const style =
            document.createElement(
                "style"
            );

        style.textContent = `
            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="segoe-ui"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="segoe-ui"]::before {
                content: "Segoe UI" !important;
            }

            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="plus-jakarta-sans"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="plus-jakarta-sans"]::before {
                content: "Plus Jakarta" !important;
            }

            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="inter"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="inter"]::before {
                content: "Inter" !important;
            }

            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="roboto"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="roboto"]::before {
                content: "Roboto" !important;
            }

            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="open-sans"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="open-sans"]::before {
                content: "Open Sans" !important;
            }

            .ql-snow .ql-picker.ql-font
            .ql-picker-item[data-value="montserrat"]::before,
            .ql-snow .ql-picker.ql-font
            .ql-picker-label[data-value="montserrat"]::before {
                content: "Montserrat" !important;
            }

            .ql-font-segoe-ui {
                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Roboto,
                    sans-serif;
            }

            .ql-font-plus-jakarta-sans {
                font-family:
                    "Plus Jakarta Sans",
                    sans-serif;
            }

            .ql-font-inter {
                font-family:
                    Inter,
                    sans-serif;
            }

            .ql-font-roboto {
                font-family:
                    Roboto,
                    sans-serif;
            }

            .ql-font-open-sans {
                font-family:
                    "Open Sans",
                    sans-serif;
            }

            .ql-font-montserrat {
                font-family:
                    Montserrat,
                    sans-serif;
            }

            .ql-font-georgia {
                font-family:
                    Georgia,
                    serif;
            }

            .admin-blog-editor-card .ql-editor {
                min-height: 350px;
                font-size: 16px;
                line-height: 1.7;
            }
        `;

        document.head.appendChild(
            style
        );
    }

    function bindEvents() {
        el.form?.addEventListener(
            "submit",
            handleSubmit
        );

        el.cancelEdit?.addEventListener(
            "click",
            resetEditor
        );

        el.summary?.addEventListener(
            "input",
            updateSummaryCounter
        );

        el.imageFile?.addEventListener(
            "change",
            handleImagePreview
        );

        el.globalSearch?.addEventListener(
            "input",
            () => {
                renderCatalog(
                    getFilteredPosts(
                        el.globalSearch.value
                    )
                );
            }
        );

        el.modalClose?.addEventListener(
            "click",
            closeModal
        );

        el.modalCancel?.addEventListener(
            "click",
            closeModal
        );

        el.modalConfirm?.addEventListener(
            "click",
            executeModalAction
        );

        el.modal?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    el.modal
                ) {
                    closeModal();
                }
            }
        );
    }

    async function loadBlogPosts() {
        renderCatalogLoading();

        const {
            data,
            error
        } = await state.client
            .from("blog_posts")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            throw error;
        }

        state.posts =
            Array.isArray(data)
                ? data
                : [];

        renderCatalog(
            getFilteredPosts(
                el.globalSearch?.value ||
                ""
            )
        );
    }

    async function loadAnalytics() {
        if (!el.metrics) {
            return;
        }

        const {
            data,
            error
        } = await state.client
            .from("blog_posts")
            .select(
                "title, category, total_shares"
            )
            .order(
                "total_shares",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );

        if (error) {
            console.warn(
                "Blog share metrics unavailable:",
                error.message
            );

            el.metrics.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        class="admin-empty-state">
                        Share metrics are not currently available.
                    </td>
                </tr>
            `;

            return;
        }

        if (
            !data ||
            data.length === 0
        ) {
            el.metrics.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        class="admin-empty-state">
                        No article performance data is available yet.
                    </td>
                </tr>
            `;

            return;
        }

        el.metrics.innerHTML = "";

        data.forEach(
            (post) => {
                const row =
                    document.createElement(
                        "tr"
                    );

                const titleCell =
                    document.createElement(
                        "td"
                    );

                titleCell.textContent =
                    safeValue(
                        post.title
                    ) ||
                    "Untitled Article";

                const categoryCell =
                    document.createElement(
                        "td"
                    );

                categoryCell.textContent =
                    safeValue(
                        post.category
                    ) ||
                    "Uncategorized";

                const sharesCell =
                    document.createElement(
                        "td"
                    );

                sharesCell.className =
                    "table-center";

                sharesCell.innerHTML = `
                    <span class="blog-share-metric">
                        ${escapeHtml(
                            formatInteger(
                                post.total_shares
                            )
                        )}
                    </span>
                `;

                row.appendChild(
                    titleCell
                );

                row.appendChild(
                    categoryCell
                );

                row.appendChild(
                    sharesCell
                );

                el.metrics.appendChild(
                    row
                );
            }
        );
    }

    function getFilteredPosts(
        query
    ) {
        const term =
            safeLower(query);

        if (!term) {
            return [
                ...state.posts
            ];
        }

        return state.posts.filter(
            (post) => {
                return [
                    post.title,
                    post.summary,
                    post.content,
                    post.category,
                    post.slug,
                    post.service_slug
                ]
                    .map(
                        safeLower
                    )
                    .some(
                        (value) =>
                            value.includes(
                                term
                            )
                    );
            }
        );
    }

    function renderCatalogLoading() {
        if (!el.catalog) {
            return;
        }

        el.catalog.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="admin-empty-state">
                    Loading article catalog...
                </td>
            </tr>
        `;
    }

    function renderCatalogError(
        message
    ) {
        if (!el.catalog) {
            return;
        }

        el.catalog.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="admin-empty-state admin-empty-state-error">
                    ${escapeHtml(
                        message
                    )}
                </td>
            </tr>
        `;
    }

    function renderCatalog(
        posts
    ) {
        if (!el.catalog) {
            return;
        }

        if (
            !posts ||
            posts.length === 0
        ) {
            el.catalog.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="admin-empty-state">
                        ${
                            el.globalSearch?.value
                                ? "No articles match your search."
                                : "No blog articles have been published yet."
                        }
                    </td>
                </tr>
            `;

            return;
        }

        el.catalog.innerHTML = "";

        posts.forEach(
            (post) => {
                const row =
                    document.createElement(
                        "tr"
                    );

                const route =
                    document.createElement(
                        "td"
                    );

                route.innerHTML = `
                    <span class="admin-mono-value">
                        /${escapeHtml(
                            safeValue(
                                post.slug
                            ) ||
                            safeValue(
                                post.service_slug
                            ) ||
                            "global"
                        )}
                    </span>
                `;

                const category =
                    document.createElement(
                        "td"
                    );

                category.textContent =
                    safeValue(
                        post.category
                    ) ||
                    "Uncategorized";

                const article =
                    document.createElement(
                        "td"
                    );

                article.innerHTML = `
                    <div class="blog-catalog-title">
                        ${escapeHtml(
                            safeValue(
                                post.title
                            ) ||
                            "Untitled Article"
                        )}
                    </div>

                    <div class="blog-catalog-summary">
                        ${escapeHtml(
                            safeValue(
                                post.summary
                            )
                        )}
                    </div>
                `;

                const actions =
                    document.createElement(
                        "td"
                    );

                actions.className =
                    "table-center";

                const editButton =
                    document.createElement(
                        "button"
                    );

                editButton.type =
                    "button";

                editButton.className =
                    "admin-table-action admin-table-action-edit";

                editButton.textContent =
                    "Edit";

                editButton.addEventListener(
                    "click",
                    () =>
                        beginEdit(
                            post
                        )
                );

                const deleteButton =
                    document.createElement(
                        "button"
                    );

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "admin-table-action admin-table-action-delete";

                deleteButton.textContent =
                    "Delete";

                deleteButton.addEventListener(
                    "click",
                    () =>
                        requestDelete(
                            post
                        )
                );

                actions.appendChild(
                    editButton
                );

                actions.appendChild(
                    deleteButton
                );

                row.appendChild(
                    route
                );

                row.appendChild(
                    category
                );

                row.appendChild(
                    article
                );

                row.appendChild(
                    actions
                );

                el.catalog.appendChild(
                    row
                );
            }
        );
    }

    async function handleSubmit(
        event
    ) {
        event.preventDefault();

        if (!state.client) {
            showFeedback(
                "Database connection is unavailable.",
                "error"
            );

            return;
        }

        const title =
            safeValue(
                el.title.value
            );

        const category =
            safeValue(
                el.category.value
            );

        const serviceSlug =
            safeValue(
                el.serviceSlug.value
            ) ||
            "global";

        const summary =
            safeValue(
                el.summary.value
            );

        const content =
            state.quill
                ? state.quill
                    .getSemanticHTML()
                    .trim()
                : "";

        if (!title) {
            showFeedback(
                "Please enter an article title.",
                "error"
            );

            el.title.focus();

            return;
        }

        if (!category) {
            showFeedback(
                "Please select an article category.",
                "error"
            );

            el.category.focus();

            return;
        }

        if (!summary) {
            showFeedback(
                "Please enter the article summary.",
                "error"
            );

            el.summary.focus();

            return;
        }

        if (!content || content === "<p><br></p>") {
            showFeedback(
                "Please enter the article content.",
                "error"
            );

            state.quill?.focus();

            return;
        }

        setSubmitting(true);

        try {
            let imageUrl =
                state.preservedImageUrl ||
                "images/blog-fallback.jpg";

            if (
                el.imageFile?.files?.length
            ) {
                imageUrl =
                    await uploadCoverImage(
                        el.imageFile.files[0]
                    );
            }

            const slug =
                makeArticleSlug(
                    title
                );

            const payload =
                buildBlogPayload({
                    title,
                    category,
                    serviceSlug,
                    summary,
                    content,
                    slug,
                    imageUrl
                });

            if (
                state.editingPostId
            ) {
                const {
                    error
                } = await state.client
                    .from("blog_posts")
                    .update(payload)
                    .eq(
                        "id",
                        state.editingPostId
                    );

                if (error) {
                    throw error;
                }

                if (
                    el.imageFile?.files?.length &&
                    state.preservedImageUrl
                ) {
                    await purgeOldCoverImage(
                        state.preservedImageUrl
                    );
                }

                showFeedback(
                    "Article updated successfully.",
                    "success"
                );
            } else {
                const {
                    error
                } = await state.client
                    .from("blog_posts")
                    .insert([
                        payload
                    ]);

                if (error) {
                    throw error;
                }

                showFeedback(
                    "Article published successfully.",
                    "success"
                );
            }

            resetEditor();

            await loadBlogPosts();
            await loadAnalytics();

        } catch (error) {
            console.error(
                "Blog save failed:",
                error
            );

            showFeedback(
                error?.message ||
                "Unable to save the article.",
                "error"
            );
        } finally {
            setSubmitting(
                false
            );
        }
    }

    function buildBlogPayload(
        data
    ) {
        /*
         * The supplied original file contains both image_url and
         * cover_image_url references in different code paths.
         *
         * The active publishing path used cover_image_url, so that
         * is preserved here.
         */
        return {
            title: data.title,
            summary: data.summary,
            content: data.content,
            category: data.category,
            service_slug:
                data.serviceSlug,
            slug: data.slug,
            cover_image_url:
                data.imageUrl
        };
    }

    async function uploadCoverImage(
        file
    ) {
        if (!file) {
            return (
                state.preservedImageUrl ||
                "images/blog-fallback.jpg"
            );
        }

        const maxBytes =
            25 * 1024 * 1024;

        if (
            file.size >
            maxBytes
        ) {
            throw new Error(
                "The cover image must be 25 MB or smaller."
            );
        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            throw new Error(
                "Please select a valid image file."
            );
        }

        const extension =
            getFileExtension(
                file.name
            );

        const safeName =
            `${Date.now()}_${randomToken()}_cover.${extension}`;

        const {
            error
        } = await state.client
            .storage
            .from(
                "blog-media-vault"
            )
            .upload(
                safeName,
                file,
                {
                    cacheControl:
                        "3600",
                    upsert: true,
                    contentType:
                        file.type
                }
            );

        if (error) {
            throw error;
        }

        const {
            data
        } = state.client
            .storage
            .from(
                "blog-media-vault"
            )
            .getPublicUrl(
                safeName
            );

        if (
            !data?.publicUrl
        ) {
            throw new Error(
                "The uploaded image URL could not be resolved."
            );
        }

        return data.publicUrl;
    }

    async function purgeOldCoverImage(
        imageUrl
    ) {
        if (
            !imageUrl ||
            imageUrl.includes(
                "blog-fallback.jpg"
            )
        ) {
            return;
        }

        /*
         * The supplied original code used vault_documents for
         * cleanup while the publishing workflow uploaded to
         * blog-media-vault. We intentionally do not delete the
         * previous image here because deleting from the wrong
         * bucket could damage an existing asset.
         */
        return;
    }

    function beginEdit(
        post
    ) {
        state.editingPostId =
            post.id;

        state.preservedImageUrl =
            safeValue(
                post.cover_image_url
            ) ||
            safeValue(
                post.image_url
            );

        el.title.value =
            safeValue(
                post.title
            );

        el.category.value =
            safeValue(
                post.category
            );

        el.serviceSlug.value =
            safeValue(
                post.service_slug
            ) ||
            safeValue(
                post.slug
            ) ||
            "global";

        el.summary.value =
            safeValue(
                post.summary
            );

        /*
         * The supplied source contains SEO fields in the form,
         * but does not establish corresponding blog_posts columns.
         * Leave them blank rather than writing unsupported columns.
         */
        el.seoTitle.value = "";
        el.seoDescription.value = "";

        if (
            state.quill
        ) {
            state.quill.setContents(
                state.quill.clipboard.convert(
                    safeValue(
                        post.content
                    )
                )
            );
        }

        updateSummaryCounter();
        updateImagePreview(
            state.preservedImageUrl
        );

        el.formTitle.textContent =
            "Edit Existing Article";

        el.submit.textContent =
            "Save Article Changes";

        el.cancelEdit.hidden =
            false;

        el.submit.classList.add(
            "admin-success-btn"
        );

        el.submit.classList.remove(
            "admin-primary-btn"
        );

        el.form?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        el.title.focus();
    }

    function resetEditor() {
        state.editingPostId =
            null;

        state.preservedImageUrl =
            "";

        el.form?.reset();

        if (
            state.quill
        ) {
            state.quill.setText(
                ""
            );
        }

        el.formTitle.textContent =
            "Draft New Article";

        el.submit.textContent =
            "Publish Article";

        el.cancelEdit.hidden =
            true;

        el.submit.classList.remove(
            "admin-success-btn"
        );

        el.submit.classList.add(
            "admin-primary-btn"
        );

        updateSummaryCounter();

        updateImagePreview(
            ""
        );
    }

    function requestDelete(
        post
    ) {
        openModal({
            title: "Delete Blog Article?",
            message:
                `Are you sure you want to permanently delete "${safeValue(post.title) || "this article"}"? This action cannot be undone.`,
            type: "danger",
            confirmLabel: "Delete Article",
            action: async () => {
                await deletePost(
                    post
                );
            }
        });
    }

    async function deletePost(
        post
    ) {
        try {
            const {
                error
            } = await state.client
                .from("blog_posts")
                .delete()
                .eq(
                    "id",
                    post.id
                );

            if (error) {
                throw error;
            }

            if (
                state.editingPostId ===
                post.id
            ) {
                resetEditor();
            }

            await loadBlogPosts();
            await loadAnalytics();

            showFeedback(
                "Article deleted successfully.",
                "success"
            );

        } catch (error) {
            console.error(
                "Article deletion failed:",
                error
            );

            showFeedback(
                error?.message ||
                "Unable to delete the article.",
                "error"
            );
        }
    }

    function openModal({
        title,
        message,
        type = "info",
        confirmLabel = "Confirm",
        action
    }) {
        if (!el.modal) {
            return;
        }

        state.pendingModalAction =
            action;

        el.modalTitle.textContent =
            title;

        el.modalMessage.textContent =
            message;

        el.modalConfirm.textContent =
            confirmLabel;

        el.modalIcon.textContent =
            type === "danger"
                ? "!"
                : "✓";

        el.modal.classList.toggle(
            "admin-modal-danger",
            type === "danger"
        );

        el.modal.hidden =
            false;

        el.modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        window.setTimeout(
            () =>
                el.modalConfirm.focus(),
            0
        );
    }

    function closeModal() {
        if (!el.modal) {
            return;
        }

        state.pendingModalAction =
            null;

        el.modal.hidden =
            true;

        el.modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    async function executeModalAction() {
        const action =
            state.pendingModalAction;

        closeModal();

        if (
            typeof action ===
            "function"
        ) {
            await action();
        }
    }

    function handleImagePreview() {
        const file =
            el.imageFile?.files?.[0];

        if (!file) {
            updateImagePreview(
                state.preservedImageUrl
            );

            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            (event) => {
                updateImagePreview(
                    event.target.result
                );
            };

        reader.readAsDataURL(
            file
        );
    }

    function updateImagePreview(
        url
    ) {
        if (
            !el.imagePreviewWrap ||
            !el.imagePreview
        ) {
            return;
        }

        if (!url) {
            el.imagePreviewWrap.hidden =
                true;

            el.imagePreview.removeAttribute(
                "src"
            );

            return;
        }

        el.imagePreview.src =
            url;

        el.imagePreviewWrap.hidden =
            false;
    }

    function updateSummaryCounter() {
        const length =
            safeValue(
                el.summary?.value
            ).length;

        if (el.summaryCount) {
            el.summaryCount.textContent =
                String(
                    length
                );
        }

        if (el.summaryCounter) {
            el.summaryCounter.classList.toggle(
                "warning",
                length >= 100 &&
                length < 140
            );

            el.summaryCounter.classList.toggle(
                "danger",
                length >= 140
            );
        }
    }

    function setSubmitting(
        isSubmitting
    ) {
        if (!el.submit) {
            return;
        }

        el.submit.disabled =
            isSubmitting;

        if (isSubmitting) {
            el.submit.textContent =
                state.editingPostId
                    ? "Saving Article..."
                    : "Publishing Article...";
        } else {
            el.submit.textContent =
                state.editingPostId
                    ? "Save Article Changes"
                    : "Publish Article";
        }
    }

    function showFeedback(
        message,
        type = "info"
    ) {
        if (!el.feedback) {
            return;
        }

        el.feedback.textContent =
            message;

        el.feedback.className =
            "admin-feedback";

        el.feedback.classList.add(
            `admin-feedback-${type}`
        );
    }

    function subscribeToBlogChanges() {
        if (!state.client) {
            return;
        }

        state.client
            .channel(
                "admin-blog-posts"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "blog_posts"
                },
                async () => {
                    try {
                        await loadBlogPosts();
                        await loadAnalytics();
                    } catch (error) {
                        console.error(
                            "Realtime blog refresh failed:",
                            error
                        );
                    }
                }
            )
            .subscribe();
    }

    function startClock() {
        if (!el.clock) {
            return;
        }

        const update =
            () => {
                el.clock.textContent =
                    new Intl.DateTimeFormat(
                        "en-US",
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

    function makeArticleSlug(
        title
    ) {
        return safeLower(
            title
        )
            .normalize(
                "NFKD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
            .slice(
                0,
                180
            );
    }

    function getFileExtension(
        filename
    ) {
        const parts =
            safeValue(
                filename
            ).split(".");

        return (
            parts.length > 1
                ? safeLower(
                    parts.pop()
                )
                : "jpg"
        ).replace(
            /[^a-z0-9]/g,
            ""
        ) || "jpg";
    }

    function randomToken() {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {
            return window.crypto
                .randomUUID()
                .slice(
                    0,
                    8
                );
        }

        return Math.random()
            .toString(
                36
            )
            .slice(
                2,
                10
            );
    }

    function formatInteger(
        value
    ) {
        const number =
            Number(
                value
            );

        return Number.isFinite(
            number
        )
            ? number.toLocaleString(
                "en-US"
            )
            : "0";
    }

    function safeValue(
        value
    ) {
        return String(
            value ?? ""
        ).trim();
    }

    function safeLower(
        value
    ) {
        return safeValue(
            value
        ).toLowerCase();
    }

    function escapeHtml(
        value
    ) {
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

    window.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Escape"
            ) {
                closeModal();
            }
        }
    );
});
