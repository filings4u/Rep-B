const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
let db,user,profile,documents=[],filtered=[];

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;
  ({db,user,profile}=auth);
  hydrateProfile();

  const [vault,userDocs,docs,entities,filings]=await Promise.all([
    db.from('client_vault').select('*').or(`uploaded_by.eq.${user.id},target_client_email.eq.${profile.email_address||''}`).order('created_at',{ascending:false}),
    db.from('user_documents').select('id,file_name,file_url,file_size,created_at,user_id').eq('user_id',user.id).order('created_at',{ascending:false}),
    db.from('documents').select('id,file_name,file_size,storage_path,created_at,user_id').eq('user_id',user.id).order('created_at',{ascending:false}),
    db.from('client_entities').select('id,entity_name,registry_document_url,created_at').eq('user_id',user.id).not('registry_document_url','is',null),
    db.from('user_filings').select('id,company_name,schedule_1_url,created_at').eq('customer_email',profile.email_address||'').not('schedule_1_url','is',null)
  ]);

  [vault,userDocs,docs,entities,filings].forEach(r=>{if(r.error)console.warn(r.error.message)});
  documents=[
    ...(vault.data||[]).map(normalizeVault),
    ...(userDocs.data||[]).map(d=>({id:'ud-'+d.id,name:d.file_name||'Document',source:'Uploaded document',kind:'Uploaded',date:d.created_at,size:d.file_size,url:d.file_url||null})),
    ...(docs.data||[]).map(d=>({id:'d-'+d.id,name:d.file_name||'Document',source:'Document record',kind:'Document',date:d.created_at,size:d.file_size,storagePath:d.storage_path||null,bucket:'client_documents_vault'})),
    ...(entities.data||[]).map(d=>({id:'e-'+d.id,name:(d.entity_name||'Entity')+' registry document',source:'Business entity',kind:'Registry',date:d.created_at,url:d.registry_document_url})),
    ...(filings.data||[]).map(d=>({id:'f-'+d.id,name:(d.company_name||'Filing')+' Schedule 1',source:'Filing record',kind:'Filing',date:d.created_at,url:d.schedule_1_url}))
  ];

  // De-duplicate records that resolve to the same name/url/path.
  const seen=new Set();
  documents=documents.filter(d=>{
    const key=(d.url||d.storagePath||d.name+'|'+d.date).toLowerCase();
    if(seen.has(key))return false; seen.add(key); return true;
  });

  $('gate').hidden=true;$('app').hidden=false;
  buildTypes();renderStats();applyFilters();
}

function normalizeVault(v){
  const path=v.storage_path||v.file_path||v.path||v.document_path||null;
  const name=v.file_name||v.document_name||v.title||(path?path.split('/').pop():'Vault document');
  return {id:'v-'+v.id,name,source:'Secure vault',kind:v.document_type||v.category||'Vault',date:v.created_at||v.uploaded_at||v.updated_at,size:v.file_size||v.size||null,url:v.file_url||v.document_url||null,storagePath:path,bucket:v.bucket_name||'client_documents_vault'};
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

function renderStats(){
  $('totalDocuments').textContent=documents.length;
  $('vaultDocuments').textContent=documents.filter(d=>d.source==='Secure vault').length;
  $('filingDocuments').textContent=documents.filter(d=>['Business entity','Filing record'].includes(d.source)).length;
  const cutoff=Date.now()-30*86400000;
  $('recentDocuments').textContent=documents.filter(d=>d.date&&new Date(d.date).getTime()>=cutoff).length;
}

function buildTypes(){
  const types=[...new Set(documents.map(d=>d.kind).filter(Boolean))].sort();
  $('typeFilter').innerHTML='<option value="">All document types</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
}

function applyFilters(){
  const q=$('search').value.trim().toLowerCase(),type=$('typeFilter').value;
  filtered=documents.filter(d=>(!q||[d.name,d.source,d.kind].join(' ').toLowerCase().includes(q))&&(!type||d.kind===type));
  render();
}

function render(){
  $('documentList').innerHTML=filtered.length?filtered.map(d=>`
    <div class="document-row">
      <div class="document-icon">${esc(icon(d.name))}</div>
      <div class="document-name"><b>${esc(d.name)}</b><small>${esc(d.source)}</small></div>
      <div class="document-meta"><span>${esc(d.kind||'Document')}</span><small>${esc(formatSize(d.size))}</small></div>
      <div class="document-meta"><span>${dt(d.date)}</span><small>Added</small></div>
      <button class="document-action" data-id="${esc(d.id)}" ${(!d.url&&!d.storagePath)?'disabled':''}>Open →</button>
    </div>`).join(''):'<div class="empty-state">No documents match your current filters.</div>';
  document.querySelectorAll('.document-action[data-id]').forEach(b=>b.onclick=()=>openDocument(b.dataset.id,b));
}

async function openDocument(id,button){
  const d=documents.find(x=>x.id===id); if(!d)return;
  button.disabled=true; const old=button.textContent; button.textContent='Opening…';
  try{
    let url=d.url;
    if(!url&&d.storagePath){
      const {data,error}=await db.storage.from(d.bucket||'client_documents_vault').createSignedUrl(d.storagePath,120);
      if(error)throw error;
      url=data.signedUrl;
    }
    if(!url)throw new Error('This document does not have an available file.');
    window.open(url,'_blank','noopener');
  }catch(e){toast(e.message||'Unable to open document.')}
  finally{button.disabled=false;button.textContent=old;}
}

function icon(name){
  const n=(name||'').toLowerCase();
  if(n.endsWith('.pdf'))return 'PDF';
  if(/\.(png|jpg|jpeg|webp|gif)$/.test(n))return 'IMG';
  return 'FILE';
}
function formatSize(v){
  const n=Number(v); if(!Number.isFinite(n)||n<=0)return 'Size unavailable';
  if(n<1024)return n+' B'; if(n<1048576)return (n/1024).toFixed(1)+' KB'; return (n/1048576).toFixed(1)+' MB';
}
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2800)}
$('search').addEventListener('input',applyFilters);
$('typeFilter').addEventListener('change',applyFilters);
boot();