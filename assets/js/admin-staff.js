const db=window.filings4uSupabase;
let staff=[],view=[],active=null,currentId=null;

const $=x=>document.getElementById(x);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const dt=x=>x?new Date(x).toLocaleDateString():'—';

async function boot(){
  const auth=await window.filings4uRequireAdmin();
  if(!auth)return;

  currentId=auth.user.id;
  $('gate').hidden=true;
  $('app').hidden=false;
  await load();
}

function deny(x){
  $('gate').textContent=x;
  $('gate').style.color='#991b1b';
}

async function load(){
  const {data,error}=await db.from('admin_profiles')
    .select('*')
    .order('first_name',{ascending:true});

  if(error)return deny(error.message);

  staff=data||[];
  filter();
}

function filter(){
  const q=$('q').value.trim().toLowerCase();
  const s=$('status').value;

  view=staff.filter(x=>{
    const hay=[
      x.first_name,x.last_name,x.email_address,x.role,x.city,x.state
    ].join(' ').toLowerCase();

    return hay.includes(q)&&
      (!s||(s==='active'?!x.terminated_date:!!x.terminated_date));
  });

  render();
}

function render(){
  const activeCount=staff.filter(x=>!x.terminated_date).length;
  const terminated=staff.length-activeCount;
  const roles=new Set(
    staff.filter(x=>!x.terminated_date).map(x=>x.role).filter(Boolean)
  ).size;

  $('stats').innerHTML=[
    ['Admin profiles',staff.length],
    ['Active staff',activeCount],
    ['Roles in use',roles],
    ['Terminated',terminated]
  ].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');

  $('rows').innerHTML=view.length?view.map(x=>`<tr>
    <td>
      <b>${esc([x.first_name,x.last_name].filter(Boolean).join(' '))}</b>
      <small>${esc(x.email_address)}${x.id===currentId?' · You':''}</small>
    </td>
    <td>${esc(x.role)}</td>
    <td><span class="badge ${x.terminated_date?'off':''}">${x.terminated_date?'Terminated':'Active'}</span></td>
    <td>${esc(x.phone_number)}</td>
    <td>${esc([x.city,x.state].filter(Boolean).join(', '))}</td>
    <td>${dt(x.hired_date)}</td>
    <td>${dt(x.updated_at)}</td>
    <td><button class="edit" data-id="${esc(x.id)}">Manage</button></td>
  </tr>`).join('')
  :'<tr><td colspan="8" class="empty">No staff match these filters.</td></tr>';

  document.querySelectorAll('.edit').forEach(b=>{
    b.onclick=()=>openStaff(b.dataset.id);
  });
}

function openStaff(id){
  active=staff.find(x=>String(x.id)===String(id));
  if(!active)return toast('Staff profile could not be found.');

  const x=active;
  $('drawerTitle').textContent=[x.first_name,x.last_name].filter(Boolean).join(' ')||x.email_address||'Staff profile';

  $('detail').innerHTML=`
    <section class="box">
      <h3>Administrator profile</h3>
      <div class="form">
        <label>First name<input id="first" value="${esc(x.first_name||'')}"></label>
        <label>Last name<input id="last" value="${esc(x.last_name||'')}"></label>
        <label class="wide">Email<input value="${esc(x.email_address)}" disabled></label>
        <label>Phone<input id="phone" value="${esc(x.phone_number||'')}"></label>
        <label>Role<input id="role" value="${esc(x.role||'admin')}"></label>
        <label>Street address<input id="street" value="${esc(x.street_address||'')}"></label>
        <label>City<input id="city" value="${esc(x.city||'')}"></label>
        <label>State<input id="stateEdit" value="${esc(x.state||'')}"></label>
        <label>ZIP<input id="zip" value="${esc(x.zip_code||'')}"></label>
        <label>Hired date<input id="hired" type="date" value="${x.hired_date||''}"></label>
        <label>Terminated date<input id="terminated" type="date" value="${x.terminated_date||''}" ${x.id===currentId?'disabled':''}></label>
      </div>
      <div class="actions">
        <button id="save" class="primary" type="button">Save profile</button>
        ${x.id===currentId?'':`<button id="toggle" type="button" class="${x.terminated_date?'':'danger'}">${x.terminated_date?'Reactivate staff':'Terminate staff'}</button>`}
      </div>
    </section>`;

  $('save').onclick=save;
  if($('toggle'))$('toggle').onclick=toggle;

  $('shade').hidden=false;
  $('drawer').classList.add('open');
  $('drawer').setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  $('close').focus();
}

async function save(){
  if(!active)return;

  const role=$('role').value.trim()||'admin';
  const patch={
    first_name:$('first').value.trim()||null,
    last_name:$('last').value.trim()||null,
    phone_number:$('phone').value.trim()||null,
    role,
    street_address:$('street').value.trim()||null,
    city:$('city').value.trim()||null,
    state:$('stateEdit').value.trim()||null,
    zip_code:$('zip').value.trim()||null,
    hired_date:$('hired').value||null,
    terminated_date:active.id===currentId?active.terminated_date:($('terminated').value||null),
    updated_at:new Date().toISOString()
  };

  if(!/^[a-z0-9_-]{2,40}$/i.test(role)){
    return toast('Role must use letters, numbers, dashes or underscores.');
  }

  const {data,error}=await db.from('admin_profiles')
    .update(patch)
    .eq('id',active.id)
    .select()
    .single();

  if(error)return toast(error.message);

  const i=staff.findIndex(x=>x.id===data.id);
  if(i>=0)staff[i]=data;

  filter();
  openStaff(data.id);
  toast('Staff profile updated.');
}

async function toggle(){
  if(!active||active.id===currentId){
    return toast('You cannot terminate your own administrator profile.');
  }

  const val=active.terminated_date?null:new Date().toISOString().slice(0,10);

  const {data,error}=await db.from('admin_profiles')
    .update({
      terminated_date:val,
      updated_at:new Date().toISOString()
    })
    .eq('id',active.id)
    .select()
    .single();

  if(error)return toast(error.message);

  const i=staff.findIndex(x=>x.id===data.id);
  if(i>=0)staff[i]=data;

  filter();
  openStaff(data.id);
  toast(val?'Staff marked terminated.':'Staff reactivated.');
}

function close(){
  $('drawer').classList.remove('open');
  $('drawer').setAttribute('aria-hidden','true');
  $('shade').hidden=true;
  document.body.classList.remove('drawer-open');
}

function toast(x){
  $('toast').textContent=x;
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,2500);
}

$('q').oninput=filter;
$('status').onchange=filter;
$('clear').onclick=()=>{
  $('q').value='';
  $('status').value='';
  filter();
};
$('refresh').onclick=load;
$('close').onclick=close;
$('shade').onclick=close;

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('drawer').classList.contains('open'))close();
});

document.getElementById('signOut')?.addEventListener('click',window.filings4uSignOut);

boot();
