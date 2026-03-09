'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string; name: string; email: string; role: string; active: boolean; createdAt: string
}

const emptyForm = () => ({ name: '', email: '', password: '', role: 'USER', active: true })

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (!['SUPERVISOR', 'SUPERUSER'].includes(user.role)) { router.push('/dashboard'); return }
    load()
  }, [user])

  const load = () => {
    fetch('/api/users').then(r => r.json()).then(d => Array.isArray(d) && setUsers(d))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users'
      const method = editId ? 'PUT' : 'POST'
      const payload = editId && !form.password ? { name: form.name, email: form.email, role: form.role, active: form.active } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setShowForm(false); setEditId(null); setForm(emptyForm()); load()
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    load()
  }

  function openEdit(u: User) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active })
    setEditId(u.id)
    setShowForm(true)
  }

  const roleBadge: Record<string, string> = { USER: 'badge-user', SUPERVISOR: 'badge-supervisor', SUPERUSER: 'badge-superuser' }
  const roleLabel: Record<string, string> = { USER: 'Usuário', SUPERVISOR: 'Supervisor', SUPERUSER: 'Superusuário' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', margin: 0 }}>Usuários</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true) }}>
          + Novo Usuário
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.2rem' }}>
              {editId ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Nome *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nome completo" />
              </div>
              <div>
                <label>Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@exemplo.com" />
              </div>
              <div>
                <label>{editId ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required={!editId} />
              </div>
              <div>
                <label>Perfil</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="USER">Usuário</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  {user?.role === 'SUPERUSER' && <option value="SUPERUSER">Superusuário</option>}
                </select>
              </div>
              {editId && user?.role === 'SUPERUSER' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  <label htmlFor="active" style={{ margin: 0, textTransform: 'none', fontSize: '0.9rem', color: 'var(--text)' }}>Usuário ativo</label>
                </div>
              )}
              {error && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Email', 'Perfil', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ padding: '0.9rem 1.2rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.9rem', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.85rem', color: 'var(--text2)' }}>{u.email}</td>
                <td style={{ padding: '0.85rem 1.2rem' }}>
                  <span className={`badge ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span>
                </td>
                <td style={{ padding: '0.85rem 1.2rem' }}>
                  <span style={{ fontSize: '0.78rem', color: u.active ? 'var(--success)' : 'var(--text2)' }}>
                    {u.active ? '● Ativo' : '○ Inativo'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }} onClick={() => openEdit(u)}>
                      Editar
                    </button>
                    {user?.role === 'SUPERUSER' && u.id !== user.userId && (
                      <button className="btn-danger" style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }} onClick={() => handleDelete(u.id, u.name)}>
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>Nenhum usuário encontrado</div>
        )}
      </div>
    </div>
  )
}
