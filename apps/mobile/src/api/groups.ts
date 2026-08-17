import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useDiscoverGroups(type?: string) {
  return useQuery({
    queryKey: ['groups', 'discover', type],
    queryFn: async () => (await api.get('/groups', { params: type ? { type } : {} })).data,
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: async () => (await api.get('/groups/mine')).data,
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data,
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: async () => (await api.get(`/groups/${groupId}/members`)).data,
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (group: { name: string; description?: string; visibility: string; groupType?: string }) =>
      (await api.post('/groups', group)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'discover'] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'mine'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => (await api.post(`/groups/${groupId}/join`)).data,
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useSetGroupSchedule(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { days: string[]; time: string; timezone: string; durationMinutes?: number }) =>
      (await api.patch(`/groups/${groupId}/schedule`, { schedule })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}
