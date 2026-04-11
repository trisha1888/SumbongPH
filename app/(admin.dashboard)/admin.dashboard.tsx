import { auth, db } from '@/firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

const AdminDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  const stats = [
    { label: 'TOTAL THIS MONTH', value: '247' },
    { label: 'IN PROGRESS', value: '89' },
    { label: 'RESOLVED', value: '120' },
  ];

  const complaints = [
    {
      id: 'SBP-2025-0142',
      title: 'Loud karaoke past 10PM',
      cat: 'NOISE',
      time: '166d ago',
      color: '#000',
    },
    {
      id: 'SBP-2025-0143',
      title: 'Clogged drainage on Rizal Street',
      cat: 'INFRASTRUCTURE',
      time: '166d ago',
      color: '#000',
    },
    {
      id: 'SBP-2025-0144',
      title: 'Stray dogs near daycare center',
      cat: 'PUBLIC SAFETY',
      time: '168d ago',
      color: '#CCC',
    },
  ];

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.replace('/(login)/login');
          return;
        }

        const adminRef = doc(db, 'admin', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          router.replace('/(home_dasborad)/home.dashboard');
          return;
        }

        const adminData = adminSnap.data();

        if (adminData.active !== true) {
          await signOut(auth);
          Alert.alert('Access Denied', 'This admin account is inactive.');
          router.replace('/(login)/login');
          return;
        }

        setAdminName(adminData.name || 'Admin');
      } catch (error) {
        console.log('ADMIN ACCESS ERROR:', error);
        router.replace('/(login)/login');
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Checking admin access...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          isDesktop ? styles.desktopPadding : styles.mobilePadding
        }
        showsVerticalScrollIndicator={false}
      >
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

              <TouchableOpacity onPress={() => router.push('/maps.dashboard')}>
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/users.dashboard')}>
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>

              <Text style={styles.navItem}>Reports</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.userName}>Logout • {adminName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroContainer}>
          <Text style={styles.heroText}>
            <Text style={styles.orangeText}>38</Text> complaints{'\n'}need your{'\n'}attention.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.statsGrid, !isDesktop && styles.stackColumn]}>
          {stats.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push('/complaints.dashboard')}>
              <Text style={styles.orangeLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {complaints.map((item, index) => (
            <View key={index} style={styles.complaintRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      item.color === '#000' ? '#FF6B00' : '#CCC',
                  },
                ]}
              />
              <View style={styles.complaintContent}>
                <Text style={styles.complaintTitle}>{item.title}</Text>
                <Text style={styles.complaintSub}>
                  {item.id}  •  {item.cat}
                </Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  mobilePadding: {
    padding: 24,
  },
  desktopPadding: {
    paddingHorizontal: '10%',
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 70,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
  },
  navItem: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '500',
  },
  activeTabWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
    paddingBottom: 4,
  },
  activeNavItem: {
    fontSize: 13,
    color: '#000',
    fontWeight: '700',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  heroContainer: {
    marginBottom: 60,
  },
  heroText: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 68,
    letterSpacing: -2,
    color: '#111827',
  },
  orangeText: {
    color: '#FF6B00',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 80,
  },
  stackColumn: {
    flexDirection: 'column',
    gap: 50,
  },
  statCard: {
    flex: 1,
  },
  statValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#AAA',
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  orangeLink: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '700',
  },
  complaintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  complaintContent: {
    flex: 1,
    marginLeft: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  complaintSub: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 4,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 11,
    color: '#BBB',
    fontWeight: '500',
  },
});

export default AdminDashboard;