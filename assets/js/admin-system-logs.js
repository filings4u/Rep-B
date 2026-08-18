
function enforceAdminPageAccess(){
  const key="sb-lrbimrlbskjweynxlgas-auth-token";
  try{
    const raw=localStorage.getItem(key);
    const session=raw?JSON.parse(raw):null;
    const email=String(session?.user?.email||"").toLowerCase();
    const role=session?.user?.user_metadata?.role;
    if(!session?.access_token){ window.location.replace("admin-login.html"); return false; }
    if(role!=="admin" && !email.endsWith("@filings4u.com")){ window.location.replace("client-dashboard.html"); return false; }
    return true;
  }catch(e){ console.error("Admin access verification failed:",e); window.location.replace("admin-login.html"); return false; }
}

function updateAdminPageClock(){ const el=document.getElementById("portal-clock"); if(el) el.textContent=new Date().toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}); }

document.addEventListener("DOMContentLoaded",()=>{ if(!enforceAdminPageAccess()) return; updateAdminPageClock(); setInterval(updateAdminPageClock,1000); });


// Global blur modal dispatcher trigger mechanics
    window.showAuditCustomModal = function(icon, header, text) {
      const mask = document.getElementById("auditBlurModalMask");
      const box = document.getElementById("auditModalInteriorBox");
      if (!mask || !box) return;

      document.getElementById("auditModalIcon").textContent = icon;
      document.getElementById("auditModalHeader").textContent = header;
      document.getElementById("auditModalMessage").textContent = text;

      mask.style.display = "flex";
      setTimeout(() => { box.style.transform = "scale(1)"; }, 10);
    };

    window.closeAuditNotificationModal = function() {
      const mask = document.getElementById("auditBlurModalMask");
      const box = document.getElementById("auditModalInteriorBox");
      if (box) box.style.transform = "scale(0.95)";
      if (mask) mask.style.display = "none";
    };

 document.addEventListener("DOMContentLoaded", async () => {
      "use strict";

      const logTargetBox = document.getElementById("masterSystemEventLogsOutputTarget");
      const filterBtns = document.querySelectorAll(".filter-btn");
      let activeCategoryFilter = "ALL";
      let masterLogsDataCache = [];

      function escapeLogHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      const client = window.supabaseInstance || window.supabaseClient;
      if (!client) return;

      async function reloadPlatformSystemAuditLedger() {
        try {
          let queryEngine = client.from('system_event_logs').select('*');
          if (activeCategoryFilter !== "ALL") {
            queryEngine = queryEngine.eq('event_category', activeCategoryFilter);
          }

          const { data: records, error } = await queryEngine.order('created_at', { ascending: false }).limit(100);
          if (error) throw error;

          masterLogsDataCache = records || [];
          renderPlatformSystemAuditLogs();

        } catch (err) {
          console.error(err);
          if (logTargetBox) {
            logTargetBox.innerHTML = `<tr><td colspan="6" style="padding:30px; text-align:center; color:var(--staff-red); font-weight:700;">✕ Synchronization Rejected: ${err.message}</td></tr>`;
          }
        }
      }

      function renderPlatformSystemAuditLogs() {
        if (masterLogsDataCache.length === 0) {
          logTargetBox.innerHTML = `<tr><td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted); font-style:italic;">No historical event entries found matching active criteria.</td></tr>`;
          return;
        }

        logTargetBox.innerHTML = "";
        masterLogsDataCache.forEach(log => {
          const tr = document.createElement("tr");
          tr.style.cssText = "border-bottom:1px solid var(--border-color); background:#fff;";
          
          const timestamp = log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : 'N/A';
          const badgeBackground = log.actor_role === 'admin' ? '#fee2e2' : '#e0f2fe';
          const badgeColor = log.actor_role === 'admin' ? '#991b1b' : '#0369a1';

          tr.innerHTML = `
            <td style="padding:12px; color:var(--text-muted); font-family:monospace; font-size:0.75rem;">${timestamp}</td>
            <td style="padding:12px; font-weight:700; color:var(--text-dark);">${escapeLogHtml(log.actor_email)}</td>
            <td style="padding:12px;"><span style="font-size:10px; font-weight:800; background:${badgeBackground}; color:${badgeColor}; padding:2px 8px; border-radius:4px; text-transform:uppercase;">${log.actor_role}</span></td>
            <td style="padding:12px;">
              <strong style="font-size:0.75rem; color:var(--text-dark); display:block; font-family:monospace;">${escapeLogHtml(log.event_category)}</strong>
              <small style="font-size:10px; color:var(--text-muted); font-family:monospace;">${escapeLogHtml(log.event_action)}</small>
            </td>
            <td style="padding:12px; color:#334155; line-height:1.4; font-weight:500; text-align:left;">${escapeLogHtml(log.event_description)}</td>
            <td style="padding:12px; text-align:right; font-family:monospace; color:var(--text-muted); font-size:0.75rem;">${escapeLogHtml(log.ip_address)}</td>
          `;
          logTargetBox.appendChild(tr);
        });
      }

      filterBtns.forEach(btn => {
        btn.addEventListener("click", async function() {
          filterBtns.forEach(b => b.classList.remove("active"));
          this.classList.add("active");
          activeCategoryFilter = this.dataset.cat;
          await reloadPlatformSystemAuditLedger();
        });
      });

      client.channel('system-live-logs-matrix-stream')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_event_logs' }, async (payload) => {
          if (activeCategoryFilter === "ALL" || payload.new.event_category === activeCategoryFilter) {
            masterLogsDataCache.unshift(payload.new);
            if (masterLogsDataCache.length > 100) masterLogsDataCache.pop();
            renderPlatformSystemAuditLogs();
          }
        }).subscribe();


      // Execute primary live table hydration loop metrics on mount
      await reloadPlatformSystemAuditLedger();
    });