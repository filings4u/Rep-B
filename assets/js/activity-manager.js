(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),getDb=()=>window.filings4uSupabase||window.supabaseClient||window.filings4uDb;
const st={db:null,rows:[],filtered:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").trim().toLowerCase();
const date=v=>v?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v)):"—";
function toast(m,e=false){const x=document.createElement("div");x.className="toast"+(e?" error":"");x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
try{const a=await window.filings4uRequireAdmin?.();if(window.filings4uRequireAdmin&&!a)return}catch(e){return}
st.db=getDb();if(!st.db)return toast("Supabase unavailable.",true);
$("#managementMobileToggle")?.addEventListener("click",()=>document.body.classList.toggle("mobile-nav-open"));$("#managementSidebarBackdrop")?.addEventListener("click",()=>document.body.classList.remove("mobile-nav-open"));$("#managementDesktopToggle")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-collapsed"));

async function load(){
 const [logs,web]=await Promise.all([
   st.db.from("admin_system_logs").select("*").order("event_timestamp",{ascending:false}).limit(500),
   st.db.from("website_content_activity").select("*").order("occurred_at",{ascending:false}).limit(500)
 ]);
 const rows=[];
 (logs.data||[]).forEach(x=>rows.push({source:"admin_system_logs",id:x.id,title:x.action_event,details:`Operator: ${x.operator_user}`,actor:x.operator_user,severity:x.severity_rating||"INFO",when:x.event_timestamp,meta:{network_ip_origin:x.network_ip_origin}}));
 (web.data||[]).forEach(x=>rows.push({source:"website_content_activity",id:x.id,title:x.action,details:x.details||`${x.entity_type}${x.entity_key?" · "+x.entity_key:""}`,actor:x.actor_user_id||"System",severity:"INFO",when:x.occurred_at,meta:{entity_type:x.entity_type,entity_key:x.entity_key,entity_id:x.entity_id,metadata:x.metadata}}));
 st.rows=rows.sort((a,b)=>new Date(b.when)-new Date(a.when));
 renderStats();apply();
}
function renderStats(){const today=new Date().toISOString().slice(0,10);$("#statTotal").textContent=st.rows.length;$("#statToday").textContent=st.rows.filter(x=>String(x.when||"").slice(0,10)===today).length;$("#statWebsite").textContent=st.rows.filter(x=>x.source==="website_content_activity").length;$("#statWarnings").textContent=st.rows.filter(x=>["warning","error","critical"].includes(norm(x.severity))).length}
function apply(){const q=norm($("#activitySearch").value),source=$("#activitySource").value,sev=$("#activitySeverity").value;st.filtered=st.rows.filter(x=>(!q||[x.title,x.details,x.actor,JSON.stringify(x.meta||{})].map(norm).join(" ").includes(q))&&(!source||x.source===source)&&(!sev||String(x.severity).toUpperCase()===sev));render()}
function render(){
 $("#activityList").innerHTML=st.filtered.length?st.filtered.map(x=>`<article class="activity-row" data-source="${x.source}" data-id="${x.id}">
 <span class="activity-icon">${x.source==="website_content_activity"?"▧":"↻"}</span>
 <div class="activity-copy"><strong>${esc(x.title||"Activity")}</strong><p>${esc(x.details||"")}</p><small>${esc(x.actor||"System")} · ${esc(date(x.when))}</small></div>
 <span class="source-pill ${x.source==="website_content_activity"?"website":""}">${x.source==="website_content_activity"?"Website":"System"}</span>
 <span class="severity-pill ${norm(x.severity)}">${esc(x.severity||"INFO")}</span><time>›</time></article>`).join(""):'<div class="activity-empty">No activity matches these filters.</div>';
 $$(".activity-row").forEach(r=>r.onclick=()=>openRow(r.dataset.source,r.dataset.id));
}
function openRow(source,id){const x=st.rows.find(y=>y.source===source&&String(y.id)===String(id));if(!x)return;$("#activityModalTitle").textContent=x.title||"Activity details";const meta=Object.entries(x.meta||{}).map(([k,v])=>`<div><dt>${esc(k.replace(/_/g," "))}</dt><dd>${esc(typeof v==="object"?JSON.stringify(v,null,2):v)}</dd></div>`).join("");$("#activityModalBody").innerHTML=`<div class="activity-detail"><dl><div><dt>Source</dt><dd>${esc(source)}</dd></div><div><dt>Operator / actor</dt><dd>${esc(x.actor||"System")}</dd></div><div><dt>Severity</dt><dd>${esc(x.severity||"INFO")}</dd></div><div><dt>Occurred</dt><dd>${esc(date(x.when))}</dd></div><div><dt>Details</dt><dd>${esc(x.details||"")}</dd></div>${meta}</dl></div>`;$("#activityModal").hidden=false}
$$("[data-close-activity]").forEach(x=>x.onclick=()=>$("#activityModal").hidden=true);$("#activitySearch").oninput=apply;$("#activitySource").onchange=apply;$("#activitySeverity").onchange=apply;$("#refreshActivity").onclick=load;$("#refreshActivityTop").onclick=load;$("#activitySearchTrigger").onclick=()=>$("#activitySearch").focus();
await load();
})();