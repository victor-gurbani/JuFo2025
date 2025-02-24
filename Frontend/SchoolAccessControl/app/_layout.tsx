import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Login Screen' }} />
        <Stack.Screen name="AdminPanel" options={{ title: 'Admin Panel' }} />
        <Stack.Screen name="TeacherPanel" options={{ title: 'Teacher Panel' }} />
        <Stack.Screen name="GuardPanel" options={{ title: 'Guard Panel' }} />
      </Stack>
    </SafeAreaProvider>
  );
}