import { useContext, createContext, type PropsWithChildren, useCallback, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { useStorageState } from './useStorageState';
import { authService } from '@/services/authService';
import { registerUnauthorizedHandler } from '@/services/authInterceptor';
import { useSegments, useRouter } from 'expo-router';
import { AuthResponse, User } from '@/types/types';
import { checkAndHandleExpiration } from '@/services/Paywall';
import { Alert } from 'react-native';

const AuthContext = createContext<{
  authenticate: (email: string, password: string) => Promise<AuthResponse>;
  completeSession: (response: AuthResponse) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}>({
  authenticate: async () => { throw new Error('Not implemented'); },
  completeSession: async () => {},
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

  const completeSession = useCallback(async (response: AuthResponse): Promise<void> => {
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
            if (__DEV__) {
              const safeRcResult = {
                created: rcResult?.created ?? null,
                customerInfo: {
                  activeEntitlements: Object.keys(rcResult?.customerInfo?.entitlements?.active ?? {}).length,
                  latestExpirationDate: rcResult?.customerInfo?.latestExpirationDate ?? null,
                },
              };
              console.log('useSession.completeSession: RevenueCat logIn result (sanitized):', JSON.stringify(safeRcResult));
            }
          } catch (e) {
            if (__DEV__) console.log('useSession.completeSession: RevenueCat logIn succeeded');
          }
        }
      }
    } catch (err) {
      console.error('RevenueCat logIn failed during completeSession:', err);
    }
  }, [setAccessToken, setUser]);

  /**
   * Authenticate with email and password without persisting the session yet.
   */
  const authenticate = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    return await authService.login(email, password);
  }, []);

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
      const response = await authenticate(email, password);
      await completeSession(response);
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
              if (__DEV__) {
                const safeRcResult = {
                  created: rcResult?.created ?? null,
                  customerInfo: {
                    activeEntitlements: Object.keys(rcResult?.customerInfo?.entitlements?.active ?? {}).length,
                    latestExpirationDate: rcResult?.customerInfo?.latestExpirationDate ?? null,
                  },
                };
                console.log('useSession.signUp: RevenueCat logIn result (sanitized):', JSON.stringify(safeRcResult));
              }
            } catch (e) {
              if (__DEV__) console.log('useSession.signUp: RevenueCat logIn succeeded');
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

  /**
   * Handle subscription expiration by showing alert and logging out
   */
  const handleSubscriptionExpired = useCallback(async (): Promise<void> => {
    if (__DEV__) console.log('handleSubscriptionExpired: Subscription expired, showing alert and logging out');
    
    Alert.alert(
      'Subscription Expired',
      'Your subscription has expired. You will be logged out.',
      [
        {
          text: 'OK',
          onPress: async () => {
            // Log out after user dismisses alert
            await signOut();
          },
        },
      ],
      { cancelable: false }
    );
  }, [signOut]);

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      void signOut();
    });
  }, [signOut]);

  /**
   * Set up RevenueCat listener for real-time subscription changes
   */
  useEffect(() => {
    if (Platform.OS === 'web' || !accessToken) {
      return;
    }

    if (__DEV__) console.log('useSession: Setting up RevenueCat customerInfoUpdateListener');

    // addCustomerInfoUpdateListener does not return an unsubscribe function
    // It sets up a listener that remains active for the lifetime of the app
    Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      if (__DEV__) {
        console.log('useSession: Received RevenueCat customerInfoUpdate');
      }

      // Check if subscription is expired
      const isExpired = await checkAndHandleExpiration();
      if (isExpired) {
        if (__DEV__) console.log('useSession: Subscription expired via listener, triggering logout');
        await handleSubscriptionExpired();
      }
    });

    // Listener is set up and will remain active
    // Note: RevenueCat SDK manages listener cleanup, no manual unsubscribe available
  }, [accessToken, handleSubscriptionExpired]);

  /**
   * Set up AppState listener for app resume to check subscription expiration
   */
  useEffect(() => {
    if (Platform.OS === 'web' || !accessToken) {
      return;
    }

    if (__DEV__) console.log('useSession: Setting up AppState listener');

    const subscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active') {
        if (__DEV__) console.log('useSession: App resumed, checking subscription expiration');

        try {
          const isExpired = await checkAndHandleExpiration();
          if (isExpired) {
            if (__DEV__) console.log('useSession: Subscription expired on app resume, triggering logout');
            await handleSubscriptionExpired();
          }
        } catch (error) {
          console.error('useSession: Error checking subscription on app resume:', error);
        }
      }
    });

    return () => {
      if (__DEV__) console.log('useSession: Removing AppState listener');
      subscription.remove();
    };
  }, [accessToken, handleSubscriptionExpired]);

  /**
   * Check subscription expiration on initial session load
   */
  useEffect(() => {
    if (Platform.OS === 'web' || !accessToken || isLoading) {
      return;
    }

    if (__DEV__) console.log('useSession: Checking subscription on session load');

    const checkExpiration = async () => {
      try {
        const isExpired = await checkAndHandleExpiration();
        if (isExpired) {
          if (__DEV__) console.log('useSession: Subscription expired on session load, triggering logout');
          await handleSubscriptionExpired();
        }
      } catch (error) {
        console.error('useSession: Error checking subscription on session load:', error);
      }
    };

    void checkExpiration();
  }, [accessToken, isLoading, handleSubscriptionExpired]);

  return (
    <AuthContext.Provider
      value={{
        authenticate,
        completeSession,
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
