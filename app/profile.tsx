import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { navigateToMapsByRole } from '@/services/roleNavigation';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
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
  profilePic?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [docId, setDocId] = useState<string | null>(null);

  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editBarangay, setEditBarangay] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoadingProfile(false);
      return;
    }

    const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const snapshotDoc = snapshot.docs[0];
          setDocId(snapshotDoc.id);

          const docData = snapshotDoc.data();

          setUserProfile({
            uid: docData.uid,
            name: docData.name || '',
            email: docData.email || currentUser.email || '',
            mobileNumber: docData.mobileNumber || '',
            barangay: docData.barangay || '',
            role: docData.role || 'user',
            profilePic: docData.profilePic || '',
          });
        }

        setLoadingProfile(false);
      },
      (error) => {
        console.log('PROFILE ERROR:', error);
        setLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Unable to log out.');
    }
  };

  const handleEditProfile = () => {
    setEditName(userProfile?.name || '');
    setEditMobile(userProfile?.mobileNumber || '');
    setEditBarangay(userProfile?.barangay || '');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    if (!docId) {
      Alert.alert('Error', 'User document not found.');
      return;
    }

    try {
      setUpdating(true);

      await updateDoc(doc(db, 'users', docId), {
        name: editName.trim(),
        mobileNumber: editMobile.trim(),
        barangay: editBarangay.trim(),
      });

      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.log('SAVE PROFILE ERROR:', error);
      Alert.alert('Error', 'Failed to save.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Need access to photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('IMAGE PICKER ERROR:', error);
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!docId || !auth.currentUser) {
      Alert.alert('Error', 'User not found.');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const fileRef = ref(storage, `profiles/${auth.currentUser.uid}.jpg`);

      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, 'users', docId), {
        profilePic: downloadURL,
      });

      Alert.alert('Success', 'Photo updated!');
    } catch (error) {
      console.log('UPLOAD ERROR:', error);
      Alert.alert('Error', 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';

    const parts = name.trim().split(' ').filter(Boolean);

    return parts.length === 1
      ? parts[0].charAt(0).toUpperCase()
      : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  if (loadingProfile) {
    return (
      <ThemedView style={[styles.container, styles.centered, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#2F70E9" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.topLogoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="white" />
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handlePickImage}>
              <View style={styles.avatar}>
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : userProfile?.profilePic ? (
                  <Image source={{ uri: userProfile.profilePic }} style={styles.fullImage} />
                ) : (
                  <ThemedText style={styles.avatarText}>{getInitials(userProfile?.name)}</ThemedText>
                )}

                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={12} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            <ThemedText style={[styles.name, isDarkMode && styles.darkText]}>
              {userProfile?.name || 'User'}
            </ThemedText>

            <ThemedText style={styles.location}>
              {userProfile?.barangay || 'No barangay set'}
            </ThemedText>

            <TouchableOpacity
              style={[styles.editButton, isDarkMode && styles.darkCard]}
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
                  <ThemedText style={styles.infoText}>{userProfile?.email}</ThemedText>
                  <ThemedText style={styles.infoText}>
                    {userProfile?.mobileNumber || 'No mobile'}
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

              <ThemedText style={styles.menuValue}>{userProfile?.role || 'user'}</ThemedText>
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

              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#D1D5DB', true: '#2F70E9' }}
                thumbColor="#FFFFFF"
              />
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

        <Modal visible={isEditModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalContent, isDarkMode && styles.darkCard]}
            >
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                  Edit Profile
                </ThemedText>

                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDarkMode ? '#F9FAFB' : '#111827'}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedText style={styles.inputLabel}>FULL NAME</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    isDarkMode && styles.darkInput,
                    { color: isDarkMode ? '#FFF' : '#000' },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                />

                <ThemedText style={styles.inputLabel}>MOBILE</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    isDarkMode && styles.darkInput,
                    { color: isDarkMode ? '#FFF' : '#000' },
                  ]}
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                />

                <ThemedText style={styles.inputLabel}>BARANGAY</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    isDarkMode && styles.darkInput,
                    { color: isDarkMode ? '#FFF' : '#000' },
                  ]}
                  value={editBarangay}
                  onChangeText={setEditBarangay}
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <View style={[styles.tabBar, isDarkMode && styles.darkCard]}>
          <TabIcon
            icon="home-outline"
            label="Home"
            onPress={() => router.push('/(home_dasborad)/home.dashboard')}
          />
          <TabIcon
            icon="document-text-outline"
            label="Reports"
            onPress={() => router.push('/(reports_dashboard)/reports.dashboard')}
          />
          <TabIcon
            icon="map-outline"
            label="Maps"
            onPress={() => navigateToMapsByRole(router)}
          />
          <TabIcon icon="person" label="Profile" active />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TabIcon({ icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Ionicons
        name={active ? icon.replace('-outline', '') : icon}
        size={22}
        color={active ? '#2F70E9' : '#9CA3AF'}
      />
      <ThemedText style={[styles.tabLabel, { color: active ? '#2F70E9' : '#9CA3AF' }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 65,
    paddingBottom: 110,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C83E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2F70E9',
    padding: 4,
    borderRadius: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  darkText: {
    color: '#F9FAFB',
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 18,
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  darkCard: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  topLogoutButton: {
    position: 'absolute',
    top: 55,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', // Centers vertically
    alignItems: 'center',     // Centers horizontally
    padding: 20,              // Prevents modal from touching edges
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,         // Rounded corners on all sides
    padding: 24,
    width: '100%',            // Responsive width
    maxHeight: '80%',         // Limits height for smaller screens
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 15,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 5,
  },
  darkInput: {
    backgroundColor: '#111827',
    borderColor: '#374151',
  },
  saveButton: {
    backgroundColor: '#2F70E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 25,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
  },
});