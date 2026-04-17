import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MapsDashboardView from '../../components/MapsDashboardView';
import { useTheme } from '../ThemeContext';

const PRIMARY_RED = '#DC2626';
const DARK_BG = '#020617';

export default function MapDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  // --- CATCH PARAMS FROM REPORT CLICK ---
  const params = useLocalSearchParams();
  const targetLat = params.lat ? parseFloat(params.lat as string) : null;
  const targetLng = params.lng ? parseFloat(params.lng as string) : null;

  const navigateTo = (path: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Adjusted paddingTop here to move content down */}
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.greeting}>GEOSPATIAL VIEW</ThemedText>
          <ThemedText style={[styles.headerTitle, isDarkMode && { color: '#FFF' }]}>Live Map</ThemedText>
        </View>

        <View style={styles.mapWrapper}>
          <View style={[styles.mapCanvas, isDarkMode && styles.darkMapCanvas]}>
            {/* Pass the target coordinates to your View component */}
            <MapsDashboardView 
              isDarkMode={isDarkMode} 
              targetLat={targetLat} 
              targetLng={targetLng} 
            />
          </View>
        </View>

        {/* --- NAVIGATION DOCK --- */}
        <View style={[styles.navDock, isDarkMode && styles.darkCard, styles.shadow]}>
          <NavIcon icon="home" label="Home" onPress={() => navigateTo('/(home_dasborad)/home.dashboard')} />
          <NavIcon icon="document-text" label="Reports" onPress={() => navigateTo('/(reports_dashboard)/reports.dashboard')} />
          <View style={{ width: 60 }} />
          <NavIcon icon="map" label="Map" active />
          <NavIcon icon="person" label="Profile" onPress={() => navigateTo('/profile')} />
          
          <TouchableOpacity 
            style={[styles.fab, styles.shadow, isDarkMode && { borderColor: DARK_BG }]} 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push('/category.dashboard');
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const NavIcon = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? PRIMARY_RED : '#94A3B8'} />
    <ThemedText style={[styles.navLabel, { color: active ? PRIMARY_RED : '#94A3B8' }]}>{label}</ThemedText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: DARK_BG },
  darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
  // INCREASED paddingTop from 10 to 30 to move it down slightly
  headerTitleContainer: { paddingHorizontal: 20, paddingTop: 30, zIndex: 10 },
  greeting: { fontSize: 10, fontWeight: '900', color: PRIMARY_RED, letterSpacing: 1.5 },
  headerTitle: { fontSize: 26, fontWeight: '900' },
  mapWrapper: { flex: 1, paddingTop: 10 },
  mapCanvas: { flex: 1, overflow: 'hidden' },
  darkMapCanvas: { backgroundColor: '#0F172A' },
  navDock: { position: 'absolute', bottom: 30, left: 16, right: 16, height: 75, backgroundColor: 'white', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#E2E8F0' },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  navLabel: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  fab: { position: 'absolute', top: -32, left: '50%', marginLeft: -35, width: 70, height: 70, borderRadius: 24, backgroundColor: PRIMARY_RED, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: '#F8FAFC' },
  shadow: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }) },
});