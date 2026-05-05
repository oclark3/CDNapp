// import Constants from 'expo-constants';

// type AppExtra = {
//     revenueCatAppleApiKey?: string;
//     revenueCatAndroidApiKey?: string;
// };

// const appExtra = Constants.expoConfig?.extra as AppExtra | undefined;

// export const ENV_VARS = {
//     ANDROID_REVENUECAT_API_KEY:
//         appExtra?.revenueCatAndroidApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
//     IOS_REVENUECAT_API_KEY:
//         appExtra?.revenueCatAppleApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
// };
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const ENV_VARS = {
    ANDROID_REVENUECAT_API_KEY: process.env.ANDROID_REVENUECAT_API_KEY,
    IOS_REVENUECAT_API_KEY: process.env.IOS_REVENUECAT_API_KEY,
};