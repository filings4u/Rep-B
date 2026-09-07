const db=window.filings4uSupabase;
const $=id=>document.getElementById(id);

function showMessage(text,type='error'){
  $('message').textContent=text;
  $('message').className=`message ${type}`;
  $('message').hidden=false;
}

function nextPage(){
  const params=new URLSearchParams(location.search);
  const next=params.get('next');
  if(!next||next.includes('://')||next.startsWith('//')) return 'client-dashboard.html';
  return next;
}

async function getClientProfile(userId){
  const {data,error}=await db
    .from('client_profiles')
    .select('id,email_address,first_name,last_name,company_name')
    .eq('id',userId)
    .maybeSingle();

  if(error) throw error;
  return data;
}

async function checkExistingSession(){
  if(!db) return showMessage('Supabase client failed to load.');

  const params=new URLSearchParams(location.search);
  if(params.get('error')==='client-profile-required'){
    showMessage('This login is not linked to an active filings4u client profile.');
  }

  const {data:{user}}=await db.auth.getUser();
  if(!user) return;

  $('signOutExisting').hidden=false;

  try{
    const profile=await getClientProfile(user.id);
    if(profile){
      showMessage(`Already signed in as ${profile.email_address}. Redirecting…`,'ok');
      setTimeout(()=>location.href=nextPage(),350);
    }
  }catch(error){
    console.error(error);
  }
}

$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();
  $('message').hidden=true;
  $('submit').disabled=true;
  $('submit').textContent='Signing in…';

  try{
    const email=$('email').value.trim();
    const password=$('password').value;

    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error) throw error;
    if(!data.user) throw new Error('No authenticated user was returned.');

    const profile=await getClientProfile(data.user.id);

    if(!profile){
      await db.auth.signOut({ scope: 'local' });
      throw new Error('This account is not linked to a filings4u client profile.');
    }

    showMessage('Sign-in successful. Opening your workspace…','ok');
    location.href=nextPage();
  }catch(error){
    showMessage(error.message||'Unable to sign in.');
  }finally{
    $('submit').disabled=false;
    $('submit').textContent='Sign in';
  }
});

$('togglePassword').addEventListener('click',()=>{
  const input=$('password');
  input.type=input.type==='password'?'text':'password';
  $('togglePassword').textContent=input.type==='password'?'Show':'Hide';
});

$('signOutExisting').addEventListener('click',async()=>{
  await db.auth.signOut({ scope: 'local' });
  $('signOutExisting').hidden=true;
  showMessage('The existing session has been signed out.','ok');
});

checkExistingSession();