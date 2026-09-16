import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useOrganizations(type?: string) {
  return useQuery({
    queryKey: ['organizations', type],
    queryFn: async () => (await api.get('/organizations', { params: type ? { type } : {} })).data,
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async () => (await api.get(`/organizations/${id}`)).data,
    enabled: !!id,
  });
}

export function useOrganizationAnnouncements(id: string | undefined) {
  return useQuery({
    queryKey: ['organizations', id, 'announcements'],
    queryFn: async () => (await api.get(`/organizations/${id}/announcements`)).data,
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (org: { name: string; slug: string; type: 'church' | 'ministry'; description?: string }) =>
      (await api.post('/organizations', org)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useFollowOrganization(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/organizations/${id}/follow`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations', id] }),
  });
}

export function usePostAnnouncement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcement: { title: string; body: string }) =>
      (await api.post(`/organizations/${id}/announcements`, announcement)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations', id, 'announcements'] }),
  });
}

export function useOrganizationPrayers(id: string | undefined) {
  return useQuery({
    queryKey: ['organizations', id, 'prayers'],
    queryFn: async () => (await api.get(`/organizations/${id}/prayers`)).data,
    enabled: !!id,
  });
}
