import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    const { userName, password } = await req.json();

    const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [userName, password]
    )

    if((rows as any[]).length > 0) {
        return NextResponse.json({ error: 'Invalid credentials'}, { status: 401 });
    }

    return NextResponse.json({ message: 'Login success' });
}