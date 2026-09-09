const db=window.filings4uSupabase;
const STRIPE_PUBLISHABLE_KEY=window.FILINGS4U_STRIPE_PUBLISHABLE_KEY||'';
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
let user,services=[],clients=[],stateFees=[],stripe=null,elements=null,paymentElement=null,paymentIntentId=null,clientSecret=null,trackingNumber=null;
let toastTimer;

const FILINGS4U_ADMIN_SERVICE_CATALOG=[{"slug":"llc-formation","service_title":"LLC Formation","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":399.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"corporations","service_title":"Corporations (C/S-Corp)","base_price_starter":129.0,"base_price_compliance":249.0,"base_price_enterprise":599.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"series-llc","service_title":"Series LLC","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":399.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"sole-proprietorship","service_title":"Sole Proprietorship","base_price_starter":79.0,"base_price_compliance":159.0,"base_price_enterprise":239.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"dba-registration","service_title":"DBA Registration","base_price_starter":39.0,"base_price_compliance":99.0,"base_price_enterprise":159.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"nonprofits","service_title":"Nonprofit Organization","base_price_starter":149.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"foreign-qualification","service_title":"Foreign Qualification Certificate","base_price_starter":149.0,"base_price_compliance":249.0,"base_price_enterprise":349.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"llc-reinstatement","service_title":"LLC Reinstatement","base_price_starter":79.0,"base_price_compliance":149.0,"base_price_enterprise":249.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"servicemark-filing","service_title":"Servicemark Filing","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":399.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"annual-reports","service_title":"Annual Reports","base_price_starter":89.0,"base_price_compliance":159.0,"base_price_enterprise":249.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"operating-agreement","service_title":"Operating Agreement","base_price_starter":49.0,"base_price_compliance":99.0,"base_price_enterprise":199.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"registered-agent","service_title":"Registered Agent","base_price_starter":99.0,"base_price_compliance":179.0,"base_price_enterprise":299.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"business-licenses","service_title":"Business Licenses","base_price_starter":79.0,"base_price_compliance":149.0,"base_price_enterprise":299.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"dissolution","service_title":"Entity Dissolution","base_price_starter":149.0,"base_price_compliance":249.0,"base_price_enterprise":349.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"certificate-of-good-standing","service_title":"Certificate of Good Standing","base_price_starter":49.0,"base_price_compliance":99.0,"base_price_enterprise":149.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"clia-certificate","service_title":"CLIA Certificate","base_price_starter":199.0,"base_price_compliance":349.0,"base_price_enterprise":499.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"regulatory-consulting","service_title":"Regulatory Consulting","base_price_starter":150.0,"base_price_compliance":1000.0,"base_price_enterprise":1850.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"state-tax","service_title":"State Income Tax","base_price_starter":199.0,"base_price_compliance":349.0,"base_price_enterprise":549.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"franchise-tax","service_title":"Franchise Tax Filing","base_price_starter":149.0,"base_price_compliance":249.0,"base_price_enterprise":399.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"sales-tax-registration","service_title":"Sales Tax Registration","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":299.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"payroll-tax-940-941","service_title":"Payroll Tax (940/941)","base_price_starter":199.0,"base_price_compliance":349.0,"base_price_enterprise":499.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"duns-number","service_title":"DUNS Number Procurement","base_price_starter":49.0,"base_price_compliance":99.0,"base_price_enterprise":179.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"minority-certificate","service_title":"Minority Certificate","base_price_starter":99.0,"base_price_compliance":249.0,"base_price_enterprise":399.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"ifta-registration","service_title":"IFTA Registration","base_price_starter":159.0,"base_price_compliance":279.0,"base_price_enterprise":349.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"ifta-quarterly-returns","service_title":"IFTA Quarterly Fuel Tax Filing","base_price_starter":129.0,"base_price_compliance":249.0,"base_price_enterprise":449.0,"catalog_group":"Business & State Services","service_type":"state","requires_jurisdiction":true},{"slug":"web-design-packages","service_title":"Web Design Packages","base_price_starter":699.0,"base_price_compliance":1499.0,"base_price_enterprise":2999.0,"catalog_group":"Design & Operational Specialties","service_type":"specialty","requires_jurisdiction":false},{"slug":"logo-design-packages","service_title":"Logo Design Packages","base_price_starter":149.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Design & Operational Specialties","service_type":"specialty","requires_jurisdiction":false},{"slug":"shipper-packages","service_title":"Shipper Setup Packages","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":349.0,"catalog_group":"Design & Operational Specialties","service_type":"specialty","requires_jurisdiction":false},{"slug":"carrier-packages-brokers","service_title":"Carrier Setup Packages for Brokers","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":349.0,"catalog_group":"Design & Operational Specialties","service_type":"specialty","requires_jurisdiction":false},{"slug":"carrier-packages-truckers","service_title":"Carrier Packages for Trucking Companies","base_price_starter":79.0,"base_price_compliance":149.0,"base_price_enterprise":249.0,"catalog_group":"Design & Operational Specialties","service_type":"specialty","requires_jurisdiction":false},{"slug":"federal-tax","service_title":"Federal Income Tax","base_price_starter":299.0,"base_price_compliance":499.0,"base_price_enterprise":799.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"employer-id-ein","service_title":"Employer ID (EIN)","base_price_starter":79.0,"base_price_compliance":149.0,"base_price_enterprise":199.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"heavy-use-tax-2290","service_title":"Heavy Use Tax (2290)","base_price_starter":99.0,"base_price_compliance":179.0,"base_price_enterprise":249.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"cage-code","service_title":"CAGE Code","base_price_starter":249.0,"base_price_compliance":349.0,"base_price_enterprise":449.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"owner-operators","service_title":"Owner Operators","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"trucker-authority","service_title":"Trucker Authority","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"broker-authority","service_title":"Broker Authority","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"ucr-registration","service_title":"UCR Registration","base_price_starter":99.0,"base_price_compliance":179.0,"base_price_enterprise":249.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"scac-code","service_title":"SCAC Code Registration","base_price_starter":49.0,"base_price_compliance":99.0,"base_price_enterprise":149.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"dot-consortium","service_title":"DOT Consortium","base_price_starter":149.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"driver-file","service_title":"Driver Qualification File","base_price_starter":279.0,"base_price_compliance":349.0,"base_price_enterprise":449.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"process-agents-boc-3","service_title":"Process Agents (BOC-3)","base_price_starter":49.0,"base_price_compliance":99.0,"base_price_enterprise":149.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"trucker-insurance-quote","service_title":"Trucker Insurance","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":299.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"broker-insurance-quote","service_title":"Broker Insurance","base_price_starter":99.0,"base_price_compliance":199.0,"base_price_enterprise":299.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"hazmat-registration","service_title":"DOT HAZMAT Registration","base_price_starter":199.0,"base_price_compliance":349.0,"base_price_enterprise":449.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"new-entrant-audit","service_title":"New Entrant Audit","base_price_starter":199.0,"base_price_compliance":299.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"mcs-150-update","service_title":"MCS-150 Biennial Update","base_price_starter":59.0,"base_price_compliance":89.0,"base_price_enterprise":139.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"boc-3-amendment","service_title":"BOC-3 Process Agent Amendment","base_price_starter":39.0,"base_price_compliance":79.0,"base_price_enterprise":119.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"dot-permits","service_title":"DOT Permits","base_price_starter":79.0,"base_price_compliance":149.0,"base_price_enterprise":299.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"apostille-services","service_title":"Apostille Services","base_price_starter":149.0,"base_price_compliance":249.0,"base_price_enterprise":399.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false},{"slug":"trademark-filing","service_title":"Trademark Filing","base_price_starter":299.0,"base_price_compliance":399.0,"base_price_enterprise":499.0,"catalog_group":"Government & Regulatory Services","service_type":"government","requires_jurisdiction":false}];

function normalizeServiceCatalog(dbServices){
  const registry=FILINGS4U_ADMIN_SERVICE_CATALOG.map(x=>({...x,_catalog_source:'pricing_registry'}));
  const dbRows=(dbServices||[]).map(x=>({
    ...x,
    catalog_group:x.service_type==='government'?'Government & Regulatory Services':
      x.service_type==='design'?'Design & Operational Specialties':'Additional filings4u Services',
    _catalog_source:'database'
  }));

  // Pricing registry wins for canonical slugs/prices; DB-only services are still preserved.
  const bySlug=new Map();
  [...dbRows,...registry].forEach(s=>{
    const slug=String(s.slug||'').trim();
    if(!slug)return;
    bySlug.set(slug,{...(bySlug.get(slug)||{}),...s});
  });

  // Remove accidental duplicate titles while keeping the canonical registry-backed entry.
  const byTitle=new Map();
  [...bySlug.values()].forEach(s=>{
    const key=String(s.service_title||s.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
    const existing=byTitle.get(key);
    if(!existing || s._catalog_source==='pricing_registry')byTitle.set(key,s);
  });

  return [...byTitle.values()].sort((a,b)=>{
    const groups=['Business & State Services','Government & Regulatory Services','Design & Operational Specialties','Additional filings4u Services'];
    const ga=groups.indexOf(a.catalog_group),gb=groups.indexOf(b.catalog_group);
    return (ga-gb)||String(a.service_title||'').localeCompare(String(b.service_title||''));
  });
}

function renderServiceOptions(){
  const groups=['Business & State Services','Government & Regulatory Services','Design & Operational Specialties','Additional filings4u Services'];
  let html='<option value="">Choose a service</option>';
  groups.forEach(group=>{
    const rows=services.filter(s=>s.catalog_group===group);
    if(!rows.length)return;
    html+=`<optgroup label="${escapeHtml(group)}">${rows.map(s=>`<option value="${escapeHtml(s.slug)}">${escapeHtml(s.service_title)}</option>`).join('')}</optgroup>`;
  });
  $('service').innerHTML=html;
}


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
  services=normalizeServiceCatalog(rs[0].data||[]);clients=rs[1].data||[];stateFees=rs[2].data||[];
  renderServiceOptions();
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
