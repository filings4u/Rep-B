// ============================================================================
// 📁 MODULE CARD: CORE METRICS DATA MAPPING & INSPECTOR MODALS CONTROLLER
// ============================================================================
(function() {
  "use strict";

  // --- 1. HYDRATE ANALYTIC DASHBOARD TOTALS ---
  window.hydrateAdminDashboardMetrics = async function(client) {
    const revNode = document.getElementById('stat-total-revenue');
    const entitiesNode = document.getElementById('stat-active-users');
    const pendingNode = document.getElementById('stat-pending-filings');

    try {
      // 🟢 SYNCHRONIZED TARGET SCHEMAS: Queries your live orders, entities, and tickets tables simultaneously
      const [salesQuery, entitiesQuery, pendingQuery] = await Promise.all([
        client.from('orders').select('total_fee, status'),
        client.from('entities').select('*', { count: 'exact', head: true }),
        client.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'Open')
      ]);

      // Compute aggregated platform revenue metrics from database arrays safely
      let calculatedPlatformRevenue = 0;
      if (salesQuery.data) {
        calculatedPlatformRevenue = salesQuery.data.reduce((sum, row) => {
          const currentStatus = (row.status || "").toLowerCase();
          // Only tally revenue that has been paid or validated to protect financial reporting accuracy
          if (currentStatus.includes("paid") || currentStatus.includes("validated") || currentStatus.includes("active")) {
            return sum + (parseFloat(row.total_fee) || 0);
          }
          return sum;
        }, 0);
      }

      // Inject clean, thousands-separated calculations back into your statistic layout blocks
      if (revNode) {
        revNode.textContent = `$${calculatedPlatformRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      
      if (entitiesNode && entitiesQuery.count !== null) {
        entitiesNode.textContent = entitiesQuery.count.toLocaleString('en-US');
      }
      
      if (pendingNode && pendingQuery.count !== null) {
        pendingNode.textContent = pendingQuery.count.toLocaleString('en-US');
      }

      console.log("[Metrics Engine] Dashboard performance counters successfully hydrated.");

    } catch (err) {
      console.warn("Metrics hydration exception caught:", err.message);
    }
  };

  // --- 2. STREAM SALES ROSTERS TO DATA LEDGER CARD ---
  window.streamLiveOperationalLedgers = async function(client) {
    const targetBox = document.getElementById("admin-global-sales-target-box");
    if (!targetBox) return;

    try {
      // 🟢 DATABASE REALignment: Streams records directly from your transactional orders data rows
      const { data: sales, error } = await client
        .from('orders')
        .select('company_name, service_title, total_fee, tracking_number, created_at, collected_payload_metadata')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!sales || sales.length === 0) {
        targetBox.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--text-muted);">No sales tracking rows logged to production clusters.</td></tr>`;
        return;
      }

      targetBox.innerHTML = sales.map(row => {
        const itemizedPrice = parseFloat(row.total_fee || 0);
        const uniqueTrackingNumber = row.tracking_number || "F4U-DIRECT";
        const cleanTimestamp = row.created_at ? new Date(row.created_at).toLocaleDateString() : "Pending";
        
        // Extract buyer email from jsonb safely
        const meta = row.collected_payload_metadata || {};
        const customerEmail = meta.email || "Not Provided";

        return `
          <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem; color: var(--text-dark);">
            <td style="padding: 12px; font-weight: 700;">${row.company_name || 'Filing Profile'}</td>
            <td style="padding: 12px; font-family: monospace; color: var(--text-muted);">${customerEmail}</td>
            <td style="padding: 12px; color: var(--text-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">
              ${row.service_title}
            </td>
            <td style="padding: 12px; font-weight: 800; color: var(--emerald);">$${itemizedPrice.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="btn-sm" style="padding: 4px 8px; font-size: 0.75rem; background: var(--text-dark); color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;" 
                data-token="${uniqueTrackingNumber}" 
                data-title="${row.service_title}" 
                data-company="${row.company_name || 'Filing Profile'}" 
                data-amount="${itemizedPrice}"
                onclick="window.executeAdminInspectorFlyoutRowLink(this)">
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.warn("Sales ledger rendering failure:", err.message);
      targetBox.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--staff-red);">Failed to render sales history lines.</td></tr>`;
    }
  };

  // --- 3. MODAL DISPLAY SYSTEM CONTROL LOGIC ---
  window.executeAdminInspectorFlyoutRowLink = function(buttonNode) {
    if (!buttonElement && !buttonNode) return;
    
    const title = buttonNode.getAttribute("data-title");
    const token = buttonNode.getAttribute("data-token");
    const company = buttonNode.getAttribute("data-company");
    const amount = parseFloat(buttonNode.getAttribute("data-amount")) || 0;
    
    window.revealFilingDetailModal(title, token, company, amount);
  };

  window.revealFilingDetailModal = function(title, trackingNum, company, amount) {
    const modal = document.getElementById("filingDetailModal");
    const targetHeader = document.getElementById("modalHeaderFilingTitle");
    const displayTarget = document.getElementById("modalMetadataDisplayTarget");

    if (!modal || !displayTarget) return;
    if (targetHeader) targetHeader.textContent = company;

    displayTarget.innerHTML = `
      <div style="line-height: 1.6; display: flex; flex-direction: column; gap: 10px; text-align: left;">
        <div><strong>Target Corporate Client:</strong> <span style="font-weight: 600; color: var(--text-dark);">${company}</span></div>
        <div><strong>Fulfillment Descriptor Line:</strong> <span>${title}</span></div>
        <div><strong>F4U Processing Token:</strong> <span style="font-family: monospace; font-weight: 700;">${trackingNum}</span></div>
        <div><strong>Settled Price Value:</strong> <span style="color: #10b981; font-weight: 700;">$${amount.toFixed(2)}</span></div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
        <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">This operational database object payload is compiled, synchronized, and mirrored live from your production ledger architecture.</div>
      </div>
    `;
    
    modal.style.display = "flex";
  };

  window.closeFilingDetailModal = function() {
    const modal = document.getElementById("filingDetailModal");
    if (modal) modal.style.display = "none";
  };
})();
