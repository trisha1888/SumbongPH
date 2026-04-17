import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// --- UI Components & Context ---
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ReportLocationPicker from '../components/ReportLocationPicker';
import { useTheme } from './ThemeContext';

// --- Firebase & Services ---
import {
  REPORT_CATEGORIES,
  REPORT_URGENCY_LEVELS,
  ReportCategory,
  ReportUrgency,
} from '@/models/report';
import { submitReport } from '@/services/reportService';
import { auth, storage } from '../firebaseConfig';

// --- Styling Constants ---
const PRIMARY_BLUE = '#3B82F6';
const SLATE_400 = '#94A3B8';
const SLATE_600 = '#475569';

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

const CATEGORY_META: Record<ReportCategory, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  Flood: { icon: 'cloud-outline', color: '#4F46E5', bg: '#EEF2FF' },
  Garbage: { icon: 'trash-outline', color: '#16A34A', bg: '#F0FDF4' },
  Road: { icon: 'construct-outline', color: '#EA580C', bg: '#FFF7ED' },
  Streetlight: { icon: 'bulb-outline', color: '#CA8A04', bg: '#FEFCE8' },
  Noise: { icon: 'volume-high-outline', color: '#9333EA', bg: '#FAF5FF' },
  Safety: { icon: 'alert-circle-outline', color: '#DC2626', bg: '#FEF2F2' },
  Other: { icon: 'help-circle-outline', color: '#4B5563', bg: '#F9FAFB' },
};

export default function EditReportScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();

  const isDesktop = width > 768;

  // --- Form State ---
  const initialCategory = useMemo<ReportCategory>(() => {
    const matched = REPORT_CATEGORIES.find((item) => item === params.category);
    return matched || 'Other';
  }, [params.category]);

  const [category] = useState<ReportCategory>(initialCategory);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<ReportUrgency>('Low');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const meta = CATEGORY_META[category];

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pickImage = async () => {
    try {
      triggerHaptic();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to upload proof.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Image Error', 'Failed to access gallery.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedLocation || !description.trim()) {
      Alert.alert('Missing Info', 'Please complete all fields and select a location.');
      return;
    }
    try {
      setSubmitting(true);
      let imageUrl = '';
      if (selectedImageUri) {
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `report_proofs/${auth.currentUser?.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      await submitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        coordinates: { ...selectedLocation, address: location.trim() },
        urgency,
        imageUrl,
      });

      router.replace('/(reports_dashboard)/reports.dashboard');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.headerWrapper,
            { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>

          <View>
            <ThemedText style={[styles.headerTitle, isDarkMode && styles.whiteText]}>
              Create Report
            </ThemedText>

            <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={12} color={meta.color} />
              <ThemedText style={[styles.categoryBadgeText, { color: meta.color }]}>
                {category.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollArea, isDesktop && styles.desktopScrollArea]}
          showsVerticalScrollIndicator={false}
        >
          {/* Map Section */}
          <View style={styles.mapContainer}>
            <ReportLocationPicker
              value={selectedLocation}
              onLocationSelect={(picked: SelectedLocation) => {
                if (picked) {
                  triggerHaptic();
                  setSelectedLocation(picked);
                  setLocation(picked.address || '');
                }
              }}
              height={isDesktop ? 400 : 260}
            />
          </View>

          {/* NEW: Location Details */}
          <View style={[styles.locationDetailsCard, isDarkMode && styles.darkCard]}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={18} color={PRIMARY_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.locationTitle, isDarkMode && styles.whiteText]}>
                  LOCATION DETAILS
                </ThemedText>
                <ThemedText style={styles.locationSubtitle}>
                  Information from your selected map pin
                </ThemedText>
              </View>
            </View>

            {selectedLocation ? (
              <View style={styles.locationInfoWrap}>
                <View style={styles.locationInfoBlock}>
                  <ThemedText style={styles.locationInfoLabel}>ADDRESS</ThemedText>
                  <ThemedText style={[styles.locationInfoValue, isDarkMode && styles.whiteText]}>
                    {selectedLocation.address || 'No address available'}
                  </ThemedText>
                </View>

                <View style={styles.coordinatesRow}>
                  <View style={styles.coordinateCard}>
                    <ThemedText style={styles.coordinateLabel}>LATITUDE</ThemedText>
                    <ThemedText style={[styles.coordinateValue, isDarkMode && styles.whiteText]}>
                      {selectedLocation.latitude.toFixed(6)}
                    </ThemedText>
                  </View>

                  <View style={styles.coordinateCard}>
                    <ThemedText style={styles.coordinateLabel}>LONGITUDE</ThemedText>
                    <ThemedText style={[styles.coordinateValue, isDarkMode && styles.whiteText]}>
                      {selectedLocation.longitude.toFixed(6)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyLocationState}>
                <Ionicons name="map-outline" size={28} color={SLATE_400} />
                <ThemedText style={styles.emptyLocationText}>
                  Drop a pin on the map to show location details here.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Priority Levels */}
          <ThemedText style={styles.sectionLabel}>PRIORITY LEVEL</ThemedText>
          <View style={styles.priorityRow}>
            {REPORT_URGENCY_LEVELS.map((level) => {
              const isActive = urgency === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => {
                    triggerHaptic();
                    setUrgency(level);
                  }}
                  style={[styles.priorityTab, isActive && styles.priorityTabActive]}
                >
                  <ThemedText style={[styles.priorityText, isActive && styles.priorityTextActive]}>
                    {level}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Report Title */}
          <View style={styles.inputPod}>
            <ThemedText style={styles.cardLabel}>REPORT TITLE</ThemedText>
            <TextInput
              style={styles.registryInput}
              placeholder="Summary of the incident..."
              placeholderTextColor={SLATE_400}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description & Image Card */}
          <View style={[styles.descriptionCard, isDarkMode && styles.darkCard]}>
            <ThemedText style={styles.cardLabel}>DETAILED DESCRIPTION</ThemedText>
            <TextInput
              style={[styles.descriptionInput, isDarkMode && styles.whiteText]}
              placeholder="Provide a detailed log of the incident..."
              placeholderTextColor={SLATE_400}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.divider} />

            <TouchableOpacity style={styles.proofButton} onPress={pickImage}>
              <View style={styles.cameraIconBg}>
                <Ionicons
                  name={selectedImageUri ? 'checkmark-circle' : 'camera'}
                  size={18}
                  color={PRIMARY_BLUE}
                />
              </View>
              <ThemedText style={[styles.proofText, isDarkMode && styles.whiteText]}>
                {selectedImageUri ? 'Proof Image Ready' : 'Attach Proof Image'}
              </ThemedText>
            </TouchableOpacity>

            {selectedImageUri && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.commitBtn, submitting && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.commitBtnText}>COMMIT REPORT</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.discardBtn}>
            <ThemedText style={styles.discardText}>DISCARD CHANGES</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  darkContainer: { backgroundColor: '#0F172A' },
  safeArea: { flex: 1, maxWidth: 1200, width: '100%', alignSelf: 'center' },

  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 45 : 15,
    paddingBottom: 15,
    gap: 15,
    zIndex: 10,
  },

  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  backButton: { padding: 4 },
  whiteText: { color: 'white' },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  scrollArea: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 },
  desktopScrollArea: { paddingHorizontal: 100 },

  mapContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 18,
  },

  locationDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 25,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.8,
  },
  locationSubtitle: {
    fontSize: 12,
    color: SLATE_400,
    marginTop: 2,
    fontWeight: '600',
  },
  locationInfoWrap: {
    gap: 14,
  },
  locationInfoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationInfoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: SLATE_400,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  locationInfoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    fontWeight: '700',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordinateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_400,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyLocationState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  emptyLocationText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    color: SLATE_400,
    fontWeight: '600',
    lineHeight: 18,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: SLATE_600,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },

  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  priorityTab: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priorityTabActive: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
  priorityText: { fontSize: 14, fontWeight: '700', color: SLATE_400 },
  priorityTextActive: { color: '#FFFFFF' },

  inputPod: { marginBottom: 25 },
  registryInput: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: PRIMARY_BLUE,
  },

  descriptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_400,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },

  proofButton: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cameraIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

  previewWrap: {
    marginTop: 15,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: { width: '100%', height: 180, borderRadius: 16 },
  removeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 1 },

  commitBtn: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 20,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 35,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  commitBtnText: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  discardBtn: { marginTop: 22, marginBottom: 20, alignItems: 'center' },
  discardText: { fontSize: 12, fontWeight: '800', color: SLATE_400, letterSpacing: 1 },
});