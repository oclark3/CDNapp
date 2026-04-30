import  { useEffect, useCallback, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
  return useReducer(
    (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    // Web fallback uses localStorage, which is weaker than secure httpOnly cookies.
    // If web auth becomes a primary flow, prefer migrating to cookie-based sessions.
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } else {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

export function useStorageState(key: string): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  useEffect(() => {
    const loadValue = async () => {
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') {
            setState(localStorage.getItem(key));
          }
        } catch (e) {
          console.error('Local storage is unavailable:', e);
        }
      } else {
        const value = await SecureStore.getItemAsync(key);
        setState(value);
      }
    };

    loadValue();
  }, [key]);

  // Set
  const setValue = useCallback(
    (value: string | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key]
  );

  return [state, setValue];
}
