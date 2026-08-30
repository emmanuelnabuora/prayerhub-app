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
