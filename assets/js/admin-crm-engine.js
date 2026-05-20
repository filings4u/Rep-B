/**
 * 👥 filings4u Live Admin CRM & Customer Provisioning Controller (Finalized)
 * Direct Supabase Admin API management tracking, directory queries, and layout syncing
 */
(function initializeAdminCrmEngine() {
    "use strict";

    let activeClient = null;

    function getSupabaseClientInstance() {
        return window.supabaseClient || window.supabase;
    }

    // ==========================================================================
    // 📋 1. FETCH LIVE ACTIVE CUSTOMER RECORDS DIRECTORY LEDGER
    // ==========================================================================
    window.fetchCrmActiveProfilesList = async function() {
        activeClient = getSupabaseClientInstance();
        const tbody = document.getElementById('crmProfilesTableBody');
        if (!activeClient || !tbody) return;

        try {
            // Pull secure user records from your verified public.profiles directory ledger
            const { data: profiles, error } = await activeClient
                .from('profiles')
                .select('id, company_name, is_agency, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!profiles || profiles.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted); font-style:italic;">No customer profiles registered inside system directories.</td></tr>';
                return;
            }

            tbody.innerHTML = profiles.map(row => {
                const onboardingDate = new Date(row.created_at).toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit', year: 'numeric'
                });
                
                const classificationLabel = row.is_agency 
                    ? `<span class="status-pill pending" style="background:rgba(243,156,18,0.1); color:#d97706;">Wholesale Agency</span>` 
                    : `<span class="status-pill active" style="background:rgba(16,185,129,0.1); color:var(--emerald);">Standard Client</span>`;

                return `
                    <tr class="log-entry-row crm-data-row">
                        <td><strong style="color:var(--text-dark); font-size:0.9rem;">${row.company_name || 'Unnamed Account'}</strong></td>
                        <td><code style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.78rem;">${row.id}</code></td>
                        <td>${classificationLabel}</td>
                        <td style="color:var(--text-muted); font-weight:600;">${onboardingDate}</td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            console.error("CRM table directory query stalled:", err.message);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--staff-red);">Failed to compile profile data indices from database.</td></tr>';
        }
    };

    // ==========================================================================
    // 🚀 2. SECURE ADMIN PROVISIONING ACCOUNT INJECTION ACTION
    // ==========================================================================
    window.executeAdminCustomerProvisioning = async function(event) {
        event.preventDefault();
        activeClient = getSupabaseClientInstance();
        
        const feedbackBlock = document.getElementById("modalFeedback");
        const submitButton = document.getElementById("crmSubmitBtn");
        if (!activeClient || !submitButton) return;

        const targetCompanyName = document.getElementById("crm_company_name").value.trim();
        const targetEmail = document.getElementById("crm_email").value.trim();
        const targetPassword = document.getElementById("crm_password").value;
        const targetIsAgency = document.getElementById("crm_is_agency").checked;

        submitButton.disabled = true;
        if (feedbackBlock) {
            feedbackBlock.style.color = "var(--text-dark)";
            feedbackBlock.textContent = "Provisioning secure client profile container...";
        }

        try {
            // Deploys standard signUp with clean metadata keys, executing your automated database triggers smoothly
            const { data, error } = await activeClient.auth.signUp({
                email: targetEmail,
                password: targetPassword,
                options: {
                    data: {
                        company_name: targetCompanyName,
                        is_agency: targetIsAgency
                    }
                }
            });

            if (error) throw error;

            if (feedbackBlock) {
                feedbackBlock.style.color = "var(--emerald)";
                feedbackBlock.textContent = "✓ Record pre-seeded. Secure invite token initialized for customer transmission!";
            }

            setTimeout(async () => {
                document.getElementById("crmRegistrationForm").reset();
                if (typeof closeRegistrationModal === 'function') closeRegistrationModal();
                await window.fetchCrmActiveProfilesList();
                submitButton.disabled = false;
            }, 2000);

        } catch (faultException) {
            console.error("CRM User injection pipeline breach exception caught:", faultException.message);
            if (feedbackBlock) {
                feedbackBlock.style.color = "var(--staff-red)";
                feedbackBlock.textContent = `Error: ${faultException.message}`;
            }
            submitButton.disabled = false;
        }
    };

    // ==========================================================================
    // 🔍 3. LIVE CROSS-GRID FUZZY CRM TEXT SEARCH COUPLING
    // ==========================================================================
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('adminGlobalSearchField');
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.crm-data-row').forEach(row => {
                const textContext = row.textContent.toLowerCase();
                if (textContext.includes(query)) {
                    row.style.setProperty('display', 'table-row', 'important');
                } else {
                    row.style.setProperty('display', 'none', 'important');
                }
            });
        });
    });

    // ==========================================================================
    // 🏁 4. WORKSPACE BOOTSTRAP INITIALIZATION SUBSCRIPTION POLLER
    // ==========================================================================
    const monitoringBootstrapLoop = setInterval(() => {
        activeClient = getSupabaseClientInstance();
        if (activeClient) {
            clearInterval(monitoringBootstrapLoop);
            window.fetchCrmActiveProfilesList();
        }
    }, 100);

})();