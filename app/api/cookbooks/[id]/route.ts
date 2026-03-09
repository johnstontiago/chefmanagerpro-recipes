import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const cookbook = await prisma.cookbook.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      recipes: {
        include: {
          createdBy: { select: { name: true } },
          updatedBy: { select: { name: true } },
          ingredients: { orderBy: { order: 'asc' } },
          steps: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  if (!cookbook) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Only owner, supervisors, or superusers can view
  const canView = cookbook.ownerId === session.userId || ['SUPERVISOR', 'SUPERUSER'].includes(session.role)
  if (!canView) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  return NextResponse.json(cookbook)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const cookbook = await prisma.cookbook.findUnique({ where: { id } })
  if (!cookbook) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const canEdit = cookbook.ownerId === session.userId || ['SUPERVISOR', 'SUPERUSER'].includes(session.role)
  if (!canEdit) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { name, description } = await req.json()

  const updated = await prisma.cookbook.update({
    where: { id },
    data: { name, description, updatedById: session.userId },
    include: {
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (session.role !== 'SUPERUSER') return NextResponse.json({ error: 'Apenas superusuários podem excluir livros' }, { status: 403 })

  const { id } = await params
  await prisma.cookbook.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
