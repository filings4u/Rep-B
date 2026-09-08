const SUPABASE_URL='https://lrbimrlbskjweynxlgas.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_RlmqwQM8ATOc7-ML9hvwgw_UljUEavh';
const STRIPE_PUBLISHABLE_KEY='pk_test_51TTy4i0dNjSlvyScX676lZwB34Lby8nEuv0sRorwo6kGYKkTJYiTyPQA6PVjzwUSjB9Kz90LdHtCh2E1BTMMEkTX00HCLPKUkf';
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v)||0);
const date=v=>v?new Date(`${v}T12:00:00`).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}):'—';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let token='';
let invoice=null;
let stripe=null;
let elements=null;
let paymentElement=null;
let clientSecret='';

function showOnly(id){
  ['checkoutLoading','checkoutError','checkoutPaid','checkoutApp'].forEach(x=>$(x).hidden=x!==id);
}
function showError(message){$('checkoutErrorMessage').textContent=message||'Unable to load this invoice.';showOnly('checkoutError');}
function showPaymentMessage(message){$('paymentMessage').textContent=message;$('paymentMessage').hidden=false;}
function clearPaymentMessage(){$('paymentMessage').hidden=true;$('paymentMessage').textContent='';}
async function invoke(action){
  const {data,error}=await client.functions.invoke('invoice-checkout',{body:{action,token}});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  return data;
}
function renderInvoice(){
  $('invoiceNumber').textContent=invoice.invoice_number||'Invoice';
  $('dueDate').textContent=date(invoice.due_date);
  $('customerEmail').textContent=invoice.client_email||'—';
  $('paymentTerms').textContent=invoice.payment_terms||'Due upon receipt';
  $('paymentAmount').textContent=money(invoice.total_amount);
  const lines=(invoice.invoice_line_items||[]).sort((a,b)=>Number(a.line_number)-Number(b.line_number));
  $('invoiceLines').innerHTML=lines.map(l=>`<div class="line-row"><span>${esc(l.description)}</span><span class="qty">${Number(l.quantity)||0}</span><span class="amount">${money(l.line_total)}</span></div>`).join('')||'<div class="line-row"><span>filings4u services</span><span class="qty">1</span><span class="amount">'+money(invoice.subtotal_amount)+'</span></div>';
  const discountLabel=invoice.discount_type==='percent'&&Number(invoice.discount_value)?`Discount (${Number(invoice.discount_value)}%)`:'Discount';
  $('invoiceTotals').innerHTML=`
    <div class="total-row"><span>Subtotal</span><strong>${money(invoice.subtotal_amount)}</strong></div>
    ${Number(invoice.discount_amount)>0?`<div class="total-row"><span>${discountLabel}</span><strong>− ${money(invoice.discount_amount)}</strong></div>`:''}
    ${Number(invoice.tax_amount)>0?`<div class="total-row"><span>Tax${Number(invoice.tax_rate)?` (${Number(invoice.tax_rate)}%)`:''}</span><strong>${money(invoice.tax_amount)}</strong></div>`:''}
    ${Number(invoice.shipping_amount)>0?`<div class="total-row"><span>Shipping</span><strong>${money(invoice.shipping_amount)}</strong></div>`:''}
    <div class="total-row grand"><span>Total due</span><strong>${money(invoice.total_amount)}</strong></div>`;
  if(invoice.customer_notes){$('customerNotes').textContent=invoice.customer_notes;$('customerNotesWrap').hidden=false;}
}
async function preparePayment(){
  const data=await invoke('create_payment');
  if(data.paid){return showPaid(data.invoice_number||invoice.invoice_number);}
  if(!data.client_secret)throw new Error('Secure payment could not be initialized.');
  const stripePublishableKey=data.publishable_key||STRIPE_PUBLISHABLE_KEY;
  if(!stripePublishableKey)throw new Error('Stripe publishable key is not configured.');
  clientSecret=data.client_secret;
  stripe=Stripe(stripePublishableKey);
  elements=stripe.elements({clientSecret,appearance:{theme:'stripe',variables:{colorPrimary:'#10b981',borderRadius:'9px',fontFamily:'DM Sans, sans-serif'}}});
  paymentElement=elements.create('payment',{layout:'tabs'});
  paymentElement.mount('#paymentElement');
  $('payButton').disabled=false;
  $('payButtonText').textContent=`Pay ${money(invoice.total_amount)}`;
}
async function verifyAndFinish(){
  const result=await invoke('verify_payment');
  if(result.paid){showPaid(result.invoice_number||invoice?.invoice_number);return true;}
  return false;
}
function showPaid(number){
  $('paidInvoiceNumber').textContent=number||invoice?.invoice_number||'Invoice';
  showOnly('checkoutPaid');
}
async function submitPayment(event){
  event.preventDefault();clearPaymentMessage();
  if(!stripe||!elements||!clientSecret)return;
  const button=$('payButton');button.disabled=true;$('payButtonText').textContent='Processing payment…';
  try{
    const {error:submitError}=await elements.submit();if(submitError)throw submitError;
    const {error,paymentIntent}=await stripe.confirmPayment({elements,clientSecret,redirect:'if_required',confirmParams:{return_url:location.href}});
    if(error)throw error;
    if(paymentIntent?.status==='succeeded'){
      const completed=await verifyAndFinish();
      if(!completed)throw new Error('Payment was submitted, but confirmation is still processing. Refresh this page in a moment.');
      return;
    }
    throw new Error(`Payment status: ${paymentIntent?.status||'pending'}.`);
  }catch(error){
    showPaymentMessage(error.message||'Payment could not be completed.');
    button.disabled=false;$('payButtonText').textContent=`Pay ${money(invoice?.total_amount)}`;
  }
}
async function boot(){
  token=new URLSearchParams(location.search).get('invoice')||'';
  if(!token)return showError('This invoice payment link is missing its secure token.');
  try{
    const data=await invoke('load');
    invoice=data.invoice;
    if(!invoice)throw new Error('Invoice not found.');
    if(invoice.payment_status==='paid'){return showPaid(invoice.invoice_number);}
    renderInvoice();
    showOnly('checkoutApp');
    await preparePayment();
  }catch(error){showError(error.message||'Unable to load this invoice.');}
}
$('paymentForm').addEventListener('submit',submitPayment);
boot();
