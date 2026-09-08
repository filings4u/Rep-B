(function(){'use strict';
const URL='https://lrbimrlbskjweynxlgas.supabase.co',KEY='sb_publishable_RlmqwQM8ATOc7-ML9hvwgw_UljUEavh';
if(!window.supabase||typeof window.supabase.createClient!=='function')throw new Error('Supabase JS v2 is required.');
if(!window.filings4uAdminSupabase){
  window.filings4uAdminSupabase=window.supabase.createClient(URL,KEY,{auth:{
    persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,
    storageKey:'filings4u-admin-auth',flowType:'pkce'
  }});
}
window.filings4uSupabase=window.filings4uAdminSupabase;
window.filings4uSignOut=async()=>{await window.filings4uAdminSupabase.auth.signOut({scope:'local'});location.href='admin-login.html';};
})();