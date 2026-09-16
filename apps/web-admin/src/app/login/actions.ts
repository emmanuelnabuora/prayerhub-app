'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) {
    if (loginRes.status === 401) return { error: 'Invalid email or password.' };
    if (loginRes.status === 429) return { error: 'Too many login attempts — please wait a minute and try again.' };
    const body = await loginRes.text().catch(() => '');
    return { error: `Login failed (HTTP ${loginRes.status}): ${body.slice(0, 200)}` };
  }
  const { accessToken } = await loginRes.json();

  const meRes = await fetch(`${API_URL}/admin/moderation/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (meRes.status === 403) {
    return { error: 'This account does not have admin or moderator access.' };
  }
  if (!meRes.ok) return { error: 'Could not verify admin access. Try again.' };

  cookies().set('admin_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  redirect('/dashboard');
}
