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
 document.querySelectorAll('[data-download-invoice]').forEach(b=>b.onclick=()=>downloadInvoice(b.dataset.downloadInvoice));
 document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>toggleReceipt(b.dataset.receipt));
 document.querySelectorAll('[data-download-receipt]').forEach(b=>b.onclick=()=>downloadReceipt(b.dataset.downloadReceipt));
}
function invoiceRow(i){
 const canPay=String(i.payment_status).toLowerCase()!=='paid'&&i.payment_url;
 return `<article class="billing-row invoice-row" data-invoice-row="${esc(i.id)}">
   <div class="billing-primary">
     <h3>${esc(i.invoice_number||'Invoice')}</h3>
     <p>${esc((i.invoice_line_items||[])[0]?.description||'filings4u services')}</p>
   </div>
   <div class="billing-meta billing-due"><span>Due date</span><b>${date(i.due_date)}</b></div>
   <div class="billing-meta billing-status"><span>Status</span><b><i class="billing-pill ${esc(i.payment_status)}">${esc(i.payment_status||i.status)}</i></b></div>
   <div class="billing-meta billing-amount"><span>Amount due</span><b>${money(i.total_amount)}</b></div>
   <div class="billing-actions">
     <button class="billing-button" type="button" data-view-invoice="${esc(i.id)}">View invoice</button>
     <button class="billing-button download" type="button" data-download-invoice="${esc(i.id)}">Download invoice</button>
     ${canPay?`<a class="billing-button pay" href="${esc(i.payment_url)}">Pay now</a>`:''}
   </div>
 </article>`;
}
function renderReceipts(){
 const q=($('receiptSearch')?.value||'').trim().toLowerCase();
 const list=receipts.filter(r=>[r.invoice_number,r.tracking_number,r.selected_service,r.service_key,r.company_name].join(' ').toLowerCase().includes(q));
 $('receiptList').innerHTML=list.length?list.map(receiptRow).join(''):'<div class="empty-billing">No receipts match your search.</div>';
 document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>toggleReceipt(b.dataset.receipt));
 document.querySelectorAll('[data-download-receipt]').forEach(b=>b.onclick=()=>downloadReceipt(b.dataset.downloadReceipt));
}
function receiptRow(r){
 const invoice=r.kind==='invoice', title=invoice?(r.invoice_number||'Invoice'):(r.tracking_number||'Website order');
 const desc=invoice?((r.invoice_line_items||[])[0]?.description||'filings4u services'):(r.selected_service||r.service_key||'filings4u service');
 const total=invoice?r.total_amount:(r.total_paid_amount||r.total_amount);
 const paid=r.paid_at||r.created_at;
 return `<article class="billing-row receipt-row">
   <div class="billing-primary"><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>
   <div class="billing-meta billing-type"><span>Type</span><b>${invoice?'Invoice payment':'Website order'}</b></div>
   <div class="billing-meta billing-paid"><span>Paid</span><b>${date(paid)}</b></div>
   <div class="billing-meta billing-amount"><span>Total paid</span><b>${money(total)}</b></div>
   <div class="billing-actions">
     <button class="billing-button receipt" type="button" data-receipt="${esc(r.receiptKey)}">View receipt</button>
     <button class="billing-button download" type="button" data-download-receipt="${esc(r.receiptKey)}">Download receipt</button>
   </div>
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
function pdf(){
  if(!window.jspdf?.jsPDF)throw new Error('PDF library could not be loaded.');
  return new window.jspdf.jsPDF({unit:'pt',format:'letter'});
}
function pdfHeader(doc,title,number){
  doc.setFillColor(10,31,68);doc.rect(0,0,612,92,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('filings4u',42,48);
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('A Subsidiary of Roseland Companies, LLC',42,66);
  doc.setFont('helvetica','bold');doc.setFontSize(19);doc.text(title,570,42,{align:'right'});
  doc.setFontSize(10);doc.text(String(number||''),570,61,{align:'right'});
  doc.setTextColor(10,31,68);
}
function pdfLine(doc,label,value,y,bold=false){
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(10);doc.setTextColor(71,85,105);doc.text(label,42,y);
  doc.setTextColor(10,31,68);doc.text(String(value??'—'),570,y,{align:'right'});
}
function pdfSaveName(value,fallback){
  return String(value||fallback).replace(/[^a-z0-9_-]+/gi,'-')+'.pdf';
}
function downloadInvoice(id){
  try{
    const i=invoices.find(x=>String(x.id)===String(id));if(!i)return toast('Invoice could not be found.');
    const doc=pdf();pdfHeader(doc,'INVOICE',i.invoice_number);
    let y=124;
    doc.setFontSize(9);doc.setTextColor(148,163,184);doc.text('BILL TO',42,y);doc.text('DUE DATE',390,y);
    y+=18;doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(10,31,68);doc.text(String(i.client_email||user.email||''),42,y);doc.text(date(i.due_date),390,y);
    y+=34;doc.setDrawColor(226,232,240);doc.line(42,y,570,y);y+=24;
    doc.setFontSize(9);doc.setTextColor(100,116,139);doc.text('DESCRIPTION',42,y);doc.text('QTY',430,y,{align:'right'});doc.text('AMOUNT',570,y,{align:'right'});y+=12;doc.line(42,y,570,y);y+=21;
    const ls=(i.invoice_line_items||[]).sort((a,b)=>Number(a.line_number)-Number(b.line_number));
    ls.forEach(l=>{
      doc.setFontSize(10);doc.setTextColor(10,31,68);doc.text(String(l.description||''),42,y,{maxWidth:320});
      doc.text(String(l.quantity||1),430,y,{align:'right'});doc.setFont('helvetica','bold');doc.text(money(l.line_total),570,y,{align:'right'});doc.setFont('helvetica','normal');
      y+=25;doc.setDrawColor(238,242,247);doc.line(42,y-8,570,y-8);
      if(y>650){doc.addPage();y=60;}
    });
    y+=10;pdfLine(doc,'Subtotal',money(i.subtotal_amount),y);y+=20;
    if(Number(i.discount_amount)>0){pdfLine(doc,'Discount','− '+money(i.discount_amount),y);y+=20;}
    if(Number(i.tax_amount)>0){pdfLine(doc,'Tax',money(i.tax_amount),y);y+=20;}
    if(Number(i.shipping_amount)>0){pdfLine(doc,'Shipping',money(i.shipping_amount),y);y+=20;}
    doc.setDrawColor(10,31,68);doc.line(390,y-4,570,y-4);y+=18;pdfLine(doc,'Total',money(i.total_amount),y,true);
    if(i.customer_notes){y+=38;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Invoice notes',42,y);y+=16;doc.setFont('helvetica','normal');doc.setTextColor(71,85,105);doc.text(String(i.customer_notes),42,y,{maxWidth:528});}
    doc.setFontSize(8);doc.setTextColor(148,163,184);doc.text('Generated from the secure filings4u Client Portal.',306,752,{align:'center'});
    doc.save(pdfSaveName(i.invoice_number,'filings4u-invoice'));
  }catch(e){toast(e.message||'Unable to download invoice.');}
}
function downloadReceipt(key){
  try{
    const r=receipts.find(x=>x.receiptKey===key);if(!r)return toast('Receipt could not be found.');
    const invoice=r.kind==='invoice';
    const number=invoice?(r.invoice_number||'Invoice'):(r.tracking_number||'Website order');
    const doc=pdf();pdfHeader(doc,'PAYMENT RECEIPT',number);
    let y=124;
    doc.setFillColor(236,253,245);doc.roundedRect(42,y-13,145,28,10,10,'F');doc.setTextColor(4,120,87);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('PAYMENT RECEIVED',54,y+5);
    y+=46;
    pdfLine(doc,'Paid',datetime(r.paid_at||r.created_at),y);y+=22;
    pdfLine(doc,'Receipt type',invoice?'Invoice payment':'Website order',y);y+=32;
    doc.setDrawColor(226,232,240);doc.line(42,y,570,y);y+=24;
    if(invoice){
      const ls=(r.invoice_line_items||[]).sort((a,b)=>Number(a.line_number)-Number(b.line_number));
      ls.forEach(l=>{doc.setFontSize(10);doc.setTextColor(10,31,68);doc.text(`${l.description} × ${l.quantity}`,42,y,{maxWidth:360});doc.setFont('helvetica','bold');doc.text(money(l.line_total),570,y,{align:'right'});doc.setFont('helvetica','normal');y+=26;});
    }else{
      const desc=r.selected_service||r.service_key||'filings4u service';doc.setFontSize(10);doc.setTextColor(10,31,68);doc.text(String(desc),42,y);doc.setFont('helvetica','bold');doc.text(money(r.total_paid_amount||r.total_amount),570,y,{align:'right'});doc.setFont('helvetica','normal');y+=28;
      if(r.service_fee!=null){pdfLine(doc,'Service fee',money(r.service_fee),y);y+=20;}
      if(r.government_fee!=null){pdfLine(doc,'Government fee',money(r.government_fee),y);y+=20;}
      if(r.addons_total!=null){pdfLine(doc,'Add-ons',money(r.addons_total),y);y+=20;}
    }
    y+=10;doc.setDrawColor(10,31,68);doc.line(390,y,570,y);y+=22;pdfLine(doc,'Total paid',money(invoice?r.total_amount:(r.total_paid_amount||r.total_amount)),y,true);
    doc.setFontSize(8);doc.setTextColor(148,163,184);doc.text('Thank you for choosing filings4u.',306,735,{align:'center'});doc.text('This receipt was generated from the secure filings4u Client Portal.',306,750,{align:'center'});
    doc.save(pdfSaveName(number+'-receipt','filings4u-receipt'));
  }catch(e){toast(e.message||'Unable to download receipt.');}
}

function toast(x){const t=$('toast');if(!t)return;t.textContent=x;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,3000)}
$('receiptSearch')?.addEventListener('input',renderReceipts);
boot();