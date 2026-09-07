const db=window.filings4uSupabase;
const STRIPE_PUBLISHABLE_KEY=window.FILINGS4U_STRIPE_PUBLISHABLE_KEY||'';
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
let user,services=[],clients=[],stateFees=[],stripe=null,elements=null,paymentElement=null,paymentIntentId=null,clientSecret=null,trackingNumber=null;
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;
  user=auth.user;
  const rs=await Promise.all([
    db.from('services').select('id,slug,service_title,service_type,requires_jurisdiction,base_price_starter,base_price_compliance,base_price_enterprise').order('service_title'),
    db.from('client_profiles').select('id,email_address,first_name,last_name,phone_number,company_name').order('first_name'),
    db.from('state_service_fees').select('*').order('state_name')
  ]);
  const failed=rs.find(r=>r.error);
  if(failed){$('gate').textContent=failed.error.message;$('gate').style.color='#991b1b';return;}
  services=rs[0].data||[];clients=rs[1].data||[];stateFees=rs[2].data||[];
  $('service').innerHTML='<option value="">Choose a service</option>'+services.map(s=>`<option value="${escapeHtml(s.slug)}">${escapeHtml(s.service_title)}</option>`).join('');
  $('client').innerHTML='<option value="">New / unlinked customer</option>'+clients.map(c=>{
    const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||c.company_name||c.email_address;
    return `<option value="${escapeHtml(c.id)}">${escapeHtml(name)} · ${escapeHtml(c.email_address)}</option>`;
  }).join('');
  $('gate').hidden=true;$('app').hidden=false;renderSummary();
}

function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function selectedService(){return services.find(s=>s.slug===$('service').value)||null;}
function mode(){return document.querySelector('input[name="mode"]:checked')?.value||'card';}
function total(){return Number($('serviceFee').value||0)+Number($('governmentFee').value||0)+Number($('addons').value||0);}
function makeTracking(){const d=new Date().toISOString().slice(0,10).replaceAll('-','');return `M-${d}-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;}

function populateClient(){
  const c=clients.find(x=>String(x.id)===String($('client').value));if(!c)return;
  $('first').value=c.first_name||'';$('last').value=c.last_name||'';$('email').value=c.email_address||'';$('phone').value=c.phone_number||'';$('company').value=c.company_name||'';
}

function applyServiceDefaults(){
  const s=selectedService();if(!s)return renderSummary();
  const plan=$('plan').value;
  const map={starter:Number(s.base_price_starter||0),compliance:Number(s.base_price_compliance||0),enterprise:Number(s.base_price_enterprise||0)};
  if(plan!=='custom')$('serviceFee').value=(map[plan]||0).toFixed(2);
  applyGovernmentFee();renderSummary();resetStripe();
}

function applyGovernmentFee(){
  const state=stateFees.find(x=>x.state_code===$('state').value);
  const slug=$('service').value;
  if(!state)return;
  const keys=[
    ['series-llc','series_llc'],['nonprofit','non_profit'],['non-profit','non_profit'],['s-corp','s_corp'],
    ['c-corp','c_corp'],['corporation','c_corp'],['partnership','partnership'],['llc','llc']
  ];
  const found=keys.find(([needle])=>slug.includes(needle));
  if(found)$('governmentFee').value=Number(state[found[1]]||0).toFixed(2);
}

function renderSummary(){
  const s=selectedService();
  $('summaryService').textContent=s?.service_title||'New service order';
  $('sumService').textContent=money($('serviceFee').value);$('sumGovernment').textContent=money($('governmentFee').value);$('sumAddons').textContent=money($('addons').value);$('sumTotal').textContent=money(total());
  $('sumState').textContent=$('state').value||'No state selected';
  const m=mode();$('sumMode').textContent=m==='card'?'Pay now with Stripe':m==='invoice'?'Create linked invoice':'No-charge order';
  $('stripeArea').hidden=m!=='card';
  $('submitOrder').textContent=m==='card'?(elements?'Pay & create order':'Continue to secure payment'):m==='invoice'?'Create order & invoice':'Create no-charge order';
}

function resetStripe(){
  if(paymentElement){paymentElement.unmount();paymentElement=null;}
  elements=null;clientSecret=null;paymentIntentId=null;trackingNumber=null;
  $('stripeMountMessage').textContent='Enter customer, service, state and pricing. The secure Stripe payment form will mount before the order is finalized.';
  renderSummary();
}

async function mountStripe(){
  if(!STRIPE_PUBLISHABLE_KEY)throw new Error('Stripe publishable key is not configured in the admin browser configuration.');
  if(total()<=0)throw new Error('Paid orders must have a total greater than zero.');
  trackingNumber=trackingNumber||makeTracking();
  const {data,error}=await db.functions.invoke('admin-order-payment-intent',{body:{
    amount:total(),tracking_number:trackingNumber,email_address:$('email').value.trim().toLowerCase(),
    service_key:$('service').value,plan_tier:$('plan').value,user_id:$('client').value||null
  }});
  if(error)throw error;if(data?.error)throw new Error(data.error);
  clientSecret=data.clientSecret;paymentIntentId=data.paymentIntentId;
  stripe=Stripe(STRIPE_PUBLISHABLE_KEY);
  elements=stripe.elements({clientSecret});
  paymentElement=elements.create('payment',{layout:'tabs'});
  paymentElement.mount('#paymentElement');
  $('stripeMountMessage').textContent='Secure payment details';
  renderSummary();
}

function buildOrder(paymentStatus,paidAt){
  const s=selectedService(),linked=clients.find(c=>String(c.id)===String($('client').value))||null;
  const now=new Date().toISOString(),t=mode()==='free'?0:total();
  return {
    tracking_number:trackingNumber||makeTracking(),first_name:$('first').value.trim(),last_name:$('last').value.trim(),
    email_address:$('email').value.trim().toLowerCase(),phone_number:$('phone').value.trim()||'Not Provided',
    company_name:$('company').value.trim()||'Not Specified',selected_plan:$('plan').value,selected_service:s.slug,
    user_id:linked?.id||null,service_key:s.slug,plan_tier:$('plan').value,service_type:s.service_type,
    jurisdiction_state:$('state').value,order_status:$('orderStatus').value,payment_status:paymentStatus,currency:'USD',
    service_fee:mode()==='free'?0:Number($('serviceFee').value||0),government_fee:mode()==='free'?0:Number($('governmentFee').value||0),
    addons_total:mode()==='free'?0:Number($('addons').value||0),subtotal_amount:t,total_amount:t,total_paid_amount:paymentStatus==='paid'?t:0,
    account_created:!!linked,account_setup_mode:linked?'returning_customer':null,submitted_at:now,paid_at:paidAt,updated_at:now,
    stripe_payment_intent_id:paymentIntentId||null,upsells_payload:[],form_payload:{source:'admin_order_intake',payment_mode:mode(),internal_note:$('note').value.trim()||null}
  };
}

async function createInvoice(order){
  const due=new Date();due.setDate(due.getDate()+14);
  const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
  const payload={
    client_email:order.email_address,line_item_description:selectedService()?.service_title||order.service_key,total_amount:order.total_amount,
    due_date:due.toISOString().slice(0,10),token_hash:token,client_profile_id:order.user_id||null,order_id:order.id,
    status:'open',currency:'USD',subtotal_amount:order.total_amount,payment_status:'unpaid',tracking_number:order.tracking_number,
    customer_notes:'Created from Admin Order Intake',payment_terms:'Due within 14 days',created_by:user.id,updated_at:new Date().toISOString()
  };
  const {data:invoice,error}=await db.from('invoices').insert(payload).select().single();if(error)throw error;
  const lines=[
    ['Service fee',order.service_fee],['Government / filing fee',order.government_fee],['Add-ons',order.addons_total]
  ].filter(x=>Number(x[1])>0).map((x,i)=>({invoice_id:invoice.id,line_number:i+1,description:x[0],quantity:1,unit_price:Number(x[1]),line_total:Number(x[1])}));
  if(lines.length){const {error:lineError}=await db.from('invoice_line_items').insert(lines);if(lineError)throw lineError;}
  return invoice;
}

async function submit(event){
  event.preventDefault();
  const s=selectedService();if(!s)return toast('Choose a service.');
  if(!$('first').value.trim()||!$('last').value.trim()||!$('email').value.trim())return toast('Customer name and email are required.');
  if(!$('state').value)return toast('Choose a state / jurisdiction.');
  if([Number($('serviceFee').value),Number($('governmentFee').value),Number($('addons').value)].some(x=>!Number.isFinite(x)||x<0))return toast('Fees must be valid non-negative amounts.');
  const button=$('submitOrder');button.disabled=true;
  try{
    if(mode()==='card'){
      if(!elements){await mountStripe();toast('Secure payment form is ready. Enter payment details, then click Pay & create order.');return;}
      const {error:submitError}=await elements.submit();if(submitError)throw submitError;
      const {paymentIntent,error}=await stripe.confirmPayment({elements,clientSecret,redirect:'if_required'});
      if(error)throw error;
      if(paymentIntent.status!=='succeeded')throw new Error(`Payment is ${paymentIntent.status}. The order was not marked paid.`);
      const orderPayload=buildOrder('paid',new Date().toISOString());
      const {data:order,error:orderError}=await db.from('orders').insert(orderPayload).select().single();if(orderError)throw orderError;
      await createInvoice({...order,payment_status:'paid'});
      const inv=await db.from('invoices').update({status:'paid',payment_status:'paid',paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('order_id',order.id);
      if(inv.error)throw inv.error;
      location.href=`admin-orders.html?order=${encodeURIComponent(order.id)}`;return;
    }

    trackingNumber=trackingNumber||makeTracking();
    const paymentStatus=mode()==='free'?'paid':'pending';
    const orderPayload=buildOrder(paymentStatus,mode()==='free'?new Date().toISOString():null);
    const {data:order,error:orderError}=await db.from('orders').insert(orderPayload).select().single();if(orderError)throw orderError;
    if(mode()==='invoice')await createInvoice(order);
    location.href=`admin-orders.html?order=${encodeURIComponent(order.id)}`;
  }catch(error){toast(error.message||'Unable to create order.');}
  finally{button.disabled=false;renderSummary();}
}

function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}

$('client').addEventListener('change',populateClient);$('service').addEventListener('change',applyServiceDefaults);$('plan').addEventListener('change',applyServiceDefaults);
$('state').addEventListener('change',()=>{applyGovernmentFee();renderSummary();resetStripe();});
['serviceFee','governmentFee','addons'].forEach(id=>$(id).addEventListener('input',()=>{renderSummary();resetStripe();}));
document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',()=>{resetStripe();renderSummary();}));
$('orderForm').addEventListener('submit',submit);
boot();
