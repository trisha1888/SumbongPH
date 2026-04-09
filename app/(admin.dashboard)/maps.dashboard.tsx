import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

const MapDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}>
        
        {/* --- NAVBAR --- */}
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>
          {isDesktop && (
            <View style={styles.navLinks}>
              {/* CONNECTED TO ADMIN OVERVIEW */}
              <TouchableOpacity onPress={() => router.push('/admin.dashboard')}>
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/complaints.dashboard')}>
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>
              
              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Map</Text>
              </View>
                            <TouchableOpacity onPress={() => router.push('/users.dashboard')}>
                              <Text style={styles.navItem}>Users</Text>
                            </TouchableOpacity>
              <Text style={styles.navItem}>Reports</Text>
            </View>
          )}
          <Text style={styles.userName}>Kap. Roberto Santos</Text>
        </View>

        {/* --- MAP CONTENT --- */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.mainTitle}>Map View</Text>
          <Text style={styles.subtitle}>Geospatial visualization of barangay complaints.</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>[ Map Integration Here ]</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 24 },
  desktopPadding: { paddingHorizontal: '10%', paddingVertical: 40 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 70 },
  logo: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 30, alignItems: 'center' },
  navItem: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  activeTabWrapper: { borderBottomWidth: 2, borderBottomColor: '#FF6B00', paddingBottom: 4 },
  activeNavItem: { fontSize: 13, color: '#000', fontWeight: '700' },
  userName: { fontSize: 13, fontWeight: '600' },
  headerTitleContainer: { marginBottom: 30 },
  mainTitle: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  mapPlaceholder: { height: 500, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB' },
  placeholderText: { color: '#9CA3AF', fontWeight: '600' }
});

export default MapDashboard;