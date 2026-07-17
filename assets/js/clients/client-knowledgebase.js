/**
 * 📰 SUPPORT KNOWLEDGEBASE ARTICLES UTILITY DRIVER
 * Coordinated with filings4u architecture frameworks.
 */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // Dispatch data queries immediately on compilation
  fetchSupportKnowledgebaseArticles();
  setupKnowledgebaseSearchEngine();
});

/**
 * 📡 DATABASE ACCESS DISPATCH: FETCH RESOURCE ARTICLES
 * Gathers content rows and throws exceptions if query errors pass boundaries.
 */
async function fetchSupportKnowledgebaseArticles(searchTokenString = null) {
  "use strict";

  const structureGridTarget = document.getElementById("knowledgebaseArticlesLayoutTargetGrid");
  if (!structureGridTarget) {
    throw new Error("Viewport Structure Exception: Required DOM node #knowledgebaseArticlesLayoutTargetGrid missing from layout.");
  }

  // Fallback check to use the correct unified database client reference instance
  const client = window.supabaseInstance || window.supabase;
  if (!client) {
    throw new Error("Connection Exception: Unified Supabase driver engine is offline or uninitialized.");
  }

  let processingQuery = client
    .from('knowledge_base_articles')
    .select('id, title, content, category');

  // Inject structural search parameters safely if text inputs contain parameters
  if (searchTokenString) {
    processingQuery = processingQuery.ilike('title', `%${searchTokenString}%`);
  }

  const { data: articles, error } = await processingQuery.limit(12);

  // STRICT ERROR CHECKING: Intercept database operational faults instantly
  if (error) {
    console.error("Knowledgebase Database Query Failure:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  // Handle empty search outputs gracefully inside the presentation panel layout grid
  if (!articles || articles.length === 0) {
    structureGridTarget.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; padding: 30px; font-size: 0.85rem; color: var(--text-muted);">
        No resource documentation found matching your search term.
      </p>
    `;
    return;
  }

  // Construct article cards cleanly
  structureGridTarget.innerHTML = articles.map(art => {
    if (!art.id || !art.title) {
      throw new Error(`Data Integrity Exception: Article object parsing failed for row signature: ${art.id || 'Unknown ID'}`);
    }

    const cleanCategoryLabel = art.category || 'Compliance Guide';
    const cleanContentSnippet = art.content || 'Regulatory structure tracking provisions details execution loop metadata text records asset.';

    return `
      <div class="console-card" style="margin-bottom: 0 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 240px !important; box-sizing: border-box !important;">
        <div>
          <span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.08); color: var(--emerald); padding: 4px 8px; border-radius: 4px; font-weight: 800; text-transform: uppercase; display: inline-block; margin-bottom: 10px;">
            ${cleanCategoryLabel}
          </span>
          <h3 style="margin: 0 0 10px 0; font-size: 1rem; font-weight: 800; color: var(--text-dark); line-height: 1.3;">
            ${art.title}
          </h3>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;">
            ${cleanContentSnippet}
          </p>
        </div>
        <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #f1f5f9; box-sizing: border-box !important;">
          <button onclick="displayFullArticleModal('${encodeURIComponent(art.id)}')" style="background: transparent; border: none; padding: 0; color: var(--emerald); font-weight: 700; font-size: 0.8rem; cursor: pointer; display: inline-block;">
            Read Full Article ➔
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * ⚡ INTERACTION EVENT ENGINE
 * Attaches the input debounce handler and manages programmatic modal display routines.
 */
function setupKnowledgebaseSearchEngine() {
  "use strict";

  const textInputFieldNode = document.getElementById("knowledgebaseLocalQueryField");
  if (!textInputFieldNode) return;

  let debouncedTimerModulePointer;

  textInputFieldNode.addEventListener("input", function (e) {
    clearTimeout(debouncedTimerModulePointer);
    
    // Delays execution for 300ms to throttle database read loads while typing
    debouncedTimerModulePointer = setTimeout(function () {
      fetchSupportKnowledgebaseArticles(e.target.value.trim());
    }, 300);
  });
}

/**
 * 📑 PROMPT ARTICLE VIEW OVERLAY
 * Resolves a single article item completely from your data layer.
 */
window.displayFullArticleModal = async function (articleId) {
  "use strict";

  if (!articleId) {
    throw new Error("Interaction Exception: Target articleId identifier parameter missing.");
  }

  const client = window.supabaseInstance || window.supabase;
  if (!client) {
    throw new Error("Connection Exception: Unified Supabase driver engine is offline.");
  }

  const { data: targetedArticle, error } = await client
    .from('knowledge_base_articles')
    .select('title, content')
    .eq('id', decodeURIComponent(articleId))
    .single();

  if (error) {
    console.error("Single Article Transaction Failure Context:", error);
    throw new Error(`Database Operation Exception: [${error.code}] ${error.message}`);
  }

  if (targetedArticle) {
    // Render out text outputs into clear desktop display alerts
    alert(`📖 ${targetedArticle.title}\n\n${targetedArticle.content}`);
  }
};
