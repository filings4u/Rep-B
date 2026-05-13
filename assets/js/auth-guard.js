// auth-guard.js
async function protectWizard() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Capture the current wizard filename (e.g., wizard-2290.html)
        const currentWizard = window.location.pathname.split("/").pop();
        const currentParams = window.location.search; // Keep ?plan=elite&price=899
        
        // Redirect to login and tell it where to return
        const returnUrl = encodeURIComponent(currentWizard + currentParams);
        window.location.href = `index.html?redirect=${returnUrl}`;
    }
}
protectWizard();
