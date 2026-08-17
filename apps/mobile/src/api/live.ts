import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useLiveRooms() {
  return useQuery({
    queryKey: ['live', 'rooms'],
    queryFn: async () => (await api.get('/live/rooms')).data,
    refetchInterval: 15000, // rooms go live/end frequently; poll rather than require a socket just to browse
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (room: { title: string; topic?: string; scheduledFor?: string }) =>
      (await api.post('/live/rooms', room)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live', 'rooms'] }),
  });
}

export function useRoom(roomId: string | undefined) {
  return useQuery({
    queryKey: ['live', 'room', roomId],
    queryFn: async () => (await api.get(`/live/rooms/${roomId}`)).data,
    enabled: !!roomId,
    refetchInterval: 5000,
  });
}

export function useJoinRoomToken(roomId: string) {
  return useMutation({
    mutationFn: async () => (await api.post(`/live/rooms/${roomId}/token`)).data as
      { token: string; sfuUrl: string; role: string },
  });
}

export function useRaiseHand(roomId: string) {
  return useMutation({ mutationFn: async () => (await api.post(`/live/rooms/${roomId}/raise-hand`)).data });
}

export function useChangeRole(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { targetUserId: string; role: 'co_host' | 'speaker' | 'listener' }) =>
      (await api.post(`/live/rooms/${roomId}/role`, vars)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live', 'room', roomId] }),
  });
}

export function useRemoveParticipant(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) =>
      (await api.post(`/live/rooms/${roomId}/remove`, { targetUserId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live', 'room', roomId] }),
  });
}

export function useEndRoom(roomId: string) {
  return useMutation({ mutationFn: async () => (await api.post(`/live/rooms/${roomId}/end`)).data });
}
