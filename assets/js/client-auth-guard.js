(function(){'use strict';
window.filings4uRequireClient=async function(options={}){
  const db=window.filings4uClientSupabase;
  const loginUrl=options.loginUrl||'customer-login.html';
  if(!db){console.error('[filings4u] Client Supabase client missing.');return null}
  const {data,error}=await db.auth.getUser();
  const user=data?.user||null;
  if(error||!user){
    const next=encodeURIComponent((location.pathname.split('/').pop()||'client-dashboard.html')+location.search+location.hash);
    if(options.redirect!==false)location.href=`${loginUrl}?error=sign-in-required&next=${next}`;
    return null;
  }
  // Explicitly reject admin accounts on the CLIENT session only.
  const [{data:profile,error:profileError},{data:admin}]=await Promise.all([
    db.from('client_profiles').select('id,email_address,first_name,last_name,company_name,avatar_url,tracking_number').eq('id',user.id).maybeSingle(),
    db.from('admin_profiles').select('id,terminated_date').eq('id',user.id).maybeSingle()
  ]);
  if(profileError){console.error(profileError);return null}
  if(admin&&!admin.terminated_date){
    await db.auth.signOut({scope:'local'});
    if(options.redirect!==false)location.href=`${loginUrl}?error=admin-account&next=${encodeURIComponent('client-dashboard.html')}`;
    return null;
  }
  if(!profile){
    await db.auth.signOut({scope:'local'});
    if(options.redirect!==false)location.href=`${loginUrl}?error=client-profile-required&next=${encodeURIComponent('client-dashboard.html')}`;
    return null;
  }
  return {db,user,profile};
};
window.filings4uClientSignOut=async function(){
  if(window.filings4uClientSupabase)await window.filings4uClientSupabase.auth.signOut({scope:'local'});
  location.href='customer-login.html';
};
})();