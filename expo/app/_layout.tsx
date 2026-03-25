import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { SearchHistoryProvider } from "@/hooks/useSearchHistory";
import { AuthProvider } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { httpLink } from "@trpc/client";
import superjson from "superjson";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on network errors or 4xx errors
        if (error instanceof Error && 
            (error.message.includes('fetch') || 
             error.message.includes('network') ||
             error.message.includes('Failed to fetch'))) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: process.env.EXPO_PUBLIC_RORK_API_BASE_URL 
        ? `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api/trpc`
        : 'http://localhost:3000/api/trpc',
      transformer: superjson,
      fetch: (url, options) => {
        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).catch((error) => {
          clearTimeout(timeoutId);
          console.warn('tRPC fetch error:', error.message);
          throw error;
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    }),
  ],
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <AuthProvider>
          <SearchHistoryProvider>
            <GestureHandlerRootView style={styles.container}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </SearchHistoryProvider>
        </AuthProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});