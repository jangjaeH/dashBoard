import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET
export async function POST(req: Request) {
    const { userName, password } = await req.json();

    const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [userName, password]
    )

    if((rows as any[]).length > 0) {
        return NextResponse.json({ error: 'Invalid credentials'}, { status: 401 });
    }

    const payload = { userName };
    const token = jwt.sign(payload, SECRET_KEY!, { expiresIn: '5h' });

    const response = NextResponse.json({ message : 'Login success' });
    response.cookies.set('token', token, {
        httpOnly: true, 
        secure: false, 
        sameSite: 'strict', 
        maxAge: 3600 * 5,
    });

    return response
}