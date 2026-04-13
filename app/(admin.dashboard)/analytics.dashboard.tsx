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
  area: string;
  createdAt?: any;
};

type FilterType = 'All' | 'This Week' | 'This Month';

export default function AnalyticsDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [activeFilter, setActiveFilter] = useState<FilterType>('This Week');
  const [reports, setReports] = useState<ReportItem[]>([]);

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
        console.log('ANALYTICS ACCESS ERROR:', error);
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
        const mappedReports: ReportItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            title: data.title || data.description || 'Untitled Report',
            category: data.category || 'Uncategorized',
            status: data.status || 'Pending',
            area:
              data.address ||
              data.barangay ||
              data.location?.address ||
              'Unknown Area',
            createdAt: data.createdAt || null,
          };
        });

        setReports(mappedReports);
        setLoadingAnalytics(false);
      },
      (error) => {
        console.log('ANALYTICS LOAD ERROR:', error);
        Alert.alert('Error', 'Failed to load analytics data.');
        setLoadingAnalytics(false);
      }
    );

    return () => unsubscribe();
  }, [isMounted]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const normalizeStatus = (status: string) => status.toLowerCase().trim();

  const getReportDate = (value: any): Date | null => {
    if (!value) return null;

    try {
      if (value?.toDate) return value.toDate();
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  const currentDay = startOfWeek.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  startOfWeek.setDate(startOfWeek.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (activeFilter === 'All') return true;

      const reportDate = getReportDate(report.createdAt);
      if (!reportDate) return false;

      if (activeFilter === 'This Week') {
        return reportDate >= startOfWeek;
      }

      if (activeFilter === 'This Month') {
        return reportDate >= startOfMonth;
      }

      return true;
    });
  }, [reports, activeFilter]);

  const totalReports = filteredReports.length;

  const pendingCount = filteredReports.filter((r) =>
    ['pending', 'new'].includes(normalizeStatus(r.status))
  ).length;

  const inProgressCount = filteredReports.filter((r) =>
    ['in progress', 'ongoing', 'processing'].includes(normalizeStatus(r.status))
  ).length;

  const resolvedCount = filteredReports.filter((r) =>
    ['resolved', 'completed', 'done'].includes(normalizeStatus(r.status))
  ).length;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredReports.forEach((report) => {
      const key = report.category || 'Uncategorized';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReports]);

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredReports.forEach((report) => {
      const key = report.area || 'Unknown Area';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredReports]);

  const recentReports = useMemo(() => {
    return filteredReports.slice(0, 5);
  }, [filteredReports]);

  const weeklyTrendData = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = dayLabels.map((label, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      return {
        label,
        date,
        value: 0,
      };
    });

    reports.forEach((report) => {
      const date = getReportDate(report.createdAt);
      if (!date) return;

      if (date < startOfWeek) return;

      const reportDay = new Date(date);
      reportDay.setHours(0, 0, 0, 0);

      days.forEach((day) => {
        const baseDay = new Date(day.date);
        baseDay.setHours(0, 0, 0, 0);

        if (reportDay.getTime() === baseDay.getTime()) {
          day.value += 1;
        }
      });
    });

    return days;
  }, [reports]);

  const maxWeekValue = Math.max(...weeklyTrendData.map((d) => d.value), 1);

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);

    if (['resolved', 'completed', 'done'].includes(normalized)) return '#22C55E';
    if (['in progress', 'ongoing', 'processing'].includes(normalized)) return '#F97316';
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
        contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>

          {isDesktop && (
            <View style={styles.navLinks}>
              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/admin.dashboard')}
              >
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/complaints.dashboard')}
              >
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/maps.dashboard')}
              >
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin.dashboard)/users.dashboard')}
              >
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>

              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Report Analytics</Text>
              </View>
            </View>
          )}

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.userName}>Logout • {adminName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>Report Analytics</Text>
            <Text style={styles.subtitle}>
              Real-time analytics based on reports received by the system.
            </Text>
          </View>

          <View style={styles.filterRow}>
            {(['All', 'This Week', 'This Month'] as FilterType[]).map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loadingAnalytics ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.stateText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.summaryRow, !isDesktop && styles.summaryColumn]}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalReports}</Text>
                <Text style={styles.summaryLabel}>TOTAL REPORTS</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                  {pendingCount}
                </Text>
                <Text style={styles.summaryLabel}>PENDING</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: '#F97316' }]}>
                  {inProgressCount}
                </Text>
                <Text style={styles.summaryLabel}>IN PROGRESS</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: '#22C55E' }]}>
                  {resolvedCount}
                </Text>
                <Text style={styles.summaryLabel}>RESOLVED</Text>
              </View>
            </View>

            <View style={[styles.grid, !isDesktop && styles.gridMobile]}>
              <View style={styles.leftColumn}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Weekly Report Trend</Text>
                  <Text style={styles.panelSubtitle}>
                    Reports received this week by day
                  </Text>

                  <View style={styles.chartCard}>
                    <View style={styles.barChart}>
                      {weeklyTrendData.map((item) => (
                        <View key={item.label} style={styles.barItem}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${(item.value / maxWeekValue) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.barValue}>{item.value}</Text>
                          <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Category Breakdown</Text>
                  <Text style={styles.panelSubtitle}>
                    Most common report categories
                  </Text>

                  <View style={styles.listCard}>
                    {categoryData.length === 0 ? (
                      <Text style={styles.emptyText}>No category data available.</Text>
                    ) : (
                      categoryData.map((item) => {
                        const widthPercent =
                          totalReports > 0 ? (item.count / totalReports) * 100 : 0;

                        return (
                          <View key={item.name} style={styles.metricRow}>
                            <View style={styles.metricHeader}>
                              <Text style={styles.metricName}>{item.name}</Text>
                              <Text style={styles.metricCount}>{item.count}</Text>
                            </View>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${widthPercent}%` },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.rightColumn}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Top Reported Areas</Text>
                  <Text style={styles.panelSubtitle}>
                    Locations with the most received reports
                  </Text>

                  <View style={styles.listCard}>
                    {areaData.length === 0 ? (
                      <Text style={styles.emptyText}>No area data available.</Text>
                    ) : (
                      areaData.map((item, index) => {
                        const widthPercent =
                          totalReports > 0 ? (item.count / totalReports) * 100 : 0;

                        return (
                          <View key={item.name} style={styles.areaRow}>
                            <View style={styles.rankBadge}>
                              <Text style={styles.rankText}>{index + 1}</Text>
                            </View>

                            <View style={styles.areaInfo}>
                              <View style={styles.metricHeader}>
                                <Text style={styles.metricName}>{item.name}</Text>
                                <Text style={styles.metricCount}>{item.count}</Text>
                              </View>

                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    { width: `${widthPercent}%` },
                                  ]}
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Recent Activity</Text>
                  <Text style={styles.panelSubtitle}>
                    Latest reports received by the system
                  </Text>

                  <View style={styles.listCard}>
                    {recentReports.length === 0 ? (
                      <Text style={styles.emptyText}>No recent reports found.</Text>
                    ) : (
                      recentReports.map((report) => (
                        <View key={report.id} style={styles.activityRow}>
                          <View
                            style={[
                              styles.activityDot,
                              { backgroundColor: getStatusColor(report.status) },
                            ]}
                          />
                          <View style={styles.activityTextWrap}>
                            <Text style={styles.activityTitle}>{report.title}</Text>
                            <Text style={styles.activityMeta}>
                              {report.category} • {report.area} • {getRelativeTime(report.createdAt)}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: `${getStatusColor(report.status)}20`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: getStatusColor(report.status) },
                              ]}
                            >
                              {report.status}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  filterRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#EA580C',
  },

  centerState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 13,
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
    flex: 1.4,
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

  chartCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  barChart: {
    height: 220,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 26,
    height: 150,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#F97316',
    borderRadius: 999,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
  },

  listCard: {
    gap: 14,
  },
  metricRow: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  metricCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F97316',
  },

  areaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  areaInfo: {
    flex: 1,
    gap: 8,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});