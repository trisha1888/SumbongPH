import { auth } from '@/firebaseConfig';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { reload, sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerified = async () => {
    try {
      setChecking(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Session Expired',
          'Please log in again or sign up again.'
        );
        router.replace('/login');
        return;
      }

      await reload(user);

      if (user.emailVerified) {
        Alert.alert(
          'Email Verified',
          'Your email has been verified. You can now log in.'
        );
        router.replace('/login');
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email is not verified yet. Please check your Gmail and click the verification link first.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Check Failed',
        error?.message || 'Something went wrong.'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Session Expired',
          'Please sign up again to resend the verification email.'
        );
        router.replace('/signup');
        return;
      }

      await sendEmailVerification(user);

      Alert.alert(
        'Verification Email Sent',
        'A new verification link has been sent to your Gmail.'
      );
    } catch (error: any) {
      Alert.alert(
        'Resend Failed',
        error?.message || 'Unable to resend verification email.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Ionicons
            name="mail-unread-outline"
            size={48}
            color="#111827"
            style={{ marginBottom: 18 }}
          />

          <ThemedText style={styles.title}>
            Verify your email before login
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            We sent a verification link to{' '}
            <ThemedText style={styles.emailText}>
              {email || auth.currentUser?.email || 'your email'}
            </ThemedText>
            . Open your email and tap the link to activate your account.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryButton, checking && { opacity: 0.7 }]}
            onPress={handleVerified}
            disabled={checking}
          >
            <ThemedText style={styles.primaryButtonText}>
              {checking ? 'Checking...' : "I've Verified My Email"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, resending && { opacity: 0.7 }]}
            onPress={handleResend}
            disabled={resending}
          >
            <ThemedText style={styles.secondaryButtonText}>
              {resending ? 'Resending...' : 'Resend Verification Email'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')}>
            <ThemedText style={styles.backToLogin}>Back to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: 10,
  },
  card: {
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#4B5563',
    marginBottom: 26,
  },
  emailText: {
    fontWeight: '700',
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#114A8D',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 18,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLogin: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 16,
    fontWeight: '500',
  },
});