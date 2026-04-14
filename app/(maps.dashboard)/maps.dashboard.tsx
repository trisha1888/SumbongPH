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
        
        {/* ✅ ADDED WRAPPER TO PUSH FILTERS DOWN */}
        <View style={styles.mapWrapper}>
          <View style={[styles.mapCanvas, isDarkMode && styles.darkMapCanvas]}>
            <MapsDashboardView isDarkMode={isDarkMode} />
          </View>
        </View>

        {/* TAB BAR */}
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
            icon="person-outline"
            label="Profile"
            onPress={() => router.push('/profile')}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

type TabIconProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
};

function TabIcon({ icon, label, active, onPress }: TabIconProps) {
  const activeIcon = active
    ? (icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap)
    : icon;

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={activeIcon}
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

  // ✅ NEW WRAPPER (moves filters down)
  mapWrapper: {
    flex: 1,
    paddingTop: 25, // 🔥 THIS MOVES THE FILTER BUTTONS DOWN
  },

  mapCanvas: {
    flex: 1,
  },

  darkMapCanvas: {
    backgroundColor: '#0F172A',
  },

  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },

  darkTabBar: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },

  tabItem: {
    alignItems: 'center',
    flex: 1,
  },

  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
  },
});