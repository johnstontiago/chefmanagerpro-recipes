'use client'

import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const nav = [
    { href: '/dashboard', label: 'Visão Geral', icon: '◈' },
    { href: '/dashboard/cookbooks', label: 'Livros de Receitas', icon: '📚' },
    ...(user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER'
      ? [{ href: '/dashboard/users', label: 'Usuários', icon: '👥' }]
      : []),
  ]

  const roleBadge: Record<string, string> = {
    USER: 'badge-user',
    SUPERVISOR: 'badge-supervisor',
    SUPERUSER: 'badge-superuser',
  }
  const roleLabel: Record<string, string> = {
    USER: 'Usuário',
    SUPERVISOR: 'Supervisor',
    SUPERUSER: 'Superusuário',
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--bg2)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🍽️</span>
          <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
            ChefManager
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
        {nav.map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.75rem', borderRadius: 6, marginBottom: '0.25rem',
              background: pathname === item.href ? 'rgba(212,168,83,0.1)' : 'transparent',
              color: pathname === item.href ? 'var(--accent)' : 'var(--text2)',
              transition: 'all 0.15s', cursor: 'pointer', fontSize: '0.9rem',
              border: pathname === item.href ? '1px solid rgba(212,168,83,0.2)' : '1px solid transparent',
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.1rem' }}>{user?.email}</div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <span className={`badge ${roleBadge[user?.role || 'USER']}`}>
            {roleLabel[user?.role || 'USER']}
          </span>
        </div>
        <button className="btn-ghost" onClick={logout} style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }}>
          Sair
        </button>
      </div>
    </aside>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ color: 'var(--accent)', fontSize: '1rem' }}>Carregando...</div>
    </div>
  )
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, padding: '2rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
