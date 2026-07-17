document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchClientRegisteredEntities(session.user.id);
    initializeRealtimeEntitySync(session.user.id);
});

// Master Portfolio Processing Loop
async function fetchClientRegisteredEntities(userId) {
    const displayGridTarget = document.getElementById("entitiesDisplayGridTarget");
    if (!displayGridTarget) return;

    // Pull directly from your 'entities' layout ledger
    const { data: records, error } = await supabase
        .from('entities')
        .select('id, entity_name, entity_type, state_of_formation, registration_date, status, file_number')
        .eq('user_id', userId)
        .order('entity_name', { ascending: true });

    if (error || !records || records.length === 0) {
        displayGridTarget.innerHTML = `
            <div style="grid-column: 1 / -1; background: white; border: 1px solid var(--border-color); padding: 40px; text-align: center; border-radius: 8px;">
                <span style="font-size: 2rem;">🏢</span>
                <h3 style="margin: 10px 0 5px 0; font-size: 1rem; font-weight: 800;">No Entities Registered</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">You haven't formed a business entity under this profile yet.</p>
                <a href="client-services.html" style="background: var(--emerald); color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.8rem;">Start Formation Order</a>
            </div>
        `;
        return;
    }

    displayGridTarget.innerHTML = records.map(ent => {
        const isProfileActive = ent.status?.toLowerCase() === 'active';
        return `
            <div style="background: white !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; padding: 20px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 200px !important; box-sizing: border-box !important;">
                <div>
                    <div style="display: flex !important; justify-content: space-between !important; align-items: flex-start !important; margin-bottom: 12px !important;">
                        <span style="font-size: 0.65rem !important; background: #f1f5f9 !important; padding: 4px 8px !important; border-radius: 4px !important; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
                            ${ent.entity_type || 'LLC'}
                        </span>
                        <span style="padding: 4px 8px !important; border-radius: 4px !important; font-weight: 800; font-size: 0.65rem !important; text-transform: uppercase; background: ${isProfileActive ? 'rgba(16, 185, 129, 0.1)' : '#fee2e2'} !important; color: ${isProfileActive ? 'var(--emerald)' : '#ef4444'} !important;">
                            ${ent.status || 'Unknown'}
                        </span>
                    </div>
                    
                    <h3 style="margin: 0 0 6px 0 !important; font-size: 1.05rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">
                        ${ent.entity_name}
                    </h3>
                    
                    <div style="display: flex !important; flex-direction: column !important; gap: 4px !important; margin-top: 12px !important; font-size: 0.8rem !important; color: var(--text-muted) !important;">
                        <div>📍 Jurisdiction: <strong>${ent.state_of_formation || 'N/A'}</strong></div>
                        <div>📄 File ID Number: <code>${ent.file_number || 'Processing'}</code></div>
                        <div>📅 Formation Timestamp: <strong>${ent.registration_date ? new Date(ent.registration_date).toLocaleDateString() : 'Pending'}</strong></div>
                    </div>
                </div>

                <!-- INTERACTIVE SELECTION COMPONENT ACTIONS TRACK -->
                <div style="margin-top: 20px !important; padding-top: 12px !important; border-top: 1px solid #f1f5f9 !important; display: flex !important; justify-content: space-between !important; gap: 10px !important;">
                    
                        🛡️ Compliance Tracker
                    </a>
                    
                        📂 View Documents
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Attach Realtime Pipeline Listeners 
function initializeRealtimeEntitySync(userId) {
    supabase
        .channel(`public:entities:user=${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entities', filter: `user_id=eq.${userId}` }, () => {
            fetchClientRegisteredEntities(userId);
        })
        .subscribe();
}
