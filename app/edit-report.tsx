import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { REPORT_CATEGORIES, REPORT_URGENCY_LEVELS, ReportCategory, ReportUrgency } from '@/models/report';
import { submitReport } from '@/services/reportService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useTheme } from './ThemeContext';

const CATEGORY_META: Record<
  ReportCategory,
  { icon: any; bg: string; color: string }
> = {
  Flood: { icon: 'cloud-outline', bg: '#EEF2FF', color: '#4F46E5' },
  Garbage: { icon: 'trash-outline', bg: '#F0FDF4', color: '#16A34A' },
  Road: { icon: 'construct-outline', bg: '#FFF7ED', color: '#EA580C' },
  Streetlight: { icon: 'bulb-outline', bg: '#FEFCE8', color: '#CA8A04' },
  Noise: { icon: 'volume-high-outline', bg: '#FAF5FF', color: '#9333EA' },
  Safety: { icon: 'alert-circle-outline', bg: '#FEF2F2', color: '#DC2626' },
  Other: { icon: 'help-circle-outline', bg: '#F9FAFB', color: '#4B5563' },
};

export default function EditReportScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();

  const initialCategory = useMemo<ReportCategory>(() => {
    const fromParams = params.category;
    const matched = REPORT_CATEGORIES.find((item) => item === fromParams);
    return matched || 'Other';
  }, [params.category]);

  const [category] = useState<ReportCategory>(initialCategory);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<ReportUrgency>('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryMeta = CATEGORY_META[category];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a short title for your report.');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please enter the location of the issue.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      const result = await submitReport({
        category,
        title,
        location,
        urgency,
        description,
      });

      Alert.alert(
        'Report Submitted',
        `Your report has been submitted successfully.\n\nReport Code: ${result.reportCode}`,
        [
          {
            text: 'View My Reports',
            onPress: () => router.replace('/(reports_dashboard)/reports.dashboard'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error?.message || 'Something went wrong while submitting your report.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Report',
          headerTitleAlign: 'left',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
          },
          headerTintColor: isDarkMode ? '#F9FAFB' : '#111827',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? '#F9FAFB' : '#111827'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryMeta.bg }]}>
                <Ionicons name={categoryMeta.icon} size={22} color={categoryMeta.color} />
              </View>

              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
                  Category
                </ThemedText>
                <ThemedText style={[styles.categoryValue, isDarkMode && styles.darkText]}>
                  {category}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Report Title
            </ThemedText>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
              placeholder="Example: Flooded road near barangay hall"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Location
            </ThemedText>
            <View style={[styles.inputRow, isDarkMode && styles.darkInput]}>
              <Ionicons name="location-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.flexInput, isDarkMode && styles.darkText]}
                placeholder="Enter the exact location"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Urgency Level
            </ThemedText>
            <View style={styles.urgencyRow}>
              {REPORT_URGENCY_LEVELS.map((level) => {
                const active = urgency === level;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.urgencyTab,
                      isDarkMode && styles.darkInput,
                      active && styles.activeUrgency,
                    ]}
                    onPress={() => setUrgency(level)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[
                        styles.urgencyText,
                        isDarkMode && styles.darkSubText,
                        active && styles.activeUrgencyText,
                      ]}
                    >
                      {level}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.textArea, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
              placeholder="Describe the issue clearly so the admin can review it."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <ThemedText style={styles.submitText}>Submitting...</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.submitText}>Submit Report</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <ThemedText style={[styles.secondaryText, isDarkMode && styles.darkSubText]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  darkCard: { backgroundColor: '#1F2937', borderColor: '#374151' },
  darkInput: { backgroundColor: '#111827', borderColor: '#374151' },
  darkText: { color: '#F9FAFB' },
  darkSubText: { color: '#9CA3AF' },
  darkDivider: { backgroundColor: '#374151' },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 6,
  },
  flexInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 12,
    marginLeft: 10,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  urgencyTab: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeUrgency: {
    backgroundColor: '#2F70E9',
    borderColor: '#2F70E9',
  },
  activeUrgencyText: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#2F70E9',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2F70E9',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});