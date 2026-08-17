import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  cookies().delete('admin_token');
  return NextResponse.redirect(new URL('/login', req.url));
}
