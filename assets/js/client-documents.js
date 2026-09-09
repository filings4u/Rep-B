const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';

let db,user,profile,documents=[],filtered=[];
let toastTimer;

async function boot(){
  const auth=await window.filings4uRequireClient();
  if(!auth)return;

  ({db,user,profile}=auth);
  hydrateProfile();

  const email=(profile.email_address||user.email||'').trim().toLowerCase();

  const results=await Promise.all([
    db.from('client_vault')
      .select('id,uploaded_by,file_name,storage_bucket_path,file_size_bytes,created_at,bucket_id,storage_path,content_type,asset_vault_category,target_client_email')
      .or(`uploaded_by.eq.${user.id},target_client_email.eq.${email}`)
      .order('created_at',{ascending:false}),

    db.from('user_documents')
      .select('id,file_name,file_url,file_size,created_at,user_id')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false}),

    db.from('documents')
      .select('id,file_name,file_size,storage_path,created_at,user_id')
      .eq('user_id',user.id)
      .order('created_at',{ascending:false}),

    db.from('client_entities')
      .select('id,entity_name,registry_document_url,created_at')
      .eq('user_id',user.id)
      .not('registry_document_url','is',null)
      .order('created_at',{ascending:false}),

    db.from('user_filings')
      .select('id,company_name,schedule_1_url,created_at')
      .eq('customer_email',email)
      .not('schedule_1_url','is',null)
      .order('created_at',{ascending:false})
  ]);

  const [vault,userDocs,docs,entities,filings]=results;
  const failures=results.filter(r=>r.error);
  if(failures.length){
    console.warn('Some document sources could not be loaded.',failures.map(r=>r.error.message));
    toast('Some document sources could not be loaded.');
  }

  documents=[
    ...(vault.data||[]).map(normalizeVault),
    ...(userDocs.data||[]).map(d=>({
      id:'ud-'+d.id,
      name:d.file_name||'Document',
      source:'Uploaded document',
      kind:'Uploaded',
      date:d.created_at,
      size:d.file_size,
      url:safeHttpUrl(d.file_url)
    })),
    ...(docs.data||[]).map(d=>({
      id:'d-'+d.id,
      name:d.file_name||'Document',
      source:'Document record',
      kind:'Document',
      date:d.created_at,
      size:d.file_size,
      storagePath:d.storage_path||null,
      bucket:'client_documents_vault'
    })),
    ...(entities.data||[]).map(d=>({
      id:'e-'+d.id,
      name:(d.entity_name||'Entity')+' registry document',
      source:'Business entity',
      kind:'Registry',
      date:d.created_at,
      url:safeHttpUrl(d.registry_document_url)
    })),
    ...(filings.data||[]).map(d=>({
      id:'f-'+d.id,
      name:(d.company_name||'Filing')+' Schedule 1',
      source:'Filing record',
      kind:'Filing',
      date:d.created_at,
      url:safeHttpUrl(d.schedule_1_url)
    }))
  ];

  const seen=new Set();
  documents=documents.filter(d=>{
    const key=String(d.url||d.storagePath||`${d.name}|${d.date}`).toLowerCase();
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });

  $('gate').hidden=true;
  $('app').hidden=false;
  buildTypes();
  renderStats();
  applyFilters();
}

function normalizeVault(v){
  const path=v.storage_path||v.storage_bucket_path||null;
  const name=v.file_name||(path?path.split('/').pop():'Vault document');
  return {
    id:'v-'+v.id,
    name,
    source:'Secure vault',
    kind:v.asset_vault_category||mimeKind(v.content_type)||'Vault',
    date:v.created_at,
    size:v.file_size_bytes||null,
    storagePath:path,
    bucket:v.bucket_id||'client_documents_vault'
  };
}

function safeHttpUrl(value){
  if(!value)return null;
  try{
    const u=new URL(String(value));
    return ['http:','https:'].includes(u.protocol)?u.href:null;
  }catch{
    return null;
  }
}

function hydrateProfile(){
  const name=[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'My Account';
  const company=profile.company_name||'filings4u client';
  const initial=(profile.first_name||profile.company_name||profile.email_address||'C').charAt(0).toUpperCase();

  $('clientName').textContent=name;
  $('clientAvatar').textContent=initial;
  if($('clientMenuName'))$('clientMenuName').textContent=name;
  if($('clientMenuCompany'))$('clientMenuCompany').textContent=company;
  if($('clientMenuAvatar'))$('clientMenuAvatar').textContent=initial;
}

function renderStats(){
  $('totalDocuments').textContent=documents.length;
  $('vaultDocuments').textContent=documents.filter(d=>d.source==='Secure vault').length;
  $('filingDocuments').textContent=documents.filter(d=>{
    const source=String(d.source||'').toLowerCase();
    const kind=String(d.kind||'').toLowerCase();
    return source==='business entity' || source==='filing record' || kind==='filing' || kind.includes('filing');
  }).length;

  const cutoff=Date.now()-30*86400000;
  $('recentDocuments').textContent=documents.filter(d=>d.date&&new Date(d.date).getTime()>=cutoff).length;
}

function buildTypes(){
  const types=[...new Set(documents.map(d=>d.kind).filter(Boolean))].sort();
  $('typeFilter').innerHTML='<option value="">All document types</option>'+
    types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
}

function applyFilters(){
  const q=$('search').value.trim().toLowerCase();
  const type=$('typeFilter').value;

  filtered=documents.filter(d=>{
    const hay=[d.name,d.source,d.kind].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!type||d.kind===type);
  });

  render();
}

function render(){
  $('documentList').innerHTML=filtered.length?filtered.map(d=>`
    <div class="document-row">
      <div class="document-icon">${esc(icon(d.name))}</div>
      <div class="document-name"><b>${esc(d.name)}</b><small>${esc(d.source)}</small></div>
      <div class="document-meta"><span>${esc(d.kind||'Document')}</span><small>${esc(formatSize(d.size))}</small></div>
      <div class="document-meta"><span>${dt(d.date)}</span><small>Added</small></div>
      <button class="document-action" type="button" data-id="${esc(d.id)}" ${(!d.url&&!d.storagePath)?'disabled':''}>Open →</button>
    </div>`).join('')
    :'<div class="empty-state">No documents match your current filters.</div>';

  document.querySelectorAll('.document-action[data-id]').forEach(button=>{
    button.onclick=()=>openDocument(button.dataset.id,button);
  });
}

async function openDocument(id,button){
  const d=documents.find(x=>x.id===id);
  if(!d)return;

  button.disabled=true;
  const old=button.textContent;
  button.textContent='Opening…';

  try{
    let url=d.url;

    if(!url&&d.storagePath){
      const {data,error}=await db.storage
        .from(d.bucket||'client_documents_vault')
        .createSignedUrl(d.storagePath,120);

      if(error)throw error;
      url=safeHttpUrl(data?.signedUrl);
    }

    if(!url)throw new Error('This document does not have an available file.');

    const opened=window.open(url,'_blank','noopener,noreferrer');
    if(!opened)toast('Your browser blocked the new tab. Please allow pop-ups for this site.');
  }catch(error){
    toast(error.message||'Unable to open document.');
  }finally{
    button.disabled=false;
    button.textContent=old;
  }
}

function mimeKind(value){
  const v=String(value||'').toLowerCase();
  if(v==='application/pdf')return 'PDF';
  if(v.startsWith('image/'))return 'Image';
  return '';
}

function icon(name){
  const n=(name||'').toLowerCase();
  if(n.endsWith('.pdf'))return 'PDF';
  if(/\.(png|jpg|jpeg|webp|gif)$/.test(n))return 'IMG';
  return 'FILE';
}

function formatSize(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return 'Size unavailable';
  if(n<1024)return `${n} B`;
  if(n<1048576)return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1048576).toFixed(1)} MB`;
}

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,2800);
}

$('search').addEventListener('input',applyFilters);
$('typeFilter').addEventListener('change',applyFilters);

boot();
