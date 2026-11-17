import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProProvider } from '../lib/pro';
import { StoreProvider, useStore } from '../lib/store';
import { colors } from '../lib/theme';

function Gate() {
  const { ready } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="doc/edit" options={{ title: '' }} />
      <Stack.Screen name="doc/[id]" options={{ title: '' }} />
      <Stack.Screen name="client/[id]" options={{ title: 'Client', presentation: 'modal' }} />
      <Stack.Screen name="item/[id]" options={{ title: 'Item', presentation: 'modal' }} />
      <Stack.Screen name="pick-client" options={{ title: 'Choose client', presentation: 'modal' }} />
      <Stack.Screen name="pick-item" options={{ title: 'Add item', presentation: 'modal' }} />
      <Stack.Screen name="business" options={{ title: 'Business profile' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ProProvider>
          <StatusBar style="dark" />
          <Gate />
        </ProProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
