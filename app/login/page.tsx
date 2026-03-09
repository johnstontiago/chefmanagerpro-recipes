'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao fazer login'); return }
      router.push('/dashboard')
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(212,168,83,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(212,168,83,0.03) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.2rem', fontSize: '1.8rem',
          }}>🍽️</div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
            ChefManager
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Sistema de fichas técnicas
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text)' }}>
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Email</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Senha</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)',
                borderRadius: 6, padding: '0.7rem 1rem', color: '#e74c3c', fontSize: '0.85rem',
              }}>{error}</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          ChefManager © {new Date().getFullYear()} – Gestão profissional de receitas
        </p>
      </div>
    </div>
  )
}
