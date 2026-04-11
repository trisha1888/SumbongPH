import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './ThemeContext';

export default function EditReportScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Initial states based on your "Review Report" screens
  const [location, setLocation] = useState('San Antonio, TX');
  const [description, setDescription] = useState('Heavy flooding in the main intersection...');

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Edit Report Details',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>
        )
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Date Picker Section (Simplified for UI) */}
          <ThemedText style={styles.label}>Date & Time</ThemedText>
          <View style={[styles.inputContainer, isDarkMode && styles.darkInput]}>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            <ThemedText style={styles.inputText}>October 24, 2024 - 10:30 AM</ThemedText>
          </View>

          {/* Location Input */}
          <ThemedText style={styles.label}>Location</ThemedText>
          <View style={[styles.inputContainer, isDarkMode && styles.darkInput]}>
            <Ionicons name="location-outline" size={20} color="#9CA3AF" />
            <TextInput 
              style={styles.flexInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Urgency Selection */}
          <ThemedText style={styles.label}>Urgency Level</ThemedText>
          <View style={styles.urgencyRow}>
            {['Low', 'Medium', 'High'].map((level) => (
              <TouchableOpacity 
                key={level} 
                style={[styles.urgencyTab, level === 'High' && styles.activeUrgency]}
              >
                <ThemedText style={level === 'High' ? styles.activeUrgencyText : styles.urgencyText}>
                  {level}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description Multi-line Input */}
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.darkInput]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.updateButton} onPress={() => router.back()}>
            <ThemedText style={styles.updateButtonText}>Update Details</ThemedText>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  darkContainer: { backgroundColor: '#111827' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 15 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 10, 
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  darkInput: { backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' },
  inputText: { color: '#111827', fontSize: 15 },
  flexInput: { flex: 1, color: '#111827', fontSize: 15 },
  urgencyRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  urgencyTab: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  activeUrgency: { backgroundColor: '#2F70E9', borderColor: '#2F70E9' },
  urgencyText: { color: '#6B7280', fontWeight: '600' },
  activeUrgencyText: { color: 'white', fontWeight: '600' },
  textArea: { backgroundColor: 'white', borderRadius: 10, padding: 12, height: 120, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15 },
  updateButton: { backgroundColor: '#2F70E9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  updateButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});