document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchClientFinancialLedger(session.user.id);
});

async function fetchClientFinancialLedger(userId) {
    const layerTarget = document.getElementById("billingLedgerOutputContainer");
    if (!layerTarget) return;

    // Direct interface connection tracking your sales_ledger & invoices data mapping models
    const { data: invoices, error } = await supabase
        .from('billing_history')
        .select('id, description, amount, status, created_at, invoice_number')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !invoices || invoices.length === 0) {
        layerTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">Zero transaction logs balance active under this profile ledger record loop.</p>`;
        return;
    }

    layerTarget.innerHTML = invoices.map(inv => {
        const isOpenBalance = inv.status?.toLowerCase() === 'unpaid' || inv.status?.toLowerCase() === 'pending';
        return `
            <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 16px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 0.85rem !important;">
                <div>
                    <span style="font-weight: 800 !important; color: var(--text-dark) !important; display: block !important;">${inv.description}</span>
                    <small style="color: var(--text-muted) !important; font-size: 0.72rem !important;">Invoice ID Token: <code>${inv.invoice_number || inv.id.slice(0,8)}</code> | Date: ${new Date(inv.created_at).toLocaleDateString()}</small>
                </div>
                <div style="display: flex !important; align-items: center !important; gap: 15px !important;">
                    <strong style="font-size: 1rem !important; color: var(--text-dark) !important;">$${parseFloat(inv.amount).toFixed(2)}</strong>
                    <span style="padding: 4px 10px !important; border-radius: 4px !important; font-size: 0.68rem !important; font-weight: 800 !important; text-transform: uppercase !important; background: ${isOpenBalance ? '#fee2e2' : 'rgba(16, 185, 129, 0.1)'} !important; color: ${isOpenBalance ? '#ef4444' : 'var(--emerald)'} !important;">
                        ${inv.status}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}
