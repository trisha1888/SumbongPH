import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { submitSuggestion } from '@/services/suggestionService';
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
import { useTheme } from './ThemeContext';

const SUGGESTION_CATEGORIES = [
  'Cleanliness',
  'Safety',
  'Environment',
  'Roads',
  'Lighting',
  'Health',
  'Education',
  'Youth Programs',
  'General',
];

export default function NewSuggestionScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your suggestion.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please write your suggestion before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      await submitSuggestion({
        title: title.trim(),
        description: description.trim(),
        category,
      });

      Alert.alert(
        'Suggestion Submitted',
        'Your suggestion has been successfully sent to the barangay.',
        [
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error?.message ?? 'Something went wrong while submitting your suggestion.'
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
          title: 'New Suggestion',
          headerTitleAlign: 'left',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
          },
          headerTintColor: isDarkMode ? '#F9FAFB' : '#111827',
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Suggestion Title
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.darkInput,
                isDarkMode && styles.darkText,
              ]}
              placeholder="Example: Add more streetlights near the covered court"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Category
            </ThemedText>

            <View style={styles.categoryWrap}>
              {SUGGESTION_CATEGORIES.map((item) => {
                const active = category === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryChip,
                      isDarkMode && styles.darkInput,
                      active && styles.activeChip,
                    ]}
                    onPress={() => setCategory(item)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[
                        styles.categoryChipText,
                        isDarkMode && styles.darkSubText,
                        active && styles.activeChipText,
                      ]}
                    >
                      {item}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={[styles.label, isDarkMode && styles.darkSubText]}>
              Description
            </ThemedText>

            <TextInput
              style={[
                styles.textArea,
                isDarkMode && styles.darkInput,
                isDarkMode && styles.darkText,
              ]}
              placeholder="Explain your idea and how it can improve the community."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
            />
          </View>

          {/* SUBMIT BUTTON */}
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
              <ThemedText style={styles.submitText}>Submit Suggestion</ThemedText>
            )}
          </TouchableOpacity>

          {/* CANCEL BUTTON */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            disabled={submitting}
          >
            <ThemedText style={[styles.cancelText, isDarkMode && styles.darkSubText]}>
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
    marginBottom: 24,
    elevation: 2,
  },

  darkCard: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
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

  darkInput: {
    backgroundColor: '#111827',
    borderColor: '#374151',
  },

  darkText: {
    color: '#F9FAFB',
  },

  darkSubText: {
    color: '#9CA3AF',
  },

  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    marginBottom: 10,
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },

  activeChip: {
    backgroundColor: '#2F70E9',
    borderColor: '#2F70E9',
  },

  activeChipText: {
    color: '#FFFFFF',
  },

  textArea: {
    minHeight: 170,
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

  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  cancelText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 15,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});