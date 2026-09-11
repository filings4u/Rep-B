(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),getDb=()=>window.filings4uSupabase||window.supabaseClient||window.filings4uDb;
const st={db:null,events:[],deletions:[],settings:null,filtered:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").trim().toLowerCase();
const fmt=v=>v?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v)):"—";
function toast(m,e=false){const x=document.createElement("div");x.className="toast"+(e?" error":"");x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
try{const a=await window.filings4uRequireAdmin?.();if(window.filings4uRequireAdmin&&!a)return}catch(e){return}
st.db=getDb();if(!st.db)return toast("Supabase unavailable.",true);
$("#managementMobileToggle")?.addEventListener("click",()=>document.body.classList.toggle("mobile-nav-open"));$("#managementSidebarBackdrop")?.addEventListener("click",()=>document.body.classList.remove("mobile-nav-open"));$("#managementDesktopToggle")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-collapsed"));

async function load(){
 const [telemetry,deletions,settings]=await Promise.all([
   st.db.from("platform_security_telemetry_logs").select("*").order("created_at",{ascending:false}).limit(500),
   st.db.from("deletion_audit_logs").select("*").order("deleted_at",{ascending:false}).limit(250),
   st.db.from("global_platform_settings").select("*").eq("id",1).maybeSingle()
 ]);
 if(telemetry.error)toast(telemetry.error.message,true);
 st.events=telemetry.data||[];st.deletions=deletions.data||[];st.settings=settings.data||null;
 renderStats();renderStatus();populateFilters();apply();
}
function renderStats(){const today=new Date().toISOString().slice(0,10);$("#statEvents").textContent=st.events.length;$("#statToday").textContent=st.events.filter(x=>String(x.created_at||"").slice(0,10)===today).length;$("#statActors").textContent=new Set(st.events.map(x=>x.actor_email).filter(Boolean)).size;$("#statDeletions").textContent=st.deletions.length}
function renderStatus(){const s=st.settings||{};$("#platformSecurityStatus").innerHTML=[
["Website mode",s.website_operating_mode||"Unknown",s.website_operating_mode==="production"],
["Maintenance interlock",s.maintenance_mode_interlock_active?"Active":"Inactive",!s.maintenance_mode_interlock_active],
["Client portal",s.client_portal_enabled===false?"Disabled":"Enabled",s.client_portal_enabled!==false]
].map(([k,v,ok])=>`<div class="platform-status-row"><strong>${esc(k)}</strong><span class="${ok?"ok":"warn"}">${esc(v)}</span></div>`).join("")}
function populateFilters(){const roles=[...new Set(st.events.map(x=>x.account_role).filter(Boolean))].sort(),actions=[...new Set(st.events.map(x=>x.action_type).filter(Boolean))].sort();$("#securityRole").innerHTML='<option value="">All roles</option>'+roles.map(x=>`<option>${esc(x)}</option>`).join("");$("#securityAction").innerHTML='<option value="">All actions</option>'+actions.map(x=>`<option>${esc(x)}</option>`).join("")}
function apply(){const q=norm($("#securitySearch").value),role=$("#securityRole").value,action=$("#securityAction").value;st.filtered=st.events.filter(x=>(!q||[x.action_type,x.actor_email,x.account_role,x.message_details].map(norm).join(" ").includes(q))&&(!role||x.account_role===role)&&(!action||x.action_type===action));render()}
function render(){ $("#securityEventList").innerHTML=st.filtered.length?st.filtered.map(x=>`<article class="security-event" data-id="${x.id}"><span class="security-event-icon">⌾</span><div class="security-event-copy"><strong>${esc(x.action_type)}</strong><p>${esc(x.message_details)}</p><small>${esc(x.actor_email)} · ${esc(fmt(x.created_at))}</small></div><span class="security-pill">${esc(x.account_role)}</span><span class="security-pill">${esc(x.action_type)}</span><time>›</time></article>`).join(""):'<div class="security-empty">No security events match these filters.</div>';$$(".security-event").forEach(r=>r.onclick=()=>openEvent(r.dataset.id))}
function openEvent(id){const x=st.events.find(y=>String(y.id)===String(id));if(!x)return;$("#securityModalTitle").textContent=x.action_type;$("#securityModalBody").innerHTML=`<div class="security-detail"><div><b>Actor</b><span>${esc(x.actor_email)}</span></div><div><b>Role</b><span>${esc(x.account_role)}</span></div><div><b>Action</b><span>${esc(x.action_type)}</span></div><div><b>Timestamp</b><span>${esc(fmt(x.created_at))}</span></div><div><b>Details</b><span>${esc(x.message_details)}</span></div></div>`;$("#securityModal").hidden=false}
$$("[data-close-security]").forEach(x=>x.onclick=()=>$("#securityModal").hidden=true);$("#securitySearch").oninput=apply;$("#securityRole").onchange=apply;$("#securityAction").onchange=apply;$("#refreshSecurity").onclick=load;$("#refreshSecurityTop").onclick=load;$("#securitySearchTrigger").onclick=()=>$("#securitySearch").focus();await load();
})();