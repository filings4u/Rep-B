(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const getDb=()=>window.filings4uSupabase||window.supabaseClient||window.filings4uDb;
const st={db:null,rows:[],filtered:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").toLowerCase().trim();
const date=v=>v?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v)):"—";
function toast(m,e=false){const x=document.createElement("div");x.className="toast"+(e?" error":"");x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
try{const a=await window.filings4uRequireAdmin?.();if(window.filings4uRequireAdmin&&!a)return}catch(e){return}
st.db=getDb();if(!st.db)return toast("Supabase unavailable.",true);
$("#managementMobileToggle")?.addEventListener("click",()=>document.body.classList.toggle("mobile-nav-open"));
$("#managementSidebarBackdrop")?.addEventListener("click",()=>document.body.classList.remove("mobile-nav-open"));
$("#managementDesktopToggle")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-collapsed"));

async function load(){
 const [portal,general,system]=await Promise.all([
   st.db.from("portal_notifications").select("*").order("created_at",{ascending:false}).limit(300),
   st.db.from("notifications").select("*").order("created_at",{ascending:false}).limit(300),
   st.db.from("system_notifications").select("*").order("created_at",{ascending:false}).limit(300)
 ]);
 const out=[];
 (portal.data||[]).forEach(x=>out.push({source:"portal_notifications",id:x.id,title:x.title,message:x.message,recipient:x.recipient_email||x.email_address||"",isRead:!!x.is_read,created_at:x.created_at,type:x.notification_type||"general",action_url:x.action_url,action_label:x.action_label}));
 (general.data||[]).forEach(x=>out.push({source:"notifications",id:x.id,title:x.title,message:x.message,recipient:x.recipient_email||"",isRead:x.is_unread===false,created_at:x.created_at,type:"general"}));
 (system.data||[]).forEach(x=>out.push({source:"system_notifications",id:x.id,title:x.title,message:x.message,recipient:x.profile_id||"",isRead:!!x.is_read,created_at:x.created_at,type:"system"}));
 st.rows=out.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 renderStats();apply();
}
function renderStats(){
 $("#statTotal").textContent=st.rows.length;
 $("#statUnread").textContent=st.rows.filter(x=>!x.isRead).length;
 $("#statPortal").textContent=st.rows.filter(x=>x.source==="portal_notifications").length;
 $("#statSystem").textContent=st.rows.filter(x=>x.source==="system_notifications").length;
}
function apply(){
 const q=norm($("#notificationSearch").value),source=$("#notificationSource").value,state=$("#notificationState").value;
 st.filtered=st.rows.filter(x=>(!q||[x.title,x.message,x.recipient,x.type].map(norm).join(" ").includes(q))&&(!source||x.source===source)&&(!state||(state==="read"?x.isRead:!x.isRead)));
 render();
}
function render(){
 $("#notificationList").innerHTML=st.filtered.length?st.filtered.map(x=>`<article class="notification-row ${x.isRead?"":"unread"}" data-source="${x.source}" data-id="${x.id}">
   <span class="notification-icon">${x.source==="portal_notifications"?"◌":x.source==="system_notifications"?"⚙":"○"}</span>
   <div class="notification-copy"><strong>${esc(x.title)}</strong><p>${esc(x.message)}</p><small>${esc(x.recipient||"No recipient")}</small></div>
   <span class="source-pill ${x.source==="portal_notifications"?"portal":""}">${x.source==="portal_notifications"?"Portal":x.source==="system_notifications"?"System":"General"}</span>
   <span class="state-pill ${x.isRead?"":"unread"}">${x.isRead?"Read":"Unread"}</span>
   <time title="${esc(date(x.created_at))}">›</time>
 </article>`).join(""):'<div class="notification-empty">No notifications match these filters.</div>';
 $$(".notification-row").forEach(r=>r.onclick=()=>markRead(r.dataset.source,r.dataset.id));
}
async function markRead(source,id){
 const row=st.rows.find(x=>x.source===source&&String(x.id)===String(id));if(!row||row.isRead)return;
 let res;
 if(source==="portal_notifications")res=await st.db.from(source).update({is_read:true}).eq("id",id);
 else if(source==="notifications")res=await st.db.from(source).update({is_unread:false}).eq("id",id);
 else res=await st.db.from(source).update({is_read:true}).eq("id",id);
 if(res.error)return toast(res.error.message,true);row.isRead=true;renderStats();apply();
}
function openNew(){ $("#notificationForm").reset();$("#notificationModal").hidden=false }
$("#newNotificationTop").onclick=openNew;$("#newNotificationButton").onclick=openNew;
$$("[data-close-notification]").forEach(x=>x.onclick=()=>$("#notificationModal").hidden=true);
$("#notificationForm").onsubmit=async e=>{e.preventDefault();const payload={recipient_email:$("#notificationEmail").value.trim().toLowerCase(),email_address:$("#notificationEmail").value.trim().toLowerCase(),title:$("#notificationTitle").value.trim(),message:$("#notificationMessage").value.trim(),notification_type:$("#notificationType").value,action_url:$("#notificationActionUrl").value.trim()||null,action_label:$("#notificationActionLabel").value.trim()||null,is_read:false,is_archived:false};const r=await st.db.from("portal_notifications").insert(payload);if(r.error)return toast(r.error.message,true);$("#notificationModal").hidden=true;await load();toast("Portal notification created.")};
$("#markVisibleRead").onclick=async()=>{for(const x of st.filtered.filter(x=>!x.isRead)){await markRead(x.source,x.id)}toast("Visible notifications marked read.")};
$("#notificationSearch").oninput=apply;$("#notificationSource").onchange=apply;$("#notificationState").onchange=apply;$("#refreshNotifications").onclick=load;$("#notificationSearchTrigger").onclick=()=>$("#notificationSearch").focus();
await load();
})();