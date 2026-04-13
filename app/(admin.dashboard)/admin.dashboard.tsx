import { auth, db } from '@/firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
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

type ReportItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt?: any;
};

const AdminDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

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
  }, [isMounted, router]);

  useEffect(() => {
    if (!isMounted) return;

    const reportsRef = collection(db, 'reports');
    const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const allReports: ReportItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            title: data.title || data.description || 'Untitled Report',
            category: data.category || 'Uncategorized',
            status: data.status || 'Pending',
            createdAt: data.createdAt || null,
          };
        });

        setReports(allReports);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthReports = allReports.filter((item) => {
          if (!item.createdAt) return false;

          try {
            const date = item.createdAt?.toDate
              ? item.createdAt.toDate()
              : new Date(item.createdAt);

            return (
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            );
          } catch {
            return false;
          }
        });

        const pending = allReports.filter((item) =>
          ['pending', 'new'].includes(item.status.toLowerCase())
        );

        const inProgress = allReports.filter((item) =>
          ['in progress', 'ongoing', 'processing'].includes(
            item.status.toLowerCase()
          )
        );

        const resolved = allReports.filter((item) =>
          ['resolved', 'completed', 'done'].includes(
            item.status.toLowerCase()
          )
        );

        setTotalThisMonth(thisMonthReports.length);
        setPendingCount(pending.length);
        setInProgressCount(inProgress.length);
        setResolvedCount(resolved.length);
        setLoadingDashboard(false);
      },
      (error) => {
        console.log('DASHBOARD LOAD ERROR:', error);
        Alert.alert('Error', 'Failed to load dashboard data.');
        setLoadingDashboard(false);
      }
    );

    return () => unsubscribe();
  }, [isMounted]);

  const recentReports = useMemo(() => {
    return reports.slice(0, 5);
  }, [reports]);

  const stats = [
    { label: 'TOTAL THIS MONTH', value: String(totalThisMonth), color: '#EA580C' },
    { label: 'PENDING', value: String(pendingCount), color: '#3B82F6' },
    { label: 'IN PROGRESS', value: String(inProgressCount), color: '#F97316' },
    { label: 'RESOLVED', value: String(resolvedCount), color: '#22C55E' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const getRelativeTime = (value: any) => {
    if (!value) return 'No date';

    try {
      const date = value?.toDate ? value.toDate() : new Date(value);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();

      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch {
      return 'No date';
    }
  };

  const getStatusDotColor = (status: string) => {
    const normalized = status.toLowerCase();

    if (['resolved', 'completed', 'done'].includes(normalized)) {
      return '#22C55E';
    }

    if (['in progress', 'ongoing', 'processing'].includes(normalized)) {
      return '#F97316';
    }

    if (['pending', 'new'].includes(normalized)) {
      return '#3B82F6';
    }

    return '#9CA3AF';
  };

  if (!isMounted || checkingAccess) {
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

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/complaints.dashboard')
                }
              >
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
router.push('/(admin.dashboard)/announcements.dashboard' as any)                }
              >
                <Text style={styles.navItem}>Announcements</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/maps.dashboard')
                }
              >
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/users.dashboard')
                }
              >
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/analytics.dashboard')
                }
              >
                <Text style={styles.navItem}>Report Analytics</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.userName}>Logout • {adminName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>Admin Overview</Text>
            <Text style={styles.subtitle}>
              Real-time summary of received reports and current system activity.
            </Text>
          </View>
        </View>

        <View style={[styles.summaryRow, !isDesktop && styles.summaryColumn]}>
          {stats.map((item, index) => (
            <View key={index} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: item.color }]}>
                {item.value}
              </Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.grid, !isDesktop && styles.gridMobile]}>
          <View style={styles.leftColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Priority Overview</Text>
              <Text style={styles.panelSubtitle}>
                Current reports that need admin attention
              </Text>

              <View style={styles.heroCard}>
                <Text style={styles.heroText}>
                  <Text style={styles.orangeText}>{inProgressCount}</Text> reports{'\n'}
                  need your{'\n'}
                  attention.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.panel}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.panelTitle}>Recent Activity</Text>
                  <Text style={styles.panelSubtitle}>
                    Latest reports received by the system
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push('/(admin.dashboard)/complaints.dashboard')
                  }
                >
                  <Text style={styles.orangeLink}>View all</Text>
                </TouchableOpacity>
              </View>

              {loadingDashboard ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.stateText}>Loading recent reports...</Text>
                </View>
              ) : recentReports.length === 0 ? (
                <View style={styles.centerState}>
                  <Text style={styles.stateText}>No reports found.</Text>
                </View>
              ) : (
                <View style={styles.listCard}>
                  {recentReports.map((item) => (
                    <View key={item.id} style={styles.activityRow}>
                      <View
                        style={[
                          styles.activityDot,
                          { backgroundColor: getStatusDotColor(item.status) },
                        ]}
                      />
                      <View style={styles.activityTextWrap}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <Text style={styles.activityMeta}>
                          {item.category} • {item.status} • {getRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 24 },
  desktopPadding: { paddingHorizontal: '8%', paddingVertical: 36 },

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
    marginBottom: 40,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#111827',
  },
  navLinks: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'center',
  },
  navItem: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeTabWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
    paddingBottom: 4,
  },
  activeNavItem: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  headerRow: {
    marginBottom: 24,
    gap: 18,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryColumn: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 18,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EA580C',
  },
  summaryLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
  },

  grid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
    gap: 20,
  },
  rightColumn: {
    flex: 1,
    gap: 20,
  },

  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 18,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  panelSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    color: '#6B7280',
  },

  heroCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
  },
  heroText: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1.5,
    color: '#111827',
  },
  orangeText: {
    color: '#F97316',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orangeLink: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },

  centerState: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  listCard: {
    gap: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  activityMeta: {
    marginTop: 3,
    fontSize: 11,
    color: '#6B7280',
  },
});

export default AdminDashboard;