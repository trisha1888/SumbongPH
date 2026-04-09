import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SafetyDashboard() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header matching the Review Report style */}
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Review Report',
        headerTitleAlign: 'left',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 20 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ),
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.card}>
            {/* Category Header Section for Safety */}
            <View style={styles.row}>
              <View style={styles.safetyBadge}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
              </View>
              <View>
                <ThemedText style={styles.label}>Category</ThemedText>
                <ThemedText style={styles.value}>safety</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Location Section */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Location</ThemedText>
              <ThemedText style={styles.value}>Location not set</ThemedText>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <ThemedText style={styles.value}>No description provided</ThemedText>
            </View>

            {/* Urgency Section */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Urgency</ThemedText>
              <View style={styles.urgencyBadge}>
                <ThemedText style={styles.urgencyText}>low</ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.submitButton}>
            <ThemedText style={styles.submitText}>Submit Report</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton}>
            <ThemedText style={styles.editText}>Edit Details</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 30, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  // Red theme for safety reports
  safetyBadge: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8 },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
  value: { color: '#111827', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  section: { marginBottom: 20 },
  urgencyBadge: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  urgencyText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  submitButton: { backgroundColor: '#2F70E9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  editButton: { paddingVertical: 10, alignItems: 'center' },
  editText: { color: '#4B5563', fontWeight: '600' }
});