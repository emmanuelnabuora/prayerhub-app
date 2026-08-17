'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

// Calls the same admin-gated endpoint from Sprint 8 (organizations.controller.ts
// @Roles('admin','super_admin')) — this page is the UI that endpoint was always
// waiting on, not new backend logic.
export async function verifyOrganization(formData: FormData) {
  const orgId = formData.get('orgId') as string;
  await apiFetch(`/organizations/${orgId}/verify`, { method: 'POST' });
  revalidatePath('/organizations');
}
