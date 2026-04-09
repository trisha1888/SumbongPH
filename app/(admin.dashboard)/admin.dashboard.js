import { Stack, useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

const AdminDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const stats = [
    { label: 'TOTAL THIS MONTH', value: '247' },
    { label: 'IN PROGRESS', value: '89' },
    { label: 'RESOLVED', value: '120' },
  ];

  const complaints = [
    { id: 'SBP-2025-0142', title: 'Loud karaoke past 10PM', cat: 'NOISE', time: '166d ago', color: '#000' },
    { id: 'SBP-2025-0143', title: 'Clogged drainage on Rizal Street', cat: 'INFRASTRUCTURE', time: '166d ago', color: '#000' },
    { id: 'SBP-2025-0144', title: 'Stray dogs near daycare center', cat: 'PUBLIC SAFETY', time: '168d ago', color: '#CCC' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}
        showsVerticalScrollIndicator={false}
      >
        {/* --- NAVBAR --- */}
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>
          {isDesktop && (
            <View style={styles.navLinks}>
              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Overview</Text>
              </View>
              
              <TouchableOpacity onPress={() => router.push('/complaints.dashboard')}>
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>
              
              {/* CONNECTED TO MAP */}
              <TouchableOpacity onPress={() => router.push('/maps.dashboard')}>
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/users.dashboard')}>
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>
              <Text style={styles.navItem}>Reports</Text>
            </View>
          )}
          <Text style={styles.userName}>Kap. Roberto Santos</Text>
        </View>

        {/* --- HERO SECTION --- */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroText}>
            <Text style={styles.orangeText}>38</Text> complaints{'\n'}need your{'\n'}attention.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* --- STATS GRID --- */}
        <View style={[styles.statsGrid, !isDesktop && styles.stackColumn]}>
          {stats.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* --- RECENT COMPLAINTS SECTION --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push('/complaints.dashboard')}>
              <Text style={styles.orangeLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {complaints.map((item, index) => (
            <View key={index} style={styles.complaintRow}>
              <View style={[styles.dot, { backgroundColor: item.color === '#000' ? '#FF6B00' : '#CCC' }]} />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.complaintTitle}>{item.title}</Text>
                <Text style={styles.complaintSub}>{item.id}  •  {item.cat}</Text>
              </View>
              <Text style={styles.timeLabel}>{item.time}</Text>
            </View>
          ))}
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
  heroContainer: { marginBottom: 60 },
  heroText: { fontSize: 64, fontWeight: '800', lineHeight: 68, letterSpacing: -2 },
  orangeText: { color: '#FF6B00' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 60 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 80 },
  stackColumn: { flexDirection: 'column', gap: 50 },
  statCard: { flex: 1 },
  statValue: { fontSize: 48, fontWeight: '700' },
  statLabel: { fontSize: 10, color: '#AAA', fontWeight: '800', marginTop: 10, letterSpacing: 0.5 },
  section: { marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  orangeLink: { fontSize: 12, color: '#FF6B00', fontWeight: '700' },
  complaintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  complaintTitle: { fontSize: 14, fontWeight: '700' },
  complaintSub: { fontSize: 10, color: '#BBB', marginTop: 4, fontWeight: '600' },
  timeLabel: { fontSize: 11, color: '#BBB', fontWeight: '500' },
});

export default AdminDashboard;