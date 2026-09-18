(function(){
'use strict';
const $=id=>document.getElementById(id);
const state={rows:[],filtered:[],detail:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const labelize=k=>String(k||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});};
const displayValue=v=>{if(v===null||v===undefined||v==='')return '—';if(Array.isArray(v))return v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(', ');if(typeof v==='object')return JSON.stringify(v,null,2);return String(v);};
function toast(msg){const e=$('formsToast');if(!e)return;e.textContent=msg;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3500);}
function typeLabel(row){return row.form_title||labelize(row.form_key)||'Client Form';}
function buildFilters(){
  const types=[...new Map(state.rows.map(r=>[r.form_key,typeLabel(r)])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  $('formsTypeFilter').innerHTML='<option value="">All form types</option>'+types.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const clients=[...new Map(state.rows.filter(r=>r.client_email).map(r=>[r.client_email,r.client_name||r.client_email])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  $('formsClientFilter').innerHTML='<option value="">All clients</option>'+clients.map(([v,l])=>`<option value="${esc(v)}">${esc(l)} · ${esc(v)}</option>`).join('');
}
function renderStats(){const now=Date.now();$('formsTotal').textContent=state.rows.length;$('formsRecent').textContent=state.rows.filter(r=>now-new Date(r.completed_at).getTime()<=30*864e5).length;$('formsClients').textContent=new Set(state.rows.map(r=>r.client_email).filter(Boolean)).size;$('formsTypes').textContent=new Set(state.rows.map(r=>r.form_key).filter(Boolean)).size;}
function applyFilters(){
  const q=$('formsSearch').value.trim().toLowerCase(),t=$('formsTypeFilter').value,c=$('formsClientFilter').value,days=Number($('formsDateFilter').value||0),cut=days?Date.now()-days*864e5:0;
  state.filtered=state.rows.filter(r=>{const hay=[r.form_title,r.form_key,r.client_name,r.client_email,r.business_name,r.tracking_number,r.order_reference].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!t||r.form_key===t)&&(!c||r.client_email===c)&&(!cut||new Date(r.completed_at).getTime()>=cut);});
  renderRows();
}
function renderRows(){const body=$('formsRows');$('formsResultCount').textContent=`${state.filtered.length} submission${state.filtered.length===1?'':'s'}`;if(!state.filtered.length){body.innerHTML='<tr><td colspan="7"><div class="forms-empty">No completed forms match these filters.</div></td></tr>';return;}body.innerHTML=state.filtered.map(r=>`<tr>
<td><strong>${esc(typeLabel(r))}</strong><small>${esc(r.form_version?'Version '+r.form_version:r.source_type.replaceAll('_',' '))} · ${r.answer_count||0} fields</small></td>
<td><strong>${esc(r.client_name||'Client')}</strong><small>${esc(r.client_email||'—')}</small></td>
<td><strong>${esc(r.business_name||'—')}</strong></td>
<td><strong>${esc(r.tracking_number||r.order_reference||'—')}</strong><small>${r.order_reference&&r.tracking_number?esc('Order '+r.order_reference):''}</small></td>
<td><strong>${esc(fmtDate(r.completed_at))}</strong></td>
<td><span class="form-status">${esc(r.status||'completed')}</span></td>
<td><div class="form-actions"><button type="button" data-view="${esc(r.source_type)}:${esc(r.submission_id)}">View</button><button type="button" data-pdf="${esc(r.source_type)}:${esc(r.submission_id)}">Download PDF</button></div></td>
</tr>`).join('');}
async function detail(source,id){const db=window.filings4uSupabase;if(!db)throw Error('Supabase client unavailable');const {data,error}=await db.rpc('admin_client_completed_form_detail',{p_source_type:source,p_submission_id:id});if(error)throw error;return data;}
function answerEntries(obj,prefix=''){const out=[];if(!obj||typeof obj!=='object')return out;for(const [k,v] of Object.entries(obj)){const key=prefix?`${prefix} · ${labelize(k)}`:labelize(k);if(v&&typeof v==='object'&&!Array.isArray(v)){const nested=answerEntries(v,key);if(nested.length)out.push(...nested);else out.push([key,v]);}else out.push([key,v]);}return out;}
function openModal(d){state.detail=d;$('formViewerTitle').textContent=d.form_title||labelize(d.form_key);$('formViewerMeta').textContent=`Completed ${fmtDate(d.completed_at)}`;const meta=[d.client_name,d.client_email,d.business_name,d.tracking_number,d.order_reference?`Order ${d.order_reference}`:''].filter(Boolean);$('formRecordMeta').innerHTML=meta.map(x=>`<span>${esc(x)}</span>`).join('');const entries=answerEntries(d.answers);$('formAnswerList').innerHTML=entries.length?entries.map(([k,v])=>`<dl class="forms-answer-row"><dt>${esc(k)}</dt><dd>${esc(displayValue(v))}</dd></dl>`).join(''):'<div class="forms-empty">No answer fields were stored for this submission.</div>';$('formsModal').hidden=false;document.body.style.overflow='hidden';}
function closeModal(){$('formsModal').hidden=true;document.body.style.overflow='';state.detail=null;}
function safeName(s){return String(s||'form').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase();}
function pdfValue(v){return displayValue(v).replace(/\t/g,'    ');}
function downloadPdf(d){const lib=window.jspdf?.jsPDF;if(!lib){toast('PDF library did not load.');return;}const doc=new lib({unit:'pt',format:'letter'});const left=50,right=562,max=right-left;let y=52;const line=(text,size=10,bold=false,color=[19,33,58])=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);const lines=doc.splitTextToSize(String(text||''),max);if(y+lines.length*(size+4)>735){doc.addPage();y=52;}doc.text(lines,left,y);y+=lines.length*(size+4)+3;};doc.setFillColor(10,31,68);doc.rect(0,0,612,78,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('filings4u',50,48);y=112;line(d.form_title||labelize(d.form_key),20,true,[10,31,68]);line(`Completed: ${fmtDate(d.completed_at)}`,9,false,[100,116,139]);line(`Client: ${d.client_name||'—'}  |  ${d.client_email||'—'}`,9,false,[100,116,139]);if(d.business_name)line(`Business: ${d.business_name}`,9,false,[100,116,139]);if(d.tracking_number)line(`Tracking: ${d.tracking_number}`,9,false,[100,116,139]);y+=8;doc.setDrawColor(229,234,240);doc.line(left,y,right,y);y+=22;for(const [k,v] of answerEntries(d.answers)){line(k,9,true,[71,85,105]);line(pdfValue(v),10,false,[19,33,58]);y+=7;}doc.setFontSize(8);doc.setTextColor(148,163,184);doc.text('Generated from the secure filings4u administration portal.',left,760);const file=`${safeName(d.form_title)}-${safeName(d.client_name||d.client_email)}-${new Date(d.completed_at).toISOString().slice(0,10)}.pdf`;doc.save(file);}
async function load(){const gate=$('formsGate'),app=$('formsApp');try{const db=window.filings4uSupabase;if(!db)throw Error('Supabase client unavailable');const {data,error}=await db.rpc('admin_client_completed_forms',{p_search:null,p_limit:1000});if(error)throw error;state.rows=data||[];state.filtered=state.rows.slice();buildFilters();renderStats();renderRows();gate.hidden=true;app.hidden=false;}catch(e){console.error(e);gate.textContent=`Could not load completed forms: ${e.message||e}`;}}
async function handleAction(token,pdfOnly){const [source,id]=token.split(':');try{toast('Loading submission…');const d=await detail(source,id);if(pdfOnly)downloadPdf(d);else openModal(d);}catch(e){console.error(e);toast(e.message||'Could not open submission.');}}
document.addEventListener('click',e=>{const view=e.target.closest('[data-view]'),pdf=e.target.closest('[data-pdf]');if(view)handleAction(view.dataset.view,false);if(pdf)handleAction(pdf.dataset.pdf,true);if(e.target.closest('[data-close-form]'))closeModal();});
['formsSearch','formsTypeFilter','formsClientFilter','formsDateFilter'].forEach(id=>$(id)?.addEventListener(id==='formsSearch'?'input':'change',applyFilters));$('formsClear')?.addEventListener('click',()=>{$('formsSearch').value='';$('formsTypeFilter').value='';$('formsClientFilter').value='';$('formsDateFilter').value='';applyFilters();});$('formsRefresh')?.addEventListener('click',load);$('downloadFormPdf')?.addEventListener('click',()=>state.detail&&downloadPdf(state.detail));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('formsModal').hidden)closeModal();});
load();
})();
