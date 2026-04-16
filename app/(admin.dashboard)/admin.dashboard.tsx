import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
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
  reportCode: string;
  title: string;
  category: string;
  status: string;
  location: string;
  description: string;
  complainant: string;
  userEmail?: string;
  mobileNumber?: string;
  imageUrl?: string;
  createdAt?: any;
  adminSeen?: boolean;
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

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

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
            reportCode: data.reportCode || 'No Code',
            title: data.title || data.description || 'Untitled Report',
            category: data.category || 'Uncategorized',
            status: data.status || 'Pending',
            location: data.location || data.coordinates?.address || 'No location provided',
            description: data.description || 'No description provided.',
            complainant: data.userName || data.userEmail || 'Unknown User',
            userEmail: data.userEmail || '',
            mobileNumber: data.mobileNumber || '',
            imageUrl: data.imageUrl || '',
            createdAt: data.createdAt || null,
            adminSeen: data.adminSeen ?? false,
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
          ['pending', 'new'].includes(String(item.status).toLowerCase())
        );

        const inProgress = allReports.filter((item) =>
          ['in progress', 'ongoing', 'processing'].includes(
            String(item.status).toLowerCase()
          )
        );

        const resolved = allReports.filter((item) =>
          ['resolved', 'completed', 'done'].includes(
            String(item.status).toLowerCase()
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

  const newReports = useMemo(() => {
    return reports.filter(
      (item) =>
        ['pending', 'new'].includes(String(item.status).toLowerCase()) &&
        item.adminSeen !== true
    );
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

  const markReportAsSeen = async (reportId: string) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        adminSeen: true,
        adminSeenAt: serverTimestamp(),
      });
    } catch (error) {
      console.log('MARK AS SEEN ERROR:', error);
    }
  };

  const openReportDetails = async (report: ReportItem) => {
    if (report.adminSeen !== true) {
      await markReportAsSeen(report.id);
    }

    setSelectedReport({
      ...report,
      adminSeen: true,
    });

    setNotificationModalVisible(false);
    setDetailsModalVisible(true);
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
                  router.push('/(admin.dashboard)/announcements.dashboard' as any)
                }
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

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.notificationBell}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={22} color="#111827" />
              {newReports.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {newReports.length > 99 ? '99+' : newReports.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.userName}>Logout • {adminName}</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.panelTitle}>Notifications</Text>
              <Text style={styles.panelSubtitle}>
                Use the bell icon above to view all new reports.
              </Text>

              <View style={styles.notificationInfoCard}>
                <Ionicons name="notifications-outline" size={34} color="#F97316" />
                <Text style={styles.notificationInfoTitle}>{newReports.length} New Reports</Text>
                <Text style={styles.notificationInfoText}>
                  Click the notification bell to open the full list of newly submitted reports.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={notificationModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setNotificationModalVisible(false)}>
          <Pressable style={styles.notificationModalCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.notificationSubtitle}>
              New reports submitted by users
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingDashboard ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.stateText}>Loading notifications...</Text>
                </View>
              ) : newReports.length === 0 ? (
                <View style={styles.centerState}>
                  <Ionicons name="notifications-off-outline" size={30} color="#9CA3AF" />
                  <Text style={styles.stateText}>No new reports right now.</Text>
                </View>
              ) : (
                <View style={styles.notificationList}>
                  {newReports.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.notificationItem}
                      activeOpacity={0.9}
                      onPress={() => openReportDetails(item)}
                    >
                      <View style={styles.notificationItemIcon}>
                        <Ionicons name="document-text-outline" size={20} color="#F97316" />
                      </View>

                      <View style={styles.notificationItemTextWrap}>
                        <Text style={styles.notificationItemTitle}>{item.title}</Text>
                        <Text style={styles.notificationItemMeta}>
                          {item.category} • {item.status} • {getRelativeTime(item.createdAt)}
                        </Text>
                        <Text style={styles.notificationItemReporter}>
                          Reported by: {item.complainant}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDetailsModalVisible(false)}>
          <Pressable style={styles.detailsModalCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedReport && (
                <>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Report Code</Text>
                    <Text style={styles.detailValue}>{selectedReport.reportCode}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Title</Text>
                    <Text style={styles.detailValue}>{selectedReport.title}</Text>
                  </View>

                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{selectedReport.category}</Text>
                    </View>

                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>{selectedReport.status}</Text>
                    </View>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Reporter Name</Text>
                    <Text style={styles.detailValue}>{selectedReport.complainant}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Reporter Email</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.userEmail || 'No email provided'}
                    </Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Mobile Number</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.mobileNumber || 'No mobile number provided'}
                    </Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedReport.location}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedReport.description}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Proof Image</Text>
                    {selectedReport.imageUrl ? (
                      <Image
                        source={{ uri: selectedReport.imageUrl }}
                        style={styles.proofImage}
                      />
                    ) : (
                      <View style={styles.noImageBox}>
                        <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                        <Text style={styles.noImageText}>No proof image uploaded.</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.openComplaintButton}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      router.push('/(admin.dashboard)/complaints.dashboard');
                    }}
                  >
                    <Text style={styles.openComplaintButtonText}>
                      Open Complaints Page
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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

  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  notificationBell: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
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

  notificationInfoCard: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  notificationInfoTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  notificationInfoText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
  },
  notificationSubtitle: {
    marginTop: -8,
    marginBottom: 14,
    fontSize: 13,
    color: '#6B7280',
  },
  notificationList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  notificationItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItemTextWrap: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  notificationItemMeta: {
    marginTop: 3,
    fontSize: 11,
    color: '#6B7280',
  },
  notificationItemReporter: {
    marginTop: 3,
    fontSize: 11,
    color: '#9CA3AF',
  },

  detailsModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailBlock: {
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailGridItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 21,
  },
  proofImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    resizeMode: 'cover',
    marginTop: 6,
  },
  noImageBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  openComplaintButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  openComplaintButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AdminDashboard;