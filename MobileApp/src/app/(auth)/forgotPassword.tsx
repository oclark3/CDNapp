// Reset Password page for users who have forgotten their password

import React, { useState } from "react";
import { Text, View, ScrollView, Image, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "@/services/authService";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle password reset request
   */
  const handleResetPassword = async () => {
    const newErrors: { email?: string } = {};

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      const success = await authService.forgotPassword(email);
      setSubmitted(true);
      Alert.alert(
        'Success', 
        success ? 'Password reset email has been sent. Check your inbox for instructions.' : 'Password reset request processed. Check your inbox for instructions.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
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
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Reset Password</Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        {submitted && (
          <View style={{ 
            backgroundColor: '#e8f5e9', 
            padding: 15, 
            borderRadius: 5, 
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: '#4caf50'
          }}>
            <Text style={{ color: '#2e7d32', fontWeight: 'bold' }}>Email Sent!</Text>
            <Text style={{ color: '#2e7d32', marginTop: 5 }}>
              Check your inbox for a password reset link.
            </Text>
          </View>
        )}

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

        <Button
          mode="contained"
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading || !email}
          style={{ paddingVertical: 8, marginTop: 10 }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <Text style={{ textAlign: 'center' }}>
          {"\n"}
          {"\n"}
          <Link href="/(auth)/signup" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold', textAlign: 'center' }}>
            Don't have an account? Sign Up
          </Link>
          {"\n"}
          {"\n"}
          <Link href="/(auth)/login" style={{ marginTop: 10, color: '#6A1B9a', fontWeight: 'bold', textAlign: 'center' }}>
            Login
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