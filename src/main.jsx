import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let _adminToken = null;
function setAdminToken(t) { _adminToken = t; }
function getAdminToken() { return _adminToken; }

async function adminApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (getAdminToken()) headers['Authorization'] = `Bearer ${getAdminToken()}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function Icon({ type }) {
  const paths = {
    dashboard: <><path d="M12 12h17v17H12zM35 12h17v17H35zM12 35h17v17H12zM35 35h17v17H35z" /></>,
    users: <><circle cx="25" cy="22" r="9"/><path d="M10 52c3-12 12-18 20-18s17 6 20 18"/><path d="M45 20v16M37 28h16"/></>,
    bottle: <><path d="M27 8h10v11l5 8v25c0 4-3 7-7 7h-6c-4 0-7-3-7-7V27l5-8V8Z"/><path d="M27 19h10M24 37h16"/></>,
    outlet: <><path d="M14 29 32 14l18 15"/><path d="M19 27v23h26V27"/><path d="M27 50V37h10v13"/></>,
    subscription: <><rect x="12" y="17" width="40" height="34" rx="4"/><path d="M12 27h40M22 12v10M42 12v10"/></>,
    report: <><path d="M18 12h21l8 8v32H18z"/><path d="M38 12v10h9"/><path d="M26 42V31M32 42V25M38 42v-7"/></>,
    settings: <><circle cx="32" cy="32" r="7"/><path d="M32 10v8M32 46v8M10 32h8M46 32h8M16 16l6 6M42 42l6 6M48 16l-6 6M22 42l-6 6"/></>,
    plus: <><path d="M32 14v36M14 32h36"/></>,
    edit: <><path d="M14 47l3-12 25-25 9 9-25 25-12 3Z"/><path d="M37 15l9 9"/></>,
    trash: <><path d="M17 22h30M25 22v27M39 22v27M21 22l2 32h18l2-32M26 16h12l2 6H24z"/></>,
    logout: <><path d="M29 16H17v32h12"/><path d="M35 23l9 9-9 9"/><path d="M22 32h22"/></>,
    category: <><rect x="12" y="14" width="40" height="8" rx="2"/><rect x="12" y="28" width="26" height="8" rx="2"/><rect x="12" y="42" width="16" height="8" rx="2"/><rect x="40" y="28" width="12" height="22" rx="2"/></>,
    subusers: <><circle cx="24" cy="24" r="8"/><path d="M10 52c0-8 6-13 14-13s14 5 14 13"/><circle cx="45" cy="27" r="6"/><path d="M40 52c0-6 4-10 10-10s8 3 8 8"/></>,
    pos: <><rect x="10" y="18" width="44" height="30" rx="4"/><path d="M10 36h44"/><circle cx="22" cy="27" r="3"/><circle cx="32" cy="27" r="3"/><circle cx="42" cy="27" r="3"/><path d="M20 48v6h24v-6"/></>,
  };
  return <svg viewBox="0 0 64 64" className="icon" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function Modal({ title, children, onClose }) {
  return <div className="modalOverlay"><div className="modalCard"><div className="modalHead"><h2>{title}</h2><button className="closeBtn" onClick={onClose}>×</button></div>{children}</div></div>;
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label} />
    </label>
  );
}

// FIXED: SelectField now correctly handles {value, label} objects without crashing
function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {(options || []).map((opt) => {
          if (typeof opt === 'string') return <option key={opt} value={opt}>{opt}</option>;
          const val = String(opt.value || opt._id || opt.id || '');
          const text = String(opt.label || opt.name || opt.brandName || val);
          return <option key={val} value={val}>{text}</option>;
        })}
      </select>
    </label>
  );
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Login failed'); return d; });
      setAdminToken(data.token);
      onLogin(data.admin);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminLoginWrap">
      <div className="adminLoginCard">
        <div className="adminLoginLogo">SIROO</div>
        <p className="adminLoginSub">Admin Panel</p>
        <form className="adminLoginForm" onSubmit={handleLogin}>
          <label className="field"><span>Admin Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@siroo.in" required autoFocus /></label>
          <label className="field"><span>Password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></label>
          {err && <p className="adminLoginErr">{err}</p>}
          <button className="goldBtn full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In to Admin Panel'}</button>
        </form>
        <p style={{color:'rgba(255,193,129,.45)',fontSize:13,textAlign:'center',marginTop:22}}>SIROO internal admin access only.</p>
      </div>
    </div>
  );
}

function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [page, setPage] = useState('Dashboard');
  const [users, setUsers] = useState([]);
  const [bottles, setBottles] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedOutletId, setSelectedOutletId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [categories, setCategories] = useState([]);

  const nav = [['Dashboard','dashboard'],['Users','users'],['Spirit Categories','category'],['Master Bottles','bottle'],['Outlets & Bars','outlet'],['Sub-Users','subusers'],['POS Integration','pos'],['Subscriptions','subscription'],['Reports / Logs','report'],['Settings','settings']];

  function showToast(msg, dur = 3500) { setToast(msg); setTimeout(() => setToast(''), dur); }

  async function loadAll() {
    setLoading(true);
    try {
      const [u, b, o, cats] = await Promise.all([adminApi('/admin/users'), adminApi('/master-bottles'), adminApi('/admin/outlets'), adminApi('/admin/categories')]);
      setUsers(u); setBottles(b); setOutlets(o); setCategories(cats);
    } catch (e) { showToast('Load error: ' + e.message); }
    setLoading(false);
  }

  React.useEffect(() => { if (adminUser) loadAll(); }, [adminUser]);

  // Users
  async function createUser(data) {
    try { const u = await adminApi('/admin/users', { method: 'POST', body: JSON.stringify(data) }); setUsers(prev => [u, ...prev]); setModal(null); showToast('User created: ' + u.brandName); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function updateUser(data) {
    try { const u = await adminApi(`/admin/users/${data._id||data.id}`, { method: 'PUT', body: JSON.stringify(data) }); setUsers(prev => prev.map(x => (x._id||x.id)===(u._id||u.id)?u:x)); setModal(null); showToast('User updated'); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function toggleUserStatus(u) {
    try { const updated = await adminApi(`/admin/users/${u._id||u.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: u.status==='Active'?'Blocked':'Active' }) }); setUsers(prev => prev.map(x => (x._id||x.id)===(updated._id||updated.id)?updated:x)); }
    catch (e) { showToast('Error: ' + e.message); }
  }

  // Spirit Categories
  async function createCategory(data) {
    try { const c = await adminApi('/admin/categories', { method: 'POST', body: JSON.stringify(data) }); setCategories(prev => [...prev, c]); setModal(null); showToast('Category created: ' + c.name); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function updateCategory(data) {
    try { const c = await adminApi(`/admin/categories/${data._id||data.id}`, { method: 'PUT', body: JSON.stringify(data) }); setCategories(prev => prev.map(x => (x._id||x.id)===(c._id||c.id)?c:x)); setModal(null); showToast('Category updated'); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function deleteCategory(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try { await adminApi(`/admin/categories/${cat._id||cat.id}`, { method: 'DELETE' }); setCategories(prev => prev.filter(x => (x._id||x.id)!==(cat._id||cat.id))); showToast('Category deleted'); }
    catch (e) { showToast('Error: ' + e.message); }
  }

  // Master Bottles
  async function createBottle(data) {
    try { const b = await adminApi('/admin/master-bottles', { method: 'POST', body: JSON.stringify(data) }); setBottles(prev => [b, ...prev]); setModal(null); showToast('Bottle added: ' + b.name); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function updateBottle(data) {
    try { const b = await adminApi(`/admin/master-bottles/${data._id||data.id}`, { method: 'PUT', body: JSON.stringify(data) }); setBottles(prev => prev.map(x => (x._id||x.id)===(b._id||b.id)?b:x)); setModal(null); showToast('Bottle updated'); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function deleteBottle(b) {
    if (!confirm('Delete ' + b.name + '?')) return;
    try { await adminApi(`/admin/master-bottles/${b._id||b.id}`, { method: 'DELETE' }); setBottles(prev => prev.filter(x => (x._id||x.id)!==(b._id||b.id))); showToast('Bottle deleted'); }
    catch (e) { showToast('Error: ' + e.message); }
  }

  // Outlets
  async function createOutlet(data) {
    try { const o = await adminApi('/admin/outlets', { method: 'POST', body: JSON.stringify(data) }); setOutlets(prev => [o, ...prev]); setModal(null); showToast('Outlet created: ' + o.name); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function updateOutlet(data) {
    try { const o = await adminApi(`/admin/outlets/${data._id||data.id}`, { method: 'PUT', body: JSON.stringify(data) }); setOutlets(prev => prev.map(x => (x._id||x.id)===(o._id||o.id)?o:x)); setModal(null); showToast('Outlet updated'); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function createBar(data) {
    try { const o = await adminApi(`/admin/outlets/${data.outletId}/bars`, { method: 'POST', body: JSON.stringify({ name: data.name }) }); setOutlets(prev => prev.map(x => (x._id||x.id)===(o._id||o.id)?o:x)); setModal(null); showToast('Bar created: ' + data.name); }
    catch (e) { showToast('Error: ' + e.message); }
  }
  async function updateBar(data) {
    try { const o = await adminApi(`/admin/outlets/${data.outletId}/bars/${data._id||data.id}`, { method: 'PUT', body: JSON.stringify({ name: data.name }) }); setOutlets(prev => prev.map(x => (x._id||x.id)===(o._id||o.id)?o:x)); setModal(null); showToast('Bar updated: ' + data.name); }
    catch (e) { showToast('Error: ' + e.message); }
  }

  const filteredBottles = useMemo(() => bottles.filter(b => [b.name,b.category,b.barcode].join(' ').toLowerCase().includes(search.toLowerCase())), [bottles, search]);

  if (!adminUser) return <AdminLogin onLogin={setAdminUser} />;

  return (
    <div className="adminApp">
      <aside className="sidebar">
        <div className="brand"><div className="sirooMark">▮▮▮</div><strong>SIROO</strong><span>Admin Panel</span></div>
        <nav>
          {nav.map(([name, icon]) => <button key={name} className={page===name?'active':''} onClick={()=>setPage(name)}><Icon type={icon}/>{name}</button>)}
          <button onClick={()=>{ setAdminToken(null); setAdminUser(null); }} style={{marginTop:'auto',color:'#ff6b35'}}><Icon type="logout"/>Sign Out</button>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><h1>{page}</h1><p>Super admin control for users, outlets, subscriptions and master bottle database.</p></div>
          <span className="apiTag">API: {API_URL}</span>
        </header>
        {loading && <p style={{color:'#ffc181',padding:'12px 0'}}>Loading…</p>}
        {page==='Dashboard' && <Dashboard users={users} bottles={bottles} outlets={outlets} setPage={setPage}/>}
        {page==='Users' && <Users users={users} onCreate={()=>setModal({type:'user'})} onEdit={u=>setModal({type:'user',data:u})} onToggle={toggleUserStatus}/>}
        {page==='Sub-Users' && <AdminSubUsers users={users} showToast={showToast}/>}
        {page==='POS Integration' && <PosIntegration users={users} showToast={showToast}/>}
        {page==='Spirit Categories' && <SpiritCategories categories={categories} onCreate={()=>setModal({type:'category'})} onEdit={c=>setModal({type:'category',data:c})} onDelete={deleteCategory}/>}
        {page==='Master Bottles' && <MasterBottles bottles={filteredBottles} search={search} setSearch={setSearch} onCreate={()=>setModal({type:'bottle'})} onEdit={b=>setModal({type:'bottle',data:b})} onDelete={deleteBottle}/>}
        {page==='Outlets & Bars' && <Outlets outlets={outlets} users={users} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} selectedOutletId={selectedOutletId} setSelectedOutletId={setSelectedOutletId} onCreateOutlet={userId=>setModal({type:'outlet',data:{userId}})} onEditOutlet={o=>setModal({type:'outlet',data:o,isEdit:true})} onCreateBar={outletId=>setModal({type:'bar',data:{outletId}})} onEditBar={(outletId,bar)=>setModal({type:'bar',data:{...bar,outletId}})}/>}
        {page==='Subscriptions' && <Subscriptions users={users} onUpdate={updateUser}/>}
        {page==='Reports / Logs' && <Logs/>}
        {page==='Settings' && <Settings/>}
      </main>

      {modal?.type==='category' && <CategoryModal initial={modal.data} onClose={()=>setModal(null)} onSave={modal.data?updateCategory:createCategory}/>}
      {modal?.type==='bottle' && <BottleModal initial={modal.data} onClose={()=>setModal(null)} onSave={modal.data?updateBottle:createBottle} categories={categories}/>}
      {modal?.type==='user' && <UserModal initial={modal.data} onClose={()=>setModal(null)} onSave={modal.data?updateUser:createUser}/>}
      {modal?.type==='outlet' && <OutletModal users={users} initial={modal.data} isEdit={!!modal.isEdit} onClose={()=>setModal(null)} onSave={modal.isEdit?updateOutlet:createOutlet}/>}
      {modal?.type==='bar' && <BarModal initial={modal.data} onClose={()=>setModal(null)} onSave={modal.data?._id||modal.data?.id?updateBar:createBar}/>}

      {toast && <div className="adminToast">{toast}</div>}
    </div>
  );
}

function Dashboard({ users, bottles, outlets, setPage }) {
  const cards = [['Users / Brand Owners',users.length,'users','Users'],['Master Bottles',bottles.length,'bottle','Master Bottles'],['Outlets Created',outlets.length,'outlet','Outlets & Bars'],['Active Subscriptions',users.filter(u=>u.status==='Active').length,'subscription','Subscriptions']];
  return <><div className="dashGrid">{cards.map(([label,value,icon,target])=><button key={label} className="dashCard" onClick={()=>setPage(target)}><Icon type={icon}/><span>{label}</span><strong>{value}</strong></button>)}</div><section className="panel"><h2>Admin Workflow</h2><p>1. Create a user with email, password and subscription end date.<br/>2. Go to Outlets &amp; Bars → select the user → Create Outlet → Create Bars.<br/>3. User can now log in at the user frontend with their credentials.</p></section></>;
}

function Users({ users, onCreate, onEdit, onToggle }) {
  return <section className="panel"><div className="panelHead"><h2>Users / Brand Owners</h2><button className="goldBtn" onClick={onCreate}><Icon type="plus"/>Create User</button></div><div className="table"><div className="tableHeader eight"><b>Brand</b><b>Owner</b><b>Email</b><b>Mobile</b><b>Subscription</b><b>Status</b><b>Action</b></div>{users.map(u=><div className="row seven" key={u._id||u.id}><span>{u.brandName}</span><span>{u.ownerName}</span><span>{u.email}</span><span>{u.mobile||'-'}</span><span>{u.subscriptionEnds?.slice?.(0,10)||'-'}</span><b style={{color:u.status==='Active'?'#7dff9d':'#ff7043'}}>{u.status}</b><span className="actions"><button className="smallBtn" onClick={()=>onEdit(u)}>Edit</button><button className="smallBtn" onClick={()=>onToggle(u)}>{u.status==='Active'?'Block':'Activate'}</button></span></div>)}</div></section>;
}

function MasterBottles({ bottles, search, setSearch, onCreate, onEdit, onDelete }) {
  return <section className="panel"><div className="panelHead"><h2>Master Bottle Database</h2><button className="goldBtn" onClick={onCreate}><Icon type="plus"/>Add Bottle</button></div><div className="searchbar"><Icon type="bottle"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search brand, category or barcode"/></div><div className="table"><div className="tableHeader" style={{gridTemplateColumns:"56px 1.6fr 1fr .7fr 1.2fr .5fr"}}><b></b><b>Brand</b><b>Category</b><b>Size</b><b>Barcode</b><b>Action</b></div>{bottles.map(b=><div className="row" key={b._id||b.id} style={{gridTemplateColumns:"56px 1.6fr 1fr .7fr 1.2fr .5fr"}}><span className="bottleThumb">{b.image?<img src={b.image} alt="" loading="lazy"/>:<Icon type="bottle"/>}</span><span>{b.name}</span><span>{b.category}</span><span>{b.bottleSizeMl} ML</span><span>{b.barcode}</span><span className="actions"><button className="iconBtn" onClick={()=>onEdit(b)}><Icon type="edit"/></button><button className="iconBtn" onClick={()=>onDelete(b)}><Icon type="trash"/></button></span></div>)}</div></section>;
}

function Outlets({ outlets, users, selectedUserId, setSelectedUserId, selectedOutletId, setSelectedOutletId, onCreateOutlet, onEditOutlet, onCreateBar, onEditBar }) {
  const selectedUser = users.find(u=>(u._id||u.id)===selectedUserId);
  const userOutlets = outlets.filter(o=>o.userId?.toString()===selectedUserId?.toString());
  const selectedOutlet = outlets.find(o=>(o._id||o.id)===selectedOutletId);

  if (!selectedUser) return (
    <section className="panel">
      <h2>Select a User</h2>
      <p>Click a user card to manage their outlets and bars.</p>
      <div className="cardList">
        {users.map(u=><button className="infoCard clickable" key={u._id||u.id} onClick={()=>{setSelectedUserId(u._id||u.id);setSelectedOutletId(null);}}>
          <h3>{u.brandName}</h3><p>{u.ownerName}</p><div className="pill">{u.status}</div>
        </button>)}
      </div>
    </section>
  );

  if (!selectedOutlet) return (
    <section className="panel">
      <div className="panelHead">
        <div><h2>{selectedUser.brandName} — Outlets</h2><p>Stock Room is auto-created with every outlet.</p></div>
        <div className="actions">
          <button className="smallBtn" onClick={()=>setSelectedUserId(null)}>Change User</button>
          <button className="goldBtn" onClick={()=>onCreateOutlet(selectedUser._id||selectedUser.id)}><Icon type="plus"/>Create Outlet</button>
        </div>
      </div>
      <div className="cardList">
        {userOutlets.map(o=><button className="infoCard clickable" key={o._id||o.id} onClick={()=>setSelectedOutletId(o._id||o.id)}>
          <h3>{o.name}</h3>
          <div className="pill">Bars: {o.bars?.filter(b=>b.type==='bar').length||0}</div>
          <span className="actions" style={{marginTop:8}}><button className="smallBtn" onClick={e=>{e.stopPropagation();onEditOutlet(o)}}>Edit</button></span>
        </button>)}
      </div>
    </section>
  );

  return (
    <section className="panel">
      <div className="panelHead">
        <div><h2>{selectedUser.brandName} — {selectedOutlet.name}</h2><p>Manage bars inside this outlet.</p></div>
        <div className="actions">
          <button className="smallBtn" onClick={()=>setSelectedOutletId(null)}>Back</button>
          <button className="goldBtn" onClick={()=>onCreateBar(selectedOutlet._id||selectedOutlet.id)}><Icon type="plus"/>Create Bar</button>
        </div>
      </div>
      <div className="cardList">
        <div className="infoCard"><h3>Stock Room</h3><p>Auto-created — cannot delete</p></div>
        {selectedOutlet.bars.filter(b=>b.type==='bar').map(b=><div className="infoCard" key={b._id||b.id}>
          <h3>{b.name}</h3><p>Bar</p>
          <button className="smallBtn" onClick={()=>onEditBar(selectedOutlet._id||selectedOutlet.id, b)}>Edit</button>
        </div>)}
      </div>
    </section>
  );
}

function Subscriptions({ users, onUpdate }) {
  return <section className="panel"><h2>Subscriptions</h2><div className="table">{users.map(u=><div className="row four" key={u._id||u.id}><span>{u.brandName}</span><span style={{color:new Date(u.subscriptionEnds)<new Date()?'#ff7043':'#7dff9d'}}>{u.subscriptionEnds?.slice?.(0,10)||'-'}</span><b>{u.status}</b><input type="date" value={u.subscriptionEnds?.slice?.(0,10)||''} onChange={e=>onUpdate({...u,subscriptionEnds:e.target.value})}/></div>)}</div></section>;
}

function Logs() {
  return <section className="panel"><h2>Reports / Logs</h2><p>User activity logs will appear here as clients use the system.</p></section>;
}

function Settings() {
  return <section className="panel"><h2>Settings</h2><p>Backend URL: <b style={{color:'#fff'}}>{API_URL}</b></p><p>Admin credentials and scale bridge URL are configured via <b style={{color:'#fff'}}>.env</b> on the server.</p></section>;
}

// ══════════════════════════════════════════════════════════════════════════════
// POS INTEGRATION — Admin UI
//
// POS data is owned by a customer, so every call is scoped with ?userId=.
// Pick the customer first; everything below hangs off that choice.
// ══════════════════════════════════════════════════════════════════════════════

const POS_TABS = [
  ['inbox',   'Mapping Inbox'],
  ['mappings','Mappings'],
  ['sales',   'Sales'],
  ['recon',   'Reconciliation'],
  ['logs',    'Webhook Log'],
];

function PosIntegration({ users, showToast }) {
  const [userId,    setUserId]    = useState('');
  const [ctx,       setCtx]       = useState({ outlets: [], products: [], recipes: [], beers: [] });
  const [configs,   setConfigs]   = useState([]);
  const [supported, setSupported] = useState([]);
  const [selId,     setSelId]     = useState('');
  const [tab,       setTab]       = useState('inbox');

  const [unmapped, setUnmapped] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [sales,    setSales]    = useState(null);
  const [logs,     setLogs]     = useState([]);
  const [recon,    setRecon]    = useState(null);
  const [reconDate,setReconDate]= useState(new Date().toISOString().slice(0, 10));
  const [awaiting, setAwaiting] = useState(null);   // bills waiting for the next count

  const [modal,   setModal]   = useState(null);
  const [loading, setLoading] = useState(false);

  const qs      = extra => `?userId=${userId}${extra || ''}`;
  const selConfig = configs.find(c => String(c._id) === String(selId)) || null;
  const bars = (selConfig
    ? ctx.outlets.find(o => String(o._id) === String(selConfig.siRooOutletId))?.bars
    : []) || [];

  // ── loaders ────────────────────────────────────────────────────────────────
  async function loadCustomer(id) {
    if (!id) { setCtx({ outlets: [], products: [], recipes: [], beers: [] }); setConfigs([]); setSelId(''); return; }
    setLoading(true);
    try {
      const [context, cfgs, sup] = await Promise.all([
        adminApi(`/admin/pos/context?userId=${id}`),
        adminApi(`/admin/pos/configs?userId=${id}`),
        adminApi('/admin/pos/supported'),
      ]);
      setCtx(context); setConfigs(cfgs); setSupported(sup);
      setSelId(cfgs[0] ? String(cfgs[0]._id) : '');
    } catch (e) { showToast('Error: ' + e.message); }
    setLoading(false);
  }

  async function loadTab() {
    if (!userId || !selId) return;
    setLoading(true);
    try {
      if (tab === 'inbox')    setUnmapped(await adminApi(`/admin/pos/unmapped${qs(`&posConfigId=${selId}`)}`));
      if (tab === 'mappings') setMappings(await adminApi(`/admin/pos/mappings${qs(`&posConfigId=${selId}`)}`));
      if (tab === 'sales')    setSales   (await adminApi(`/admin/pos/sales${qs(`&posConfigId=${selId}`)}`));
      if (tab === 'logs')     setLogs    (await adminApi(`/admin/pos/logs${qs(`&posConfigId=${selId}`)}`));
      if (tab === 'recon')    setRecon   (await adminApi(`/admin/pos/reconciliation${qs(`&posConfigId=${selId}&from=${reconDate}&to=${reconDate}`)}`));
    } catch (e) { showToast('Error: ' + e.message); }
    setLoading(false);
  }

  useEffect(() => { loadCustomer(userId); }, [userId]);
  useEffect(() => { loadTab(); }, [selId, tab, reconDate]);

  // ── actions ────────────────────────────────────────────────────────────────
  async function saveConfig(data) {
    try {
      const isEdit = Boolean(data._id);
      const saved = isEdit
        ? await adminApi(`/admin/pos/configs/${data._id}${qs()}`, { method: 'PUT',  body: JSON.stringify({ ...data, userId }) })
        : await adminApi(`/admin/pos/configs${qs()}`,             { method: 'POST', body: JSON.stringify({ ...data, userId }) });
      const cfgs = await adminApi(`/admin/pos/configs?userId=${userId}`);
      setConfigs(cfgs); setSelId(String(saved._id)); setModal(null);
      showToast(isEdit ? 'Connection updated' : 'Connection created — hand the webhook URL to Petpooja');
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function deleteConfig(cfg) {
    if (!confirm(`Delete "${cfg.label || cfg.posName}"? Its mappings will be removed too.`)) return;
    try {
      await adminApi(`/admin/pos/configs/${cfg._id}${qs()}`, { method: 'DELETE' });
      const cfgs = await adminApi(`/admin/pos/configs?userId=${userId}`);
      setConfigs(cfgs); setSelId(cfgs[0] ? String(cfgs[0]._id) : '');
      showToast('Connection deleted');
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function saveMapping(data) {
    try {
      await adminApi(`/admin/pos/mappings${qs()}`, { method: 'POST', body: JSON.stringify({ ...data, userId, posConfigId: selId }) });
      setModal(null); showToast('Mapping saved');
      if (tab === 'mappings') setMappings(await adminApi(`/admin/pos/mappings${qs(`&posConfigId=${selId}`)}`));
      else setTab('mappings');
      setUnmapped(await adminApi(`/admin/pos/unmapped${qs(`&posConfigId=${selId}`)}`));
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function deleteMapping(id) {
    if (!confirm('Remove this mapping? Future sales of this item will stop deducting stock.')) return;
    try {
      await adminApi(`/admin/pos/mappings/${id}${qs()}`, { method: 'DELETE' });
      setMappings(await adminApi(`/admin/pos/mappings${qs(`&posConfigId=${selId}`)}`));
      showToast('Mapping removed');
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function ignoreItem(row) {
    try {
      await adminApi(`/admin/pos/unmapped/${row._id}/ignore${qs()}`, { method: 'PUT', body: JSON.stringify({ userId, ignored: true }) });
      setUnmapped(await adminApi(`/admin/pos/unmapped${qs(`&posConfigId=${selId}`)}`));
      showToast(`"${row.posItemName}" ignored`);
    } catch (e) { showToast('Error: ' + e.message); }
  }

  async function runReconcile() {
    try {
      const d = await adminApi(`/admin/pos/reconcile${qs()}`, { method: 'POST', body: JSON.stringify({ userId, posConfigId: selId, date: reconDate }) });
      showToast(`Reconciled — ${d.records?.length || 0} bottle(s)`);
      setAwaiting(d.awaitingCount || []);
      setRecon(await adminApi(`/admin/pos/reconciliation${qs(`&posConfigId=${selId}&from=${reconDate}&to=${reconDate}`)}`));
    } catch (e) { showToast('Error: ' + e.message); }
  }

  function copyUrl(url) {
    navigator.clipboard?.writeText(url)
      .then(() => showToast('Webhook URL copied'))
      .catch(() => showToast(url));
  }

  const STATUS_COLOR = { OK:'#7dff9d', SHRINKAGE:'#ff7043', SURPLUS:'#ffc181', UNRECONCILED:'#888' };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>POS Integration</h2>
            <p>
              Petpooja pushes every bill to a webhook the moment the cashier hits <b>SAVE AND PRINT</b>.
              There is no menu or orders API to pull from, so items appear in the Mapping Inbox as bills arrive —
              ring up one of each drink, then map them here.
            </p>
          </div>
        </div>

        <div className="formGrid">
          <div className="field">
            <span>Customer *</span>
            <select value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Select a customer</option>
              {(users || []).map(u => <option key={u._id} value={u._id}>{u.businessName || u.name || u.email}</option>)}
            </select>
          </div>
          {userId && (
            <div className="field">
              <span>Connection</span>
              <select value={selId} onChange={e => setSelId(e.target.value)}>
                {configs.length === 0 && <option value="">No connections yet</option>}
                {configs.map(c => <option key={c._id} value={c._id}>{c.label || c.posName} — {c.outletName}</option>)}
              </select>
            </div>
          )}
        </div>

        {userId && (
          <button className="goldBtn" style={{ marginTop: 16 }} onClick={() => setModal({ type:'config' })}>
            <Icon type="plus"/>Add POS Connection
          </button>
        )}
        {!userId && <p className="note" style={{ marginTop: 16 }}>Select a customer to manage their POS connections.</p>}
        {loading && <p style={{ color:'#ffc181', marginTop: 12 }}>Loading…</p>}
      </section>

      {/* ── Connection detail ── */}
      {selConfig && (
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>{selConfig.label || selConfig.posName}</h2>
              <p>
                {selConfig.posName?.toUpperCase()} · {selConfig.outletName}
                {selConfig.restID ? <> · restID <b>{selConfig.restID}</b></> : null}
              </p>
            </div>
            <div className="actions">
              <button className="smallBtn" onClick={() => setModal({ type:'config', data: selConfig })}>Edit</button>
              <button className="smallBtn" style={{ color:'#ff7043' }} onClick={() => deleteConfig(selConfig)}>Delete</button>
            </div>
          </div>

          <div className="posUrlBox">
            <div>
              <span>Webhook URL — give this to Petpooja</span>
              <code>{selConfig.webhookUrl}</code>
            </div>
            <button className="smallBtn" onClick={() => copyUrl(selConfig.webhookUrl)}>Copy</button>
          </div>

          <div className="posStatRow">
            <div><span>Orders Received</span><b>{selConfig.ordersReceived || 0}</b></div>
            <div><span>Last Bill</span><b>{selConfig.lastEventAt ? new Date(selConfig.lastEventAt).toLocaleString() : 'None yet'}</b></div>
            <div><span>Last Order ID</span><b>{selConfig.lastOrderId || '—'}</b></div>
            <div>
              <span>Auto-Deduct</span>
              <b style={{ color: selConfig.autoDeduct ? '#7dff9d' : '#ffc181' }}>{selConfig.autoDeduct ? 'On' : 'Off — logging only'}</b>
            </div>
            <div>
              <span>Status</span>
              <b style={{ color: selConfig.active ? '#7dff9d' : '#ff7043' }}>{selConfig.active ? 'Active' : 'Paused'}</b>
            </div>
          </div>

          {!selConfig.lastEventAt && (
            <p className="note" style={{ marginTop: 14 }}>
              No bills received yet. Configure the URL above in Petpooja, then print a test bill —
              the items will show up in the Mapping Inbox.
            </p>
          )}

          <div className="posTabs">
            {POS_TABS.map(([k, label]) => (
              <button key={k} className={tab === k ? 'posTabOn' : ''} onClick={() => setTab(k)}>
                {label}{k === 'inbox' && unmapped.length ? ` (${unmapped.length})` : ''}
              </button>
            ))}
          </div>

          {/* ── Mapping inbox ── */}
          {tab === 'inbox' && (
            <>
              <p style={{ color:'rgba(255,193,129,.6)', fontSize:13, margin:'0 0 12px' }}>
                Items seen on live bills that aren't mapped yet. Map the drinks; ignore the food.
              </p>
              <div className="table">
                <div className="tableHeader" style={{ gridTemplateColumns:'1.6fr .8fr .9fr .6fr .6fr 1fr' }}>
                  <b>Item</b><b>Kind</b><b>POS Category</b><b>Seen</b><b>Qty</b><b>Action</b>
                </div>
                {unmapped.map(r => (
                  <div className="row" key={r._id} style={{ gridTemplateColumns:'1.6fr .8fr .9fr .6fr .6fr 1fr' }}>
                    <span>
                      <b style={{ color:'#fff2e2' }}>{r.posItemName || '(unnamed)'}</b>
                      <small style={{ display:'block', opacity:.55, fontFamily:'monospace' }}>{r.posItemId}</small>
                    </span>
                    <span className={r.kind === 'addon' ? 'posKindAddon' : 'posKindItem'}>{r.kind}</span>
                    <span>{r.posCategory || '—'}</span>
                    <span>{r.timesSeen}</span>
                    <span>{r.qtySeen}</span>
                    <span className="actions">
                      <button className="smallBtn" onClick={() => setModal({ type:'mapping', data:{
                        kind:r.kind, posItemId:r.posItemId, posItemName:r.posItemName, posCategory:r.posCategory } })}>Map</button>
                      <button className="smallBtn" onClick={() => ignoreItem(r)}>Ignore</button>
                    </span>
                  </div>
                ))}
                {unmapped.length === 0 && !loading && (
                  <p style={{ color:'rgba(255,193,129,.5)', padding:'12px 0' }}>
                    Nothing waiting. Every item seen so far is either mapped or ignored.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Mappings ── */}
          {tab === 'mappings' && (
            <>
              <div className="panelHead" style={{ marginBottom: 12 }}>
                <p style={{ margin:0 }}>{mappings.length} mapping{mappings.length === 1 ? '' : 's'}</p>
                <button className="smallBtn" onClick={() => setModal({ type:'mapping' })}>+ Add manually</button>
              </div>
              <div className="table">
                <div className="tableHeader" style={{ gridTemplateColumns:'1.5fr .6fr 1.4fr 1fr .7fr .6fr' }}>
                  <b>POS Item</b><b>Kind</b><b>Pours From</b><b>Bar</b><b>ML / Serve</b><b>Action</b>
                </div>
                {mappings.map(m => (
                  <div className="row" key={m._id} style={{ gridTemplateColumns:'1.5fr .6fr 1.4fr 1fr .7fr .6fr' }}>
                    <span>
                      <b style={{ color:'#fff2e2' }}>{m.posItemName || m.posItemId}</b>
                      <small style={{ display:'block', opacity:.55, fontFamily:'monospace' }}>{m.posItemId}</small>
                    </span>
                    <span className={m.kind === 'addon' ? 'posKindAddon' : 'posKindItem'}>{m.kind}</span>
                    <span>
                      <span className={`posTarget ${m.targetType}`}>{m.targetType}</span>{' '}
                      {m.targetType === 'bottle'
                        ? (ctx.products.find(p => String(p._id) === String(m.bottleId))?.name || '—')
                        : m.targetType === 'prebatch'
                          ? (ctx.recipes.find(r => String(r._id) === String(m.pbRecipeId))?.name || '—')
                          : (ctx.beers.find(b => String(b._id) === String(m.kegBeerId))?.name || 'Any keg at bar')}
                    </span>
                    <span>{m.locationName || '—'}</span>
                    <span><b>{m.mlPerServe}</b> ML</span>
                    <span className="actions">
                      <button className="iconBtn" onClick={() => setModal({ type:'mapping', data:m })}><Icon type="edit"/></button>
                      <button className="iconBtn" onClick={() => deleteMapping(m._id)}><Icon type="trash"/></button>
                    </span>
                  </div>
                ))}
                {mappings.length === 0 && !loading && (
                  <p style={{ color:'rgba(255,193,129,.5)', padding:'12px 0' }}>
                    No mappings yet. Map items from the inbox once bills start arriving.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Sales ── */}
          {tab === 'sales' && sales && (
            <>
              <div className="posStatRow">
                <div><span>Lines</span><b>{sales.summary.lines}</b></div>
                <div><span>Mapped</span><b style={{ color:'#7dff9d' }}>{sales.summary.mapped}</b></div>
                <div><span>Unmapped</span><b style={{ color:'#ffc181' }}>{sales.summary.unmapped}</b></div>
                <div><span>Cancelled</span><b style={{ color:'#ff7043' }}>{sales.summary.cancelled}</b></div>
                <div><span>Billed ML</span><b>{(sales.summary.totalMl || 0).toLocaleString()} ML</b></div>
                <div><span>NC</span><b>{(sales.summary.ncMl || 0).toLocaleString()} ML</b></div>
                <div><span>Short</span><b style={{ color: sales.summary.shortfalls ? '#ff7043' : '#7dff9d' }}>{sales.summary.shortfalls}</b></div>
              </div>
              <div className="table">
                <div className="tableHeader" style={{ gridTemplateColumns:'.8fr 1.5fr .6fr .5fr .9fr .8fr .9fr' }}>
                  <b>Order</b><b>Item</b><b>Kind</b><b>Qty</b><b>ML</b><b>Bar</b><b>When</b>
                </div>
                {sales.sales.slice(0, 200).map(s => (
                  <div className="row" key={s._id} style={{ gridTemplateColumns:'.8fr 1.5fr .6fr .5fr .9fr .8fr .9fr', opacity: s.reversed ? .5 : 1 }}>
                    <span style={{ fontFamily:'monospace' }}>{s.posOrderId}</span>
                    <span>
                      {s.posItemName}
                      {s.reversed && <small style={{ display:'block', color:'#ff7043' }}>cancelled — reversed</small>}
                      {!s.reversed && !s.mapped && <small style={{ display:'block', color:'#ffc181' }}>not mapped</small>}
                      {!s.reversed && s.isNc && <small style={{ display:'block', color:'#82cfff' }}>NC{s.ncReason ? ` — ${s.ncReason}` : ''}</small>}
                      {s.shortfallMl > 0 && <small style={{ display:'block', color:'#ff7043' }}>{s.note}</small>}
                    </span>
                    <span className={s.kind === 'addon' ? 'posKindAddon' : 'posKindItem'}>{s.kind}</span>
                    <span>{s.quantity}</span>
                    <span>{s.mapped ? `${s.servedMl ?? Math.round((s.quantity||0)*(s.mlPerServe||0))} ML` : '—'}</span>
                    <span>{s.locationName || '—'}</span>
                    <span style={{ fontSize:12 }}>{new Date(s.soldAt).toLocaleString()}</span>
                  </div>
                ))}
                {sales.sales.length === 0 && <p style={{ color:'rgba(255,193,129,.5)', padding:'12px 0' }}>No sales received yet.</p>}
              </div>
            </>
          )}

          {/* ── Reconciliation ── */}
          {tab === 'recon' && (
            <>
              <div className="panelHead" style={{ marginBottom: 12 }}>
                <p style={{ margin:0 }}>Counts taken on this date against the POS bills since each bottle's previous count.</p>
                <div className="actions">
                  <input type="date" className="posDate" value={reconDate} onChange={e => setReconDate(e.target.value)}/>
                  <button className="smallBtn" onClick={runReconcile}>Run for this date</button>
                </div>
              </div>
              {recon && (
                <>
                  <div className="posStatRow">
                    <div><span>Bottles</span><b>{recon.summary.total}</b></div>
                    <div><span>OK</span><b style={{ color:'#7dff9d' }}>{recon.summary.ok}</b></div>
                    <div><span>Shrinkage</span><b style={{ color:'#ff7043' }}>{recon.summary.shrinkage}</b></div>
                    <div><span>Surplus</span><b style={{ color:'#ffc181' }}>{recon.summary.surplus}</b></div>
                    <div><span>NC</span><b>{(recon.summary.totalNcMl || 0).toLocaleString()} ML</b></div>
                    <div><span>Net Variance</span><b>{(recon.summary.totalVarianceMl || 0).toLocaleString()} ML</b></div>
                  </div>
                  <div className="table">
                    <div className="tableHeader" style={{ gridTemplateColumns:'1.5fr .6fr .9fr .9fr .7fr .8fr .7fr .8fr' }}>
                      <b>Bottle</b><b>Counts</b><b>Consumed</b><b>POS Sold</b><b>NC</b><b>Variance</b><b>%</b><b>Status</b>
                    </div>
                    {recon.records.map(r => (
                      <div className="row" key={r._id} style={{ gridTemplateColumns:'1.5fr .6fr .9fr .9fr .7fr .8fr .7fr .8fr' }}>
                        <span>{r.bottleName}</span>
                        <span>{r.counts ?? 1}</span>
                        <span>{r.physicalConsumedMl} ML</span>
                        <span>{r.posSalesML} ML</span>
                        <span>{r.ncMl ? `${r.ncMl} ML` : '—'}</span>
                        <span style={{ color: r.variance > 0 ? '#ff7043' : r.variance < 0 ? '#ffc181' : '#7dff9d' }}>{r.variance} ML</span>
                        <span>{r.variancePct || '—'}</span>
                        <span style={{ color: STATUS_COLOR[r.status], fontWeight:700 }}>{r.status}</span>
                      </div>
                    ))}
                    {recon.records.length === 0 && (
                      <p style={{ color:'rgba(255,193,129,.5)', padding:'12px 0' }}>
                        Nothing for this date. A bottle shows here once it is counted on this date — its bills since the previous count are compared automatically.
                      </p>
                    )}
                  </div>
                  {awaiting && awaiting.length > 0 && (
                    <>
                      <h3 style={{ color:'#ffc181', margin:'20px 0 8px', fontSize:16 }}>Waiting for the next count</h3>
                      <p style={{ margin:'0 0 10px', fontSize:13 }}>Bills already received for these bottles — they are compared at the next count, they are not missing.</p>
                      <div className="table">
                        <div className="tableHeader" style={{ gridTemplateColumns:'1.6fr .8fr .8fr .7fr 1.1fr' }}>
                          <b>Bottle</b><b>Lines</b><b>POS ML</b><b>NC ML</b><b>Since last count</b>
                        </div>
                        {awaiting.map((a, i) => (
                          <div className="row" key={i} style={{ gridTemplateColumns:'1.6fr .8fr .8fr .7fr 1.1fr' }}>
                            <span>{a.bottleName}</span><span>{a.lines}</span><span>{a.ml} ML</span>
                            <span>{a.ncMl ? `${a.ncMl} ML` : '—'}</span>
                            <span style={{ fontSize:12 }}>{a.since ? new Date(a.since).toLocaleString() : '—'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Webhook log ── */}
          {tab === 'logs' && (
            <div className="table">
              <div className="tableHeader" style={{ gridTemplateColumns:'.9fr .7fr .6fr .6fr .6fr 1.8fr .9fr' }}>
                <b>Order</b><b>Status</b><b>Lines</b><b>Mapped</b><b>ML</b><b>Result</b><b>When</b>
              </div>
              {logs.map(l => (
                <div className="row" key={l._id} style={{ gridTemplateColumns:'.9fr .7fr .6fr .6fr .6fr 1.8fr .9fr' }}>
                  <span style={{ fontFamily:'monospace' }}>{l.orderId || '—'}</span>
                  <span style={{ color: /cancel/i.test(l.orderStatus || '') ? '#ff7043' : '#7dff9d' }}>{l.orderStatus || '—'}</span>
                  <span>{l.linesTotal ?? '—'}</span>
                  <span>{l.linesMapped ?? '—'}</span>
                  <span>{l.mlDeducted ?? 0}</span>
                  <span style={{ color: l.ok ? 'rgba(255,225,192,.85)' : '#ff7043', fontSize:13 }}>{l.message}</span>
                  <span style={{ fontSize:12 }}>{new Date(l.at).toLocaleString()}</span>
                </div>
              ))}
              {logs.length === 0 && <p style={{ color:'rgba(255,193,129,.5)', padding:'12px 0' }}>No webhook activity yet.</p>}
            </div>
          )}
        </section>
      )}

      {modal?.type === 'config' && (
        <PosConfigModal initial={modal.data} supported={supported} outlets={ctx.outlets}
                        onClose={() => setModal(null)} onSave={saveConfig}/>
      )}
      {modal?.type === 'mapping' && (
        <PosMappingModal initial={modal.data} bars={bars} ctx={ctx} outletId={selConfig?.siRooOutletId}
                         onClose={() => setModal(null)} onSave={saveMapping}/>
      )}
    </div>
  );
}

function PosConfigModal({ initial, supported, outlets, onClose, onSave }) {
  const [form, setForm] = useState({
    posName:'petpooja', label:'', siRooOutletId:'', restID:'', staticToken:'', autoDeduct:true, active:true,
    ...(initial || {}),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pos = supported.find(s => s.id === form.posName);

  function save() {
    if (!form.siRooOutletId) { alert('Choose the outlet this POS belongs to'); return; }
    onSave(form);
  }

  return (
    <Modal title={initial ? 'Edit POS Connection' : 'Add POS Connection'} onClose={onClose}>
      <div className="formGrid">
        <div className="field">
          <span>POS System *</span>
          <select value={form.posName} onChange={e => set('posName', e.target.value)}>
            {supported.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <span>Outlet *</span>
          <select value={form.siRooOutletId} onChange={e => set('siRooOutletId', e.target.value)}>
            <option value="">Select outlet</option>
            {outlets.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </select>
        </div>
        <Field label="Label" value={form.label} onChange={v => set('label', v)} placeholder="e.g. Taj Mumbai — Petpooja"/>
        <Field label="Restaurant ID (restID)" value={form.restID} onChange={v => set('restID', v)} placeholder="e.g. cp81ghin"/>
        <Field label="Static Token (optional)" value={form.staticToken} onChange={v => set('staticToken', v)} placeholder="Leave blank if not used"/>
      </div>

      <label className="posCheck">
        <input type="checkbox" checked={form.autoDeduct !== false} onChange={e => set('autoDeduct', e.target.checked)}/>
        <span>Deduct stock automatically as bills arrive (off = record for reconciliation only)</span>
      </label>
      <label className="posCheck">
        <input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)}/>
        <span>Connection active</span>
      </label>

      <p className="note" style={{ marginTop: 14 }}>
        {pos?.help}
        {' '}<b>restID</b> arrives in Petpooja's payload at <code>properties.Restaurant.restID</code> — set it so a
        misrouted bill is rejected instead of landing on the wrong outlet.
        The webhook URL appears here once the connection is saved.
      </p>

      <button className="goldBtn full" onClick={save}>{initial ? 'Save Changes' : 'Create Connection'}</button>
    </Modal>
  );
}

function PosMappingModal({ initial, bars, ctx, outletId, onClose, onSave }) {
  const [form, setForm] = useState({
    kind:'item', posItemId:'', posItemName:'', posCategory:'',
    locationId:'', targetType:'bottle', bottleId:'', pbRecipeId:'', kegBeerId:'',
    mlPerServe:'', notes:'',
    ...(initial || {}),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = Boolean(initial?._id);

  // Only recipes belonging to this connection's outlet can be poured here
  const recipes = ctx.recipes.filter(r => !outletId || String(r.outletId) === String(outletId));

  function save() {
    if (!form.posItemId)  { alert('Enter the POS item id'); return; }
    if (!form.locationId) { alert('Choose the bar this item is poured at'); return; }
    if (!Number(form.mlPerServe)) { alert('Enter how many ML one serve pours'); return; }
    if (form.targetType === 'bottle'   && !form.bottleId)   { alert('Select the bottle'); return; }
    if (form.targetType === 'prebatch' && !form.pbRecipeId) { alert('Select the pre-batch recipe'); return; }
    onSave(form);
  }

  return (
    <Modal title={isEdit ? 'Edit Mapping' : 'Map POS Item'} onClose={onClose}>
      <div className="formGrid">
        <Field label="POS Item Name" value={form.posItemName} onChange={v => set('posItemName', v)} placeholder="e.g. Whisky Large Peg"/>
        <Field label="POS Item ID *" value={form.posItemId} onChange={v => set('posItemId', v)} placeholder="itemid, or addon_id for an addon"/>
        <div className="field">
          <span>Kind *</span>
          <select value={form.kind} onChange={e => set('kind', e.target.value)}>
            <option value="item">Menu item</option>
            <option value="addon">Addon (e.g. extra shot)</option>
          </select>
        </div>
        <div className="field">
          <span>Bar — stock comes off here *</span>
          <select value={form.locationId} onChange={e => set('locationId', e.target.value)}>
            <option value="">Select bar</option>
            {bars.map(b => <option key={b._id} value={b._id}>{b.name}{b.type === 'stockroom' ? ' (stock room)' : ''}</option>)}
          </select>
        </div>
        <div className="field">
          <span>Pours From *</span>
          <select value={form.targetType} onChange={e => set('targetType', e.target.value)}>
            <option value="bottle">Bottle stock</option>
            <option value="prebatch">Pre-batch bottle</option>
            <option value="keg">Draft keg</option>
          </select>
        </div>

        {form.targetType === 'bottle' && (
          <div className="field">
            <span>Bottle *</span>
            <select value={form.bottleId || ''} onChange={e => set('bottleId', e.target.value)}>
              <option value="">Select bottle</option>
              {ctx.products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.bottleSizeMl}ml)</option>)}
            </select>
          </div>
        )}
        {form.targetType === 'prebatch' && (
          <div className="field">
            <span>Pre-Batch Recipe *</span>
            <select value={form.pbRecipeId || ''} onChange={e => set('pbRecipeId', e.target.value)}>
              <option value="">Select recipe</option>
              {recipes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
        )}
        {form.targetType === 'keg' && (
          <div className="field">
            <span>Beer (optional)</span>
            <select value={form.kegBeerId || ''} onChange={e => set('kegBeerId', e.target.value)}>
              <option value="">Any active keg at that bar</option>
              {ctx.beers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <Field label="ML per Serve *" type="number" value={form.mlPerServe} onChange={v => set('mlPerServe', v)} placeholder="e.g. 60"/>
        <Field label="Notes" value={form.notes} onChange={v => set('notes', v)} placeholder="Optional"/>
      </div>

      <p className="note" style={{ marginTop: 14 }}>
        Each sale of this item records <b>{Number(form.mlPerServe) || 0} ML</b> per unit against
        {' '}{form.targetType === 'prebatch' ? 'the pre-batch recipe' : form.targetType === 'keg' ? 'the keg' : 'the bottle'}
        {' '}at <b>{bars.find(b => String(b._id) === String(form.locationId))?.name || 'the selected bar'}</b>.
        {' '}Physical stock is not touched — the bills are compared with the next physical count to give the variance.
        {form.targetType === 'keg' && ' Kegs mapped here are counted from the POS: the user only enters the keg weight, and anything beyond the billed ML becomes wastage.'}
        {' '}NC / complimentary lines are recorded separately and taken out of the variance.
        {form.kind === 'addon' && ' Addon quantity is multiplied by the parent item quantity.'}
      </p>

      <button className="goldBtn full" onClick={save}>{isEdit ? 'Save Mapping' : 'Create Mapping'}</button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-USERS — created here, read-only on the brand's own side
// ══════════════════════════════════════════════════════════════════════════════

const DESIGNATIONS = ['Manager','Assistant Manager','Bar Staff','Bartender','Controller','Storekeeper','Accountant','Auditor','Other'];

function AdminSubUsers({ users, showToast }) {
  const [userId,setUserId]   = useState('');
  const [subs,setSubs]       = useState([]);
  const [outlets,setOutlets] = useState([]);
  const [sections,setSections]= useState([]);
  const [modal,setModal]     = useState(null);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{ adminApi('/admin/sections').then(setSections).catch(()=>{}); },[]);

  async function load(id){
    if(!id){ setSubs([]); setOutlets([]); return; }
    setLoading(true);
    try{
      const [s,o]=await Promise.all([
        adminApi(`/admin/sub-users?userId=${id}`),
        adminApi(`/admin/customer-outlets?userId=${id}`),
      ]);
      setSubs(s); setOutlets(o);
    }catch(e){ showToast('Error: '+e.message); }
    setLoading(false);
  }
  useEffect(()=>{ load(userId); },[userId]);

  async function save(data){
    try{
      if(data._id) await adminApi(`/admin/sub-users/${data._id}`,{method:'PUT',body:JSON.stringify(data)});
      else         await adminApi('/admin/sub-users',{method:'POST',body:JSON.stringify({...data,userId})});
      setModal(null); load(userId);
      showToast(data._id?'Sub-user updated':'Sub-user created');
    }catch(e){ showToast('Error: '+e.message); }
  }
  async function remove(s){
    if(!confirm(`Delete ${s.name}? They will no longer be able to sign in.`)) return;
    try{ await adminApi(`/admin/sub-users/${s._id}`,{method:'DELETE'}); load(userId); showToast('Sub-user deleted'); }
    catch(e){ showToast('Error: '+e.message); }
  }
  async function toggle(s){
    try{
      await adminApi(`/admin/sub-users/${s._id}`,{method:'PUT',body:JSON.stringify({status:s.status==='Active'?'Disabled':'Active'})});
      load(userId);
    }catch(e){ showToast('Error: '+e.message); }
  }

  const outletName = id => outlets.find(o=>String(o._id)===String(id))?.name;
  const sectionLabel = k => sections.find(x=>x.key===k)?.label||k;

  return (
    <div>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Sub-Users</h2>
            <p>Staff logins are created here. The brand can see their team but cannot add or change anyone.</p>
          </div>
          {userId && <button className="goldBtn" onClick={()=>setModal({})}><Icon type="plus"/>Add Sub-User</button>}
        </div>

        <div className="field" style={{maxWidth:420}}>
          <span>Customer *</span>
          <select value={userId} onChange={e=>setUserId(e.target.value)}>
            <option value="">Select a customer</option>
            {(users||[]).map(u=><option key={u._id} value={u._id}>{u.brandName||u.ownerName||u.email}</option>)}
          </select>
        </div>
        {loading && <p style={{color:'#ffc181',marginTop:12}}>Loading…</p>}
      </section>

      {userId && (
        <section className="panel">
          <div className="table">
            <div className="tableHeader" style={{gridTemplateColumns:'1.2fr 1fr 1fr .9fr 1.4fr .7fr .8fr'}}>
              <b>Name</b><b>Login ID</b><b>Designation</b><b>Outlets</b><b>Sections</b><b>Money</b><b>Action</b>
            </div>
            {subs.map(s=>(
              <div className="row" key={s._id} style={{gridTemplateColumns:'1.2fr 1fr 1fr .9fr 1.4fr .7fr .8fr'}}>
                <span>
                  <b style={{color:'#fff2e2'}}>{s.name}</b>
                  <small style={{display:'block',color:s.status==='Active'?'#7dff9d':'#ff7043'}}>{s.status}</small>
                </span>
                <span style={{fontFamily:'monospace',fontSize:13}}>{s.username}</span>
                <span>{s.designation||'—'}</span>
                <span>{(s.outletAccess||[]).map(outletName).filter(Boolean).join(', ')||'—'}</span>
                <span style={{fontSize:12,color:'rgba(255,193,129,.75)'}}>
                  {(s.sections||[]).length ? `${s.sections.length} granted` : 'none'}
                  <small style={{display:'block',opacity:.6}}>
                    {(s.sections||[]).slice(0,3).map(sectionLabel).join(', ')}{(s.sections||[]).length>3?'…':''}
                  </small>
                </span>
                <span style={{color:s.financialAccess?'#7dff9d':'rgba(255,193,129,.5)',fontSize:12,fontWeight:700}}>
                  {s.financialAccess?'VISIBLE':'HIDDEN'}
                </span>
                <span className="actions">
                  <button className="iconBtn" onClick={()=>setModal(s)}><Icon type="edit"/></button>
                  <button className="smallBtn" onClick={()=>toggle(s)}>{s.status==='Active'?'Disable':'Enable'}</button>
                  <button className="iconBtn" onClick={()=>remove(s)}><Icon type="trash"/></button>
                </span>
              </div>
            ))}
            {subs.length===0 && !loading && (
              <p style={{color:'rgba(255,193,129,.5)',padding:'12px 0'}}>No sub-users for this customer yet.</p>
            )}
          </div>
        </section>
      )}

      {modal && (
        <AdminSubUserModal initial={modal._id?modal:null} outlets={outlets} sections={sections}
          onClose={()=>setModal(null)} onSave={save}/>
      )}
    </div>
  );
}

function AdminSubUserModal({ initial, outlets, sections, onClose, onSave }) {
  const isEdit = Boolean(initial);
  const [step,setStep]=useState(1);
  const [err,setErr]=useState('');
  const [f,setF]=useState({
    username:'',name:'',phone:'',email:'',designation:'',financialAccess:false,
    ...(initial||{}),
    // re-stated after the spread so the shapes are normalised, and the password
    // box always starts empty rather than echoing anything back
    outletAccess:(initial?.outletAccess||[]).map(String),
    sections:(initial?.sections?.length?initial.sections:['dashboard']),
    password:'',
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggle=(k,v)=>setF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));

  function next(){
    setErr('');
    if(step===1){
      if(!f.username.trim()) return setErr('Enter a login ID');
      if(!isEdit && (!f.password||f.password.length<4)) return setErr('Password must be at least 4 characters');
      if(isEdit && f.password && f.password.length<4)   return setErr('Password must be at least 4 characters');
    }
    if(step===2 && !f.name.trim())  return setErr('Enter the person\'s name');
    if(step===3 && !f.designation)  return setErr('Choose a designation');
    setStep(s=>s+1);
  }
  function save(){
    setErr('');
    if(f.outletAccess.length===0) return setErr('Assign at least one outlet');
    if(f.sections.length===0)     return setErr('Grant at least one section');
    const body={...f};
    if(isEdit && !body.password) delete body.password;
    onSave(body);
  }

  const STEPS=['Credentials','Person','Role','Access'];

  return (
    <Modal title={isEdit?`Edit ${initial.name}`:'New Sub-User'} onClose={onClose}>
      <div className="wizSteps">
        {STEPS.map((s,i)=>(
          <div key={s} className={`wizStep ${step===i+1?'on':''} ${step>i+1?'done':''}`}>
            <b>{step>i+1?'✓':i+1}</b><span>{s}</span>
          </div>
        ))}
      </div>
      {err && <p className="adminLoginErr" style={{marginBottom:14}}>{err}</p>}

      {step===1 && (
        <>
          <p className="wizHint">The login ID replaces an email address at sign-in.</p>
          <div className="formGrid">
            <Field label="Login ID *" value={f.username} onChange={v=>set('username',v)} placeholder="e.g. rahul.bar"/>
            <Field label={isEdit?'New Password (blank = keep)':'Password *'} type="password"
                   value={f.password} onChange={v=>set('password',v)} placeholder="At least 4 characters"/>
          </div>
        </>
      )}

      {step===2 && (
        <>
          <p className="wizHint">Who is this login for?</p>
          <div className="formGrid">
            <Field label="Full Name *" value={f.name} onChange={v=>set('name',v)} placeholder="e.g. Rahul Sharma"/>
            <Field label="Mobile Number" value={f.phone} onChange={v=>set('phone',v)} placeholder="10-digit number"/>
            <Field label="Email (optional)" value={f.email} onChange={v=>set('email',v)} placeholder="Optional"/>
          </div>
        </>
      )}

      {step===3 && (
        <>
          <p className="wizHint">A label only — what they can open is set on the next step.</p>
          <div className="desigGrid">
            {DESIGNATIONS.map(d=>(
              <button key={d} className={`desigChip ${f.designation===d?'on':''}`} onClick={()=>set('designation',d)}>{d}</button>
            ))}
          </div>
        </>
      )}

      {step===4 && (
        <>
          <p className="wizHint">Anything left unticked is refused by the API, not merely hidden.</p>
          <label className="wizLabel">Outlets *</label>
          <div className="accessGrid">
            {outlets.map(o=>{
              const id=String(o._id); const on=f.outletAccess.includes(id);
              return <label key={id} className={`accessRow ${on?'on':''}`}>
                <input type="checkbox" checked={on} onChange={()=>toggle('outletAccess',id)}/>
                <span>{o.name}</span></label>;
            })}
            {outlets.length===0 && <small style={{color:'rgba(255,193,129,.5)'}}>This customer has no outlets yet.</small>}
          </div>

          <div className="wizLabelRow">
            <label className="wizLabel">Sections *</label>
            <div className="wizBulk">
              <button onClick={()=>set('sections',sections.map(s=>s.key))}>Select all</button>
              <button onClick={()=>set('sections',['dashboard'])}>Clear</button>
            </div>
          </div>
          <div className="accessGrid">
            {sections.map(s=>{
              const on=f.sections.includes(s.key);
              return <label key={s.key} className={`accessRow ${on?'on':''}`}>
                <input type="checkbox" checked={on} onChange={()=>toggle('sections',s.key)}/>
                <span>{s.label}</span></label>;
            })}
          </div>

          <label className={`accessRow moneyRow ${f.financialAccess?'on':''}`} style={{marginTop:14}}>
            <input type="checkbox" checked={f.financialAccess} onChange={e=>set('financialAccess',e.target.checked)}/>
            <span><b>Financial access</b>
              <small>Off — every price, cost, stock value and sales figure is stripped from their data server-side.</small>
            </span>
          </label>
        </>
      )}

      <div style={{display:'flex',gap:10,marginTop:20}}>
        {step>1 && <button className="smallBtn" onClick={()=>{setErr('');setStep(s=>s-1);}}>Back</button>}
        {step<4 && <button className="goldBtn" style={{flex:1,justifyContent:'center'}} onClick={next}>Continue</button>}
        {step===4 && <button className="goldBtn" style={{flex:1,justifyContent:'center'}} onClick={save}>{isEdit?'Save Changes':'Create Sub-User'}</button>}
      </div>
    </Modal>
  );
}


function SpiritCategories({ categories, onCreate, onEdit, onDelete }) {
  return (
    <section className="panel">
      <div className="panelHead">
        <div>
          <h2>Spirit Categories</h2>
          <p>Each category has a gram:ml ratio used to convert scale weight into remaining ML.<br/>Formula: (gross weight − empty bottle weight) ÷ gramToMlRatio = remaining ML</p>
        </div>
        <button className="goldBtn" onClick={onCreate}><Icon type="plus"/>Add Category</button>
      </div>
      <div className="table">
        <div className="tableHeader" style={{gridTemplateColumns:'1.2fr 1fr 1fr 2fr .5fr'}}>
          <b>Category Name</b><b>Gram : ML Ratio</b><b>750ml liquid wt.</b><b>Description</b><b>Action</b>
        </div>
        {categories.map(c=>(
          <div className="row" key={c._id||c.id} style={{gridTemplateColumns:'1.2fr 1fr 1fr 2fr .5fr'}}>
            <span style={{fontWeight:800,color:'#fff2e2'}}>{c.name}</span>
            <span style={{color:'#ff9638',fontWeight:800}}>{c.gramToMlRatio}</span>
            <span style={{color:'#ffc181'}}>{Math.round(750*c.gramToMlRatio)}g</span>
            <span style={{color:'#ffd9ad'}}>{c.description||'-'}</span>
            <span className="actions">
              <button className="iconBtn" onClick={()=>onEdit(c)}><Icon type="edit"/></button>
              <button className="iconBtn" onClick={()=>onDelete(c)}><Icon type="trash"/></button>
            </span>
          </div>
        ))}
        {categories.length===0&&<p style={{color:'#ffc181',padding:'16px'}}>No categories yet. Add your first spirit category.</p>}
      </div>
      <p className="note" style={{marginTop:16}}><strong>Common ratios:</strong> Whisky ≈ 0.93 · Vodka ≈ 0.91 · Rum ≈ 0.94 · Gin ≈ 0.92 · Beer ≈ 1.00</p>
    </section>
  );
}

function CategoryModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ name:'', gramToMlRatio:'', description:'', ...(initial||{}) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const preview = form.gramToMlRatio && !isNaN(form.gramToMlRatio)
    ? `750ml → ${Math.round(750*Number(form.gramToMlRatio))}g liquid · 1000ml → ${Math.round(1000*Number(form.gramToMlRatio))}g liquid`
    : 'Enter ratio to see preview';
  function handleSave(){
    if(!form.name.trim()){alert('Category name is required');return;}
    const r=Number(form.gramToMlRatio);
    if(!r||r<=0||r>2){alert('Ratio must be between 0.1 and 2.0 (e.g. 0.93 for whisky)');return;}
    onSave(form);
  }
  return (
    <Modal title={initial?'Edit Spirit Category':'Add Spirit Category'} onClose={onClose}>
      <div className="formGrid">
        <Field label="Category Name" value={form.name} onChange={v=>set('name',v)} placeholder="e.g. Whisky" required/>
        <Field label="Gram : ML Ratio" type="number" value={form.gramToMlRatio} onChange={v=>set('gramToMlRatio',v)} placeholder="e.g. 0.93" required/>
        <div className="field" style={{gridColumn:'1/3'}}>
          <span>Description (optional)</span>
          <input value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="e.g. Scotch, Bourbon, Irish whisky"/>
        </div>
      </div>
      <p className="note">{preview}</p>
      <p className="note" style={{marginTop:8}}>Ratio = grams per ml of spirit. Whisky 0.93 means 750ml weighs 697.5g of liquid inside the bottle.</p>
      <button className="goldBtn full" onClick={handleSave}>{initial?'Save Changes':'Add Category'}</button>
    </Modal>
  );
}

// Shrinks a picked photo in the browser before upload (max 600px, well under
// the server's 1 MB limit). PNG/WEBP keep transparency; photos go to JPEG.
const MAX_IMAGE_CHARS = 1_300_000;
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return reject(new Error('Choose a PNG, JPG, WEBP or GIF image'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const keepAlpha = /png|webp|gif/i.test(file.type);
        const type = keepAlpha ? 'image/webp' : 'image/jpeg';
        let max = 600, quality = 0.88, out = '';
        for (let i = 0; i < 6; i++) {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * scale));
          c.height = Math.max(1, Math.round(img.height * scale));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL(type, quality);
          if (!out.startsWith('data:' + type)) out = c.toDataURL('image/png');   // browser without WEBP export
          if (out.length <= MAX_IMAGE_CHARS) return resolve(out);
          max = Math.round(max * 0.75); quality = Math.max(0.6, quality - 0.08);
        }
        reject(new Error('Image is too large even after resizing — try a smaller photo'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageUpload({ label, value, onChange }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';                  // allow picking the same file again
    if (!file) return;
    setErr(''); setBusy(true);
    try { onChange(await shrinkImage(file)); }
    catch (ex) { setErr(ex.message); }
    setBusy(false);
  }
  return (
    <div className="field imgField">
      <span>{label}</span>
      <div className="imgUpload">
        <div className="imgPreview">{value ? <img src={value} alt=""/> : <Icon type="bottle"/>}</div>
        <div className="imgUploadActions">
          <button type="button" className="smallBtn" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Processing…' : value ? 'Change Image' : 'Upload Image'}
          </button>
          {value && <button type="button" className="smallBtn ghostBtn" onClick={() => onChange('')}>Remove</button>}
          <small>PNG, JPG, WEBP or GIF · resized automatically</small>
          {err && <small style={{ color:'#ff7043' }}>{err}</small>}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pick} hidden/>
      </div>
    </div>
  );
}

function BottleModal({ initial, onClose, onSave, categories }) {
  const [form, setForm] = useState({ name:'', category:'', bottleSizeMl:'', barcode:'', image:'', ...(initial||{}) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  function handleSave() {
    if (!form.name||!form.category||!form.bottleSizeMl||!form.barcode) { alert('Brand name, category, bottle size and barcode are required'); return; }
    onSave(form);
  }
  return <Modal title={initial?'Edit Master Bottle':'Add Master Bottle'} onClose={onClose}>
    <div className="formGrid">
      <Field label="Brand Name" value={form.name} onChange={v=>set('name',v)} required/>
      <label className="field">
        <span>Category *</span>
        <select value={form.category} onChange={e=>set('category',e.target.value)} style={{color:form.category?'#fff':'rgba(255,255,255,.4)'}}>
          <option value="">Select Spirit Category</option>
          {(categories||[]).map(c=><option key={c._id||c.id} value={c.name}>{c.name}</option>)}
        </select>
      </label>
      <Field label="Bottle Size ML" type="number" value={form.bottleSizeMl} onChange={v=>set('bottleSizeMl',v)} required/>
      <Field label="Barcode" value={form.barcode} onChange={v=>set('barcode',v)} required/>
    </div>
    <div style={{ marginTop:16 }}>
      <ImageUpload label="Bottle Image (Optional)" value={form.image} onChange={v=>set('image',v)}/>
    </div>
    <p className="note">Empty bottle weight is <strong>auto-calculated</strong> when the user enters the full bottle weight. Category must match a Spirit Category.</p>
    <button className="goldBtn full" onClick={handleSave}>{initial?'Save Changes':'Save Bottle'}</button>
  </Modal>;
}

function UserModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ? {...initial, password:''} : {brandName:'',ownerName:'',mobile:'',email:'',password:'',subscriptionEnds:''});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  function handleSave() {
    if (!form.brandName||!form.ownerName||!form.email||(!initial&&!form.password)||!form.subscriptionEnds) { alert('All required fields must be filled'); return; }
    onSave(form);
  }
  return <Modal title={initial?'Edit User':'Create User'} onClose={onClose}>
    <div className="formGrid">
      <Field label="Brand Name" value={form.brandName} onChange={v=>set('brandName',v)} required/>
      <Field label="Owner Name" value={form.ownerName} onChange={v=>set('ownerName',v)} required/>
      <Field label="Mobile" value={form.mobile} onChange={v=>set('mobile',v)}/>
      <Field label="Email" value={form.email} onChange={v=>set('email',v)} required/>
      <Field label={initial?'New Password (leave blank to keep)':'Password'} type="password" value={form.password} onChange={v=>set('password',v)} required={!initial}/>
      <Field label="Subscription Ends" type="date" value={form.subscriptionEnds?.slice?.(0,10)||''} onChange={v=>set('subscriptionEnds',v)} required/>
    </div>
    <button className="goldBtn full" onClick={handleSave}>{initial?'Save User':'Create User'}</button>
  </Modal>;
}

// FIXED: OutletModal - proper create vs edit separation, no black screen crash
function OutletModal({ users, initial, isEdit, onClose, onSave }) {
  const [userId, setUserId] = useState(initial?.userId || '');
  const [outletName, setOutletName] = useState(initial?.name || initial?.outletName || '');

  function handleSave() {
    if (!outletName.trim()) { alert('Outlet name is required'); return; }
    if (!isEdit && !userId) { alert('Please select a user first'); return; }
    if (isEdit) {
      onSave({ _id: initial._id || initial.id, id: initial._id || initial.id, outletName });
    } else {
      onSave({ userId, outletName });
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Outlet' : 'Create Outlet'} onClose={onClose}>
      <div className="formGrid">
        {!isEdit && (
          <SelectField
            label="User / Brand"
            value={userId}
            onChange={setUserId}
            options={users.map(u => ({ value: String(u._id||u.id), label: u.brandName }))}
          />
        )}
        <Field label="Outlet Name" value={outletName} onChange={setOutletName} required/>
      </div>
      <p className="note">Stock Room is auto-created. Add bars after creating the outlet.</p>
      <button className="goldBtn full" onClick={handleSave}>{isEdit ? 'Save Outlet' : 'Create Outlet'}</button>
    </Modal>
  );
}

function BarModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const isEdit = !!(initial?._id || initial?.id);
  function handleSave() {
    if (!name.trim()) { alert('Bar name is required'); return; }
    onSave({ ...initial, name });
  }
  return <Modal title={isEdit?'Edit Bar':'Create Bar'} onClose={onClose}>
    <div className="formGrid"><Field label="Bar Name" value={name} onChange={setName} required/></div>
    <button className="goldBtn full" onClick={handleSave}>{isEdit?'Save Bar':'Create Bar'}</button>
  </Modal>;
}

createRoot(document.getElementById('root')).render(<App />);
