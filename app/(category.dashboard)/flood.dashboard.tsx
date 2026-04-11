import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { submitComplaint } from '@/services/complaintService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FloodDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  const category = 'Flood';

  const location =
    typeof params.location === 'string' && params.location.trim()
      ? params.location
      : '';

  const description =
    typeof params.description === 'string' && params.description.trim()
      ? params.description
      : '';

  const urgency =
    typeof params.urgency === 'string' && params.urgency.trim()
      ? params.urgency
      : 'Low';

  const reportDate =
    typeof params.date === 'string' && params.date.trim()
      ? params.date
      : '';

  const handleSubmitReport = async () => {
    try {
      if (!location || !description) {
        Alert.alert(
          'Incomplete Report',
          'Please complete the report details before submitting.'
        );
        return;
      }

      setLoading(true);

      const complaintId = await submitComplaint({
        title: `${category} complaint`,
        description: reportDate
          ? `${description}\n\nReported date: ${reportDate}`
          : description,
        category,
        location,
        urgency,
      });

      Alert.alert(
        'Success',
        'Your complaint has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/reports.dashboard'),
          },
        ]
      );
    } catch (error: any) {
      console.log('SUBMIT REPORT ERROR:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Review Report',
          headerTitleAlign: 'left',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.floodBadge}>
                <ThemedText style={styles.floodBadgeText}>
                  {category.toLowerCase()}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.label}>Category</ThemedText>
                <ThemedText style={styles.value}>{category}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <ThemedText style={styles.label}>Location</ThemedText>
              <ThemedText style={styles.value}>
                {location || 'Not set'}
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <ThemedText style={styles.value}>
                {description || 'No description'}
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Urgency</ThemedText>
              <View style={styles.urgencyBadge}>
                <ThemedText style={styles.urgencyText}>{urgency}</ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Date Reported</ThemedText>
              <ThemedText style={styles.value}>
                {reportDate || 'No date selected'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitReport}
            disabled={loading}
          >
            <ThemedText style={styles.submitText}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: '/edit-report',
                params: {
                  category,
                  location,
                  description,
                  urgency,
                  date: reportDate,
                },
              })
            }
          >
            <ThemedText style={styles.editText}>Edit Details</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  floodBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  floodBadgeText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 14,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  urgencyBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  urgencyText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2F70E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  editText: {
    color: '#4B5563',
    fontWeight: '600',
  },
});