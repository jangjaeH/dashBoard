import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.dataBinding.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, topic, description } = body

  if (!code || !topic) {
    return NextResponse.json({ message: 'code/topic are required' }, { status: 400 })
  }

  const created = await prisma.dataBinding.create({
    data: {
      code,
      topic,
      description,
    },
  })

  return NextResponse.json(created, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, code, topic, description } = body

  if (!id) {
    return NextResponse.json({ message: 'id is required' }, { status: 400 })
  }

  const updated = await prisma.dataBinding.update({
    where: { id },
    data: {
      ...(code ? { code } : {}),
      ...(topic ? { topic } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ message: 'id is required' }, { status: 400 })
  }

  await prisma.dataBinding.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
