import React, { useState } from "react";
import { Text, View, ScrollView, Image, Alert, Platform } from "react-native";
import { useSession } from "@/hooks/useSession";
import { TextInput, Button } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from 'expo-constants';
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import { presentPaywallIfNeeded, checkProStatus } from "@/services/Paywall";
import Purchases from "react-native-purchases";

export default function LoginScreen() {
  const { signIn, signOut } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle login with email and password
   */
  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      // Call the real authentication API
      await signIn(email, password);

      const appConfig = Constants.expoConfig?.extra as {
        revenueCatAppleApiKey?: string;
        revenueCatAndroidApiKey?: string;
      };

      const hasRevenueCatKey = Boolean(
        appConfig?.revenueCatAppleApiKey ||
        appConfig?.revenueCatAndroidApiKey ||
        process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
        process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
      );

      if (Platform.OS !== 'web' && hasRevenueCatKey) {
        try {
          const isPro = await checkProStatus();

          if (!isPro) {
            // User does not have entitlement; present paywall
            const result = await presentPaywallIfNeeded();

            // Handle paywall result
            if (result === PAYWALL_RESULT.CANCELLED) {
              // User dismissed paywall without purchasing; log them out and stay on login
              console.log('User dismissed paywall; logging out');
              await signOut();
              return;
            } else if (
              result === PAYWALL_RESULT.PURCHASED ||
              result === PAYWALL_RESULT.RESTORED
            ) {
              // User subscribed; proceed to home
              console.log('User subscribed; proceeding to home');
            } else {
              console.log('Paywall result:', result);
            }
          }
          // If isPro is true or user just subscribed, proceed to home
        } catch (err) {
          console.error('Error checking/presenting paywall after signIn:', err);
        }
      }

      // Navigation will be handled by the session provider effect; navigate to home
      try {
        router.replace('/');
      } catch (e) {
        // ignore router errors
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Login Failed', errorMessage);
      setPassword(''); // Clear password on error
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 }}>
        <Image
          source={require("@assets/logo.png")}
          style={{ width: '80%', alignSelf: 'center', marginVertical: 40 }}
          resizeMode="contain"
        />
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Login</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text.toLowerCase());
            if (errors.email) {
              setErrors({ ...errors, email: undefined });
            }
          }}
          placeholder="example@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={{ marginBottom: 5 }}
          error={!!errors.email}
        />
        {errors.email && (
          <Text style={{ color: '#d32f2f', fontSize: 12, marginBottom: 15 }}>
            {errors.email}
          </Text>
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) {
              setErrors({ ...errors, password: undefined });
            }
          }}
          placeholder="Enter your password"
          secureTextEntry
          editable={!loading}
          style={{ marginBottom: 5 }}
          error={!!errors.password}
        />
        {errors.password && (
          <Text style={{ color: '#d32f2f', fontSize: 12, marginBottom: 15 }}>
            {errors.password}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !email || !password}
          style={{ paddingVertical: 8, marginTop: 10 }}
        >
          {loading ? 'Signing in...' : 'Login'}
        </Button>

        

        <Text style={{ textAlign: 'center' }}>
          {"\n"}
          {"\n"}
          <Link href="/(auth)/signup" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold' }}>
            Don't have an account? Sign Up
          </Link>
          {"\n"}
          {"\n"}
          <Link href="/(auth)/forgotPassword" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold' }}>
            Forgot your password?
          </Link>
          {"\n"}
          {"\n"}
          {"\n"}
            <Link href="/staticPages/terms">
              <Text style={{ color: '#666', textDecorationLine: 'underline' }}>Terms of Use</Text>
          </Link>
          {' '}|{' '}
            <Link href="/staticPages/privacy">
              <Text style={{ color: '#666', textDecorationLine: 'underline' }}>Privacy Policy</Text>
          </Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}