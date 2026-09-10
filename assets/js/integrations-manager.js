(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),getDb=()=>window.filings4uSupabase||window.supabaseClient||window.filings4uDb;
const st={db:null,rows:[],filtered:[],health:{}};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").trim().toLowerCase();
function toast(m,e=false){const x=document.createElement("div");x.className="toast"+(e?" error":"");x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
try{const a=await window.filings4uRequireAdmin?.();if(window.filings4uRequireAdmin&&!a)return}catch(e){return}
st.db=getDb();if(!st.db)return toast("Supabase unavailable.",true);
$("#managementMobileToggle")?.addEventListener("click",()=>document.body.classList.toggle("mobile-nav-open"));$("#managementSidebarBackdrop")?.addEventListener("click",()=>document.body.classList.remove("mobile-nav-open"));$("#managementDesktopToggle")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-collapsed"));

async function countTable(table){const r=await st.db.from(table).select("id",{count:"exact",head:true});return{count:r.count||0,error:r.error}}
async function load(){
 const [cfg,email,stripe,wizard]=await Promise.all([
   st.db.from("management_integrations").select("*").order("provider"),
   countTable("portal_email_events"),
   countTable("stripe_webhook_events"),
   countTable("wizard_v2_webhook_events")
 ]);
 st.health={email:email.count,stripe:stripe.count,wizard:wizard.count};
 $("#statWebhookEvents").textContent=stripe.count+wizard.count;$("#statEmailEvents").textContent=email.count;
 $("#healthGrid").innerHTML=`
   <article class="health-card"><header><strong>Stripe webhook activity</strong><span class="health-dot"></span></header><p>Recorded payment webhook events available to the management platform.</p><small>${stripe.count} recorded events</small></article>
   <article class="health-card"><header><strong>Wizard webhook activity</strong><span class="health-dot"></span></header><p>Recorded wizard handoff or webhook events available for operational review.</p><small>${wizard.count} recorded events</small></article>
   <article class="health-card"><header><strong>Portal email activity</strong><span class="health-dot"></span></header><p>Recorded customer portal email events available for delivery monitoring.</p><small>${email.count} recorded events</small></article>`;
 if(cfg.error){
   $("#integrationList").innerHTML='<div class="integration-empty">Run management-automations-integrations.sql once to create the integrations configuration table.</div>';
   st.rows=[];
 }else st.rows=cfg.data||[];
 renderStats();apply();
}
function renderStats(){const cats=[...new Set(st.rows.map(x=>x.category).filter(Boolean))].sort();$("#integrationCategory").innerHTML='<option value="">All categories</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join("");$("#statConfigured").textContent=st.rows.length;$("#statConnected").textContent=st.rows.filter(x=>x.status==="Connected").length}
function apply(){const q=norm($("#integrationSearch").value),cat=$("#integrationCategory").value,status=$("#integrationState").value;st.filtered=st.rows.filter(x=>(!q||[x.provider,x.category,x.environment,x.endpoint_label,x.notes].map(norm).join(" ").includes(q))&&(!cat||x.category===cat)&&(!status||x.status===status));render()}
function render(){ $("#integrationList").innerHTML=st.filtered.length?st.filtered.map(x=>`<article class="integration-row" data-id="${x.id}"><span class="integration-icon">⌁</span><div class="integration-copy"><strong>${esc(x.provider)}</strong><p>${esc(x.endpoint_label||x.notes||"No public connection label")}</p></div><span class="category-pill">${esc(x.category)}</span><span>${esc(x.environment||"Production")}</span><span class="status-pill ${norm(x.status).replace(/\s+/g,"-")}">${esc(x.status)}</span><b>›</b></article>`).join(""):'<div class="integration-empty">No configured integrations match these filters.</div>';$$(".integration-row").forEach(r=>r.onclick=()=>openIntegration(r.dataset.id))}
function openIntegration(id){const x=st.rows.find(y=>String(y.id)===String(id));$("#integrationModalTitle").textContent=x?"Edit integration":"Add integration";$("#integrationId").value=x?.id||"";$("#integrationProvider").value=x?.provider||"";$("#integrationEditCategory").value=x?.category||"Other";$("#integrationEditStatus").value=x?.status||"Planned";$("#integrationEnvironment").value=x?.environment||"Production";$("#integrationEndpoint").value=x?.endpoint_label||"";$("#integrationDocs").value=x?.documentation_url||"";$("#integrationNotes").value=x?.notes||"";$("#integrationModal").hidden=false}
$("#integrationForm").onsubmit=async e=>{e.preventDefault();const id=$("#integrationId").value,p={provider:$("#integrationProvider").value.trim(),category:$("#integrationEditCategory").value,status:$("#integrationEditStatus").value,environment:$("#integrationEnvironment").value,endpoint_label:$("#integrationEndpoint").value.trim()||null,documentation_url:$("#integrationDocs").value.trim()||null,notes:$("#integrationNotes").value.trim()||null,last_checked_at:new Date().toISOString(),updated_at:new Date().toISOString()};const r=id?await st.db.from("management_integrations").update(p).eq("id",id):await st.db.from("management_integrations").insert({...p,connected_at:p.status==="Connected"?new Date().toISOString():null});if(r.error)return toast(r.error.message,true);$("#integrationModal").hidden=true;await load();toast(id?"Integration updated.":"Integration added.")};
function openNew(){openIntegration(null)}$("#newIntegrationTop").onclick=openNew;$("#newIntegrationButton").onclick=openNew;$$("[data-close-integration]").forEach(x=>x.onclick=()=>$("#integrationModal").hidden=true);$("#integrationSearch").oninput=apply;$("#integrationCategory").onchange=apply;$("#integrationState").onchange=apply;$("#refreshIntegrations").onclick=load;$("#integrationSearchTrigger").onclick=()=>$("#integrationSearch").focus();await load();
})();