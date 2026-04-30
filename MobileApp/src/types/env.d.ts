declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?: string;
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};