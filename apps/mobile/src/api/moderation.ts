import { useMutation } from '@tanstack/react-query';
import { api } from './client';

export function useCreateReport() {
  return useMutation({
    mutationFn: async (report: {
      targetType: 'user' | 'prayer_request' | 'comment' | 'message' | 'room' | 'post' | 'testimony';
      targetId: string;
      reason: string;
    }) => (await api.post('/reports', report)).data,
  });
}
