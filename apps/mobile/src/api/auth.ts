import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { api } from './client';

// Auth tokens are persisted in SecureStore (never AsyncStorage/plain state),
// matching the pattern client.ts already uses for its refresh interceptor.
// isAuthenticated is tracked via React Query's cache so App.tsx can reactively
// show LoginScreen vs the main Tab.Navigator without prop drilling.

export const AUTH_STATUS_KEY = ['auth', 'status'];

async function persistTokens(data: { accessToken: string; refreshToken: string }) {
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
}

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      (await api.post('/auth/login', credentials)).data,
    onSuccess: async (data) => {
      await persistTokens(data);
      queryClient.setQueryData(AUTH_STATUS_KEY, true);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; username: string; displayName: string }) =>
      (await api.post('/auth/register', payload)).data,
    onSuccess: async (data) => {
      await persistTokens(data);
      queryClient.setQueryData(AUTH_STATUS_KEY, true);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_STATUS_KEY, false);
    },
  });
}
