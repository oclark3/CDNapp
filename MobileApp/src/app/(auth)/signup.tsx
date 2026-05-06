import React, { useState } from "react";
import { Text, View, ScrollView, Image, Alert, Platform } from "react-native";
import { useSession } from "@/hooks/useSession";
import { TextInput, Button } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import { checkProStatus, presentPaywallIfNeeded } from "@/services/Paywall";
import Constants from 'expo-constants';

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

export default function SignUpScreen() {
  const { signUp } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  /**
   * Handle user registration
   */
  const handleSignUp = async () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string 
    } = {};

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (Platform.OS !== 'web' && hasRevenueCatKey) {
        const isProBeforePaywall = await checkProStatus();

        if (!isProBeforePaywall) {
          const result = await presentPaywallIfNeeded();

          if (result === PAYWALL_RESULT.CANCELLED) {
            console.log('User dismissed paywall before signup; staying on signup screen');
            return;
          }

          if (result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED) {
            console.error('Paywall was not completed successfully before signup');
            return;
          }
        }
      }

      const hasAccessAfterPaywall = Platform.OS === 'web' ? true : await checkProStatus();
      if (!hasAccessAfterPaywall) {
        Alert.alert('Subscription Required', 'Please subscribe to continue creating your account.');
        return;
      }

      await signUp(email, password);

      router.replace('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
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

        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Create Account</Text>

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
          placeholder="At least 8 characters"
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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) {
              setErrors({ ...errors, confirmPassword: undefined });
            }
          }}
          placeholder="Re-enter password"
          secureTextEntry
          editable={!loading}
          style={{ marginBottom: 5 }}
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <Text style={{ color: '#d32f2f', fontSize: 12, marginBottom: 15 }}>
            {errors.confirmPassword}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading || !email || !password || !confirmPassword}
          style={{ paddingVertical: 8, marginTop: 10 }}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <Text style={{ textAlign: 'center' }}>
          {"\n"}
          {"\n"}
          <Link href="/(auth)/login" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold' }}>
          Already have an account? Login
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
