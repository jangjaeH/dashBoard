import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET
export async function POST(req: Request) {
        let conn;
        try {
            conn = await db.getConnection();

            const { usercode, password } = await req.json();

            const [rows] = await conn.query(
                'SELECT * FROM users WHERE usercode = ? AND password = ?',
                [usercode, password]
            )

            if((rows as any[]).length > 0) {
                return NextResponse.json({ error: 'Invalid credentials'}, { status: 401 });
            }

            const payload = { usercode };
            const token = jwt.sign(payload, SECRET_KEY!, { expiresIn: '5h' });

            const response = NextResponse.json({ message : 'Login success', token: token });
            response.cookies.set('token', token, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax', 
                maxAge: 3600 * 5,
                path: '/',
            });
            console.log('response:', response)
            return response
    } catch (err: any) {
        throw err
    } finally {
        if (conn) conn.end();
    }
}