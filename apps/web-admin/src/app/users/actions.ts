'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export async function grantRole(formData: FormData) {
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  // AdminService.grantRole enforces server-side that only a super_admin can
  // grant admin/super_admin — a plain admin submitting this form for those
  // roles gets a 403 from the API, not a UI that silently let them do it.
  await apiFetch('/admin/users/roles', {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  });
  revalidatePath('/users');
}

export async function revokeRole(formData: FormData) {
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  await apiFetch(`/admin/users/${userId}/roles/${role}`, { method: 'DELETE' });
  revalidatePath('/users');
}
