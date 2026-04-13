import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { ReportItem } from '@/models/report';
import {
  formatTimeAgo,
  getCategoryIcon,
  getPendingReportsCount,
  getRecentReports,
  getResolvedReportsCount,
  getStatusStyle,
  subscribeToMyReports,
} from '@/services/reportService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../ThemeContext';

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  barangay?: string;
  role?: string;
  profilePic?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  reportId?: string;
  createdAt?: any;
  userId?: string;
};

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'normal' | 'important' | 'urgent';
  scope?: string;
  barangay?: string;
  isPinned?: boolean;
  isActive?: boolean;
  createdAt?: any;
  createdBy?: string;
  createdByName?: string;
};

export default function HomeDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoadingProfile(false);
      return;
    }

    const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setUserProfile({
          uid: docData.uid,
          name: docData.name || currentUser.displayName || 'User',
          email: docData.email || currentUser.email || '',
          mobileNumber: docData.mobileNumber || '',
          barangay: docData.barangay || '',
          role: docData.role || 'user',
          profilePic: docData.profilePic || '',
        });
      } else {
        setUserProfile({
          uid: currentUser.uid,
          name: currentUser.displayName || 'User',
          email: currentUser.email || '',
          mobileNumber: '',
          barangay: '',
          role: 'user',
          profilePic: '',
        });
      }
      setLoadingProfile(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMyReports(
      (data) => {
        setReports(data);
        setLoadingReports(false);
      },
      (error) => {
        console.log('HOME REPORT SUBSCRIPTION ERROR:', error);
        setReports([]);
        setLoadingReports(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const allNotifications: NotificationItem[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              title: data.title || 'Notification',
              message: data.message || '',
              type: data.type || 'general',
              read: data.read || false,
              reportId: data.reportId || '',
              createdAt: data.createdAt || null,
              userId: data.userId || '',
            };
          })
          .filter((item) => item.userId === currentUser.uid || item.userId === 'all');

        setNotifications(allNotifications);
        setLoadingNotifications(false);
      },
      (error) => {
        console.log('HOME NOTIFICATIONS ERROR:', error);
        setNotifications([]);
        setLoadingNotifications(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const ensureAnnouncementsCollectionExists = async () => {
      try {
        const announcementsRef = collection(db, 'announcements');
        const firstDocQuery = query(announcementsRef, limit(1));
        const snapshot = await getDocs(firstDocQuery);

        if (snapshot.empty) {
          await addDoc(announcementsRef, {
            title: 'Welcome Announcement',
            message: 'Important community updates from admins will appear here.',
            type: 'general',
            priority: 'normal',
            scope: 'all',
            barangay: '',
            isPinned: true,
            isActive: true,
            createdBy: 'system',
            createdByName: 'System',
            createdAt: serverTimestamp(),
          });

          console.log('Default announcement created successfully.');
        }
      } catch (error) {
        console.log('AUTO CREATE ANNOUNCEMENTS ERROR:', error);
      }
    };

    ensureAnnouncementsCollectionExists();
  }, []);

  useEffect(() => {
    const announcementsRef = collection(db, 'announcements');

    // ✅ FIX: removed where('isActive', '==', true)
    // para kahit old docs na walang isActive ay mabasa pa rin,
    // then sa filter na lang natin ihahandle.
    const announcementsQuery = query(
      announcementsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const allAnnouncements: AnnouncementItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            title: data.title || 'Announcement',
            message: data.message || '',
            type: data.type || 'general',
            priority: data.priority || 'normal',
            scope: data.scope || 'all',
            barangay: data.barangay || '',
            isPinned: data.isPinned ?? false,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt || null,
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || 'Admin',
          };
        });

        const filteredAnnouncements = allAnnouncements.filter((item) => {
          // hide only if explicitly false
          if (item.isActive === false) return false;

          // ✅ FIX: if no scope, treat as public
          if (!item.scope || item.scope === 'all') return true;

          if (item.scope === 'barangay') {
            const announcementBarangay = (item.barangay || '').trim().toLowerCase();
            const userBarangay = (userProfile?.barangay || '').trim().toLowerCase();

            if (!announcementBarangay || !userBarangay) return false;

            return announcementBarangay === userBarangay;
          }

          // fallback: allow unknown old values instead of hiding
          return true;
        });

        filteredAnnouncements.sort((a, b) => {
          if ((a.isPinned ?? false) && !(b.isPinned ?? false)) return -1;
          if (!(a.isPinned ?? false) && (b.isPinned ?? false)) return 1;

          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;

          return bTime - aTime;
        });

        setAnnouncements(filteredAnnouncements);
        setLoadingAnnouncements(false);
      },
      (error) => {
        console.log('HOME ANNOUNCEMENTS ERROR:', error);
        setAnnouncements([]);
        setLoadingAnnouncements(false);
      }
    );

    return unsubscribe;
  }, [userProfile?.barangay]);

  const pendingCount = useMemo(() => getPendingReportsCount(reports), [reports]);
  const resolvedCount = useMemo(() => getResolvedReportsCount(reports), [reports]);
  const recentReports = useMemo(() => getRecentReports(reports, 3), [reports]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((item) => !item.read).length;
  }, [notifications]);

  const latestAnnouncements = useMemo(() => {
    return announcements.slice(0, 3);
  }, [announcements]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  if (
    loadingProfile ||
    loadingReports ||
    loadingNotifications ||
    loadingAnnouncements
  ) {
    return (
      <ThemedView style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#2F70E9" />
        <ThemedText style={[styles.loadingText, isDarkMode && styles.darkSubText]}>
          Loading dashboard...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <ThemedText style={[styles.welcomeLabel, isDarkMode && styles.darkSubText]}>
                Welcome back,
              </ThemedText>
              <ThemedText style={[styles.userName, isDarkMode && styles.darkText]}>
                {userProfile?.name || 'User'}
              </ThemedText>
              <ThemedText style={[styles.userBarangay, isDarkMode && styles.darkSubText]}>
                {userProfile?.barangay || 'No barangay set'}
              </ThemedText>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationWrap}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={26}
                  color={isDarkMode ? '#F9FAFB' : '#4B5563'}
                />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.badgeWrap}>
                    <ThemedText style={styles.badgeText}>
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.avatar}>
                {userProfile?.profilePic ? (
                  <Image source={{ uri: userProfile.profilePic }} style={styles.avatarImage} />
                ) : (
                  <ThemedText style={styles.avatarText}>{getInitials(userProfile?.name)}</ThemedText>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <View style={styles.statTopRow}>
                <ThemedText style={[styles.statLabel, isDarkMode && styles.darkSubText]}>
                  Pending
                </ThemedText>
                <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="time-outline" size={18} color="#F97316" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, isDarkMode && styles.darkText]}>
                {pendingCount}
              </ThemedText>
            </View>

            <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <View style={styles.statTopRow}>
                <ThemedText style={[styles.statLabel, isDarkMode && styles.darkSubText]}>
                  Resolved
                </ThemedText>
                <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />
                </View>
              </View>
              <ThemedText style={[styles.statValue, isDarkMode && styles.darkText]}>
                {resolvedCount}
              </ThemedText>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Announcements
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/announcements' as any)}>
              <ThemedText style={styles.viewAll}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.sectionSubtext, isDarkMode && styles.darkSubText]}>
            Latest community and barangay updates.
          </ThemedText>

          {latestAnnouncements.length === 0 ? (
            <View style={[styles.emptyCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="megaphone-outline" size={24} color="#9CA3AF" />
              <ThemedText style={[styles.emptyTitle, isDarkMode && styles.darkText]}>
                No announcements yet
              </ThemedText>
              <ThemedText style={[styles.emptyText, isDarkMode && styles.darkSubText]}>
                Important updates from admins will appear here.
              </ThemedText>
            </View>
          ) : (
            latestAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))
          )}

          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Recent Reports
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(reports_dashboard)/reports.dashboard')}>
              <ThemedText style={styles.viewAll}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.sectionSubtext, isDarkMode && styles.darkSubText]}>
            Shows only unresolved reports from the last 3 days.
          </ThemedText>

          {recentReports.length === 0 ? (
            <View style={[styles.emptyCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
              <ThemedText style={[styles.emptyTitle, isDarkMode && styles.darkText]}>
                No recent reports
              </ThemedText>
              <ThemedText style={[styles.emptyText, isDarkMode && styles.darkSubText]}>
                Reports disappear here once they are resolved or older than 3 days.
              </ThemedText>
            </View>
          ) : (
            recentReports.map((report) => <RecentReportCard key={report.id} report={report} />)
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push('/category.dashboard')}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={[styles.tabBar, isDarkMode && styles.darkCard]}>
          <TabIcon
            icon="home-outline"
            label="Home"
            active
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

function AnnouncementCard({ announcement }: { announcement: AnnouncementItem }) {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.reportCard, isDarkMode && styles.darkCard]}>
      <View style={styles.reportTopRow}>
        <View style={styles.reportLeftRow}>
          <View style={[styles.reportIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="megaphone-outline" size={22} color="#2563EB" />
          </View>

          <View style={styles.reportTextWrap}>
            <ThemedText style={[styles.reportTitle, isDarkMode && styles.darkText]} numberOfLines={1}>
              {announcement.title}
            </ThemedText>
            <ThemedText style={[styles.reportCode, isDarkMode && styles.darkSubText]}>
              {announcement.scope === 'barangay'
                ? announcement.barangay || 'Barangay Announcement'
                : 'Public Announcement'}
            </ThemedText>
          </View>
        </View>

        {announcement.isPinned ? (
          <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
            <ThemedText style={[styles.statusText, { color: '#1D4ED8' }]}>
              PINNED
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ThemedText style={[styles.reportDescription, isDarkMode && styles.darkSubText]} numberOfLines={3}>
        {announcement.message}
      </ThemedText>
    </View>
  );
}

function RecentReportCard({ report }: { report: ReportItem }) {
  const { isDarkMode } = useTheme();
  const statusStyle = getStatusStyle(report.status);

  return (
    <View style={[styles.reportCard, isDarkMode && styles.darkCard]}>
      <View style={styles.reportTopRow}>
        <View style={styles.reportLeftRow}>
          <View style={styles.reportIconWrap}>
            <Ionicons name={getCategoryIcon(report.category) as any} size={22} color="#4B5563" />
          </View>

          <View style={styles.reportTextWrap}>
            <ThemedText style={[styles.reportTitle, isDarkMode && styles.darkText]} numberOfLines={1}>
              {report.title}
            </ThemedText>
            <ThemedText style={[styles.reportCode, isDarkMode && styles.darkSubText]}>
              {report.reportCode}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>
            {statusStyle.label}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.reportDescription, isDarkMode && styles.darkSubText]} numberOfLines={2}>
        {report.description}
      </ThemedText>

      <View style={styles.reportFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <ThemedText style={[styles.footerText, isDarkMode && styles.darkSubText]} numberOfLines={1}>
            {report.location}
          </ThemedText>
        </View>

        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <ThemedText style={[styles.footerText, isDarkMode && styles.darkSubText]}>
            {formatTimeAgo(report)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

function TabIcon({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  darkCard: { backgroundColor: '#1F2937', borderColor: '#374151' },
  darkText: { color: '#F9FAFB' },
  darkSubText: { color: '#9CA3AF' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeLabel: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 28, fontWeight: '700', color: '#111827', marginTop: 2 },
  userBarangay: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationWrap: {
    position: 'relative',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2F70E9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 16,
  },
  statTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#6B7280' },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 30, fontWeight: '700', color: '#111827', marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sectionSubtext: { marginTop: 6, marginBottom: 14, fontSize: 13, color: '#6B7280' },
  viewAll: { color: '#2F70E9', fontSize: 14, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
    marginBottom: 22,
  },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reportLeftRow: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  reportIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTextWrap: { flex: 1, marginLeft: 12 },
  reportTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  reportCode: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  reportDescription: { marginTop: 14, fontSize: 14, lineHeight: 20, color: '#6B7280' },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  footerText: { fontSize: 12, color: '#6B7280', flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 98,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2F70E9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
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
    alignItems: 'center',
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { marginTop: 4, fontSize: 10, fontWeight: '600' },
});