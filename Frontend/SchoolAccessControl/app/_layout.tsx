import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useAppTheme } from '../theme/ThemeContext';

function ThemedApp() {
  const { theme } = useAppTheme();
  
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Login Screen' }} />
          <Stack.Screen name="AdminPanel" options={{ title: 'Admin Panel' }} />
          <Stack.Screen name="TeacherPanel" options={{ title: 'Teacher Panel' }} />
          <Stack.Screen name="GuardPanel" options={{ title: 'Guard Panel' }} />
          <Stack.Screen name="GuardFacePanel" options={{ title: 'Guard Face Panel' }} />
        </Stack>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}