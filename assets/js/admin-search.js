// assets/js/admin-search.js
(async function runLiveGlobalSearchEngine() {
    "use strict";

    function waitForSupabase() {
        return new Promise(res => {
            if (window.supabaseClient) return res(window.supabaseClient);
            const idx = setInterval(() => { if (window.supabaseClient) { clearInterval(idx); res(window.supabaseClient); } }, 30);
        });
    }
    const client = await waitForSupabase();
    const searchField = document.getElementById('adminGlobalSearchField');
    let debounceSearchTimer;

    if (searchField) {
        searchField.addEventListener('input', (e) => {
            clearTimeout(debounceSearchTimer);
            const searchKeyword = e.target.value.trim().toLowerCase();

            // Wait 300 milliseconds after the user stops typing before calling the database
            debounceSearchTimer = setTimeout(async () => {
                if (searchKeyword.length < 2) return; 

                try {
                    const { data: results, error } = await client
                        .from('profiles')
                        .select('full_name, email, role')
                        .or(`full_name.ilike.%${searchKeyword}%,email.ilike.%${searchKeyword}%`)
                        .limit(10);

                    if (error) throw error;
                    console.log("🔍 Live query match response data array:", results);
                    // Hook this array into your dropdown or list renderer layout here
                    
                } catch (err) {
                    console.error("Live database query intercept error:", err.message);
                }
            }, 300);
        });
    }
})();
