const $=id=>document.getElementById(id);

let db,user,profile;
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;
  ({db,user,profile}=auth);
  fill();
  $('gate').hidden=true;
  $('app').hidden=false;
}

function fill(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C')[0].toUpperCase();

  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  $('largeAvatar').textContent=initial;
  $('profileName').textContent=name;
  $('profileCompany').textContent=company;

  if($('clientMenuName'))$('clientMenuName').textContent=name;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;

  $('firstName').value=profile.first_name||'';
  $('lastName').value=profile.last_name||'';
  $('email').value=user.email||profile.email_address||'';
  $('phone').value=profile.phone_number||'';
  $('company').value=profile.company_name||'';
  $('street').value=profile.street_address||'';
  $('city').value=profile.city||'';
  $('state').value=profile.state||'';
  $('zip').value=profile.zip_code||'';
  $('securityEmail').textContent=user.email||profile.email_address||'—';
}

async function updateProfile(payload,button,message){
  button.disabled=true;
  const old=button.textContent;
  button.textContent='Saving…';
  try{
    const {data,error}=await db
      .from('client_profiles')
      .update({...payload,updated_at:new Date().toISOString()})
      .eq('id',user.id)
      .select('id,email_address,first_name,last_name,phone_number,street_address,city,state,zip_code,updated_at,company_name,avatar_url')
      .single();

    if(error)throw error;
    profile={...profile,...data};
    fill();
    $(message).textContent='Saved';
    setTimeout(()=>$(message).textContent='',2200);
    toast('Account updated.');
  }catch(e){
    toast(e.message||'Unable to save changes.');
  }finally{
    button.disabled=false;
    button.textContent=old;
  }
}

$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  updateProfile({
    first_name:$('firstName').value.trim()||null,
    last_name:$('lastName').value.trim()||null,
    phone_number:$('phone').value.trim()||null,
    company_name:$('company').value.trim()||null
  },$('saveProfile'),'profileSaved');
});

$('addressForm').addEventListener('submit',e=>{
  e.preventDefault();
  updateProfile({
    street_address:$('street').value.trim()||null,
    city:$('city').value.trim()||null,
    state:$('state').value.trim()||null,
    zip_code:$('zip').value.trim()||null
  },$('saveAddress'),'addressSaved');
});

$('passwordForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const current=$('currentPassword').value;
  const next=$('newPassword').value;
  const confirm=$('confirmPassword').value;

  if(next!==confirm)return toast('The passwords do not match.');
  if(next.length<8)return toast('Use at least 8 characters.');
  if(current===next)return toast('Choose a new password that is different from your current password.');

  const b=$('savePassword');
  b.disabled=true;
  b.textContent='Updating…';

  try{
    const {error}=await db.auth.updateUser({
      password:next,
      currentPassword:current
    });
    if(error)throw error;

    $('passwordForm').reset();
    $('passwordSaved').textContent='Password updated';
    setTimeout(()=>$('passwordSaved').textContent='',2500);
    toast('Password updated successfully.');
  }catch(err){
    toast(err.message||'Unable to update password.');
  }finally{
    b.disabled=false;
    b.textContent='Update password';
  }
});

document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('is-active',x===btn));
  document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('is-active',x.dataset.panel===btn.dataset.tab));
});

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2800);
}

boot();
