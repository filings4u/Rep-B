(function(){
'use strict';

const db=window.filings4uAdminSupabase||window.filings4uSupabase||window.supabaseClient;
const $=id=>document.getElementById(id);

function msg(text,type='error'){
  const el=$('message');
  if(!el)return;
  el.textContent=text;
  el.className='message '+type;
  el.hidden=false;
}

function nextPage(){
  const p=new URLSearchParams(location.search);
  const raw=p.get('returnTo')||p.get('next')||'admin-dashboard.html';
  if(raw.includes('://')||raw.startsWith('//')||raw.startsWith('/'))return 'admin-dashboard.html';
  if(/^admin-(login|forgot-password|reset-password)\.html/i.test(raw))return 'admin-dashboard.html';
  return raw;
}

async function verifyCurrentSession(){
  if(!db)return null;
  const {data:{session}}=await db.auth.getSession();
  if(!session)return null;
  const {data,error}=await db.functions.invoke('admin-auth-check',{body:{action:'verify'}});
  if(error||data?.ok!==true)return null;
  return {session,admin:data.admin};
}

(async()=>{
  if(!db){
    msg('The secure sign-in service could not load. Refresh the page and try again.');
    return;
  }
  const p=new URLSearchParams(location.search);
  if(p.get('reason')==='admin_required')msg('That account is not an active filings4u administrator.');
  try{
    const current=await verifyCurrentSession();
    if(current){
      msg('Already signed in. Redirecting…','ok');
      location.replace(nextPage());
    }
  }catch(e){
    console.error('[filings4u admin login bootstrap]',e);
  }
})();

$('loginForm')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const submit=$('submit');
  submit.disabled=true;
  if($('message'))$('message').hidden=true;

  try{
    if(!db)throw new Error('The secure sign-in service is unavailable.');

    const email=$('email').value.trim();
    const password=$('password').value;
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!data?.session?.access_token)throw new Error('A secure session was not created.');

    const {data:check,error:checkError}=await db.functions.invoke('admin-auth-check',{
      body:{action:'verify'}
    });

    if(checkError||check?.ok!==true){
      try{await db.auth.signOut({scope:'local'});}catch(_){}
      throw new Error(check?.error==='admin_required'
        ?'This account is not an active filings4u administrator.'
        :'Administrator access could not be verified.');
    }

    msg('Sign in successful. Opening management…','ok');
    location.replace(nextPage());
  }catch(error){
    console.error('[filings4u admin sign in]',error);
    msg(error?.message||'Unable to sign in.');
  }finally{
    submit.disabled=false;
  }
});

$('togglePassword')?.addEventListener('click',()=>{
  const input=$('password');
  input.type=input.type==='password'?'text':'password';
  $('togglePassword').textContent=input.type==='password'?'Show':'Hide';
});

$('signOutExisting')?.addEventListener('click',async()=>{
  if(db)await db.auth.signOut({scope:'local'});
  msg('Admin session signed out.','ok');
});
})();