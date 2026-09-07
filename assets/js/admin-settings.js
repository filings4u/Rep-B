const db=window.filings4uSupabase;
let settings=null;

const $=x=>document.getElementById(x);
const money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(x||0));

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;
  $('gate').hidden=true;
  $('app').hidden=false;
  await load();
}

function deny(x){
  $('gate').textContent=x;
  $('gate').style.color='#991b1b';
}

async function load(){
  setBusy(true,'Loading…');
  const {data,error}=await db.from('global_platform_settings')
    .select('*')
    .order('id')
    .limit(1)
    .maybeSingle();

  setBusy(false);

  if(error)return toast(error.message);
  if(!data)return toast('No global platform settings record exists.');

  settings=data;
  fill();
  renderStatus();
}

function fill(){
  $('mode').value=settings.website_operating_mode||'';
  $('maintenance').checked=!!settings.maintenance_mode_interlock_active;
  $('announcement').value=settings.website_announcement||'';

  $('portalEnabled').checked=!!settings.client_portal_enabled;
  $('showOrders').checked=!!settings.client_portal_show_orders;
  $('showSupport').checked=!!settings.client_portal_show_support;
  $('portalAnnouncement').value=settings.client_portal_announcement||'';

  $('starterFee').value=Number(settings.starter_base_processing_fee||0);
  $('premiumFee').value=Number(settings.premium_suite_processing_fee||0);
  $('stateFee').value=Number(settings.state_disbursement_baseline_fee||0);

  $('stripeUrl').value=settings.stripe_webhook_receiver_url||'';
  $('emailUrl').value=settings.transactional_email_endpoint_url||'';

  $('updated').textContent=settings.updated_at
    ?`Last updated ${new Date(settings.updated_at).toLocaleString()}`
    :'Last updated —';
}

function renderStatus(){
  $('statusCards').innerHTML=[
    ['Website mode',settings.website_operating_mode||'—'],
    ['Maintenance',settings.maintenance_mode_interlock_active?'ACTIVE':'Off'],
    ['Client portal',settings.client_portal_enabled?'Enabled':'Disabled'],
    ['Starter baseline',money(settings.starter_base_processing_fee)]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
}

function validUrl(value){
  if(!value)return true;
  try{
    const u=new URL(value);
    return u.protocol==='https:'||u.protocol==='http:';
  }catch{
    return false;
  }
}

async function save(e){
  e.preventDefault();
  if(!settings)return toast('Settings record is not loaded.');

  const stripeUrl=$('stripeUrl').value.trim();
  const emailUrl=$('emailUrl').value.trim();

  if(!validUrl(stripeUrl))return toast('Stripe webhook URL must be a valid http or https URL.');
  if(!validUrl(emailUrl))return toast('Transactional email URL must be a valid http or https URL.');

  const patch={
    website_operating_mode:$('mode').value.trim(),
    maintenance_mode_interlock_active:$('maintenance').checked,
    website_announcement:$('announcement').value.trim()||null,
    client_portal_enabled:$('portalEnabled').checked,
    client_portal_show_orders:$('showOrders').checked,
    client_portal_show_support:$('showSupport').checked,
    client_portal_announcement:$('portalAnnouncement').value.trim()||null,
    starter_base_processing_fee:Number($('starterFee').value),
    premium_suite_processing_fee:Number($('premiumFee').value),
    state_disbursement_baseline_fee:Number($('stateFee').value),
    stripe_webhook_receiver_url:stripeUrl||null,
    transactional_email_endpoint_url:emailUrl||null,
    updated_at:new Date().toISOString()
  };

  if(!patch.website_operating_mode)return toast('Website operating mode is required.');

  const fees=[
    patch.starter_base_processing_fee,
    patch.premium_suite_processing_fee,
    patch.state_disbursement_baseline_fee
  ];
  if(fees.some(x=>!Number.isFinite(x)||x<0)){
    return toast('Fees must be valid non-negative amounts.');
  }

  setBusy(true,'Saving…');

  const {data,error}=await db.from('global_platform_settings')
    .update(patch)
    .eq('id',settings.id)
    .select()
    .single();

  setBusy(false);

  if(error)return toast(error.message);

  settings=data;
  fill();
  renderStatus();
  toast('Platform settings saved.');
}

function setBusy(busy,label='Save platform settings'){
  const saveBtn=$('saveSettings');
  const reloadBtn=$('refresh');
  if(saveBtn){
    saveBtn.disabled=busy;
    saveBtn.textContent=busy?label:'Save platform settings';
  }
  if(reloadBtn)reloadBtn.disabled=busy;
}

function toast(x){
  $('toast').textContent=x;
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2800);
}

$('form').addEventListener('submit',save);
$('refresh').onclick=load;
document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);
boot();
