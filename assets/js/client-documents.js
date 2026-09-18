const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
let db,user,profile,documents=[],filtered=[],toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;
  ({db,user,profile}=auth);
  hydrateProfile();
  const {data,error}=await db.from('customer_documents')
    .select('id,title,category,description,original_file_name,bucket_id,storage_path,mime_type,file_size_bytes,created_at')
    .eq('client_profile_id',user.id)
    .eq('is_visible',true)
    .order('created_at',{ascending:false});
  if(error){$('gate').textContent='Unable to load your documents.';return toast(error.message||'Unable to load documents.');}
  documents=data||[];
  $('gate').hidden=true;
  $('app').hidden=false;
  buildCategories();
  renderStats();
  applyFilters();
}

function hydrateProfile(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();
  $('clientName').textContent=name;$('clientAvatar').textContent=initial;
  if($('clientMenuName'))$('clientMenuName').textContent=name;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
}

function buildCategories(){
  const categories=[...new Set(documents.map(d=>d.category).filter(Boolean))].sort();
  $('typeFilter').innerHTML='<option value="">All categories</option>'+categories.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}
function renderStats(){
  const cutoff=Date.now()-30*86400000;
  $('totalDocuments').textContent=documents.length;
  $('recentDocuments').textContent=documents.filter(d=>new Date(d.created_at).getTime()>=cutoff).length;
  $('categoryCount').textContent=new Set(documents.map(d=>d.category).filter(Boolean)).size;
}
function applyFilters(){
  const q=$('search').value.trim().toLowerCase();
  const type=$('typeFilter').value;
  filtered=documents.filter(d=>{
    const hay=[d.title,d.category,d.description,d.original_file_name].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!type||d.category===type);
  });
  render();
}
function render(){
  $('documentList').innerHTML=filtered.length?filtered.map(d=>`<article class="document-row">
    <div class="document-primary"><span class="document-icon">PDF</span><div class="document-name"><b>${esc(d.title)}</b><small>${esc(d.description||d.original_file_name||'Secure PDF document')}</small></div></div>
    <div class="document-meta"><span>${esc(d.category||'General')}</span><small>Category</small></div>
    <div class="document-meta"><span>${esc(dt(d.created_at))}</span><small>Date & time</small></div>
    <div class="document-meta"><span>${esc(formatSize(d.file_size_bytes))}</span><small>PDF file</small></div>
    <div class="document-actions"><button class="view-action" type="button" data-view="${esc(d.id)}">View</button><button class="download-action" type="button" data-download="${esc(d.id)}">Download PDF</button></div>
  </article>`).join(''):'<div class="empty-state"><div><strong>No documents yet</strong><p>Documents uploaded by the filings4u team will appear here automatically.</p></div></div>';
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openDocument(b.dataset.view,false,b));
  document.querySelectorAll('[data-download]').forEach(b=>b.onclick=()=>openDocument(b.dataset.download,true,b));
}

async function openDocument(id,download,button){
  const d=documents.find(x=>x.id===id);if(!d)return;
  const old=button.textContent;button.disabled=true;button.textContent=download?'Preparing…':'Opening…';
  try{
    const options=download?{download:pdfFilename(d.title)}:undefined;
    const {data,error}=await db.storage.from(d.bucket_id||'customer-documents').createSignedUrl(d.storage_path,120,options);
    if(error)throw error;
    if(!data?.signedUrl)throw new Error('Unable to create a secure document link.');
    if(download){
      const a=document.createElement('a');a.href=data.signedUrl;a.download=pdfFilename(d.title);a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    }else{
      const opened=window.open(data.signedUrl,'_blank','noopener,noreferrer');
      if(!opened)toast('Your browser blocked the PDF viewer. Please allow pop-ups for filings4u.');
    }
  }catch(error){toast(error.message||'Unable to open document.');}
  finally{button.disabled=false;button.textContent=old;}
}

function pdfFilename(v){return `${String(v||'document').replace(/[\\/:*?"<>|]+/g,'-').trim()||'document'}.pdf`;}
function formatSize(n){n=Number(n||0);if(!Number.isFinite(n)||n<=0)return '—';if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`;}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
$('search').addEventListener('input',applyFilters);$('typeFilter').addEventListener('change',applyFilters);
boot();
