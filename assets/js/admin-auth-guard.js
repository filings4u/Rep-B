/**
 * filings4u admin protected-page guard
 * Anti-flicker + authenticated admin authorization.
 */
(function(){
'use strict';

const root=document.documentElement;
root.classList.add('f4u-auth-pending');

const db=()=>window.filings4uAdminSupabase||window.filings4uSupabase||window.supabaseClient||null;
const target=()=> (location.pathname.split('/').pop()||'admin-management.html')+location.search+location.hash;

function loginUrl(reason){
  let u='admin-login.html?returnTo='+encodeURIComponent(target());
  if(reason)u+='&reason='+encodeURIComponent(reason);
  return u;
}
function deny(reason){
  root.classList.remove('f4u-auth-ready');
  root.classList.add('f4u-auth-pending');
  location.replace(loginUrl(reason||'login_required'));
  return null;
}
function reveal(){
  root.classList.remove('f4u-auth-pending');
  root.classList.add('f4u-auth-ready');
}

async function verifyAdmin(){
  const client=db();
  if(!client)return deny('auth_unavailable');

  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError||!session?.access_token)return deny('login_required');

  const {data,error}=await client.functions.invoke('admin-auth-check',{
    body:{action:'verify'}
  });

  if(error||data?.ok!==true){
    try{await client.auth.signOut({scope:'local'});}catch(_){}
    return deny(data?.error||'admin_required');
  }

  reveal();
  return {
    db:client,
    supabase:client,
    user:session.user,
    session,
    adminProfile:data.admin,
    isAdmin:true
  };
}

let ready;
window.filings4uRequireAdmin=function(){
  if(!ready)ready=verifyAdmin();
  return ready;
};
window.filings4uAdminReady=window.filings4uRequireAdmin();

const client=db();
if(client?.auth?.onAuthStateChange){
  client.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT')deny('session_expired');
  });
}
})();