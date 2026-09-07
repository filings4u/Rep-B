const db=window.filings4uSupabase;

let clientVault=[],adminVault=[],documents=[],userDocs=[],entities=[],all=[],tab='all';

const $=x=>document.getElementById(x);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const dt=x=>x?new Date(x).toLocaleString():'—';

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
  const rs=await Promise.all([
    db.from('client_vault').select('*').order('created_at',{ascending:false}),
    db.from('admin_vault').select('*').order('created_at',{ascending:false}),
    db.from('documents').select('*').order('created_at',{ascending:false}),
    db.from('user_documents').select('*').order('created_at',{ascending:false}),
    db.from('client_entities')
      .select('id,entity_name,client_email,user_id,registry_document_url,created_at')
      .order('created_at',{ascending:false})
  ]);

  const err=rs.find(x=>x.error);
  if(err)return toast(err.error.message);

  [clientVault,adminVault,documents,userDocs,entities]=rs.map(x=>x.data||[]);
  normalize();
  buildFilters();
  render();
}

function normalize(){
  all=[
    ...clientVault.map(x=>({
      id:x.id,
      name:x.file_name||'Client vault document',
      client:x.target_client_email||x.email_address||x.user_id||'—',
      category:x.asset_vault_category||'client vault',
      source:'client',
      size:normalizeSize(x.file_size_bytes??x.file_size),
      created:x.created_at,
      bucket:x.bucket_id||'client_documents_vault',
      path:cleanStoragePath(x.storage_path||x.storage_bucket_path,x.bucket_id||'client_documents_vault'),
      url:null,
      entity:null
    })),
    ...adminVault.map(x=>({
      id:x.id,
      name:x.file_name||'Admin vault document',
      client:x.target_client_email||x.email_address||x.user_id||'—',
      category:x.asset_vault_category||'admin vault',
      source:'admin',
      size:normalizeSize(x.file_size_bytes??x.file_size),
      created:x.created_at,
      bucket:x.bucket_id||'client_documents_vault',
      path:cleanStoragePath(x.storage_path||x.storage_bucket_path,x.bucket_id||'client_documents_vault'),
      url:null,
      entity:null
    })),
    ...documents.map(x=>({
      id:x.id,
      name:x.file_name||'Document',
      client:x.email_address||x.user_id||'—',
      category:x.category||'general document',
      source:'general',
      size:normalizeSize(x.file_size),
      created:x.created_at,
      bucket:extractBucket(x.storage_path,x.bucket_id),
      path:cleanStoragePath(x.storage_path,extractBucket(x.storage_path,x.bucket_id)),
      url:x.file_url||null,
      entity:null
    })),
    ...userDocs.map(x=>({
      id:x.id,
      name:x.file_name||'User document',
      client:x.email_address||x.user_id||'—',
      category:x.category||'user document',
      source:'general',
      size:normalizeSize(x.file_size),
      created:x.created_at,
      bucket:extractBucket(x.storage_path,x.bucket_id),
      path:cleanStoragePath(x.storage_path,extractBucket(x.storage_path,x.bucket_id)),
      url:x.file_url||null,
      entity:null
    })),
    ...entities.filter(x=>x.registry_document_url).map(x=>({
      id:x.id,
      name:'Registry document',
      client:x.client_email||x.user_id||'—',
      category:'registry',
      source:'registry',
      size:'—',
      created:x.created_at,
      bucket:null,
      path:null,
      url:x.registry_document_url,
      entity:x.entity_name
    }))
  ];
}

function extractBucket(path,explicit){
  if(explicit)return explicit;
  if(!path)return null;
  const clean=String(path).replace(/^\/+/,'');
  const match=clean.match(/^([^/]+)\//);
  return match?match[1]:null;
}

function cleanStoragePath(path,bucket){
  if(!path)return null;
  let clean=String(path).replace(/^\/+/,'');
  if(bucket&&clean.startsWith(bucket+'/'))clean=clean.slice(bucket.length+1);
  return clean||null;
}

function normalizeSize(value){
  if(value===null||value===undefined||value==='')return '—';
  if(typeof value==='string'&&!/^\d+(\.\d+)?$/.test(value.trim()))return value;
  return fmtBytes(Number(value));
}

function fmtBytes(n){
  n=Number(n||0);
  if(n<1024)return n+' B';
  if(n<1048576)return (n/1024).toFixed(1)+' KB';
  if(n<1073741824)return (n/1048576).toFixed(1)+' MB';
  return (n/1073741824).toFixed(1)+' GB';
}

function buildFilters(){
  const cats=[...new Set(all.map(x=>x.category).filter(Boolean))].sort();
  const srcs=[...new Set(all.map(x=>x.source).filter(Boolean))].sort();

  $('category').innerHTML='<option value="">All categories</option>'+
    cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');

  $('source').innerHTML='<option value="">All sources</option>'+
    srcs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
}

function filtered(){
  const q=$('q').value.trim().toLowerCase();
  const cat=$('category').value;
  const src=$('source').value;

  return all.filter(d=>{
    const tabOk=tab==='all'||d.source===tab;
    const hay=[d.name,d.client,d.entity,d.category,d.source].join(' ').toLowerCase();
    return tabOk&&hay.includes(q)&&(!cat||d.category===cat)&&(!src||d.source===src);
  });
}

function render(){
  const list=filtered();

  $('stats').innerHTML=[
    ['All documents',all.length],
    ['Client vault',clientVault.length],
    ['Admin vault',adminVault.length],
    ['Registry documents',entities.filter(x=>x.registry_document_url).length]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  $('rows').innerHTML=list.length?list.map(d=>`<tr>
    <td><b>${esc(d.name)}</b>${d.entity?`<small>${esc(d.entity)}</small>`:''}</td>
    <td>${esc(d.client)}</td>
    <td>${esc(d.category)}</td>
    <td><span class="source ${esc(d.source)}">${esc(d.source)}</span></td>
    <td>${esc(d.size)}</td>
    <td>${dt(d.created)}</td>
    <td><button class="openDoc" data-id="${esc(d.source+'|'+d.id)}">Open</button></td>
  </tr>`).join('')
  :'<tr><td colspan="7" class="empty">No documents match these filters.</td></tr>';

  document.querySelectorAll('.openDoc').forEach(b=>{
    b.onclick=()=>openDoc(b.dataset.id);
  });
}

async function openDoc(key){
  const [source,id]=key.split('|');
  const d=all.find(x=>x.source===source&&String(x.id)===id);
  if(!d)return;

  if(d.url){
    try{
      const url=new URL(d.url,location.href);
      window.open(url.href,'_blank','noopener,noreferrer');
    }catch{
      return toast('This document URL is invalid.');
    }
    return;
  }

  if(!d.bucket||!d.path){
    return toast('This record does not contain a usable storage location.');
  }

  const {data,error}=await db.storage.from(d.bucket).createSignedUrl(d.path,300);
  if(error)return toast(error.message);
  if(!data?.signedUrl)return toast('Unable to create a secure document link.');

  window.open(data.signedUrl,'_blank','noopener,noreferrer');
}

function toast(x){
  $('toast').textContent=x;
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2800);
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  tab=b.dataset.tab;
  $('source').value='';
  render();
});

['q','category','source'].forEach(x=>{
  $(x).addEventListener(x==='q'?'input':'change',render);
});

$('clear').onclick=()=>{
  $('q').value='';
  $('category').value='';
  $('source').value='';
  render();
};

$('refresh').onclick=load;
document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);

boot();
