import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// The logged-in user's own profile — used for the Home greeting, Profile
// screen header, and anywhere else the app needs "who am I" rather than
// looking up another user by id.
export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => (await api.get('/users/me')).data,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { displayName?: string; bio?: string; interests?: string[]; churchAffiliation?: string; country?: string; timezone?: string; languages?: string[] }) =>
      (await api.patch('/users/me', updates)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['users', 'blocked'],
    queryFn: async () => (await api.get('/users/blocked')).data,
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => (await api.delete(`/users/${userId}/block`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'blocked'] }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => (await api.delete('/users/me')).data,
  });
}

export function useBlockUser() {
  return useMutation({
    mutationFn: async (userId: string) => (await api.post(`/users/${userId}/block`)).data,
  });
}
