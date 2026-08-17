import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: async () => (await api.get('/feed')).data });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { type: string; body?: string; scriptureReference?: string; mediaAssetId?: string; groupId?: string }) =>
      (await api.post('/feed', post)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useReactToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { postId: string; type: 'amen' | 'pray' | 'encourage' }) =>
      (await api.post(`/feed/${vars.postId}/react`, { type: vars.type })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useTestimonies() {
  return useQuery({ queryKey: ['testimonies'], queryFn: async () => (await api.get('/testimonies')).data });
}

export function useCreateTestimony() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testimony: { category: string; body?: string; mediaType: string; mediaAssetId?: string }) =>
      (await api.post('/testimonies', testimony)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testimonies'] }),
  });
}

export function useReactToTestimony() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { testimonyId: string; type: 'amen' | 'encourage' }) =>
      (await api.post(`/testimonies/${vars.testimonyId}/react`, { type: vars.type })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testimonies'] }),
  });
}

// Audio-post upload flow: get a signed URL, PUT the recorded file straight to
// storage, then confirm — mirrors apps/api/src/media exactly, so the API server
// never touches the audio bytes.
export function useRequestUpload() {
  return useMutation({
    mutationFn: async (vars: { mediaType: 'audio' | 'image' | 'video'; contentType: string }) =>
      (await api.post('/media/upload-url', vars)).data as { mediaAssetId: string; uploadUrl: string; publicUrl: string },
  });
}

export function useConfirmUpload() {
  return useMutation({
    mutationFn: async (vars: { mediaAssetId: string; durationSeconds?: number }) =>
      (await api.post(`/media/${vars.mediaAssetId}/confirm`, { durationSeconds: vars.durationSeconds })).data,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['search', 'users', query],
    queryFn: async () => (await api.get('/users/search', { params: { q: query } })).data,
    enabled: query.length > 1,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => (await api.post(`/users/${userId}/follow`)).data,
    onSuccess: (_d, userId) => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
  });
}
