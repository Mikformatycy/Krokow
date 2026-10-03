import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Head><title>Kroków</title></Head>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" options={{ title: 'Kroków' }} />
        <Stack.Screen name="about-data" options={{ title: 'Informacje o danych — Kroków' }} />
        <Stack.Screen name="plan" options={{ title: 'Przykład trasy — Kroków' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
