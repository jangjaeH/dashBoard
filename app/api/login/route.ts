import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

type LoginBody = {
  action: 'login' | 'logout' | 'newid' | 'profile' | 'change-password' | 'withdraw'
  usercode?: string
  password?: string
  newid_usercode?: string
  newid_username?: string
  newid_password?: string
  currentPassword?: string
  newPassword?: string
}

type UserRow = {
  usercode: string
  username?: string
  use_yn?: string
}

const SECRET_KEY = process.env.JWT_SECRET

const getUsercodeFromToken = (req: NextRequest) => {
  const token = req.cookies.get('token')?.value
  if (!token || !SECRET_KEY) return null

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { usercode?: string }
    return decoded.usercode ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LoginBody

  if (body.action === 'login') {
    if (!body.usercode || !body.password) {
      return NextResponse.json({ message: 'usercode/password are required', token: '' }, { status: 400 })
    }

    const conn = await db.getConnection()
    try {
      const [rows] = await conn.query(
        'SELECT usercode FROM users WHERE usercode = ? AND password = ? AND use_yn = ? LIMIT 1',
        [body.usercode, body.password, 'Y'],
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

      await conn.query('INSERT INTO users (usercode, username, password, use_yn) VALUES (?, ?, ?, ?)', [
        body.newid_usercode,
        body.newid_username,
        body.newid_password,
        'Y',
      ])

      return NextResponse.json({ message: 'Signup success' }, { status: 201 })
    } finally {
      conn.release()
    }
  }

  if (body.action === 'profile') {
    const usercode = getUsercodeFromToken(req)
    if (!usercode) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const conn = await db.getConnection()
    try {
      const [rows] = await conn.query('SELECT usercode, username, use_yn FROM users WHERE usercode = ? LIMIT 1', [usercode])
      const user = (rows as UserRow[])[0]
      if (!user) {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(user)
    } finally {
      conn.release()
    }
  }

  if (body.action === 'change-password') {
    const usercode = getUsercodeFromToken(req)
    if (!usercode || !body.currentPassword || !body.newPassword) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const conn = await db.getConnection()
    try {
      const [rows] = await conn.query(
        'SELECT usercode FROM users WHERE usercode = ? AND password = ? AND use_yn = ? LIMIT 1',
        [usercode, body.currentPassword, 'Y'],
      )

      if ((rows as UserRow[]).length === 0) {
        return NextResponse.json({ message: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 })
      }

      await conn.query('UPDATE users SET password = ? WHERE usercode = ?', [body.newPassword, usercode])
      return NextResponse.json({ message: '비밀번호가 변경되었습니다.' })
    } finally {
      conn.release()
    }
  }

  if (body.action === 'withdraw') {
    const usercode = getUsercodeFromToken(req)
    if (!usercode) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const conn = await db.getConnection()
    try {
      await conn.query('UPDATE users SET use_yn = ? WHERE usercode = ?', ['N', usercode])
      const response = NextResponse.json({ message: '탈퇴 처리되었습니다.' })
      response.cookies.set('token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      })
      return response
    } finally {
      conn.release()
    }
  }

  return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
}
