(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),getDb=()=>window.filings4uSupabase||window.supabaseClient||window.filings4uDb;
const st={db:null,rows:[],filtered:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").trim().toLowerCase();
const fmt=v=>v?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v)):"—";
function toast(m,e=false){const x=document.createElement("div");x.className="toast"+(e?" error":"");x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
try{const a=await window.filings4uRequireAdmin?.();if(window.filings4uRequireAdmin&&!a)return}catch(e){return}
st.db=getDb();if(!st.db)return toast("Supabase unavailable.",true);
$("#managementMobileToggle")?.addEventListener("click",()=>document.body.classList.toggle("mobile-nav-open"));$("#managementSidebarBackdrop")?.addEventListener("click",()=>document.body.classList.remove("mobile-nav-open"));$("#managementDesktopToggle")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-collapsed"));

async function load(){
 const [admin,system,triggers]=await Promise.all([
   st.db.from("admin_system_logs").select("*").order("event_timestamp",{ascending:false}).limit(500),
   st.db.from("system_event_logs").select("*").order("created_at",{ascending:false}).limit(500),
   st.db.from("trigger_logs").select("*").order("created_at",{ascending:false}).limit(500)
 ]);
 const rows=[];
 (admin.data||[]).forEach(x=>rows.push({source:"admin_system_logs",id:x.id,event:x.action_event,details:`IP: ${x.network_ip_origin}`,actor:x.operator_user,severity:x.severity_rating||"INFO",when:x.event_timestamp,raw:x}));
 (system.data||[]).forEach(x=>rows.push({source:"system_event_logs",id:x.log_id,event:`${x.event_category} · ${x.event_action}`,details:x.event_description,actor:x.actor_email,severity:"INFO",when:x.created_at,raw:x}));
 (triggers.data||[]).forEach(x=>rows.push({source:"trigger_logs",id:x.id,event:x.error_message?"Trigger error":"Trigger event",details:x.error_message||`Tracking number: ${x.tracking_number||"—"}`,actor:"System trigger",severity:x.error_message?"ERROR":"INFO",when:x.created_at,raw:x}));
 st.rows=rows.sort((a,b)=>new Date(b.when)-new Date(a.when));renderStats();apply();
}
function renderStats(){const today=new Date().toISOString().slice(0,10);$("#statTotal").textContent=st.rows.length;$("#statErrors").textContent=st.rows.filter(x=>["error","critical"].includes(norm(x.severity))).length;$("#statToday").textContent=st.rows.filter(x=>String(x.when||"").slice(0,10)===today).length;$("#statSources").textContent=new Set(st.rows.map(x=>x.source)).size}
function apply(){const q=norm($("#logsSearch").value),source=$("#logsSource").value,sev=$("#logsSeverity").value;st.filtered=st.rows.filter(x=>(!q||[x.event,x.details,x.actor,JSON.stringify(x.raw||{})].map(norm).join(" ").includes(q))&&(!source||x.source===source)&&(!sev||String(x.severity).toUpperCase()===sev));render()}
function render(){ $("#logsTableBody").innerHTML=st.filtered.length?st.filtered.map(x=>`<tr data-source="${x.source}" data-id="${x.id}"><td><div class="log-event"><strong>${esc(x.event)}</strong><small>${esc(x.details||"")}</small></div></td><td><span class="source-pill">${esc(x.source.replace(/_/g," "))}</span></td><td>${esc(x.actor||"System")}</td><td><span class="severity-pill ${norm(x.severity)}">${esc(x.severity)}</span></td><td>${esc(fmt(x.when))}</td><td>›</td></tr>`).join(""):'<tr><td colspan="6"><div class="logs-empty">No logs match these filters.</div></td></tr>';$$("tr[data-id]").forEach(r=>r.onclick=()=>openLog(r.dataset.source,r.dataset.id))}
function openLog(source,id){const x=st.rows.find(y=>y.source===source&&String(y.id)===String(id));if(!x)return;$("#logModalTitle").textContent=x.event;const fields=Object.entries(x.raw||{}).map(([k,v])=>`<div><b>${esc(k.replace(/_/g," "))}</b><span>${esc(typeof v==="object"?JSON.stringify(v,null,2):v)}</span></div>`).join("");$("#logModalBody").innerHTML=`<div class="log-detail">${fields}</div>`;$("#logModal").hidden=false}
$$("[data-close-log]").forEach(x=>x.onclick=()=>$("#logModal").hidden=true);$("#logsSearch").oninput=apply;$("#logsSource").onchange=apply;$("#logsSeverity").onchange=apply;$("#refreshLogs").onclick=load;$("#refreshLogsTop").onclick=load;$("#logSearchTrigger").onclick=()=>$("#logsSearch").focus();await load();
})();