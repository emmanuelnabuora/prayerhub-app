import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get('/conversations')).data,
    refetchInterval: 20000,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => (await api.get(`/conversations/${conversationId}`)).data,
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async () => (await api.get(`/conversations/${conversationId}/messages`)).data,
    enabled: !!conversationId,
  });
}

export function useStartDirectConversation() {
  return useMutation({
    mutationFn: async (userId: string) => (await api.post('/conversations/direct', { userId })).data,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: { type: string; body?: string }) =>
      (await api.post(`/conversations/${conversationId}/messages`, message)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] }),
  });
}

export function useMarkRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/conversations/${conversationId}/read`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
