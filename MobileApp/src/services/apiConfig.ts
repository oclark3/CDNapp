import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Prefer Expo public env var or app config extra
const envBase = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

const getExpoHostIp = (): string | undefined => {
  const expoGoDebuggerHost = (Constants as any)?.expoGoConfig?.debuggerHost as string | undefined;
  const manifest2Host = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri as string | undefined;
  const legacyManifestDebuggerHost = (Constants as any)?.manifest?.debuggerHost as string | undefined;
  const legacyManifestHost = (Constants as any)?.manifest?.hostUri as string | undefined;

  const hostSource =
    expoGoDebuggerHost ||
    manifest2Host ||
    legacyManifestDebuggerHost ||
    legacyManifestHost;

  if (!hostSource) return undefined;

  const host = hostSource.split(':')[0];
  return host || undefined;
};

const inferredLanBase = (() => {
  const expoHostIp = getExpoHostIp();
  if (!expoHostIp) return undefined;
  return `http://${expoHostIp}:3000`;
})();

// Fallbacks for local dev per platform
const platformBase = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000' // Android emulator talks to host via 10.0.2.2
  : 'http://localhost:3000'; // iOS simulator or web

// Enforce HTTPS for production builds (non-dev environments)
const isProduction = __DEV__ === false;
const baseUrl = envBase || inferredLanBase || platformBase;
const finalUrl = isProduction && !baseUrl.startsWith('https') 
  ? baseUrl.replace('http://', 'https://')
  : baseUrl;

export const API_BASE_URL = finalUrl;

export const buildApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
