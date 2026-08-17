'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

// The only place a moderation case's status actually changes. AI triage
// (apps/api/src/moderation/ai-triage.service.ts) only ever writes a
// suggestion — this server action, requiring a human-typed resolutionNotes
// string, is what the whole pipeline is built to feed into.
export async function resolveCase(formData: FormData) {
  const caseId = formData.get('caseId') as string;
  const status = formData.get('status') as 'resolved' | 'dismissed';
  const resolutionNotes = formData.get('resolutionNotes') as string;

  await apiFetch(`/admin/moderation/${caseId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status, resolutionNotes }),
  });
  revalidatePath('/moderation');
}
