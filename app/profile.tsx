import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
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
import * as Haptics from 'expo-haptics';

import { useTheme } from './ThemeContext';

// --- Original Theme Constants ---
const PRIMARY_RED = '#DC2626';
const SLATE_500 = '#64748B';
const DARK_BG = '#020617';
const PRIMARY_BLUE = '#2F70E9';
const SLATE_400 = '#94A3B8';

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
  
  // New state for Logout Modal
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });
    return () => unsubscribe();
  }, []);

  const handleLogoutPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setIsLogoutModalVisible(false);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Unable to log out.');
    }
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setEditName(userProfile?.name || '');
    setEditMobile(userProfile?.mobileNumber || '');
    setEditBarangay(userProfile?.barangay || '');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return Alert.alert('Error', 'Name is required.');
    if (!docId) return;
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'users', docId), {
        name: editName.trim(),
        mobileNumber: editMobile.trim(),
        barangay: editBarangay.trim(),
      });
      setIsEditModalVisible(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Error', 'Gallery access required.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    if (!docId || !auth.currentUser) return;
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const fileRef = ref(storage, `profiles/${auth.currentUser.uid}.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, 'users', docId), { profilePic: url });
    } finally {
      setUploading(false);
    }
  };

  const navigateTo = (path: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  if (loadingProfile) {
    return (
      <ThemedView style={[styles.container, styles.centered, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topNav}>
            <View>
              <ThemedText style={styles.headerLabel}>USER PORTAL</ThemedText>
              <ThemedText style={[styles.navTitle, isDarkMode && styles.whiteText]}>Account Center</ThemedText>
            </View>
            <TouchableOpacity style={styles.logoutSquare} onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={22} color={PRIMARY_RED} />
            </TouchableOpacity>
          </View>

          <View style={styles.identityPod}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9}>
              <View style={[styles.podCircle, isDarkMode && styles.darkPod]}>
                <View style={styles.imageInner}>
                  {uploading ? (
                    <ActivityIndicator color={PRIMARY_BLUE} />
                  ) : userProfile?.profilePic ? (
                    <Image source={{ uri: userProfile.profilePic }} style={styles.fullImg} />
                  ) : (
                    <ThemedText style={styles.initials}>{userProfile?.name?.charAt(0).toUpperCase()}</ThemedText>
                  )}
                </View>
                <View style={[styles.cameraFloating, { borderColor: isDarkMode ? '#1E293B' : 'white' }]}>
                   <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            <ThemedText style={[styles.userName, isDarkMode && styles.whiteText]}>{userProfile?.name || 'Authorized User'}</ThemedText>
            <View style={[styles.roleChip, {backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9'}]}>
               <View style={styles.activeDot} />
               <ThemedText style={[styles.roleText, {color: isDarkMode ? '#94A3B8' : '#64748B'}]}>
                 {userProfile?.role?.toUpperCase() || 'USER'}
               </ThemedText>
            </View>
          </View>

          <View style={[styles.dataCluster, isDarkMode && styles.darkPod]}>
             <InfoRow icon="mail-outline" label="Primary Email" value={userProfile?.email} isDarkMode={isDarkMode} />
             <View style={styles.glassDivider} />
             <InfoRow icon="call-outline" label="Mobile Contact" value={userProfile?.mobileNumber || 'Not provided'} isDarkMode={isDarkMode} />
             <View style={styles.glassDivider} />
             <InfoRow icon="location-outline" label="Registry Area" value={userProfile?.barangay || 'Not assigned'} isDarkMode={isDarkMode} />
          </View>

          <View style={styles.actionGrid}>
             <TouchableOpacity style={[styles.actionTile, isDarkMode && styles.darkPod]} onPress={handleEditProfile}>
                <View style={[styles.tileIconBg, {backgroundColor: isDarkMode ? '#111827' : '#EFF6FF'}]}>
                   <Ionicons name="settings-outline" size={22} color={PRIMARY_BLUE} />
                </View>
                <ThemedText style={[styles.tileText, isDarkMode && styles.whiteText]}>Edit Profile</ThemedText>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.actionTile, isDarkMode && styles.darkPod]} onPress={() => router.push('/helpandsupport')}>
                <View style={[styles.tileIconBg, {backgroundColor: isDarkMode ? '#111827' : '#FEF2F2'}]}>
                   <Ionicons name="help-buoy-outline" size={22} color={PRIMARY_RED} />
                </View>
                <ThemedText style={[styles.tileText, isDarkMode && styles.whiteText]}>Support</ThemedText>
             </TouchableOpacity>
          </View>

          <View style={[styles.themeRow, isDarkMode && styles.darkPod]}>
             <View style={styles.themeLeft}>
                <View style={[styles.themeIcon, { backgroundColor: isDarkMode ? '#F59E0B20' : '#F1F5F9' }]}>
                  <Ionicons name={isDarkMode ? "moon" : "sunny"} size={18} color={isDarkMode ? "#F59E0B" : SLATE_400} />
                </View>
                <ThemedText style={[styles.themeText, isDarkMode && styles.whiteText]}>Dark Theme</ThemedText>
             </View>
             <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: '#E2E8F0', true: PRIMARY_BLUE }} />
          </View>
        </ScrollView>

        {/* Original Dock Navigation */}
        <View style={[styles.navDock, isDarkMode && styles.darkCard, styles.shadow]}>
          <NavIcon icon="home" label="Home" onPress={() => navigateTo('/(home_dasborad)/home.dashboard')} />
          <NavIcon icon="document-text" label="Reports" onPress={() => navigateTo('/(reports_dashboard)/reports.dashboard')} />
          <View style={{ width: 60 }} />
          <NavIcon icon="map" label="Map" onPress={() => navigateTo('/(maps.dashboard)/maps.dashboard')} />
          <NavIcon icon="person" label="Identity" active />
          <TouchableOpacity 
            style={[styles.fab, styles.shadow, isDarkMode && { borderColor: DARK_BG }]} 
            onPress={() => router.push('/category.dashboard')}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* --- CUSTOM LOGOUT CONFIRMATION MODAL --- */}
        <Modal visible={isLogoutModalVisible} transparent animationType="fade">
          <View style={styles.modalBlur}>
            <View style={[styles.logoutCard, isDarkMode && styles.darkPod]}>
              <View style={styles.logoutIconBg}>
                 <Ionicons name="log-out" size={32} color={PRIMARY_RED} />
              </View>
              <ThemedText style={[styles.logoutTitle, isDarkMode && styles.whiteText]}>Confirm Logout</ThemedText>
              <ThemedText style={styles.logoutSubText}>Are you sure you want to log out of your account?</ThemedText>
              
              <View style={styles.logoutActionRow}>
                <TouchableOpacity style={styles.cancelLogoutBtn} onPress={() => setIsLogoutModalVisible(false)}>
                  <ThemedText style={styles.cancelLogoutText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmLogoutBtn} onPress={confirmLogout}>
                  <ThemedText style={styles.confirmLogoutText}>Logout</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Original Edit Modal UI */}
        <Modal visible={isEditModalVisible} animationType="slide" transparent>
           <View style={styles.modalBlur}>
              <KeyboardAvoidingView behavior="padding" style={[styles.modalCard, isDarkMode && styles.darkPod]}>
                 <View style={styles.modalHeader}>
                   <ThemedText style={[styles.modalTitle, isDarkMode && styles.whiteText]}>Profile Setup</ThemedText>
                   <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                     <Ionicons name="close-circle" size={28} color={SLATE_400} />
                   </TouchableOpacity>
                 </View>
                 <View style={styles.inputStack}>
                    <View>
                      <ThemedText style={styles.inputLabel}>FULL NAME</ThemedText>
                      <TextInput style={[styles.input, isDarkMode && styles.darkInput]} value={editName} onChangeText={setEditName} placeholderTextColor={SLATE_400} />
                    </View>
                    <View>
                      <ThemedText style={styles.inputLabel}>MOBILE NUMBER</ThemedText>
                      <TextInput style={[styles.input, isDarkMode && styles.darkInput]} value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" />
                    </View>
                    <View>
                      <ThemedText style={styles.inputLabel}>BARANGAY</ThemedText>
                      <TextInput style={[styles.input, isDarkMode && styles.darkInput]} value={editBarangay} onChangeText={setEditBarangay} />
                    </View>
                 </View>
                 <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={updating}>
                    {updating ? <ActivityIndicator color="white" /> : <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>}
                 </TouchableOpacity>
              </KeyboardAvoidingView>
           </View>
        </Modal>

      </SafeAreaView>
    </ThemedView>
  );
}

const InfoRow = ({ icon, label, value, isDarkMode }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
      <Ionicons name={icon} size={18} color={PRIMARY_BLUE} />
    </View>
    <View style={{ marginLeft: 16 }}>
      <ThemedText style={styles.dataLabel}>{label}</ThemedText>
      <ThemedText style={[styles.dataValue, isDarkMode && {color: 'white'}]}>{value}</ThemedText>
    </View>
  </View>
);

const NavIcon = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? PRIMARY_RED : SLATE_400} />
    <ThemedText style={[styles.navLabel, { color: active ? PRIMARY_RED : SLATE_400 }]}>{label}</ThemedText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  darkContainer: { backgroundColor: '#0F172A' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  // ADJUSTED: Shifting the content down by increasing paddingTop
  scrollArea: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 120 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLabel: { fontSize: 11, fontWeight: '800', color: PRIMARY_BLUE, letterSpacing: 1.5 },
  navTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  logoutSquare: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FEE2E2' },
  identityPod: { alignItems: 'center', marginBottom: 30 },
  podCircle: { width: 124, height: 124, borderRadius: 44, backgroundColor: 'white', padding: 6, elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  darkPod: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
  imageInner: { width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  fullImg: { width: '100%', height: '100%' },
  initials: { fontSize: 44, fontWeight: '800', color: PRIMARY_BLUE },
  cameraFloating: { position: 'absolute', bottom: 0, right: 0, backgroundColor: PRIMARY_BLUE, padding: 8, borderRadius: 14, borderWidth: 3 },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  roleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  roleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  whiteText: { color: 'white' },
  dataCluster: { padding: 20, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  glassDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16, opacity: 0.5 },
  dataLabel: { fontSize: 10, fontWeight: '700', color: SLATE_400, letterSpacing: 0.5 },
  dataValue: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginTop: 1 },
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionTile: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  tileIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  tileText: { fontSize: 14, fontWeight: '700' },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 24, marginTop: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeText: { fontSize: 15, fontWeight: '600' },
  navDock: { position: 'absolute', bottom: 30, left: 16, right: 16, height: 75, backgroundColor: 'white', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#E2E8F0' },
  navItem: { alignItems: 'center', minWidth: 50 },
  navLabel: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  fab: { position: 'absolute', top: -32, left: '50%', marginLeft: -35, width: 70, height: 70, borderRadius: 24, backgroundColor: PRIMARY_RED, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: '#F8FAFC' },
  shadow: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 10 } }) },
  modalBlur: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50, width: '100%', position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  inputStack: { gap: 18 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: SLATE_400, marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  darkInput: { backgroundColor: '#0F172A', color: 'white', borderWidth: 1, borderColor: '#334155' },
  saveBtn: { backgroundColor: PRIMARY_BLUE, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

  // --- LOGOUT MODAL STYLES ---
  logoutCard: { backgroundColor: 'white', borderRadius: 32, padding: 24, width: '90%', alignItems: 'center' },
  logoutIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoutTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  logoutSubText: { fontSize: 14, color: SLATE_500, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  logoutActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelLogoutBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' },
  confirmLogoutBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: PRIMARY_RED, alignItems: 'center' },
  cancelLogoutText: { fontWeight: '700', color: SLATE_500 },
  confirmLogoutText: { fontWeight: '700', color: 'white' },
});