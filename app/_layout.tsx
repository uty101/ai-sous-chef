// @refresh reset

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { BrandIntro } from '@/components/brand-intro';
import { MePanelContext } from '@/contexts/me-panel-context';
import type { Units } from '@/utils/units';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [meOpen, setMeOpen] = useState(false);
  const [units, setUnitsState] = useState<Units>('metric');
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@sous_chef_settings').then((val) => {
      if (val) {
        try {
          const s = JSON.parse(val);
          if (s.units === 'imperial') setUnitsState('imperial');
          if (s.darkMode === true) setDarkModeState(true);
        } catch {}
      }
    });
  }, []);

  const handleIntroComplete = useCallback(() => {
    setHasSeenIntro(true);
  }, []);

  if (!hasSeenIntro) {
    return <BrandIntro onComplete={handleIntroComplete} />;
  }

  return (
    <MePanelContext.Provider value={{
      meOpen,
      openMe: () => setMeOpen(true),
      closeMe: () => setMeOpen(false),
      units,
      setUnits: setUnitsState,
      darkMode,
      setDarkMode: setDarkModeState,
    }}>
      <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(features)" options={{ headerShown: false }} />
          <Stack.Screen
            name="camera"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </MePanelContext.Provider>
  );
}
