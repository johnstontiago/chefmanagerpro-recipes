'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ cookbooks: 0, recipes: 0, users: 0 })

  useEffect(() => {
    fetch('/api/cookbooks').then(r => r.json()).then(data => {
      const cookbooks = Array.isArray(data) ? data : []
      const recipes = cookbooks.reduce((acc: number, cb: { _count?: { recipes?: number } }) => acc + (cb._count?.recipes || 0), 0)
      setStats(s => ({ ...s, cookbooks: cookbooks.length, recipes }))
    })
    if (user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER') {
      fetch('/api/users').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setStats(s => ({ ...s, users: data.length }))
      })
    }
  }, [user])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👨‍🍳
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: '0.5rem' }}>
          Bem-vindo ao ChefManager – sua cozinha digital.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.cookbooks}</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Livros de Receitas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.recipes}</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Fichas Técnicas</div>
        </div>
        {(user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER') && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.users}</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Usuários</div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Ações Rápidas</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/cookbooks">
            <button className="btn-primary">📚 Ver Livros de Receitas</button>
          </Link>
          {(user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER') && (
            <Link href="/dashboard/users">
              <button className="btn-ghost">👥 Gerenciar Usuários</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
