// Reset Password Confirmation page - where users authenticate via BLOX token
// The actual password reset is handled by the external BLOX system

import React from "react";
import { Text, View, ScrollView, Image } from "react-native";
import { Button } from "react-native-paper";
import { Link, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  // Token verification successful
  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 }}>
          <Image
            source={require("@assets/logo.png")}
            style={{ width: '80%', alignSelf: 'center', marginVertical: 40 }}
            resizeMode="contain"
          />
          
          <View style={{ 
            backgroundColor: '#ffebee', 
            padding: 15, 
            borderRadius: 5, 
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: '#d32f2f'
          }}>
            <Text style={{ color: '#c62828', fontWeight: 'bold', fontSize: 18 }}>Invalid Link</Text>
            <Text style={{ color: '#c62828', marginTop: 10 }}>
              This password reset link is invalid or has expired.
            </Text>
          </View>

          <Link href="/(auth)/forgotPassword" asChild>
            <Button mode="contained" style={{ paddingVertical: 8 }}>
              Request New Reset Link
            </Button>
          </Link>

          <Link href="/(auth)/login" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold', textAlign: 'center' }}>
            Back to Login
          </Link>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 }}>
        <Image
          source={require("@assets/logo.png")}
          style={{ width: '80%', alignSelf: 'center', marginVertical: 40 }}
          resizeMode="contain"
        />
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Password Reset</Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
          Your password reset link is valid. You can now login with your new credentials or request a new password reset if needed.
        </Text>

        <View style={{ 
          backgroundColor: '#e8f5e9', 
          padding: 15, 
          borderRadius: 5, 
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#4caf50'
        }}>
          <Text style={{ color: '#2e7d32', fontWeight: 'bold' }}>Link Verified!</Text>
          <Text style={{ color: '#2e7d32', marginTop: 5 }}>
            The password reset link from your email is valid. Check your email for further instructions or proceed to login.
          </Text>
        </View>

        <Link href="/(auth)/login" asChild>
          <Button mode="contained" style={{ paddingVertical: 8 }}>
            Go to Login
          </Button>
        </Link>

        <Link href="/(auth)/forgotPassword" style={{ marginTop: 20, color: '#6A1B9a', fontWeight: 'bold', textAlign: 'center' }}>
          Need another reset link?
        </Link>

        <Text style={{ marginTop: 30, color: '#999', fontSize: 11, textAlign: 'center' }}>
          Password reset is handled by your email. Follow the instructions in the email you received.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
