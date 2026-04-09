import { auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Login Failed', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await user.reload();

      if (!user.emailVerified) {
        await signOut(auth);

        Alert.alert(
          'Email Not Verified',
          'Please check your Gmail and click the verification link before logging in.'
        );
        return;
      }

      Alert.alert('Success', 'Logged in successfully.');

      router.replace('/(home_dasborad)/home.dashboard');
    } catch (error: any) {
      let message = 'Please check your email and password.';

      if (error.code === 'auth/invalid-email') {
        message = 'The email address is invalid.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account was found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'The password you entered is incorrect.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many login attempts. Please try again later.';
      }

      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={28} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>
              Sign in to continue reporting issues.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
                <Text style={styles.blueLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => router.push('/signup')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginTop: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  signInButton: {
    backgroundColor: '#2F70E9',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  blueLinkText: {
    color: '#2F70E9',
    fontSize: 14,
  },
  linkText: {
    color: '#2F70E9',
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
  },
});