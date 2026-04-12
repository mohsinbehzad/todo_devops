import React, { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const http = {
  get:    path       => fetch(`${API}${path}`).then(r => r.json()),
  post:   (path, d)  => fetch(`${API}${path}`, { method:'POST',   headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) }).then(r => r.json()),
  put:    (path, d)  => fetch(`${API}${path}`, { method:'PUT',    headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) }).then(r => r.json()),
  patch:  path       => fetch(`${API}${path}`, { method:'PATCH'  }).then(r => r.json()),
  delete: path       => fetch(`${API}${path}`, { method:'DELETE' }).then(r => r.json()),
}

const PRIORITIES = ['Low', 'Medium', 'High']
const CATEGORIES = ['General', 'Work', 'Academic', 'DevOps', 'CI/CD', 'Personal', 'Shopping', 'Health']
const PRIORITY_COLOR = { Low: '#22C55E', Medium: '#F59E0B', High: '#EF4444' }
const PRIORITY_BG    = { Low: '#22C55E18', Medium: '#F59E0B18', High: '#EF444418' }

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function isOverdue(d) {
  if (!d) return false
  return new Date(d) < new Date() 
}

// ─── Small components ─────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
      <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--purple)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,
      background: type==='error' ? '#EF444420' : '#22C55E20',
      border: `1px solid ${type==='error' ? '#EF4444' : '#22C55E'}`,
      color: type==='error' ? '#EF4444' : '#22C55E',
      padding:'12px 18px',borderRadius:10,fontSize:14,fontWeight:600,
      boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animation:'fadeUp 0.3s ease',
      display:'flex',alignItems:'center',gap:10}}>
      <span>{type==='error' ? '✗' : '✓'}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{background:'none',color:'inherit',fontSize:18,opacity:0.7,marginLeft:6}}>×</button>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,
      padding:'18px 20px',display:'flex',alignItems:'center',gap:14,
      animation:'fadeUp 0.4s ease',flex:1,minWidth:140}}>
      <div style={{width:44,height:44,borderRadius:10,background:color+'22',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
        {icon}
      </div>
      <div>
        <div style={{fontSize:26,fontWeight:800,color:'var(--white)',letterSpacing:'-0.5px'}}>{value}</div>
        <div style={{fontSize:12,color:'var(--muted)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,
      background: PRIORITY_BG[priority], color: PRIORITY_COLOR[priority],
      textTransform:'uppercase',letterSpacing:'0.5px'}}>
      {priority}
    </span>
  )
}

function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const overdue = !todo.completed && isOverdue(todo.dueDate)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(todo._id)
    setToggling(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${todo.title}"?`)) return
    setDeleting(true)
    await onDelete(todo._id)
  }

  return (
    <div style={{background:'var(--card)',border:`1px solid ${todo.completed ? 'var(--border)' : overdue ? '#EF444440' : 'var(--border)'}`,
      borderLeft:`3px solid ${todo.completed ? 'var(--border)' : PRIORITY_COLOR[todo.priority]}`,
      borderRadius:12,padding:'16px 18px',animation:'fadeUp 0.35s ease',
      opacity: deleting ? 0.4 : 1, transition:'all 0.2s',
      display:'flex',alignItems:'flex-start',gap:14}}>

      {/* Checkbox */}
      <button onClick={handleToggle} disabled={toggling}
        style={{marginTop:2,width:22,height:22,borderRadius:6,flexShrink:0,
          border:`2px solid ${todo.completed ? 'var(--green)' : 'var(--border)'}`,
          background: todo.completed ? 'var(--green)' : 'transparent',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.2s',animation: toggling ? 'pop 0.3s ease' : 'none'}}>
        {todo.completed && <span style={{color:'white',fontSize:13,fontWeight:700}}>✓</span>}
      </button>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:6}}>
          <h3 style={{fontSize:15,fontWeight:600,color: todo.completed ? 'var(--muted)' : 'var(--text)',
            textDecoration: todo.completed ? 'line-through' : 'none',
            textDecorationColor:'var(--muted)',lineHeight:1.3,wordBreak:'break-word'}}>
            {todo.title}
          </h3>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <PriorityBadge priority={todo.priority} />
          </div>
        </div>

        {todo.description && (
          <p style={{fontSize:13,color:'var(--muted)',marginBottom:8,lineHeight:1.5}}>
            {todo.description}
          </p>
        )}

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {/* Category */}
            <span style={{fontSize:11,color:'var(--purple-lt)',background:'#7C5CFC18',
              padding:'2px 8px',borderRadius:6,fontWeight:600}}>
              {todo.category}
            </span>
            {/* Due date */}
            {todo.dueDate && (
              <span style={{fontSize:11,fontWeight:600,
                color: overdue ? '#EF4444' : 'var(--dimmed)'}}>
                {overdue ? '⚠ Overdue · ' : '📅 '}{formatDate(todo.dueDate)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:6}}>
            <button onClick={() => onEdit(todo)}
              style={{padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:600,
                background:'var(--surface)',border:'1px solid var(--border)',
                color:'var(--dimmed)',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.target.style.borderColor='var(--purple)';e.target.style.color='var(--purple-lt)'}}
              onMouseLeave={e=>{e.target.style.borderColor='var(--border)';e.target.style.color='var(--dimmed)'}}>
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:600,
                background:'#EF444410',border:'1px solid #EF444430',
                color:'#EF4444',transition:'all 0.15s'}}
              onMouseEnter={e=>e.target.style.background='#EF444425'}
              onMouseLeave={e=>e.target.style.background='#EF444410'}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20,
      backdropFilter:'blur(6px)',animation:'fadeIn 0.2s ease'}}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,
        padding:'28px 26px',width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',
        boxShadow:'0 24px 80px rgba(0,0,0,0.6)',animation:'fadeUp 0.3s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{fontSize:20,fontWeight:800,color:'var(--white)'}}>{title}</h2>
          <button onClick={onClose} style={{background:'var(--card)',border:'1px solid var(--border)',
            borderRadius:8,width:32,height:32,fontSize:18,color:'var(--muted)'}}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TodoForm({ initial, onSubmit, onCancel, saving }) {
  const blank = { title:'', description:'', priority:'Medium', category:'General', dueDate:'' }
  const [form, setForm] = useState(initial
    ? { ...initial, dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().split('T')[0] : '' }
    : blank)
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const inp = {
    width:'100%', padding:'10px 14px',
    background:'var(--card)', border:'1px solid var(--border)',
    borderRadius:9, fontSize:14, color:'var(--text)', transition:'border-color 0.2s'
  }
  const lbl = { display:'block', fontSize:12, fontWeight:700, color:'var(--dimmed)',
    marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div style={{display:'grid',gap:16}}>
        <div>
          <label style={lbl}>Task Title *</label>
          <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)}
            required placeholder="What needs to be done?" />
        </div>
        <div>
          <label style={lbl}>Description</label>
          <textarea style={{...inp,minHeight:72,resize:'vertical'}}
            value={form.description} onChange={e=>set('description',e.target.value)}
            placeholder="Optional details..." />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label style={lbl}>Priority</label>
            <select style={inp} value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select style={inp} value={form.category} onChange={e=>set('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={lbl}>Due Date</label>
          <input style={inp} type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} />
        </div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <button type="submit" disabled={saving}
            style={{flex:1,padding:'12px',borderRadius:10,fontWeight:700,fontSize:14,
              background: saving ? 'var(--border)' : 'linear-gradient(135deg,var(--purple),var(--purple-dk))',
              color:'white',transition:'all 0.2s',boxShadow: saving ? 'none' : '0 4px 16px #7C5CFC44'}}>
            {saving ? 'Saving...' : (initial ? '✓  Update Task' : '+ Add Task')}
          </button>
          <button type="button" onClick={onCancel}
            style={{flex:1,padding:'12px',borderRadius:10,fontWeight:600,fontSize:14,
              background:'var(--card)',border:'1px solid var(--border)',color:'var(--muted)'}}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [todos,    setTodos]    = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState(null)
  const [editing,  setEditing]  = useState(null)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')   // all | pending | completed
  const [priority, setPriority] = useState('')
  const [toast,    setToast]    = useState(null)
  const [seeding,  setSeeding]  = useState(false)

  const showToast = (msg, type='success') => setToast({msg, type})

  const loadTodos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)             params.set('search', search)
      if (filter !== 'all')   params.set('status', filter)
      if (priority)           params.set('priority', priority)
      const res = await http.get(`/api/todos?${params}`)
      if (res.success) setTodos(res.data)
    } catch { showToast('Failed to load tasks', 'error') }
    setLoading(false)
  }, [search, filter, priority])

  const loadStats = useCallback(async () => {
    try { const r = await http.get('/api/stats'); if (r.success) setStats(r.data) } catch {}
  }, [])

  useEffect(() => { loadTodos(); loadStats() }, [loadTodos, loadStats])

  const handleAdd = async (form) => {
    setSaving(true)
    try {
      const res = await http.post('/api/todos', form)
      if (res.success) { showToast('Task added!'); setModal(null); loadTodos(); loadStats() }
      else showToast(res.message, 'error')
    } catch { showToast('Error adding task', 'error') }
    setSaving(false)
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      const res = await http.put(`/api/todos/${editing._id}`, form)
      if (res.success) { showToast('Task updated!'); setModal(null); setEditing(null); loadTodos(); loadStats() }
      else showToast(res.message, 'error')
    } catch { showToast('Error updating task', 'error') }
    setSaving(false)
  }

  const handleToggle = async (id) => {
    try {
      const res = await http.patch(`/api/todos/${id}/toggle`)
      if (res.success) { loadTodos(); loadStats() }
    } catch { showToast('Error', 'error') }
  }

  const handleDelete = async (id) => {
    try {
      const res = await http.delete(`/api/todos/${id}`)
      if (res.success) { showToast('Task deleted'); loadTodos(); loadStats() }
    } catch { showToast('Error deleting', 'error') }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await http.post('/api/seed')
      if (res.success) { showToast(`${res.data.length} sample tasks loaded!`); loadTodos(); loadStats() }
    } catch { showToast('Seed failed', 'error') }
    setSeeding(false)
  }

  const filterBtn = (val, label) => (
    <button onClick={() => setFilter(val)}
      style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
        transition:'all 0.2s',
        background: filter===val ? 'var(--purple)' : 'var(--card)',
        border: `1px solid ${filter===val ? 'var(--purple)' : 'var(--border)'}`,
        color: filter===val ? 'white' : 'var(--muted)'}}>
      {label}
    </button>
  )

  const progress = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>

      {/* ── Header ── */}
      <header style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',
        position:'sticky',top:0,zIndex:100,backdropFilter:'blur(10px)'}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'0 24px',
          display:'flex',alignItems:'center',justifyContent:'space-between',height:62}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,
              background:'linear-gradient(135deg,var(--purple),var(--purple-dk))',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
              ✓
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:'var(--white)',letterSpacing:'-0.3px'}}>TaskFlow</div>
              <div style={{fontSize:10,color:'var(--muted)',letterSpacing:'1px',textTransform:'uppercase'}}>To-Do Manager</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={handleSeed} disabled={seeding}
              style={{padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:600,
                background:'var(--card)',border:'1px solid var(--border)',color:'var(--muted)',transition:'all 0.2s'}}
              onMouseEnter={e=>e.target.style.borderColor='var(--purple)'}
              onMouseLeave={e=>e.target.style.borderColor='var(--border)'}>
              {seeding ? 'Loading...' : '🌱 Sample Data'}
            </button>
            <button onClick={() => setModal('add')}
              style={{padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:700,
                background:'linear-gradient(135deg,var(--purple),var(--purple-dk))',
                color:'white',boxShadow:'0 4px 14px #7C5CFC44',transition:'all 0.2s'}}>
              + New Task
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:900,margin:'0 auto',padding:'28px 24px'}}>

        {/* ── Stats ── */}
        {stats && (
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
              <StatCard icon="📋" label="Total"     value={stats.total}       color="#7C5CFC" />
              <StatCard icon="⏳" label="Pending"   value={stats.pending}     color="#F59E0B" />
              <StatCard icon="✅" label="Completed" value={stats.completed}   color="#22C55E" />
              <StatCard icon="🔴" label="High Priority" value={stats.highPriority} color="#EF4444" />
            </div>
            {/* Progress bar */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:600,color:'var(--dimmed)'}}>Overall Progress</span>
                <span style={{fontSize:13,fontWeight:800,color:'var(--purple-lt)'}}>{progress}%</span>
              </div>
              <div style={{height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress}%`,
                  background:'linear-gradient(90deg,var(--purple),var(--purple-lt))',
                  borderRadius:4,transition:'width 0.6s ease'}}/>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,
          padding:'14px 16px',marginBottom:20,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {/* Search */}
          <div style={{position:'relative',flex:1,minWidth:180}}>
            <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',
              fontSize:15,color:'var(--muted)'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:8,paddingBottom:8,
                background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,
                fontSize:13,color:'var(--text)'}}/>
          </div>
          {/* Status filters */}
          <div style={{display:'flex',gap:6}}>
            {filterBtn('all',       'All')}
            {filterBtn('pending',   'Pending')}
            {filterBtn('completed', 'Completed')}
          </div>
          {/* Priority filter */}
          <select value={priority} onChange={e=>setPriority(e.target.value)}
            style={{padding:'7px 12px',background:'var(--card)',border:'1px solid var(--border)',
              borderRadius:8,fontSize:13,color:'var(--muted)',cursor:'pointer'}}>
            <option value=''>All Priorities</option>
            {PRIORITIES.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>

        {/* ── Todo List ── */}
        {loading ? <Spinner /> : todos.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 20px',color:'var(--muted)'}}>
            <div style={{fontSize:64,marginBottom:16}}>📭</div>
            <h3 style={{fontSize:20,fontWeight:700,color:'var(--dimmed)',marginBottom:8}}>No tasks found</h3>
            <p style={{marginBottom:24,fontSize:14}}>Add a new task or load sample data to get started.</p>
            <button onClick={()=>setModal('add')}
              style={{padding:'10px 24px',borderRadius:9,fontSize:14,fontWeight:700,
                background:'linear-gradient(135deg,var(--purple),var(--purple-dk))',color:'white'}}>
              + Create First Task
            </button>
          </div>
        ) : (
          <>
            <p style={{fontSize:12,color:'var(--muted)',marginBottom:14,fontWeight:500}}>
              {todos.length} task{todos.length!==1?'s':''} found
            </p>
            <div style={{display:'grid',gap:10}}>
              {todos.map(t => (
                <TodoCard key={t._id} todo={t}
                  onToggle={handleToggle}
                  onEdit={t=>{setEditing(t);setModal('edit')}}
                  onDelete={handleDelete}/>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{textAlign:'center',padding:'20px',fontSize:12,
        color:'var(--muted)',borderTop:'1px solid var(--border)',marginTop:40}}>
        TaskFlow · React + Node.js + MongoDB · Deployed on AWS EC2 with Docker & Jenkins
      </footer>

      {/* ── Modals ── */}
      {modal==='add' && (
        <Modal title="✦ New Task" onClose={()=>setModal(null)}>
          <TodoForm onSubmit={handleAdd} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal==='edit' && editing && (
        <Modal title="Edit Task" onClose={()=>{setModal(null);setEditing(null)}}>
          <TodoForm initial={editing} onSubmit={handleEdit} onCancel={()=>{setModal(null);setEditing(null)}} saving={saving}/>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  )
}
