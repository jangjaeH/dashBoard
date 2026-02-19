import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const dashboard = await prisma.dashboard.findUnique({ where: { id } })

    if (!dashboard) {
      return NextResponse.json({ message: 'Dashboard not found' }, { status: 404 })
    }

    return NextResponse.json(dashboard)
  }

  const dashboards = await prisma.dashboard.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, updatedAt: true, background: true },
  })

  return NextResponse.json(dashboards)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, background, backgroundImage, width, height, elements } = body

  if (!name || !Array.isArray(elements)) {
    return NextResponse.json({ message: 'name/elements are required' }, { status: 400 })
  }

  const created = await prisma.dashboard.create({
    data: {
      name,
      background: background ?? '#ffffff',
      width: width ?? 1200,
      height: height ?? 700,
      backgroundImage: backgroundImage ?? null,
      elements,
    },
  })

  return NextResponse.json(created, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, name, background, backgroundImage, width, height, elements } = body

  if (!id) {
    return NextResponse.json({ message: 'id is required' }, { status: 400 })
  }

  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(background ? { background } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(backgroundImage !== undefined ? { backgroundImage } : {}),
      ...(elements ? { elements } : {}),
    },
  })

  return NextResponse.json(updated)
}
