import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (code) {
    const row = await prisma.mqttValue.findUnique({ where: { code } })
    return NextResponse.json(row)
  }

  const rows = await prisma.mqttValue.findMany()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, value } = body

  if (!code || value === undefined || value === null) {
    return NextResponse.json({ message: 'code/value are required' }, { status: 400 })
  }

  const saved = await prisma.mqttValue.upsert({
    where: { code },
    create: { code, value: String(value) },
    update: { value: String(value) },
  })

  return NextResponse.json(saved)
}
