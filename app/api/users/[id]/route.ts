import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  // Users can only edit themselves; supervisors/superusers can edit all
  if (session.userId !== id && !['SUPERVISOR', 'SUPERUSER'].includes(session.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (data.role && data.role === 'SUPERUSER' && session.role !== 'SUPERUSER') {
    return NextResponse.json({ error: 'Sem permissão para definir superusuário' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.password) updateData.password = await bcrypt.hash(data.password, 12)
  if (data.role !== undefined && ['SUPERVISOR', 'SUPERUSER'].includes(session.role)) updateData.role = data.role
  if (data.active !== undefined && session.role === 'SUPERUSER') updateData.active = data.active

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (session.role !== 'SUPERUSER') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params

  if (session.userId === id) {
    return NextResponse.json({ error: 'Não é possível excluir sua própria conta' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
