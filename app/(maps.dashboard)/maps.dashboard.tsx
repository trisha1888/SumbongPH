import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapsDashboardView from '../../components/MapsDashboardView';
import { useTheme } from '../ThemeContext';

export default function MapDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header removed as requested */}
        
        <View style={[styles.mapCanvas, isDarkMode && styles.darkMapCanvas]}>
          <MapsDashboardView isDarkMode={isDarkMode} />
        </View>

        {/* Floating Tab Bar */}
        <View style={[styles.tabBar, isDarkMode && styles.darkTabBar]}>
          <TabIcon
            icon="home-outline"
            label="Home"
            onPress={() => router.push('/(home_dasborad)/home.dashboard')}
          />
          <TabIcon
            icon="document-text-outline"
            label="Reports"
            onPress={() => router.push('/(reports_dashboard)/reports.dashboard')}
          />
          <TabIcon
            icon="map-outline"
            label="Maps"
            active
            onPress={() => router.push('/(maps.dashboard)/maps.dashboard')}
          />
          <TabIcon
            icon="bulb-outline"
            label="Ideas"
            onPress={() => router.push('/(ideas_dashboard)/ideas_dashboard')}
          />
          <TabIcon
            icon="person-outline"
            label="Profile"
            onPress={() => router.push('/profile')}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TabIcon({
  icon,
  label,
  active,
  onPress,
}: any) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons 
        name={active ? (icon as string).replace('-outline', '') : icon} 
        size={22} 
        color={active ? '#2F70E9' : '#9CA3AF'} 
      />
      <ThemedText style={[styles.tabLabel, { color: active ? '#2F70E9' : '#9CA3AF' }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  mapCanvas: {
    flex: 1,
  },
  darkMapCanvas: {
    backgroundColor: '#0F172A',
  },
  tabBar: { 
    position: 'absolute', 
    left: 12, 
    right: 12, 
    bottom: 12, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 24, 
    paddingHorizontal: 10, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  darkTabBar: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { marginTop: 4, fontSize: 10, fontWeight: '600' },
});