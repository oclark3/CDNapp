// Root layout file that manages the overall navigation stack

import { router, Stack, SplashScreen } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { useEffect } from "react";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from 'react-native';
import { ENV_VARS } from "@/utils/envVars"

// const appConfig = Constants.expoConfig?.extra as {
//   revenueCatAppleApiKey?: string;
//   revenueCatAndroidApiKey?: string;
// };

// const revenueCatAppleApiKey = appConfig?.revenueCatAppleApiKey || process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
// const revenueCatAndroidApiKey = appConfig?.revenueCatAndroidApiKey || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

// Prevent the splash screen from auto-hiding until the app is ready
SplashScreen.preventAutoHideAsync();

function SplashScreenController() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      // Hide the splash screen once loading is complete
      SplashScreen.hide();
    }
  }, [isLoading]);

  return null;
}

function RootNavigator() {
  const { accessToken, isLoading, user } = useSession();

  // Identify customer in RevenueCat when user logs in
  useEffect(() => {
    const appUserId = user?.id ?? user?.email;

    // if (appUserId) {
    //   // RevenueCat requires a string ID; coerce any numeric IDs
    //   Purchases.logIn(String(appUserId)).catch((error) => {
    //     console.error("Error logging in to RevenueCat:", error);
    //   });
    // } else {
    //   // Log out of RevenueCat when user signs out
    //   Purchases.logOut().catch((error) => {
    //     console.error("Error logging out of RevenueCat:", error);
    //   });
    // }
  }, [user]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="newsArticle" options={{ headerShown: false }} />
      <Stack.Screen name="staticPages" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? ENV_VARS.IOS_REVENUECAT_API_KEY : ENV_VARS.ANDROID_REVENUECAT_API_KEY;
    if (!apiKey) {
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
  }, []);

  return (
    <SessionProvider>
      <PaperProvider>
        <SplashScreenController />
        <RootNavigator />
      </PaperProvider>
    </SessionProvider>
  );
}