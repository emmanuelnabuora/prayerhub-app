import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function usePrayerFeed() {
  return useQuery({
    queryKey: ['prayers', 'feed'],
    queryFn: async () => (await api.get('/prayers')).data,
  });
}

export function useCreatePrayerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: { title: string; description: string; visibility: string; groupId?: string }) =>
      (await api.post('/prayers', request)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayers', 'feed'] }),
  });
}

export function useMarkPrayed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prayerId: string) => (await api.post(`/prayers/${prayerId}/pray`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayers', 'feed'] }),
  });
}
