import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from './ThemeContext';

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  barangay?: string;
  role?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setLoadingProfile(false);
          return;
        }

        const q = query(
          collection(db, 'users'),
          where('uid', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();

          setUserProfile({
            uid: docData.uid,
            name: docData.name || '',
            email: docData.email || currentUser.email || '',
            mobileNumber: docData.mobileNumber || '',
            barangay: docData.barangay || '',
            role: docData.role || 'user',
          });
        } else {
          setUserProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            mobileNumber: '',
            barangay: '',
            role: 'user',
          });
        }
      } catch (error) {
        console.log('PROFILE ERROR:', error);
        Alert.alert('Error', 'Unable to load your profile.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Unable to log out right now.');
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Notice', 'Edit Profile feature coming soon!');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';

    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0).toUpperCase() +
      parts[1].charAt(0).toUpperCase()
    );
  };

  if (loadingProfile) {
    return (
      <ThemedView style={[styles.container, styles.centered, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#60A5FA' : '#2F70E9'} />
        <ThemedText style={{ marginTop: 12, color: isDarkMode ? '#F9FAFB' : '#111827' }}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.topLogoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="log-out-outline" size={22} color="white" />
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {getInitials(userProfile?.name)}
              </ThemedText>
            </View>

            <ThemedText style={[styles.name, isDarkMode && styles.darkText]}>
              {userProfile?.name || 'User'}
            </ThemedText>

            <ThemedText style={styles.location}>
              {userProfile?.barangay || 'No barangay set'}
            </ThemedText>

            <TouchableOpacity
              style={[styles.editButton, isDarkMode && styles.darkCard]}
              activeOpacity={0.8}
              onPress={handleEditProfile}
            >
              <ThemedText style={[styles.editButtonText, isDarkMode && styles.darkText]}>
                Edit Profile
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.menuCard, isDarkMode && styles.darkCard]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={isDarkMode ? '#9CA3AF' : '#4B5563'}
                />
                <View>
                  <ThemedText style={[styles.menuLabel, isDarkMode && styles.darkText]}>
                    Personal Information
                  </ThemedText>
                  <ThemedText style={styles.infoText}>
                    {userProfile?.email || 'No email'}
                  </ThemedText>
                  <ThemedText style={styles.infoText}>
                    {userProfile?.mobileNumber || 'No mobile number'}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={isDarkMode ? '#9CA3AF' : '#4B5563'}
                />
                <ThemedText style={[styles.menuLabel, isDarkMode && styles.darkText]}>
                  Role
                </ThemedText>
              </View>
              <View style={styles.menuRight}>
                <ThemedText style={styles.menuValue}>
                  {userProfile?.role || 'user'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="moon-outline"
                  size={22}
                  color={isDarkMode ? '#9CA3AF' : '#4B5563'}
                />
                <ThemedText style={[styles.menuLabel, isDarkMode && styles.darkText]}>
                  Dark Mode
                </ThemedText>
              </View>
              <View style={styles.menuRight}>
                <ThemedText style={styles.menuValue}>
                  {isDarkMode ? 'On' : 'Off'}
                </ThemedText>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: '#D1D5DB', true: '#2F70E9' }}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={isDarkMode ? '#9CA3AF' : '#4B5563'}
                />
                <ThemedText style={[styles.menuLabel, isDarkMode && styles.darkText]}>
                  Help & Support
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tabBar, isDarkMode && styles.darkCard]}>
          <TabIcon
            icon="home-outline"
            label="Home"
            onPress={() => router.push('/(home_dasborad)/home.dashboard')}
            activeColor={isDarkMode ? '#60A5FA' : '#2F70E9'}
          />
          <TabIcon
            icon="document-text-outline"
            label="Reports"
            onPress={() => router.push('/(reports_dashboard)/reports.dashboard')}
            activeColor={isDarkMode ? '#60A5FA' : '#2F70E9'}
          />
          <TabIcon
            icon="map-outline"
            label="Maps"
            onPress={() => router.push('/(maps.dashboard)/maps.dashboard')}
            activeColor={isDarkMode ? '#60A5FA' : '#2F70E9'}
          />
          <TabIcon
            icon="bulb-outline"
            label="Ideas"
            onPress={() => router.push('/(ideas_dashboard)/ideas_dashboard')}
            activeColor={isDarkMode ? '#60A5FA' : '#2F70E9'}
          />
          <TabIcon
            icon="person"
            label="Profile"
            active
            activeColor={isDarkMode ? '#60A5FA' : '#2F70E9'}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TabIcon({ icon, label, active, onPress, activeColor }: any) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? activeColor : '#9CA3AF'} />
      <ThemedText style={[styles.tabLabel, { color: active ? activeColor : '#9CA3AF' }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  darkContainer: { backgroundColor: '#111827' },
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 110, position: 'relative' },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C83E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: 'white', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 4 },
  darkText: { color: '#F9FAFB' },
  location: { fontSize: 16, color: '#6B7280', marginBottom: 18 },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  editButtonText: { color: '#4B5563', fontWeight: '600' },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  darkCard: { backgroundColor: '#1F2937', borderColor: '#374151' },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '500', color: '#374151' },
  infoText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuValue: { fontSize: 14, color: '#9CA3AF', textTransform: 'capitalize' },
  topLogoutButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logoutText: { color: 'white', fontSize: 16, fontWeight: '700' },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 20,
  },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '600' },
});