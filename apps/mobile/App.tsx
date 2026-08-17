import React, { useCallback, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import { queryClient } from './src/api/queryClient';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

// Fraunces is the display face across the whole brand system (landing page
// wordmark, logo, and now the app) — held behind the splash screen rather than
// flashing system-font titles for a frame before swapping, which would read as
// unpolished on a screen this typography-forward.
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
      <RootNavigator />
    </QueryClientProvider>
  );
}
