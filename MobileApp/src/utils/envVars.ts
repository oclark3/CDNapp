import Constants from 'expo-constants';

type AppExtra = {
    revenueCatAppleApiKey?: string;
    revenueCatAndroidApiKey?: string;
};

const appExtra = Constants.expoConfig?.extra as AppExtra | undefined;

export const ENV_VARS = {
    ANDROID_REVENUECAT_API_KEY:
        appExtra?.revenueCatAndroidApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    IOS_REVENUECAT_API_KEY:
        appExtra?.revenueCatAppleApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
};