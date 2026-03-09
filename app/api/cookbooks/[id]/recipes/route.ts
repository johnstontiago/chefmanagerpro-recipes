import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: cookbookId } = await params
  const cookbook = await prisma.cookbook.findUnique({ where: { id: cookbookId } })
  if (!cookbook) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 })

  const canCreate = cookbook.ownerId === session.userId || ['SUPERVISOR', 'SUPERUSER'].includes(session.role)
  if (!canCreate) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { title, description, servings, prepTime, cookTime, difficulty, category, notes, ingredients, steps } = await req.json()

  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description,
      servings: servings || 1,
      prepTime,
      cookTime,
      difficulty,
      category,
      notes,
      cookbookId,
      createdById: session.userId,
      ingredients: {
        create: (ingredients || []).map((ing: { name: string; quantity: number; unit: string; cost?: number }, i: number) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          cost: ing.cost,
          order: i,
        })),
      },
      steps: {
        create: (steps || []).map((step: { description: string }, i: number) => ({
          order: i + 1,
          description: step.description,
        })),
      },
    },
    include: {
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json(recipe, { status: 201 })
}
