import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

type LoginBody = {
  action: 'login' | 'logout' | 'newid'
  usercode?: string
  password?: string
  newid_usercode?: string
  newid_username?: string
  newid_password?: string
}

type UserRow = {
  usercode: string
}

const SECRET_KEY = process.env.JWT_SECRET

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LoginBody

  if (body.action === 'login') {
    if (!body.usercode || !body.password) {
      return NextResponse.json({ message: 'usercode/password are required', token: '' }, { status: 400 })
    }

    const conn = await db.getConnection()
    try {
      const [rows] = await conn.query(
        'SELECT usercode FROM users WHERE usercode = ? AND password = ? LIMIT 1',
        [body.usercode, body.password],
      )

      const userRows = rows as UserRow[]
      if (userRows.length === 0) {
        return NextResponse.json({ message: 'Login failed', token: '' }, { status: 401 })
      }

      if (!SECRET_KEY) {
        return NextResponse.json({ message: 'JWT secret is not configured', token: '' }, { status: 500 })
      }

      const token = jwt.sign({ usercode: body.usercode }, SECRET_KEY, { expiresIn: '5h' })
      const response = NextResponse.json({ message: 'Login success', token })
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 * 5,
        path: '/',
      })
      return response
    } finally {
      conn.release()
    }
  }

  if (body.action === 'logout') {
    const response = NextResponse.json({ message: 'Logout success' })
    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    })
    return response
  }

  if (body.action === 'newid') {
    if (!body.newid_usercode || !body.newid_username || !body.newid_password) {
      return NextResponse.json({ message: 'signup fields are required' }, { status: 400 })
    }

    const conn = await db.getConnection()
    try {
      const [existRows] = await conn.query('SELECT usercode FROM users WHERE usercode = ? LIMIT 1', [body.newid_usercode])
      const duplicated = (existRows as UserRow[]).length > 0
      if (duplicated) {
        return NextResponse.json({ message: 'duplicated usercode' }, { status: 409 })
      }

      await conn.query('INSERT INTO users (usercode, username, password) VALUES (?, ?, ?)', [
        body.newid_usercode,
        body.newid_username,
        body.newid_password,
      ])

      return NextResponse.json({ message: 'Signup success' }, { status: 201 })
    } finally {
      conn.release()
    }
  }

  return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
}
