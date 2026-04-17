import React, { useCallback } from 'react';
import { 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Platform,
  useWindowDimensions 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../ThemeContext';

// --- Constants ---
const PRIMARY_RED = '#DC2626';
const SLATE_500 = '#64748B';
const SLATE_900 = '#0F172A';

const CATEGORIES = [
  { id: '1', label: 'Flood', icon: 'water', color: '#4F46E5', bg: '#EEF2FF' },
  { id: '2', label: 'Garbage', icon: 'trash', color: '#16A34A', bg: '#F0FDF4' },
  { id: '3', label: 'Road', icon: 'construct', color: '#EA580C', bg: '#FFF7ED' },
  { id: '4', label: 'Streetlight', icon: 'bulb', color: '#CA8A04', bg: '#FEFCE8' },
  { id: '5', label: 'Noise', icon: 'volume-high', color: '#9333EA', bg: '#FAF5FF' },
  { id: '6', label: 'Safety', icon: 'shield-checkmark', color: '#DC2626', bg: '#FEF2F2' },
  { id: '7', label: 'Fire', icon: 'flame', color: '#EF4444', bg: '#FEF2F2' },
  { id: '8', label: 'Medical', icon: 'medical', color: '#06B6D4', bg: '#ECFEFF' },
  { id: '9', label: 'Other', icon: 'grid', color: '#4B5563', bg: '#F9FAFB' },
];

export default function CategoryDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  // Responsive logic
  const isDesktop = width > 768;
  const COLUMN_COUNT = isDesktop ? 5 : 3;
  const GRID_PADDING = isDesktop ? 40 : 16;
  const ITEM_GAP = 12;
  
  // Calculate card width based on current screen size
  const cardWidth = (Math.min(width, 1200) - (GRID_PADDING * 2) - (ITEM_GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

  const handleSelect = useCallback((item: typeof CATEGORIES[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/edit-report',
      params: { category: item.label, icon: item.icon },
    });
  }, [router]);

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.card, 
        isDarkMode && styles.darkCard, 
        { width: cardWidth }
      ]}
      activeOpacity={0.7}
      onPress={() => handleSelect(item)}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : item.bg }
      ]}>
        <Ionicons 
          name={item.icon as any} 
          size={isDesktop ? 32 : 26} 
          color={isDarkMode ? '#FFF' : item.color} 
        />
        <View style={[styles.activeDot, { backgroundColor: item.color }]} />
      </View>
      
      <ThemedText 
        numberOfLines={1} 
        adjustsFontSizeToFit 
        style={[styles.label, isDarkMode && styles.darkText]}
      >
        {item.label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'REPORT CATEGORY',
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDarkMode ? '#020617' : '#F8FAFC' },
          headerTintColor: isDarkMode ? '#FFF' : SLATE_900,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          // Key prop forces a re-render when switching column counts (crucial for Web resize)
          key={isDesktop ? 'desktop-grid' : 'mobile-grid'}
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: GRID_PADDING }]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <ThemedText style={styles.kicker}>PROTOCOL INITIATION</ThemedText>
              <ThemedText style={[styles.mainTitle, isDarkMode && styles.darkText]}>
                Identify Incident Type
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerInfo}>
              <Ionicons name="information-circle-outline" size={14} color={SLATE_500} />
              <ThemedText style={styles.footerText}>
                Selecting a category helps us route to the correct department instantly.
              </ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: '#020617' },
  safeArea: { 
    flex: 1, 
    maxWidth: 1200, // Caps the width for desktop
    width: '100%',
    alignSelf: 'center' 
  },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  
  headerSection: {
    paddingTop: 30,
    marginBottom: 32,
    alignItems: 'center'
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    color: PRIMARY_RED,
    letterSpacing: 2,
    marginBottom: 6
  },
  mainTitle: {
    fontSize: 28, // Slightly larger for desktop feel
    fontWeight: '800',
    color: SLATE_900,
    textAlign: 'center'
  },

  listContent: {
    paddingBottom: 60,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      },
      android: { elevation: 2 }
    })
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155'
  },
  
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative'
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3
  },
  
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    width: '90%'
  },
  darkText: { color: '#F1F5F9' },
  
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8
  },
  footerText: {
    fontSize: 12,
    color: SLATE_500,
    fontWeight: '500',
  }
});