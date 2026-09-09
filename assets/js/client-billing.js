const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
const date=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
const datetime=v=>v?new Date(v).toLocaleString():'—';
let db,user,profile,invoices=[],orders=[],legacyOrders=[],receipts=[];

async function boot(){
  const auth=await window.filings4uRequireClient();if(!auth)return;
  ({db,user,profile}=auth);hydrateProfile();
  try{
    const {data,error}=await db.functions.invoke('client-billing',{body:{action:'load'}});
    if(error)throw error;if(data?.error)throw new Error(data.error);
    invoices=data?.invoices||[];orders=data?.orders||[];legacyOrders=data?.legacy_orders||[];
    buildReceipts();render();
    $('gate').hidden=true;$('app').hidden=false;
  }catch(e){$('gate').textContent='Unable to load your billing history.';$('gate').style.color='#991b1b';toast(e.message||String(e));}
}
function hydrateProfile(){
 const name=[profile?.first_name,profile?.last_name].filter(Boolean).join(' ')||'My Account';
 const company=profile?.company_name||'filings4u client';
 const initial=(profile?.first_name||profile?.company_name||user.email||'C').charAt(0).toUpperCase();
 ['clientName','clientMenuName'].forEach(id=>{if($(id))$(id).textContent=name});
 if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
 ['clientAvatar','clientMenuAvatar'].forEach(id=>{if($(id))$(id).textContent=initial});
}
function buildReceipts(){
 const paidInvoices=invoices.filter(i=>String(i.payment_status).toLowerCase()==='paid').map(i=>({...i,kind:'invoice',receiptKey:'invoice:'+i.id}));
 const invoicedOrderIds=new Set(paidInvoices.map(i=>i.order_id).filter(Boolean).map(String));
 const paidOrders=orders.filter(o=>String(o.payment_status).toLowerCase()==='paid'&&!invoicedOrderIds.has(String(o.id))).map(o=>({...o,kind:'order',receiptKey:'order:'+o.id}));
 const knownTracking=new Set(paidOrders.map(o=>o.tracking_number).filter(Boolean));
 const legacy=legacyOrders.filter(o=>!knownTracking.has(o.tracking_number)).map(o=>({...o,kind:'legacy',receiptKey:'legacy:'+o.id}));
 receipts=[...paidInvoices,...paidOrders,...legacy].sort((a,b)=>new Date(b.paid_at||b.created_at)-new Date(a.paid_at||a.created_at));
}
function render(){
 const open=invoices.filter(i=>!['paid','void','cancelled'].includes(String(i.payment_status||i.status).toLowerCase()));
 $('amountDue').textContent=money(open.reduce((s,i)=>s+Number(i.total_amount||0),0));
 $('openInvoices').textContent=open.length;
 $('paidInvoices').textContent=invoices.filter(i=>String(i.payment_status).toLowerCase()==='paid').length;
 $('websitePayments').textContent=receipts.filter(r=>r.kind!=='invoice').length;
 $('openInvoiceList').innerHTML=open.length?open.map(invoiceRow).join(''):'<div class="empty-billing">You have no open invoices.</div>';
 renderReceipts();
 document.querySelectorAll('[data-view-invoice]').forEach(b=>b.onclick=()=>viewInvoice(b.dataset.viewInvoice));
 document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>toggleReceipt(b.dataset.receipt));
}
function invoiceRow(i){
 const canPay=String(i.payment_status).toLowerCase()!=='paid'&&i.payment_url;
 return `<article class="billing-row">
   <div><h3>${esc(i.invoice_number||'Invoice')}</h3><p>${esc((i.invoice_line_items||[])[0]?.description||'filings4u services')}</p></div>
   <div class="billing-meta"><span>Due date</span><b>${date(i.due_date)}</b></div>
   <div class="billing-meta"><span>Status</span><b><i class="billing-pill ${esc(i.payment_status)}">${esc(i.payment_status||i.status)}</i></b></div>
   <div class="billing-meta"><span>Amount due</span><b>${money(i.total_amount)}</b></div>
   <div class="billing-actions"><button class="billing-button" data-view-invoice="${esc(i.id)}">View invoice</button>${canPay?`<a class="billing-button pay" href="${esc(i.payment_url)}">Pay now</a>`:''}</div>
 </article>`;
}
function renderReceipts(){
 const q=($('receiptSearch')?.value||'').trim().toLowerCase();
 const list=receipts.filter(r=>[r.invoice_number,r.tracking_number,r.selected_service,r.service_key,r.company_name].join(' ').toLowerCase().includes(q));
 $('receiptList').innerHTML=list.length?list.map(receiptRow).join(''):'<div class="empty-billing">No receipts match your search.</div>';
 document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>toggleReceipt(b.dataset.receipt));
}
function receiptRow(r){
 const invoice=r.kind==='invoice', title=invoice?(r.invoice_number||'Invoice'):(r.tracking_number||'Website order');
 const desc=invoice?((r.invoice_line_items||[])[0]?.description||'filings4u services'):(r.selected_service||r.service_key||'filings4u service');
 const total=invoice?r.total_amount:(r.total_paid_amount||r.total_amount);
 const paid=r.paid_at||r.created_at;
 return `<article class="billing-row receipt-row">
   <div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>
   <div class="billing-meta"><span>Type</span><b>${invoice?'Invoice payment':'Website order'}</b></div>
   <div class="billing-meta"><span>Paid</span><b>${date(paid)}</b></div>
   <div class="billing-meta"><span>Total paid</span><b>${money(total)}</b></div>
   <div class="billing-actions"><button class="billing-button receipt" data-receipt="${esc(r.receiptKey)}">View receipt</button></div>
   <div class="receipt-detail" id="${esc('receipt-'+r.receiptKey.replace(/[^a-z0-9]/gi,'-'))}">${receiptDetail(r)}</div>
 </article>`;
}
function receiptDetail(r){
 if(r.kind==='invoice'){
   const lines=(r.invoice_line_items||[]).sort((a,b)=>Number(a.line_number)-Number(b.line_number));
   return `<strong>Payment receipt · ${esc(r.invoice_number)}</strong><p>Paid ${datetime(r.paid_at)}</p><table class="receipt-lines">${lines.map(l=>`<tr><td>${esc(l.description)} × ${esc(l.quantity)}</td><td>${money(l.line_total)}</td></tr>`).join('')}</table><div class="receipt-total"><span>Total paid</span><span>${money(r.total_amount)}</span></div>`;
 }
 return `<strong>Website order receipt · ${esc(r.tracking_number||'Order')}</strong><p>${esc(r.selected_service||r.service_key||'filings4u service')} · Paid ${datetime(r.paid_at||r.created_at)}</p><table class="receipt-lines">${r.service_fee!=null?`<tr><td>Service fee</td><td>${money(r.service_fee)}</td></tr>`:''}${r.government_fee!=null?`<tr><td>Government fee</td><td>${money(r.government_fee)}</td></tr>`:''}${r.addons_total!=null?`<tr><td>Add-ons</td><td>${money(r.addons_total)}</td></tr>`:''}</table><div class="receipt-total"><span>Total paid</span><span>${money(r.total_paid_amount||r.total_amount)}</span></div>`;
}
async function viewInvoice(id){
 const i=invoices.find(x=>String(x.id)===String(id));if(!i)return;
 try{await db.functions.invoke('client-billing',{body:{action:'view_invoice',invoice_id:id}});}catch(e){}
 const detail=document.createElement('div');detail.className='receipt-detail open';detail.style.margin='0 0 18px';
 const lines=(i.invoice_line_items||[]).sort((a,b)=>Number(a.line_number)-Number(b.line_number));
 detail.innerHTML=`<strong>${esc(i.invoice_number)}</strong><p>Issued ${date(i.created_at)} · Due ${date(i.due_date)}</p><table class="receipt-lines">${lines.map(l=>`<tr><td>${esc(l.description)} × ${esc(l.quantity)}</td><td>${money(l.line_total)}</td></tr>`).join('')}</table>${Number(i.discount_amount)>0?`<div class="receipt-total"><span>Discount</span><span>− ${money(i.discount_amount)}</span></div>`:''}<div class="receipt-total"><span>Total</span><span>${money(i.total_amount)}</span></div>${i.customer_notes?`<p><strong>Invoice notes:</strong> ${esc(i.customer_notes)}</p>`:''}`;
 const row=document.querySelector(`[data-view-invoice="${CSS.escape(id)}"]`)?.closest('.billing-row');
 const existing=row?.querySelector('.receipt-detail');if(existing)existing.remove();row?.appendChild(detail);
}
function toggleReceipt(key){const id='receipt-'+key.replace(/[^a-z0-9]/gi,'-');$(id)?.classList.toggle('open')}
function toast(x){const t=$('toast');if(!t)return;t.textContent=x;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,3000)}
$('receiptSearch')?.addEventListener('input',renderReceipts);
boot();