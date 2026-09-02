import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => (await api.get('/search', { params: { q: query } })).data,
    enabled: query.trim().length >= 2,
  });
}
