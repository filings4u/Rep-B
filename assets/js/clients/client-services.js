document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetchGlobalServicesPricingMatrix(session.user.id);
});

async function fetchGlobalServicesPricingMatrix(userId) {
    const gridTarget = document.getElementById("servicesProcurementCatalogGrid");
    if (!gridTarget) return;

    // Pull offerings directly from global 'services' directory config
    const { data: catalogItems, error } = await supabase
        .from('services')
        .select('id, name, description, price')
        .order('price', { ascending: true });

    if (error || !catalogItems || catalogItems.length === 0) {
        gridTarget.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No corporate procurement items currently deployment active inside operational system catalogs.</p>`;
        return;
    }

    gridTarget.innerHTML = catalogItems.map(item => `
        <div style="background: white !important; border: 1px solid var(--border-color) !important; border-radius: 10px !important; padding: 24px !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-height: 220px !important; box-sizing: border-box !important;">
            <div>
                <h3 style="margin: 0 0 8px 0 !important; font-size: 1.05rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">${item.name}</h3>
                <p style="margin: 0 !important; font-size: 0.8rem !important; color: var(--text-muted) !important; line-height: 1.4 !important;">${item.description || 'Statutory legal filing provision matrix configuration task workflow execution.'}</p>
            </div>
            <div style="margin-top: 24px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; padding-top: 14px !important; border-top: 1px solid #f1f5f9 !important;">
                <span style="font-size: 1.3rem !important; font-weight: 800 !important; color: var(--text-dark) !important;">$${parseFloat(item.price).toFixed(2)}</span>
                <button onclick="triggerServicePurchasePipeline('${item.id}', '${item.name}', ${item.price}, '${userId}')" style="background: var(--emerald) !important; color: white !important; border: none !important; padding: 8px 16px !important; border-radius: 6px !important; font-weight: 700 !important; font-size: 0.78rem !important; cursor: pointer !important; transition: background 0.15s !important;">
                    Order Service
                </button>
            </div>
        </div>
    `).join('');
}

// Transaction processing pipeline loop block code execution parameters
async function triggerServicePurchasePipeline(serviceId, serviceName, price, userId) {
    const trackingVerifyCheck = confirm(`Confirm structural placement transaction generation for: "${serviceName}" at $${price.toFixed(2)}?`);
    if (!trackingVerifyCheck) return;

    // Generate dynamic checkout entries inside staging tables
    const { data: newOrderNode, error: orderErr } = await supabase
        .from('orders')
        .insert([{
            user_id: userId,
            service_id: serviceId,
            total_amount: price,
            status: "Pending Payment"
        }])
        .select()
        .single();

    if (orderErr) {
        alert("Transaction ledger generation exception block mismatch protection execution failure.");
        return;
    }

    // Provision outstanding structural context lines inside client logs
    await supabase
        .from('billing_history')
        .insert([{
            user_id: userId,
            description: `Procurement Invoice for ${serviceName}`,
            amount: price,
            status: "Unpaid"
        }]);

    alert("Operational procurement ledger lines recorded safely! Redirecting to structural billing panel...");
    window.location.href = "client-account.html";
}
