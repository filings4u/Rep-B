(function(){'use strict';
window.filings4uRequireAdmin=async function(options={}){
  const db=window.filings4uAdminSupabase;
  const loginUrl=options.loginUrl||'admin-login.html';
  if(!db){console.error('[filings4u] Admin Supabase client missing.');return null}
  const {data,error}=await db.auth.getUser();
  const user=data?.user||null;
  if(error||!user){
    const next=encodeURIComponent((location.pathname.split('/').pop()||'admin-dashboard.html')+location.search+location.hash);
    if(options.redirect!==false)location.href=`${loginUrl}?error=sign-in-required&next=${next}`;
    return null;
  }
  const {data:admin,error:adminError}=await db.from('admin_profiles')
    .select('id,email_address,first_name,last_name,role,terminated_date')
    .eq('id',user.id).maybeSingle();
  if(adminError||!admin||admin.terminated_date){
    await db.auth.signOut({scope:'local'});
    if(options.redirect!==false)location.href=`${loginUrl}?error=not-admin`;
    return null;
  }
  return {db,user,admin};
};
window.filings4uSignOut=async function(){
  if(window.filings4uAdminSupabase)await window.filings4uAdminSupabase.auth.signOut({scope:'local'});
  location.href='admin-login.html';
};
})();