'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState, FormEvent, use } from 'react'
import Link from 'next/link'

interface Ingredient { id?: string; name: string; quantity: number; unit: string; cost?: number }
interface Step { id?: string; order: number; description: string }

interface Recipe {
  id: string
  title: string
  description?: string
  servings: number
  prepTime?: number
  cookTime?: number
  difficulty?: string
  category?: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: { name: string }
  updatedBy?: { name: string }
  ingredients: Ingredient[]
  steps: Step[]
}

interface Cookbook {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string }
  createdBy: { name: string }
  updatedBy?: { name: string }
  recipes: Recipe[]
}

const emptyForm = () => ({
  title: '', description: '', servings: 1, prepTime: '', cookTime: '',
  difficulty: '', category: '', notes: '',
  ingredients: [{ name: '', quantity: 1, unit: 'g', cost: '' }] as { name: string; quantity: number; unit: string; cost: string }[],
  steps: [{ description: '' }] as { description: string }[],
})

export default function CookbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [cookbook, setCookbook] = useState<Cookbook | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch(`/api/cookbooks/${id}`).then(r => r.json()).then(d => {
      if (d.id) setCookbook(d)
    })
  }

  useEffect(() => { load() }, [id])

  const canEdit = cookbook && (
    cookbook.owner.id === user?.userId ||
    user?.role === 'SUPERVISOR' || user?.role === 'SUPERUSER'
  )

  function formatDate(d: string) {
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  function openNewRecipe() {
    setForm(emptyForm())
    setEditRecipeId(null)
    setShowForm(true)
  }

  function openEditRecipe(r: Recipe) {
    setForm({
      title: r.title, description: r.description || '', servings: r.servings,
      prepTime: r.prepTime?.toString() || '', cookTime: r.cookTime?.toString() || '',
      difficulty: r.difficulty || '', category: r.category || '', notes: r.notes || '',
      ingredients: r.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, cost: i.cost?.toString() || '' })),
      steps: r.steps.map(s => ({ description: s.description })),
    })
    setEditRecipeId(r.id)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        servings: Number(form.servings),
        prepTime: form.prepTime ? Number(form.prepTime) : null,
        cookTime: form.cookTime ? Number(form.cookTime) : null,
        ingredients: form.ingredients.filter(i => i.name).map(i => ({ ...i, quantity: Number(i.quantity), cost: i.cost ? Number(i.cost) : null })),
        steps: form.steps.filter(s => s.description),
      }
      const url = editRecipeId ? `/api/recipes/${editRecipeId}` : `/api/cookbooks/${id}/recipes`
      const method = editRecipeId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setShowForm(false)
      setSelectedRecipe(null)
      load()
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('Excluir esta receita?')) return
    await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
    setSelectedRecipe(null)
    load()
  }

  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: 1, unit: 'g', cost: '' }] }))
  }
  function removeIngredient(i: number) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  }
  function addStep() {
    setForm(f => ({ ...f, steps: [...f.steps, { description: '' }] }))
  }
  function removeStep(i: number) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  }

  if (!cookbook) return (
    <div style={{ color: 'var(--text2)', textAlign: 'center', marginTop: '4rem' }}>Carregando...</div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard/cookbooks" style={{ color: 'var(--text2)', fontSize: '0.85rem', textDecoration: 'none' }}>
          ← Livros de Receitas
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.8rem', margin: 0 }}>{cookbook.name}</h1>
            {cookbook.description && <p style={{ color: 'var(--text2)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{cookbook.description}</p>}
            <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.5rem' }}>
              👤 {cookbook.owner.name} &nbsp;·&nbsp;
              {cookbook.updatedBy
                ? <>Atualizado por <strong>{cookbook.updatedBy.name}</strong> em {formatDate(cookbook.updatedAt)}</>
                : <>Criado por <strong>{cookbook.createdBy.name}</strong> em {formatDate(cookbook.createdAt)}</>
              }
            </div>
          </div>
          {canEdit && (
            <button className="btn-primary" onClick={openNewRecipe}>+ Nova Ficha Técnica</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedRecipe ? '1fr 1.5fr' : '1fr', gap: '1.5rem' }}>
        {/* Recipes list */}
        <div>
          {cookbook.recipes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍳</div>
              <p>Nenhuma ficha técnica ainda.</p>
              {canEdit && <button className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={openNewRecipe}>Criar primeira receita</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cookbook.recipes.map(r => (
                <div key={r.id} className="card" style={{
                  cursor: 'pointer',
                  borderColor: selectedRecipe?.id === r.id ? 'var(--accent)' : 'var(--border)',
                  transition: 'border-color 0.15s',
                }} onClick={() => setSelectedRecipe(selectedRecipe?.id === r.id ? null : r)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.title}</div>
                      {r.category && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.2rem' }}>{r.category}</div>}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text2)' }}>
                        <span>🍽️ {r.servings} porção{r.servings !== 1 ? 'ões' : ''}</span>
                        {r.prepTime && <span>⏱ {r.prepTime}min</span>}
                        {r.difficulty && <span>📊 {r.difficulty}</span>}
                        <span>🥄 {r.ingredients.length} ingrediente{r.ingredients.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  {/* Audit footer */}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '0.6rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    {r.updatedBy
                      ? <>Atualizado por <strong>{r.updatedBy.name}</strong> em {formatDate(r.updatedAt)}</>
                      : <>Criado por <strong>{r.createdBy.name}</strong> em {formatDate(r.createdAt)}</>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipe detail panel */}
        {selectedRecipe && (
          <div className="card" style={{ position: 'sticky', top: '2rem', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 className="font-display" style={{ fontSize: '1.3rem', margin: 0 }}>{selectedRecipe.title}</h2>
              <button onClick={() => setSelectedRecipe(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            {selectedRecipe.description && <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1rem' }}>{selectedRecipe.description}</p>}

            {/* Meta */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                selectedRecipe.servings && `🍽️ ${selectedRecipe.servings} porção${selectedRecipe.servings !== 1 ? 'ões' : ''}`,
                selectedRecipe.prepTime && `⏱ Prep: ${selectedRecipe.prepTime}min`,
                selectedRecipe.cookTime && `🔥 Cozimento: ${selectedRecipe.cookTime}min`,
                selectedRecipe.difficulty && `📊 ${selectedRecipe.difficulty}`,
                selectedRecipe.category && `🏷️ ${selectedRecipe.category}`,
              ].filter(Boolean).map((item, i) => (
                <span key={i} style={{ background: 'var(--bg3)', padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.78rem', color: 'var(--text2)' }}>
                  {item}
                </span>
              ))}
            </div>

            {/* Ingredients */}
            {selectedRecipe.ingredients.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Ingredientes
                </h3>
                {selectedRecipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span>{ing.name}</span>
                    <span style={{ color: 'var(--text2)' }}>{ing.quantity} {ing.unit}{ing.cost ? ` · R$ ${ing.cost}` : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Steps */}
            {selectedRecipe.steps.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Modo de Preparo
                </h3>
                {selectedRecipe.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ minWidth: 24, height: 24, background: 'var(--accent)', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{step.order}</span>
                    <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{step.description}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedRecipe.notes && (
              <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text2)' }}>
                📝 {selectedRecipe.notes}
              </div>
            )}

            {/* Audit footer */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
              {selectedRecipe.updatedBy
                ? <>Última alteração por <strong style={{ color: 'var(--text)' }}>{selectedRecipe.updatedBy.name}</strong> em {formatDate(selectedRecipe.updatedAt)}</>
                : <>Criado por <strong style={{ color: 'var(--text)' }}>{selectedRecipe.createdBy.name}</strong> em {formatDate(selectedRecipe.createdAt)}</>
              }
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => openEditRecipe(selectedRecipe)}>Editar</button>
                {user?.role === 'SUPERUSER' && (
                  <button className="btn-danger" onClick={() => handleDeleteRecipe(selectedRecipe.id)}>Excluir</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 680, margin: '1rem 0' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              {editRecipeId ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Título *</label>
                  <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Nome da receita" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Descrição</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição curta..." style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label>Porções</label>
                  <input className="input" type="number" min={1} value={form.servings} onChange={e => setForm(f => ({ ...f, servings: Number(e.target.value) }))} />
                </div>
                <div>
                  <label>Categoria</label>
                  <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Entrada, Prato principal..." />
                </div>
                <div>
                  <label>Tempo de Preparo (min)</label>
                  <input className="input" type="number" min={0} value={form.prepTime} onChange={e => setForm(f => ({ ...f, prepTime: e.target.value }))} />
                </div>
                <div>
                  <label>Tempo de Cozimento (min)</label>
                  <input className="input" type="number" min={0} value={form.cookTime} onChange={e => setForm(f => ({ ...f, cookTime: e.target.value }))} />
                </div>
                <div>
                  <label>Dificuldade</label>
                  <select className="input" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    <option>Fácil</option><option>Médio</option><option>Difícil</option><option>Avançado</option>
                  </select>
                </div>
              </div>

              <hr className="divider" />

              {/* Ingredients */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ margin: 0 }}>Ingredientes</label>
                  <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={addIngredient}>+ Adicionar</button>
                </div>
                {form.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input className="input" placeholder="Nome" value={ing.name} onChange={e => setForm(f => { const arr = [...f.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; return { ...f, ingredients: arr } })} />
                    <input className="input" placeholder="Qtd" type="number" step="0.01" value={ing.quantity} onChange={e => setForm(f => { const arr = [...f.ingredients]; arr[i] = { ...arr[i], quantity: Number(e.target.value) }; return { ...f, ingredients: arr } })} />
                    <input className="input" placeholder="Unid." value={ing.unit} onChange={e => setForm(f => { const arr = [...f.ingredients]; arr[i] = { ...arr[i], unit: e.target.value }; return { ...f, ingredients: arr } })} />
                    <input className="input" placeholder="Custo R$" type="number" step="0.01" value={ing.cost} onChange={e => setForm(f => { const arr = [...f.ingredients]; arr[i] = { ...arr[i], cost: e.target.value }; return { ...f, ingredients: arr } })} />
                    <button type="button" onClick={() => removeIngredient(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                  </div>
                ))}
              </div>

              <hr className="divider" />

              {/* Steps */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ margin: 0 }}>Modo de Preparo</label>
                  <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={addStep}>+ Passo</button>
                </div>
                {form.steps.map((step, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ minWidth: 24, height: 24, background: 'var(--accent)', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.65rem' }}>{i + 1}</span>
                    <textarea className="input" rows={2} placeholder={`Passo ${i + 1}...`} value={step.description} onChange={e => setForm(f => { const arr = [...f.steps]; arr[i] = { description: e.target.value }; return { ...f, steps: arr } })} style={{ resize: 'vertical' }} />
                    <button type="button" onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', marginTop: '0.65rem' }}>×</button>
                  </div>
                ))}
              </div>

              <div>
                <label>Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Dicas, variações, alergênicos..." style={{ resize: 'vertical' }} />
              </div>

              {error && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : editRecipeId ? 'Salvar Alterações' : 'Criar Ficha Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
