const db=window.filings4uSupabase;
const $=id=>document.getElementById(id);

function showMessage(text,type='error'){
  $('message').textContent=text;
  $('message').className=`message ${type}`;
  $('message').hidden=false;
}

function safeNextPage(){
  const params=new URLSearchParams(location.search);
  const next=params.get('next');

  if(!next)return 'client-dashboard.html';

  try{
    const decoded=decodeURIComponent(next);
    if(decoded.includes('://')||decoded.startsWith('//'))return 'client-dashboard.html';
    if(decoded.startsWith('/')||decoded.includes('\\'))return 'client-dashboard.html';

    const allowed=/^[a-zA-Z0-9._-]+\.html(?:\?[a-zA-Z0-9_%=&.-]*)?$/;
    return allowed.test(decoded)?decoded:'client-dashboard.html';
  }catch{
    return 'client-dashboard.html';
  }
}

async function getClientProfile(userId){
  const {data,error}=await db
    .from('client_profiles')
    .select('id,email_address,first_name,last_name,company_name')
    .eq('id',userId)
    .maybeSingle();

  if(error)throw error;
  return data;
}

async function checkExistingSession(){
  if(!db)return showMessage('Supabase client failed to load.');

  const params=new URLSearchParams(location.search);
  if(params.get('error')==='client-profile-required'){
    showMessage('This login is not linked to an active filings4u client profile.');
  }

  const {data,error}=await db.auth.getUser();
  if(error){
    console.warn('Unable to verify existing session.',error.message);
    return;
  }

  const user=data?.user;
  if(!user)return;

  $('signOutExisting').hidden=false;

  try{
    const profile=await getClientProfile(user.id);

    if(profile){
      showMessage(`Already signed in as ${profile.email_address}. Redirecting…`,'ok');
      setTimeout(()=>location.assign(safeNextPage()),350);
    }
  }catch(error){
    console.error(error);
  }
}

$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();

  $('message').hidden=true;

  const email=$('email').value.trim().toLowerCase();
  const password=$('password').value;

  if(!email||!password){
    return showMessage('Enter your email address and password.');
  }

  $('submit').disabled=true;
  $('submit').textContent='Signing in…';

  try{
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!data.user)throw new Error('No authenticated user was returned.');

    const profile=await getClientProfile(data.user.id);

    if(!profile){
      await db.auth.signOut({scope:'local'});
      throw new Error('This account is not linked to a filings4u client profile.');
    }

    showMessage('Sign-in successful. Opening your workspace…','ok');
    location.assign(safeNextPage());
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
  const visible=input.type==='text';
  $('togglePassword').textContent=visible?'Hide':'Show';
  $('togglePassword').setAttribute('aria-label',visible?'Hide password':'Show password');
});

$('signOutExisting').addEventListener('click',async()=>{
  const {error}=await db.auth.signOut({scope:'local'});
  if(error)return showMessage(error.message||'Unable to sign out.');

  $('signOutExisting').hidden=true;
  showMessage('The existing session has been signed out.','ok');
});

checkExistingSession();
