document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchHistoricalOrderParameters(session.user.id);
    loadProfileParameterSettings(session.user.id);
    setupProfileMutationFormHandler(session.user.id);
});

// Load Historical Purchase Actions
async function fetchHistoricalOrderParameters(userId) {
    const outputTarget = document.getElementById("historicalOrdersTargetStack");
    if (!outputTarget) return;

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, services(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !orders || orders.length === 0) {
        outputTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No historic platform transactions recorded under this token.</p>`;
        return;
    }

    outputTarget.innerHTML = orders.map(ord => `
        <div style="border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 14px !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
            <div>
                <strong style="display: block !important; font-size: 0.85rem !important; color: var(--text-dark) !important;">${ord.services?.name || 'Corporate Processing Service'}</strong>
                <small style="color: var(--text-muted); font-size: 0.7rem;">Placement Matrix ID: <code>${ord.id.slice(0,8)}</code> | ${new Date(ord.created_at).toLocaleDateString()}</small>
            </div>
            <div style="text-align: right !important;">
                <span style="display: block; font-size: 0.9rem; font-weight: 800; color: var(--text-dark); margin-bottom: 4px;">$${parseFloat(ord.total_amount).toFixed(2)}</span>
                <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: ${ord.status === 'Completed' ? 'var(--emerald)' : '#d97706'}">${ord.status}</span>
            </div>
        </div>
    `).join('');
}

// Fetch Profile Details into Form Inputs
async function loadProfileParameterSettings(userId) {
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

    if (currentProfile) {
        document.getElementById("profileFirstNameInput").value = currentProfile.first_name || "";
        document.getElementById("profileLastNameInput").value = currentProfile.last_name || "";
    }
}

// Mutate Profile Details
function setupProfileMutationFormHandler(userId) {
    const configurationFormNode = document.getElementById("profileCredentialsForm");
    if (!configurationFormNode) return;

    configurationFormNode.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const firstNameValue = document.getElementById("profileFirstNameInput").value.trim();
        const lastNameValue = document.getElementById("profileLastNameInput").value.trim();
        const infoFeedbackNode = document.getElementById("profileMutateMessageFeedback");

        const { error } = await supabase
            .from('profiles')
            .update({ first_name: firstNameValue, last_name: lastNameValue })
            .eq('id', userId);

        if (!error) {
            infoFeedbackNode.style.display = "block";
            const globalClientHeaderName = document.getElementById("clientNameField");
            if (globalClientHeaderName) {
                globalClientHeaderName.textContent = `${firstNameValue} ${lastNameValue}`;
            }
            setTimeout(() => { infoFeedbackNode.style.display = "none"; }, 3000);
        }
    });
}
