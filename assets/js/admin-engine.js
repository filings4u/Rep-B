// assets/js/admin-engine.js
(function initializeProductionAdminEngine() {
    "use strict";

    console.log("🚀 Production Admin Engine mounted and listening...");

    // ==========================================================================
    // ⏰ 1. REAL-TIME SYSTEM CLOCK & DATE COUPLING ENGINE
    // ==========================================================================
    const clockDisplayElement = document.getElementById('portal-clock');
    
    function runLiveSystemClock() {
        if (!clockDisplayElement) return;
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateString = `${mm}/${dd}/${yyyy}`;
        const timeString = now.toTimeString().split(' ')[0]; 
        clockDisplayElement.innerText = `${dateString} | ${timeString}`;
    }
    
    if (clockDisplayElement) {
        setInterval(runLiveSystemClock, 1000);
        runLiveSystemClock();
    }

    // ==========================================================================
    // 🚪 2. SECURE INSTANT SIGN OUT DESK
    // ==========================================================================
    async function executeTerminalSessionTermination(btnElement) {
        if (btnElement) btnElement.disabled = true;
        console.log("Purging authorization tokens...");

        localStorage.removeItem("filings4u_secure_session_token");
        sessionStorage.clear();

        const baseTarget = window.productionRootUrl || window.location.origin;

        try {
            if (window.supabaseClient && window.supabaseClient.auth) {
                await window.supabaseClient.auth.signOut(); 
            }
        } catch (logoutErr) {
            console.warn("Auth signout bypassed:", logoutErr.message);
        }

        window.location.replace(`${baseTarget}/admin-login.html`);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const fallbackLogoutBtn = document.getElementById('sidebarFallbackLogoutBtn');
        if (fallbackLogoutBtn) {
            fallbackLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                executeTerminalSessionTermination(fallbackLogoutBtn);
            });
        }
    });

    // ==========================================================================
    // 📊 3. PRODUCTION DATABASE HYDRATION LAYERS (LIVE QUERIES)
    // ==========================================================================
    async function hydrateProductionDataFields() {
        const client = window.supabaseClient;
        if (!client) return;

        try {
            // A. Log Active Staff Account Identifier Mail stamp
            const staffEmailDisplayLog = document.getElementById('liveStaffEmailDisplayLog');
            const { data: { session } } = await client.auth.getSession();
            if (session && session.user && staffEmailDisplayLog) {
                staffEmailDisplayLog.innerText = `Active Account: ${session.user.email}`;
            }

            // B. Fetch All Rows out of Workspace Table for Analytical Counting Metrics
            const { data: filings, error: filingsErr } = await client
                .from('user_filings_workspace')
                .select('amount_paid, status, service_key');

            if (!filingsErr && filings) {
                // Calculate Total Revenue using your exact decimal numeric column block
                const totalRevenueSum = filings
                    .filter(f => f.status === 'paid' && f.amount_paid)
                    .reduce((sum, current) => sum + parseFloat(current.amount_paid), 0);

                const pendingAuditsCount = filings.filter(f => f.status === 'draft').length;

                // Safely update screen elements if present on the active page layout view
                const revEl = document.getElementById('stat-total-revenue') || document.getElementById('summary-collected-revenue');
                const pendEl = document.getElementById('stat-pending-filings') || document.getElementById('summary-unpaid-amount');
                
                if (revEl) revEl.innerText = `$${totalRevenueSum.toFixed(2)}`;
                if (pendEl) {
                    if (pendEl.id === 'summary-unpaid-amount') {
                        // On billing pages, calculate total pending pipeline cash value
                        const pendingCashValue = filings.filter(f => f.status === 'draft').length * 149.00;
                        pendEl.innerText = `$${pendingCashValue.toFixed(2)}`;
                    } else {
                        pendEl.innerText = pendingAuditsCount.toString();
                    }
                }
            }

            // C. Count Distinct Customer Profiles
            const activeUsersElement = document.getElementById('stat-active-users') || document.getElementById('summary-total-orders');
            if (activeUsersElement) {
                // Query unique profiles to fetch real operational database numbers
                const { count, error: countErr } = await client
                    .from('user_filings_workspace')
                    .select('user_id', { count: 'exact', head: true });
                
                if (!countErr && count !== null) {
                    activeUsersElement.innerText = count.toString();
                }
            }

            // D. Populate Dynamic "Target User Account" Selector Dropdowns
            const clientDropdown = document.getElementById('adminClientDropdown');
            if (clientDropdown) {
                // Query profiles holding valid customer tracking tokens
                const { data: profiles, error: profileErr } = await client
                    .from('user_filings_workspace')
                    .select('user_id');

                if (!profileErr && profiles) {
                    // Extract unique user ID arrays to remove duplicates
                    const uniqueUserIds = [...new Set(profiles.map(p => p.user_id).filter(id => id))];
                    
                    clientDropdown.innerHTML = '<option value="">-- Select Valid Target Client UUID --</option>';
                    uniqueUserIds.forEach(userId => {
                        const optionNode = document.createElement('option');
                        optionNode.value = userId;
                        optionNode.innerText = `Client reference ID: #USR-${userId.substring(0,8).toUpperCase()}`;
                        clientDropdown.appendChild(optionNode);
                    });
                }
            }
                        // ==========================================================================
            // 💰 E. LIVE GLOBAL SALES PRICING LEDGER DATA POPULATION LOOP
            // ==========================================================================
            const dashboardSalesTbody = document.getElementById('admin-global-sales-target-box');
            if (dashboardSalesTbody) {
                // Fetch the last 8 paid transactions in chronological order
                const { data: salesRecords, error: salesErr } = await client
                    .from('user_filings_workspace')
                    .select('id, user_id, service_key, amount_paid')
                    .eq('status', 'paid')
                    .order('updated_at', { ascending: false })
                    .limit(8);

                if (!salesErr && salesRecords) {
                    if (salesRecords.length === 0) {
                        dashboardSalesTbody.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center; color:var(--text-muted); font-style:italic;">No settled platform orders currently recorded inside logs.</td></tr>';
                    } else {
                        const registryMeta = window.WIZARD_REGISTRY || {};
                        
                        dashboardSalesTbody.innerHTML = salesRecords.map(sale => {
                            const spec = registryMeta[sale.service_key] || { title: sale.service_key.toUpperCase() };
                            const saleCostNum = parseFloat(sale.amount_paid) || 149.00;
                            
                            return `
                                <tr style="border-bottom:1px solid var(--border-color); color:var(--text-dark);">
                                    <td style="padding:12px; font-weight:700;">#FIL-${sale.id.substring(0,8).toUpperCase()}</td>
                                    <td style="padding:12px; font-family:monospace; font-size:0.8rem;">#USR-${sale.user_id.substring(0,8).toUpperCase()}</td>
                                    <td style="padding:12px; font-weight:600; color:var(--text-muted);">${spec.title.split(' (')[0]}</td>
                                    <td style="padding:12px; text-align:right; font-weight:800; color:var(--emerald); font-family:monospace;">$${saleCostNum.toFixed(2)}</td>
                                </tr>`;
                        }).join('');
                    }
                } else if (salesErr) {
                    console.error("Dashboard accounting stream pipeline stalled:", salesErr.message);
                }
            }


        } catch (globalHydrationErr) {
            console.error("Telemetry hydration trace paused:", globalHydrationErr.message);
        }
    }

    // Safe, non-blocking check loop targeting your custom initialization scripts
    const coreCheckLoop = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(coreCheckLoop);
            hydrateProductionDataFields();
        }
    }, 100);

    setTimeout(() => clearInterval(coreCheckLoop), 5000);

})();
