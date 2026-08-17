import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Central API client with automatic access-token refresh on 401, matching the
// auth flow implemented in apps/api/src/auth. Tokens live in SecureStore, never
// in plain component state or AsyncStorage.
export const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1' });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw error;
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    }
    throw error;
  },
);
