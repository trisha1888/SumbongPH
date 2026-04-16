import AdminReportsMap from '@/components/AdminReportsMap';
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

type ReportMapItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt?: any;
};

export default function MapDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [reports, setReports] = useState<ReportMapItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportMapItem | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setTimeout(() => router.replace('/(login)/login' as any), 0);
          return;
        }

        const adminRef = doc(db, 'admin', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          setTimeout(() => router.replace('/(home_dasborad)/home.dashboard' as any), 0);
          return;
        }

        const adminData = adminSnap.data();

        if (adminData.active !== true) {
          await signOut(auth);
          Alert.alert('Access Denied', 'This admin account is inactive.');
          setTimeout(() => router.replace('/(login)/login' as any), 0);
          return;
        }

        setAdminName(adminData.name || 'Admin');
      } catch (error) {
        console.log('MAP ADMIN ACCESS ERROR:', error);
        setTimeout(() => router.replace('/(login)/login' as any), 0);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    const reportsRef = collection(db, 'reports');
    const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const mappedReports: ReportMapItem[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();

            const latitude =
              data.latitude ??
              data.lat ??
              data.coordinates?.latitude ??
              data.coordinates?.lat ??
              data.location?.latitude ??
              data.location?.lat;

            const longitude =
              data.longitude ??
              data.lng ??
              data.coordinates?.longitude ??
              data.coordinates?.lng ??
              data.location?.longitude ??
              data.location?.lng;

            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
              return null;
            }

            return {
              id: docSnap.id,
              title: data.title || data.description || 'Untitled Report',
              description: data.description || 'No description provided.',
              category: data.category || 'Uncategorized',
              status: data.status || 'Pending',
              address:
                data.address ||
                data.coordinates?.address ||
                data.location?.address ||
                data.barangay ||
                'No address provided',
              latitude,
              longitude,
              createdAt: data.createdAt || null,
            };
          })
          .filter(Boolean) as ReportMapItem[];

        setReports(mappedReports);

        if (mappedReports.length > 0) {
          setSelectedReport((prev) => {
            if (!prev) return mappedReports[0];
            const stillExists = mappedReports.find((r) => r.id === prev.id);
            return stillExists || mappedReports[0];
          });
        } else {
          setSelectedReport(null);
        }

        setLoadingReports(false);
      },
      (error) => {
        console.log('MAP REPORTS LOAD ERROR:', error);
        Alert.alert('Error', 'Failed to load map reports from Firebase.');
        setLoadingReports(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/(login)/login' as any);
          } catch (error) {
            Alert.alert('Error', 'Failed to log out.');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();

    if (['resolved', 'completed', 'done'].includes(normalized)) return '#22C55E';
    if (['in progress', 'ongoing', 'processing'].includes(normalized)) return '#FF6B00';
    if (['pending', 'new'].includes(normalized)) return '#3B82F6';

    return '#9CA3AF';
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

  const statusSummary = useMemo(() => {
    const pending = reports.filter((r) =>
      ['pending', 'new'].includes(r.status.toLowerCase())
    ).length;

    const inProgress = reports.filter((r) =>
      ['in progress', 'ongoing', 'processing'].includes(r.status.toLowerCase())
    ).length;

    const resolved = reports.filter((r) =>
      ['resolved', 'completed', 'done'].includes(r.status.toLowerCase())
    ).length;

    return { pending, inProgress, resolved };
  }, [reports]);

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
        contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>

          {isDesktop && (
            <View style={styles.navLinks}>
              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/admin.dashboard' as any)}
              >
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/complaints.dashboard' as any)}
              >
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/announcements.dashboard' as any)}
              >
                <Text style={styles.navItem}>Announcements</Text>
              </TouchableOpacity>

              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Map</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/users.dashboard' as any)}
              >
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/analytics.dashboard' as any)}
              >
                <Text style={styles.navItem}>Report Analytics</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.userName}>Logout • {adminName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.mainTitle}>Map View</Text>
          <Text style={styles.subtitle}>Geospatial visualization of barangay reports.</Text>
        </View>

        <View style={[styles.summaryRow, !isDesktop && styles.summaryColumn]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{reports.length}</Text>
            <Text style={styles.summaryLabel}>GEOTAGGED REPORTS</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusSummary.pending}</Text>
            <Text style={styles.summaryLabel}>PENDING</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusSummary.inProgress}</Text>
            <Text style={styles.summaryLabel}>IN PROGRESS</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{statusSummary.resolved}</Text>
            <Text style={styles.summaryLabel}>RESOLVED</Text>
          </View>
        </View>

        <View style={[styles.mainGrid, !isDesktop && styles.mainGridMobile]}>
          <View style={styles.mapPanel}>
            {loadingReports ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.centerText}>Loading map reports...</Text>
              </View>
            ) : reports.length === 0 ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyTitle}>No geotagged reports found</Text>
                <Text style={styles.emptyText}>
                  Make sure your Firestore reports have latitude and longitude.
                </Text>
              </View>
            ) : (
              <AdminReportsMap
                reports={reports}
                selectedReport={selectedReport}
                onSelectReport={setSelectedReport}
              />
            )}
          </View>

          <View style={styles.sidePanel}>
            <Text style={styles.panelTitle}>Selected Report</Text>

            {selectedReport ? (
              <View style={styles.detailCard}>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: `${getStatusColor(selectedReport.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: getStatusColor(selectedReport.status) },
                    ]}
                  >
                    {selectedReport.status}
                  </Text>
                </View>

                <Text style={styles.detailTitle}>{selectedReport.title}</Text>
                <Text style={styles.detailMeta}>
                  {selectedReport.category} • {getRelativeTime(selectedReport.createdAt)}
                </Text>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedReport.description}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{selectedReport.address}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Latitude</Text>
                  <Text style={styles.detailValue}>{selectedReport.latitude}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Longitude</Text>
                  <Text style={styles.detailValue}>{selectedReport.longitude}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptySideCard}>
                <Text style={styles.emptyText}>
                  Select a marker to view report details.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 24 },
  desktopPadding: { paddingHorizontal: '10%', paddingVertical: 40 },

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
    marginBottom: 50,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#111827',
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
  },

  headerTitleContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
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
    borderRadius: 14,
    padding: 16,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EA580C',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
    marginTop: 6,
  },

  mainGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  mainGridMobile: {
    flexDirection: 'column',
  },

  mapPanel: {
    flex: 1.5,
    minHeight: 560,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sidePanel: {
    flex: 1,
  },

  centerBox: {
    minHeight: 560,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  emptySideCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  detailMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 16,
  },
  detailBlock: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});