import { match } from 'assert';
import {  NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


export function middleware(request: NextRequest) {
    const token = request.cookies.get('token'); 
    const { pathname } = request.nextUrl

    // 토큰이 있는데 로그인 페이지로 이동하려고 할때
    if (token && pathname === '/Login') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // 토큰이 없는데 로그인 페이지가 아닌 다른 페이지로 이동하려고 할때

    if(!token && pathname === '/home') {
        return NextResponse.redirect(new URL('/login', request.url));
    }


    // 추후에 메뉴에서 접근할 곳 추가하기

    return NextResponse.next();
}

// export const config = {
//     matcher: ['/home', '/login'],
// }