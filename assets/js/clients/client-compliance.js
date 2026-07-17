document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchComprehensiveComplianceMatrix(session.user.id);
});

async function fetchComprehensiveComplianceMatrix(userId) {
    const targetElement = document.getElementById("complianceMasterTargetStack");
    if (!targetElement) return;

    // Pull rows matching your exact column names
    const { data: deadlines, error } = await supabase
        .from('compliance_deadlines')
        .select('id, requirement_name, state_authority, due_date, status')
        .eq('owner_id', userId)
        .order('due_date', { ascending: true });

    if (error || !deadlines || deadlines.length === 0) {
        targetElement.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">All registered corporate structures match current state parameters accurately.</p>`;
        return;
    }

    targetElement.innerHTML = deadlines.map(item => {
        const isUrgentState = item.status === 'PENDING_ACTION';
        return `
            <div style="background: #ffffff !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 18px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; flex-wrap: wrap !important; gap: 15px !important;">
                <div style="flex: 1 !important; min-width: 250px !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 10px !important;">
                        <span style="font-size: 1.1rem !important;">${isUrgentState ? '⚠️' : '✅'}</span>
                        <strong style="font-size: 0.9rem !important; color: var(--text-dark) !important;">${item.requirement_name}</strong>
                    </div>
                    <p style="margin: 6px 0 0 26px !important; font-size: 0.8rem !important; color: var(--text-muted) !important;">
                        Filing Authority: <strong>${item.state_authority}</strong> State Department Registry.
                    </p>
                </div>
                <div style="display: flex !important; align-items: center !important; gap: 20px !important;">
                    <div style="text-align: right !important;">
                        <small style="display: block !important; font-size: 0.68rem !important; color: #94a3b8 !important; text-transform: uppercase !important; font-weight: 700 !important;">Target Due Date</small>
                        <strong style="font-size: 0.85rem !important; color: ${isUrgentState ? '#ef4444' : 'var(--text-dark)'} !important;">${new Date(item.due_date).toLocaleDateString()}</strong>
                    </div>
                    <span style="padding: 6px 12px !important; border-radius: 6px !important; font-weight: 800 !important; font-size: 0.65rem !important; text-transform: uppercase !important; background: ${isUrgentState ? '#fee2e2' : '#e2f0e9'} !important; color: ${isUrgentState ? '#ef4444' : 'var(--emerald)'} !important;">
                        ${item.status.replace('_', ' ')}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}
