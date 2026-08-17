'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// This is the same /auth/login every mobile user hits — there is no separate
// "admin login" endpoint (see docs/02-ARCHITECTURE.md section 6). What gates
// entry to the console is the role check right after: a valid PrayerHubApp
// account with no admin/moderator role logs in successfully but is redirected
// straight back out with an explanatory message, never silently into a blank
// dashboard.
export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) return { error: 'Invalid email or password.' };
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
    maxAge: 60 * 15, // matches the API's short-lived access token TTL
    path: '/',
  });
  redirect('/dashboard');
}
