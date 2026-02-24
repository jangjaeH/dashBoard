import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (!token && pathname === '/home') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/home', '/login'],
}
