import React, { useCallback, useEffect } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import { queryClient } from './src/api/queryClient';
import { AUTH_STATUS_KEY, getStoredAccessToken } from './src/api/auth';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';

SplashScreen.preventAutoHideAsync();

// Fraunces is the display face across the whole brand system (landing page
// wordmark, logo, and now the app) — held behind the splash screen rather than
// flashing system-font titles for a frame before swapping, which would read as
// unpolished on a screen this typography-forward.

// Reads whether a token exists in SecureStore on mount, then trusts React
// Query's cache going forward — useLogin/useRegister/useLogout write directly
// to this cache key so the switch between LoginScreen and the main app is
// reactive with no prop drilling or separate context needed.
function useIsAuthenticated() {
  return useQuery({
    queryKey: AUTH_STATUS_KEY,
    queryFn: async () => {
      const token = await getStoredAccessToken();
      return !!token;
    },
    staleTime: Infinity,
  });
}

function AppContent() {
  const { data: isAuthenticated, isLoading } = useIsAuthenticated();
  if (isLoading) return null;
  return isAuthenticated ? <RootNavigator /> : <LoginScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Fraunces_400Regular,
  });
  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);
  useEffect(() => { onLayout(); }, [onLayout]);
  if (!fontsLoaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
