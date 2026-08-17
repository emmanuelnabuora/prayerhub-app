// Minimal server-side fetch helper — every admin page is a Server Component
// that reads the session token from a cookie and calls the same PrayerHubApp
// API the mobile app uses. No separate "admin API"; the only difference is
// which platform role the calling user holds (see docs/15-ADMIN-CONSOLE.md).
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = cookies().get('admin_token')?.value;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}
