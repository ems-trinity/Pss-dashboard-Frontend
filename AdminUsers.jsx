// AdminUsers.jsx — User management (admin only)
const { useState } = React;

const EMPTY_FORM = { name:'', email:'', role:'user', active:true, access:[] };

function AdminUsers({ pss, users: initUsers }) {
  const [users,     setUsers]     = useState(initUsers);
  const [selected,  setSelected]  = useState(null);  // user id being edited
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [search,    setSearch]    = useState('');
  const [saved,     setSaved]     = useState(null);   // id of last-saved user
  const [tempPass,  setTempPass]  = useState('');     // one-time password for new user
  const [copied,    setCopied]    = useState(false);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function openEdit(user) {
    setForm({ name:user.name, email:user.email, role:user.role,
      active:user.active, access: user.access || [] });
    setSelected(user.id); setShowAdd(false); setTempPass('');
  }

  function openAdd() {
    setForm(EMPTY_FORM); setSelected(null); setShowAdd(true); setTempPass('');
  }

  function saveUser() {
    if (showAdd) {
      const newId = 'U' + (Date.now()+'').slice(-4);
      const pass  = 'Tr1n' + Math.random().toString(36).slice(-4).toUpperCase();
      setUsers(prev => [...prev, { id:newId, ...form, login: new Date().toISOString() }]);
      setTempPass(pass); setSaved(newId);
    } else {
      setUsers(prev => prev.map(u => u.id === selected ? { ...u, ...form } : u));
      setSaved(selected); setSelected(null); setShowAdd(false);
    }
  }

  function toggleActive(id) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }

  function toggleAccess(pssId) {
    setForm(f => ({
      ...f,
      access: f.access.includes(pssId)
        ? f.access.filter(x => x !== pssId)
        : [...f.access, pssId],
    }));
  }

  const editing = showAdd || selected !== null;
  const editUser = selected ? users.find(u => u.id === selected) : null;

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Left — user list */}
      <div style={{ flex:'0 0 58%', display:'flex', flexDirection:'column', borderRight:`1px solid ${BRAND.border}`, overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${BRAND.border}`, display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <div style={{ position:'relative', flex:1 }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
              <Ic name="search" size={13} color={BRAND.textMut}/>
            </span>
            <input type="text" placeholder="Search users…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, fontSize:13 }}/>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ flexShrink:0 }}>
            <Ic name="plus" size={14}/> Add User
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY:'auto', flex:1 }}>
          <table>
            <thead>
              <tr>
                <th>Name & Email</th>
                <th style={{ width:90 }}>Role</th>
                <th style={{ width:70 }}>Status</th>
                <th style={{ width:110 }}>Last Login</th>
                <th style={{ width:70 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}
                  style={{ background: selected===u.id || saved===u.id ? '#EFF6FF' : undefined, cursor:'pointer' }}
                  onClick={() => openEdit(u)}
                >
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                        background: u.active ? BRAND.blue : '#94A3B8',
                        color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:700 }}>
                        {u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color: BRAND.text }}>{u.name}</div>
                        <div style={{ fontSize:11, color: BRAND.textSec }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={u.role}/></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background: u.active?'#16A34A':'#94A3B8' }}/>
                      <span style={{ fontSize:12, color: u.active?'#16A34A':BRAND.textSec }}>{u.active?'Active':'Inactive'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize:11, color: BRAND.textSec }}>{fmt.timeAgo(u.login)}</span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => openEdit(u)} style={{ background:'transparent', border:'none', cursor:'pointer', color: BRAND.textSec, padding:5, borderRadius:6 }}>
                        <Ic name="edit" size={13}/>
                      </button>
                      <button onClick={() => toggleActive(u.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color: u.active?'#D97706':BRAND.textSec, padding:5, borderRadius:6 }}
                        title={u.active?'Deactivate':'Activate'}>
                        <Ic name={u.active?'disable':'checkCirc'} size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon="users" title="No users found" sub="Try a different search" color={BRAND.textMut}/>
          )}
        </div>
      </div>

      {/* Right — edit/add panel */}
      <div style={{ flex:1, overflowY:'auto', padding:24, background:'#FAFBFD' }}>
        {!editing && !tempPass && (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ic name="users" size={22} color={BRAND.textMut}/>
            </div>
            <span style={{ fontSize:14, fontWeight:600, color: BRAND.text }}>Select a user to edit</span>
            <span style={{ fontSize:12, color: BRAND.textSec }}>Or click "Add User" to create a new account</span>
          </div>
        )}

        {/* Temp password display (after add) */}
        {tempPass && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Ic name="checkCirc" size={20} color="#16A34A"/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color: BRAND.text }}>User Created</div>
                <div style={{ fontSize:12, color: BRAND.textSec }}>Share the temporary password — it will only be shown once</div>
              </div>
            </div>
            <div style={{ background:'#1E293B', borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <span className="mono" style={{ fontSize:16, fontWeight:700, color:'#F1F5F9', letterSpacing:'0.1em' }}>{tempPass}</span>
              <button onClick={() => { navigator.clipboard?.writeText(tempPass); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'5px 10px', cursor:'pointer', color:'#F1F5F9', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                <Ic name={copied?'check':'copy'} size={12} color="#F1F5F9"/>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button className="btn-ghost" onClick={() => { setTempPass(''); setSaved(null); }}>
              Done
            </button>
          </div>
        )}

        {/* Edit / Add form */}
        {editing && !tempPass && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700, color: BRAND.text }}>
              {showAdd ? 'New User' : `Edit — ${editUser?.name}`}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color: BRAND.textSec }}>Full Name</label>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Priya Mehta"/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color: BRAND.textSec }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="name@trinity-energy.com"/>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color: BRAND.textSec }}>Role</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                <option value="admin">Admin — full access, all PSS units</option>
                <option value="service">Service Engineer — can view and operate</option>
                <option value="user">End User — read-only, assigned units only</option>
              </select>
            </div>

            {form.role === 'user' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <label style={{ fontSize:12, fontWeight:600, color: BRAND.textSec }}>PSS Unit Access</label>
                <div style={{ display:'flex', flexDirection:'column', gap:6, background:'#F8FAFC', border:`1px solid ${BRAND.border}`, borderRadius:8, padding:12 }}>
                  {pss.map(u => (
                    <label key={u.id} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={form.access.includes(u.id)}
                        onChange={() => toggleAccess(u.id)} style={{ width:'auto' }}/>
                      <StatusDot status={u.status} size={6}/>
                      <span style={{ fontWeight:500, color: BRAND.text }}>{u.code}</span>
                      <span style={{ color: BRAND.textSec }}>— {u.loc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-ghost" onClick={() => { setSelected(null); setShowAdd(false); }} style={{ flex:1, justifyContent:'center' }}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!form.name.trim() || !form.email.trim()}
                onClick={saveUser} style={{ flex:1, justifyContent:'center' }}>
                <Ic name={showAdd?'plus':'check'} size={14}/>
                {showAdd ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.AdminUsers = AdminUsers;
