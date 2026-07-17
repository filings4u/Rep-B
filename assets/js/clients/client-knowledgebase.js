document.addEventListener("DOMContentLoaded", () => {
    // Public directory path indexing: session evaluation is bypass-allowed for article queries
    fetchSupportKnowledgebaseArticles();
    setupKnowledgebaseSearchEngine();
});

// Master Search Extraction Loop
async function fetchSupportKnowledgebaseArticles(searchTokenString = null) {
    const structureGridTarget = document.getElementById("knowledgebaseArticlesLayoutTargetGrid");
    if (!structureGridTarget) return;

    let processingQuery = supabase
        .from('knowledge_base_articles')
        .select('id, title, content, category');

    if (searchTokenString) {
        processingQuery = processingQuery.ilike('title', `%${searchTokenString}%`);
    }

    const { data: articles, error } = await processingQuery.limit(12);

    if (error || !articles || articles.length === 0) {
        structureGridTarget.innerHTML = `
            <p style="grid-column:1/-1; text-align:center; padding:30px; font-size:0.85rem; color:var(--text-muted);">
                No resource documentation found matching your search term.
            </p>
        `;
        return;
    }

    structureGridTarget.innerHTML = articles.map(art => `
        <div class="console-card" style="margin-bottom:0 !important; display:flex !important; flex-direction:column !important; justify-content:space-between !important; min-height:240px !important;">
            <div>
                <span style="font-size:0.65rem; background:rgba(16,185,129,0.08); color:var(--emerald); padding:4px 8px; border-radius:4px; font-weight:800; text-transform:uppercase; display:inline-block; margin-bottom:10px;">
                    ${art.category || 'Compliance Guide'}
                </span>
                <h3 style="margin:0 0 10px 0; font-size:1rem; font-weight:800; color:var(--text-dark); line-height:1.3;">
                    ${art.title}
                </h3>
                <p style="margin:0; font-size:0.8rem; color:var(--text-muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;">
                    ${art.content || 'Regulatory structure tracking provisions details execution loop metadata text records asset.'}
                </p>
            </div>
            
            <div style="margin-top:20px; padding-top:12px; border-top:1px solid #f1f5f9;">
                <button onclick="displayFullArticleModal('${art.id}')" style="background:transparent; border:none; padding:0; color:var(--emerald); font-weight:700; font-size:0.8rem; cursor:pointer;">
                    Read Full Article ➔
                </button>
            </div>
        </div>
    `).join('');
}

// Local Search Handler Configuration
function setupKnowledgebaseSearchEngine() {
    const textInputFieldNode = document.getElementById("knowledgebaseLocalQueryField");
    if (!textInputFieldNode) return;

    let debouncedTimerModulePointer;
    textInputFieldNode.addEventListener("input", (e) => {
        clearTimeout(debouncedTimerModulePointer);
        debouncedTimerModulePointer = setTimeout(() => {
            fetchSupportKnowledgebaseArticles(e.target.value.trim());
        }, 300); // 300ms network-safe debounce rate logic tracking parameter
    });
}

// Expanded View Display Handler
async function displayFullArticleModal(articleId) {
    const { data: targetedArticle } = await supabase
        .from('knowledge_base_articles')
        .select('title, content')
        .eq('id', articleId)
        .single();

    if (targetedArticle) {
        // Safe programmatic modal overlay layout render block configuration rules
        alert(`📖 ${targetedArticle.title}\n\n${targetedArticle.content}`);
    }
}
