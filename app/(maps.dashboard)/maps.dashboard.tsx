import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

export default function MapDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Removes the (maps_dashboard)/maps.dashboard header */}
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Map Header */}
        <View style={[styles.mapHeader, isDarkMode && styles.darkHeader]}>
          <ThemedText style={[styles.headerTitle, isDarkMode && styles.darkText]}>Map</ThemedText>
        </View>

        {/* Mock Map Canvas */}
        <View style={[styles.mapCanvas, isDarkMode && styles.darkMapCanvas]}>
          {/* Garbage Pin */}
          <MapPin 
            icon="location" 
            label="garbage" 
            color="#22C55E" 
            top={height * 0.15} 
            left={width * 0.1} 
          />

          {/* Streetlight Pin */}
          <MapPin 
            icon="location" 
            label="streetlight" 
            color="#EF4444" 
            top={height * 0.3} 
            left={width * 0.3} 
            isLarge 
          />

          {/* Flood Pin */}
          <MapPin 
            icon="location" 
            label="flood" 
            color="#A855F7" 
            top={height * 0.45} 
            left={width * 0.55} 
            isLarge 
          />
        </View>

        {/* Bottom Navigation */}
        <View style={[styles.tabBar, isDarkMode && styles.darkTabBar]}>
          <TabIcon icon="home-outline" label="Home" onPress={() => router.push('/(home_dasborad)/home.dashboard')} />
          <TabIcon icon="document-text-outline" label="Reports" onPress={() => router.push('/(reports_dashboard)/reports.dashboard')} />
          <TabIcon icon="map" label="Maps" active onPress={() => router.push('/(maps.dashboard)/maps.dashboard')} />
          <TabIcon icon="bulb-outline" label="Ideas" onPress={() => router.push('/(ideas_dashboard)/ideas_dashboard')} />
          <TabIcon icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// Map Pin Component
function MapPin({ icon, label, color, top, left, isLarge }: any) {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.pinContainer, { top, left }]}> 
      <View style={[
        styles.pinCircle, 
        { backgroundColor: color },
        isLarge && styles.pinLarge
      ]}>
        {isLarge && <View style={[styles.pulseRing, { borderColor: color }]} />}
        <Ionicons name={icon} size={isLarge ? 24 : 18} color="white" />
      </View>
      <ThemedText style={[styles.pinLabel, isDarkMode && styles.darkSubText]}>{label}</ThemedText>
    </View>
  );
}

// Reusable Tab Icon Component
function TabIcon({ icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={24} color={active ? '#2F70E9' : '#9CA3AF'} />
      <ThemedText style={[styles.tabLabel, { color: active ? '#2F70E9' : '#9CA3AF' }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0E7FF' }, // Light blue map background
  mapHeader: { padding: 20, backgroundColor: 'rgba(255,255,255,0.9)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  mapCanvas: { flex: 1, position: 'relative' },
  pinContainer: { position: 'absolute', alignItems: 'center' },
  pinCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', elevation: 4 },
  pinLarge: { width: 48, height: 48, borderRadius: 24 },
  pulseRing: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 10, opacity: 0.2 },
  pinLabel: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '600', textTransform: 'lowercase' },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 20 },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  darkHeader: { backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#374151' },
  darkMapCanvas: { backgroundColor: '#0F172A' },
  darkTabBar: { backgroundColor: '#111827', borderTopColor: '#374151' },
  darkContainer: { backgroundColor: '#0F172A' }
});
