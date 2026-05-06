import { useContext, createContext, type PropsWithChildren, useCallback, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { useStorageState } from './useStorageState';
import { authService } from '@/services/authService';
import { registerUnauthorizedHandler } from '@/services/authInterceptor';
import { useSegments, useRouter } from 'expo-router';
import { User } from '@/types/types';

const AuthContext = createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  user: null,
  accessToken: null,
  isLoading: false,
});

/**
 * Hook to access authentication context
 */
export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

/**
 * Provider component that manages authentication state and routing
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoadingAccessToken, accessToken], setAccessToken] = useStorageState('accessToken');
  const [[isLoadingUser, userJson], setUser] = useStorageState('user');
  const router = useRouter();
  const segments = useSegments();
  
  const isLoading = isLoadingAccessToken || isLoadingUser;
  const user = userJson ? (JSON.parse(userJson) as User) : null;

  /**
   * Handle route protection based on auth state
   */
  useEffect(() => {
    if (isLoading) return; // Wait until loading is done

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicStaticPages = segments[0] === 'staticPages';
    
    if (accessToken && user && inAuthGroup) {
      // User is signed in but in auth group, redirect to home
      router.replace('/');
    } else if (!accessToken && !user && !inAuthGroup && !inPublicStaticPages) {
      // User is logged out and not already in auth, redirect to login
      router.replace('/(auth)/login');
    }
  }, [accessToken, user, isLoading, segments, router]);

  /**
   * Login with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.login(email, password);

      if (!response?.accessToken) {
        throw new Error('Authentication token was not returned');
      }

      setAccessToken(response.accessToken);
      setUser(response.user ? JSON.stringify(response.user) : null);

      // Identify user in RevenueCat so entitlements are associated with this app user
      try {
        if (Platform.OS !== 'web' && response?.user) {
          const appUserId = response.user.id ?? response.user.email;
          if (appUserId) {
            const rcResult = await Purchases.logIn(String(appUserId));
            try {
              console.log('useSession.signIn: RevenueCat logIn result:', JSON.stringify(rcResult));
            } catch (e) {
              console.log('useSession.signIn: RevenueCat logIn succeeded');
            }
          }
        }
      } catch (err) {
        console.error('RevenueCat logIn failed during signIn:', err);
      }
    } catch (error) {
      setAccessToken(null);
      setUser(null);
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  /**
   * Register new user account
   */
  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.register(email, password);

      if (!response?.accessToken) {
        throw new Error('Authentication token was not returned');
      }

      setAccessToken(response.accessToken);
      setUser(response.user ? JSON.stringify(response.user) : null);

      // Identify user in RevenueCat immediately after signup so paywall calls
      // that follow will be associated with the correct app user.
      try {
        if (Platform.OS !== 'web' && response?.user) {
          const appUserId = response.user.id ?? response.user.email;
          if (appUserId) {
            const rcResult = await Purchases.logIn(String(appUserId));
            try {
              console.log('useSession.signUp: RevenueCat logIn result:', JSON.stringify(rcResult));
            } catch (e) {
              console.log('useSession.signUp: RevenueCat logIn succeeded');
            }
          }
        }
      } catch (err) {
        console.error('RevenueCat logIn failed during signUp:', err);
      }
    } catch (error) {
      setAccessToken(null);
      setUser(null);
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  /**
   * Logout and clear session
   */
  const signOut = useCallback(async (): Promise<void> => {
    const tokenToRevoke = accessToken || undefined;

    // Optimistically clear local session first so UI/navigation updates immediately.
    setAccessToken(null);
    setUser(null);

    // Log out from RevenueCat as well (non-blocking)
    try {
      if (Platform.OS !== 'web') {
        await Purchases.logOut();
      }
    } catch (err) {
      console.error('RevenueCat logOut failed during signOut:', err);
    }
    // Revoke server session in background. Do not block logout UX on network latency.
    authService.logout(tokenToRevoke).catch((error) => {
      console.error('Sign out failed:', error);
    });
  }, [accessToken, setAccessToken, setUser]);

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      void signOut();
    });
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signOut,
        user,
        accessToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
