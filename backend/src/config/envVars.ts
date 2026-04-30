// To manage environment variables in one place

import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV_VARS = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 3000,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || ['http://localhost:3000'],
    WEB_SERVICE_KEY: process.env.WEB_SERVICE_KEY,
    WEB_SERVICE_SECRET: process.env.WEB_SERVICE_SECRET,
    WEB_SERVICE_BASE: process.env.WEB_SERVICE_BASE,
    ANDROID_REVENUECAT_API_KEY: process.env.ANDROID_REVENUECAT_API_KEY,
    IOS_REVENUECAT_API_KEY: process.env.IOS_REVENUECAT_API_KEY,
    // EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    // APP_URL: process.env.APP_URL,
};