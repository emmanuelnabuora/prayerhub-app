import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useJournal() {
  return useQuery({
    queryKey: ['journal'],
    queryFn: async () => (await api.get('/journal')).data,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { body: string; title?: string; scriptureReference?: string; category?: string }) =>
      (await api.post('/journal', entry)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  });
}

export function useMarkAnswered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => (await api.post(`/journal/${entryId}/mark-answered`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  });
}

export function useConvertToTestimony() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => (await api.post(`/journal/${entryId}/convert-to-testimony`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  });
}
