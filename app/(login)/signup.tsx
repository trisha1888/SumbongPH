import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { registerUser } from '../../authService';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [barangay, setBarangay] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (value: string) => {
    return {
      length: value.length >= 12,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>_\-\\/[\]=+;']/.test(value),
    };
  };

  const passwordRules = validatePassword(password);

  const isPasswordStrong =
    passwordRules.length &&
    passwordRules.upper &&
    passwordRules.lower &&
    passwordRules.number &&
    passwordRules.special;

  const handleSignUp = async () => {
    if (
      !fullName.trim() ||
      !mobileNumber.trim() ||
      !email.trim() ||
      !barangay.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Sign Up Failed', 'Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Sign Up Failed', 'Passwords do not match.');
      return;
    }

    if (!isPasswordStrong) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        email.trim(),
        password,
        fullName.trim(),
        mobileNumber.trim(),
        barangay.trim()
      );

      Alert.alert(
        'Email Confirmation Required',
        'Your account has been created. Please verify your email first.'
      );

      router.replace({
        pathname: '/verify-email',
        params: { email: email.trim() },
      });
    } catch (error: any) {
      console.log('SIGN UP ERROR:', error);
      let message = error?.message || 'Something went wrong while creating your account.';
      if (error?.code === 'auth/email-already-in-use') message = 'This email is already registered.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* BACK BUTTON MOVED DOWN */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER MOVED DOWN */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Join your community today.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Mobile Number</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0912 345 6789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email Address</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Barangay</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter your barangay"
                placeholderTextColor="#9CA3AF"
                value={barangay}
                onChangeText={setBarangay}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              {password.length > 0 && (
                <View style={styles.passwordRulesBox}>
                  <ThemedText style={[styles.passwordRule, passwordRules.length ? styles.ruleValid : styles.ruleInvalid]}>
                    • At least 12 characters
                  </ThemedText>
                  <ThemedText style={[styles.passwordRule, passwordRules.upper ? styles.ruleValid : styles.ruleInvalid]}>
                    • At least 1 uppercase letter
                  </ThemedText>
                  <ThemedText style={[styles.passwordRule, passwordRules.lower ? styles.ruleValid : styles.ruleInvalid]}>
                    • At least 1 lowercase letter
                  </ThemedText>
                  <ThemedText style={[styles.passwordRule, passwordRules.number ? styles.ruleValid : styles.ruleInvalid]}>
                    • At least 1 number
                  </ThemedText>
                  <ThemedText style={[styles.passwordRule, passwordRules.special ? styles.ruleValid : styles.ruleInvalid]}>
                    • At least 1 special character
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isPasswordStrong) && { opacity: 0.7 },
              ]}
              onPress={handleSignUp}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER POSITIONED UP */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have an account?{' '}
              <ThemedText
                style={styles.linkText}
                onPress={() => router.push('/login')}
              >
                Sign In
              </ThemedText>
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 40, // Match the Login Screen "Move down" request
  },
  header: { 
    marginTop: 30, // Move title down as requested
    marginBottom: 30 
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  form: { gap: 18 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  passwordRulesBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordRule: { fontSize: 13, marginBottom: 4 },
  ruleValid: { color: '#16A34A' },
  ruleInvalid: { color: '#DC2626' },
  primaryButton: {
    backgroundColor: '#3B82F6', // Vibrant blue to match Login
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  footer: { 
    marginTop: 40, // Increased to move it down from button
    marginBottom: 20, 
    alignItems: 'center' 
  },
  footerText: { color: '#6B7280', fontSize: 15 },
  linkText: { color: '#3B82F6', fontWeight: '700' },
});