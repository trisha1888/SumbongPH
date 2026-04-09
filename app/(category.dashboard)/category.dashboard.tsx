import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

// Data mapping for categories matching your UI image
const CATEGORIES = [
  { id: '1', label: 'Flood', icon: 'cloud-outline', color: '#EEF2FF', iconColor: '#4F46E5' },
  { id: '2', label: 'Garbage', icon: 'trash-outline', color: '#F0FDF4', iconColor: '#16A34A' },
  { id: '3', label: 'Road', icon: 'construct-outline', color: '#FFF7ED', iconColor: '#EA580C' },
  { id: '4', label: 'Streetlight', icon: 'bulb-outline', color: '#FEFCE8', iconColor: '#CA8A04' },
  { id: '5', label: 'Noise', icon: 'volume-high-outline', color: '#FAF5FF', iconColor: '#9333EA' },
  { id: '6', label: 'Safety', icon: 'alert-circle-outline', color: '#FEF2F2', iconColor: '#DC2626' },
  { id: '7', label: 'Other', icon: 'help-circle-outline', color: '#F9FAFB', iconColor: '#4B5563' },
];

export default function CategoryDashboard() {
  const router = useRouter();

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => {
        // This dynamic route handles all connections (flood, garbage, road, etc.)
        const routeName = `/${item.label.toLowerCase()}.dashboard`;
        router.push(routeName as any);
      }}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={28} color={item.iconColor} />
      </View>
      <ThemedText style={styles.categoryLabel}>{item.label}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Select Category',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ),
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <ThemedText style={styles.subtitle}>What type of issue are you reporting?</ThemedText>
          
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  subtitle: { textAlign: 'center', fontSize: 16, color: '#6B7280', marginTop: 30, marginBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 25 },
  categoryCard: { flex: 1, alignItems: 'center', maxWidth: '33%' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Subtle shadow for better UI depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
});