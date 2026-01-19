import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const SECRET_KEY = process.env.JWT_SECRET
export async function POST(req: NextRequest , { params } : { params: { action: string } }) {
        const { usercode, password, action } = await req.json();
        let response  = NextResponse.json({message: '', token: ''});
        if(action == 'login') {
            let conn;
            try {
                conn = await db.getConnection();


                const [rows] = await conn.query(
                    'SELECT * FROM users WHERE usercode = ? AND password = ?',
                    [usercode, password]
                )

                console.log('rows', rows)
                if((rows as any[]).length === 0) {
                    response = NextResponse.json({message: 'Login failed', token: ''}, {status: 500});
                } else {
                    const payload = { usercode };
                    const token = jwt.sign(payload, SECRET_KEY!, { expiresIn: '5h' });

                    response = NextResponse.json({ message : 'Login success', token: token });
                    response.cookies.set('token', token, {
                        httpOnly: true, 
                        secure: process.env.NODE_ENV === 'production', 
                        sameSite: 'lax', 
                        maxAge: 3600 * 5,
                        path: '/',
                    });
                }
                return response
            } catch (err: any) {
                throw err
            } finally {
                if (conn) conn.end();
            }
        }

        if(action == 'logout') {
            const response = NextResponse.json({ message: 'Logout success' });
            response.cookies.set('token', '', {
                httpOnly: true,
                expires: new Date(0),
                path: '/',
            });
            return response;
        }     

        if(action == 'newid') {
            let conn;
            try {
                conn = await db.getConnection();
                
                const {newid_usercode, newid_username, newid_password} = await req.json();
            } catch (err: any) {
                throw err
            } finally {
                if (conn) conn.end();
            }
        }
}