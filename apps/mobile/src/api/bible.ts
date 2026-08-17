import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useBibleBooks() {
  return useQuery({ queryKey: ['bible', 'books'], queryFn: async () => (await api.get('/bible/books')).data, staleTime: Infinity });
}

export function useBibleChapter(bookId: string | undefined, chapter: number | undefined) {
  return useQuery({
    queryKey: ['bible', 'chapter', bookId, chapter],
    queryFn: async () => (await api.get(`/bible/chapters/${bookId}/${chapter}`)).data,
    enabled: !!bookId && !!chapter,
  });
}

export function useDailyVerse() {
  return useQuery({ queryKey: ['bible', 'daily-verse'], queryFn: async () => (await api.get('/bible/daily-verse')).data });
}

export function useBibleSearch(query: string) {
  return useQuery({
    queryKey: ['bible', 'search', query],
    queryFn: async () => (await api.get('/bible/search', { params: { q: query } })).data,
    enabled: query.length > 2,
  });
}

export function useBookmarks() {
  return useQuery({ queryKey: ['bible', 'bookmarks'], queryFn: async () => (await api.get('/bible/bookmarks')).data });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookmark: { bookId: string; chapter: number; verseStart: number; verseEnd?: number; referenceLabel: string }) =>
      (await api.post('/bible/bookmarks', bookmark)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bible', 'bookmarks'] }),
  });
}
