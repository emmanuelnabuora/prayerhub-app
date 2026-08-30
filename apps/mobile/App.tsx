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
import { useCurrentUser } from './src/api/users';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

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

// Once authenticated, checks whether the user has ever saved interests —
// zero interests means they registered but never completed onboarding
// (a brand-new account, or one that predates this feature). Completing
// onboarding calls useUpdateProfile, which invalidates this same query,
// so the switch to RootNavigator happens automatically with no extra state.
function AuthenticatedContent() {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return null;
  const hasCompletedOnboarding = (user?.interests?.length ?? 0) > 0;
  return hasCompletedOnboarding ? <RootNavigator /> : <OnboardingScreen onComplete={() => {}} />;
}

function AppContent() {
  const { data: isAuthenticated, isLoading } = useIsAuthenticated();
  if (isLoading) return null;
  return isAuthenticated ? <AuthenticatedContent /> : <LoginScreen />;
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
