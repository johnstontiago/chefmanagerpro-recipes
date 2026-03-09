import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { cookbook: true },
  })
  if (!recipe) return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })

  const canEdit =
    recipe.cookbook.ownerId === session.userId ||
    recipe.createdById === session.userId ||
    ['SUPERVISOR', 'SUPERUSER'].includes(session.role)

  if (!canEdit) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { title, description, servings, prepTime, cookTime, difficulty, category, notes, ingredients, steps } = await req.json()

  // Delete old ingredients and steps, then recreate
  await prisma.ingredient.deleteMany({ where: { recipeId: id } })
  await prisma.step.deleteMany({ where: { recipeId: id } })

  const updated = await prisma.recipe.update({
    where: { id },
    data: {
      title,
      description,
      servings,
      prepTime,
      cookTime,
      difficulty,
      category,
      notes,
      updatedById: session.userId,
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

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (session.role !== 'SUPERUSER') return NextResponse.json({ error: 'Apenas superusuários podem excluir receitas' }, { status: 403 })

  const { id } = await params
  await prisma.recipe.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
