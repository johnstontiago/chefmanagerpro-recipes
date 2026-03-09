'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'

interface Cookbook {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string }
  createdBy: { name: string }
  updatedBy?: { name: string }
  _count: { recipes: number }
}

interface User { id: string; name: string }

export default function CookbooksPage() {
  const { user } = useAuth()
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', ownerId: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isPrivileged = user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER'

  const load = () => {
    fetch('/api/cookbooks').then(r => r.json()).then(d => Array.isArray(d) && setCookbooks(d))
  }

  useEffect(() => {
    load()
    if (isPrivileged) {
      fetch('/api/users').then(r => r.json()).then(d => Array.isArray(d) && setUsers(d))
    }
  }, [isPrivileged])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editId ? `/api/cookbooks/${editId}` : '/api/cookbooks'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setShowForm(false)
      setEditId(null)
      setForm({ name: '', description: '', ownerId: '' })
      load()
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este livro de receitas? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/cookbooks/${id}`, { method: 'DELETE' })
    load()
  }

  function openEdit(cb: Cookbook) {
    setForm({ name: cb.name, description: cb.description || '', ownerId: cb.owner.id })
    setEditId(cb.id)
    setShowForm(true)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', margin: 0 }}>Livros de Receitas</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {cookbooks.length} livro{cookbooks.length !== 1 ? 's' : ''} encontrado{cookbooks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', ownerId: '' }) }}>
          + Novo Livro
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
              {editId ? 'Editar Livro' : 'Novo Livro de Receitas'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Nome do Livro *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Cardápio de Verão" />
              </div>
              <div>
                <label>Descrição</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição opcional..." style={{ resize: 'vertical' }} />
              </div>
              {isPrivileged && (
                <div>
                  <label>Responsável</label>
                  <select className="input" value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}>
                    <option value="">Minha conta</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
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

      {/* List */}
      {cookbooks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>Nenhum livro de receitas ainda.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
            Criar primeiro livro
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {cookbooks.map(cb => (
            <div key={cb.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{cb.name}</h3>
                  <span style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--accent)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                    {cb._count.recipes} receita{cb._count.recipes !== 1 ? 's' : ''}
                  </span>
                </div>
                {cb.description && <p style={{ color: 'var(--text2)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{cb.description}</p>}
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>
                  👤 {cb.owner.name}
                </div>
              </div>

              {/* Footer audit */}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text2)' }}>
                {cb.updatedBy
                  ? <>Atualizado por <strong>{cb.updatedBy.name}</strong> em {formatDate(cb.updatedAt)}</>
                  : <>Criado por <strong>{cb.createdBy.name}</strong> em {formatDate(cb.createdAt)}</>
                }
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Link href={`/dashboard/cookbooks/${cb.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}>
                    Abrir
                  </button>
                </Link>
                {(isPrivileged || cb.owner.id === user?.userId) && (
                  <button className="btn-ghost" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} onClick={() => openEdit(cb)}>
                    Editar
                  </button>
                )}
                {user?.role === 'SUPERUSER' && (
                  <button className="btn-danger" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} onClick={() => handleDelete(cb.id)}>
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
