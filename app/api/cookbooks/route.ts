import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const where = ['SUPERVISOR', 'SUPERUSER'].includes(session.role)
    ? {}
    : { ownerId: session.userId }

  const cookbooks = await prisma.cookbook.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
      _count: { select: { recipes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(cookbooks)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { name, description, ownerId } = await req.json()

  if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  // Supervisors/superusers can assign ownership; regular users own their own
  const finalOwnerId = ['SUPERVISOR', 'SUPERUSER'].includes(session.role) && ownerId
    ? ownerId
    : session.userId

  const cookbook = await prisma.cookbook.create({
    data: {
      name,
      description,
      ownerId: finalOwnerId,
      createdById: session.userId,
    },
    include: {
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { recipes: true } },
    },
  })

  return NextResponse.json(cookbook, { status: 201 })
}
