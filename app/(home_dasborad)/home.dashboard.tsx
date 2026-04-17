import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, onSnapshot, orderBy, query, where, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

// --- Services & UI ---
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../ThemeContext'; 
import { 
  getStatusStyle, 
  subscribeToMyReports,
  getPendingReportsCount,
  getResolvedReportsCount,
  getCategoryIcon 
} from '@/services/reportService';

// --- Assets ---
const logo = require('@/assets/images/logo.jpg');

const { width } = Dimensions.get('window');

// --- Theme Constants ---
const PRIMARY_RED = '#DC2626';
const SLATE_900 = '#0F172A';
const SLATE_500 = '#64748B';
const DARK_BG = '#020617';

// --- Category Style Helper ---
const getCategoryColors = (category: string) => {
  const normalized = category?.toLowerCase() || 'other';
  switch (normalized) {
    case 'flood': return { bg: '#EEF2FF', icon: '#4F46E5', dot: '#6366F1' };
    case 'garbage': return { bg: '#F0FDF4', icon: '#16A34A', dot: '#22C55E' };
    case 'road': return { bg: '#FFF7ED', icon: '#EA580C', dot: '#F97316' };
    case 'streetlight': return { bg: '#FEFCE8', icon: '#CA8A04', dot: '#EAB308' };
    case 'noise': return { bg: '#FAF5FF', icon: '#9333EA', dot: '#A855F7' };
    case 'safety': return { bg: '#FEF2F2', icon: '#DC2626', dot: '#EF4444' };
    case 'fire': return { bg: '#FFF1F2', icon: '#E11D48', dot: '#F43F5E' };
    case 'medical': return { bg: '#F0FDFA', icon: '#0D9488', dot: '#14B8A6' };
    default: return { bg: '#F8FAFC', icon: '#475569', dot: '#64748B' };
  }
};

interface Announcement {
  id: string;
  title: string;
  message: string;
  scope?: string;
  isPinned?: boolean;
}

interface Report {
  id: string;
  reportCode: string;
  title: string;
  category: string;
  status: 'pending' | 'resolved' | 'in_progress';
  description: string;
}

export default function HomeDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubs: Unsubscribe[] = [];

    unsubs.push(onSnapshot(query(collection(db, 'users'), where('uid', '==', currentUser.uid)), (snap) => {
      if (!snap.empty) setUserProfile(snap.docs[0].data());
    }));

    const unsubReports = subscribeToMyReports(
        (data: any[]) => setReports(data as Report[]), 
        () => setReports([])
    );
    unsubs.push(unsubReports);

    unsubs.push(onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
      setLoading(false);
    }));

    unsubs.push(onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), (snap) => {
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(n => n.userId === currentUser.uid || n.userId === 'all');
      setNotifications(filtered);
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const stats = useMemo(() => ({
    pending: getPendingReportsCount(reports as any),
    resolved: getResolvedReportsCount(reports as any),
    unread: notifications.filter(n => !n.read).length
  }), [reports, notifications]);

  const recentReports = useMemo(() => 
    reports.filter(r => r.status !== 'resolved').slice(0, 3), 
  [reports]);

  const navigateTo = useCallback((path: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);

  if (loading) {
    return (
      <ThemedView style={[styles.center, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={PRIMARY_RED} />
        <ThemedText style={styles.loadingText}>INITIALIZING COMMAND CENTER...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* --- STICKY HEADER AREA --- */}
        <View style={[styles.stickyHeader, isDarkMode && styles.darkContainer]}>
          <View style={styles.topHeader}>
            <View style={styles.brandGroup}>
              <View style={[styles.logoContainer, isDarkMode && styles.darkCard]}>
                <Image source={logo} style={styles.logoImage} />
                <View style={[styles.onlinePulse, isDarkMode && { borderColor: DARK_BG }]} />
              </View>
              <View>
                <ThemedText style={styles.greeting}>WELCOME</ThemedText>
                <ThemedText style={[styles.userName, isDarkMode && { color: '#FFF' }]}>
                    {userProfile?.name?.split(' ')[0] || 'Jay'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.iconBtn, isDarkMode && styles.darkCard]} 
                onPress={() => navigateTo('/notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={isDarkMode ? '#FFF' : SLATE_900} />
                {stats.unread > 0 && <View style={styles.dotBadge} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo('/profile')}>
                 <Image 
                  source={userProfile?.profilePic ? { uri: userProfile.profilePic } : logo} 
                  style={styles.miniAvatar} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatBox label="ACTIVE" value={stats.pending} icon="alert-circle" color={PRIMARY_RED} bg="#FEE2E2" isDarkMode={isDarkMode} />
            <StatBox label="RESOLVED" value={stats.resolved} icon="shield-checkmark" color="#16A34A" bg="#DCFCE7" isDarkMode={isDarkMode} />
            <StatBox label="SECTOR" value={userProfile?.barangay ? '1' : '1'} icon="apps" color="#2563EB" bg="#DBEAFE" isDarkMode={isDarkMode} />
          </View>
        </View>

        {/* --- SCROLLABLE CONTENT --- */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <SectionHead title="ANNOUNCEMENTS" onAction={() => navigateTo('/users.announcement')} />
          {announcements.length > 0 ? (
            announcements.slice(0, 2).map((ann) => (
              <AnnouncementItem key={ann.id} ann={ann} isDarkMode={isDarkMode} />
            ))
          ) : (
            <ThemedText style={styles.emptySubText}>No recent announcements.</ThemedText>
          )}

          <View style={{ marginTop: 24 }}>
            <SectionHead title="Recent Reports" onAction={() => navigateTo('/(reports_dashboard)/reports.dashboard')} />
            {recentReports.length === 0 ? (
              <EmptyState isDarkMode={isDarkMode} />
            ) : (
              recentReports.map((report) => (
                <ReportCard key={report.id} report={report} isDarkMode={isDarkMode} />
              ))
            )}
          </View>
        </ScrollView>

        {/* --- NAVIGATION DOCK --- */}
        <View style={[styles.navDock, isDarkMode && styles.darkCard, styles.shadow]}>
          <NavIcon icon="home" label="Home" active />
          <NavIcon icon="document-text" label="Reports" onPress={() => navigateTo('/(reports_dashboard)/reports.dashboard')} />
          <View style={{ width: 60 }} />
          <NavIcon icon="map" label="Map" onPress={() => navigateTo('/(maps.dashboard)/maps.dashboard')} />
          <NavIcon icon="person" label="Profile" onPress={() => navigateTo('/profile')} />
          
          <TouchableOpacity 
            style={[styles.fab, styles.shadow, isDarkMode && { borderColor: DARK_BG }]} 
            activeOpacity={0.8}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push('/category.dashboard');
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// --- Internal Components ---
const StatBox = ({ label, value, icon, color, bg, isDarkMode }: any) => (
  <View style={[styles.statBox, isDarkMode && styles.darkCard]}>
    <View style={[styles.statIconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : bg }]}>
      <Ionicons name={icon} size={18} color={isDarkMode ? '#FFF' : color} />
    </View>
    <ThemedText style={[styles.statNum, isDarkMode && { color: '#FFF' }]}>{value}</ThemedText>
    <ThemedText style={styles.statLabel}>{label}</ThemedText>
  </View>
);

const SectionHead = ({ title, onAction }: any) => (
  <View style={styles.sectionHeader}>
    <ThemedText style={styles.sectionTitle}>{title.toUpperCase()}</ThemedText>
    <TouchableOpacity onPress={onAction} hitSlop={15}>
      <ThemedText style={styles.viewAll}>SEE ALL</ThemedText>
    </TouchableOpacity>
  </View>
);

const AnnouncementItem = ({ ann, isDarkMode }: any) => (
  <View style={[styles.announcementCard, isDarkMode && styles.darkCard]}>
    <View style={styles.annHeader}>
      <ThemedText style={[styles.annTag, isDarkMode && { backgroundColor: '#334155', color: '#CBD5E1' }]}>
        {ann.scope?.toUpperCase() || 'ALL'}
      </ThemedText>
      <Ionicons name="pin" size={14} color={ann.isPinned ? PRIMARY_RED : 'transparent'} />
    </View>
    <ThemedText style={[styles.annTitle, isDarkMode && { color: '#FFF' }]}>{ann.title}</ThemedText>
    <ThemedText numberOfLines={2} style={[styles.annBody, isDarkMode && { color: '#94A3B8' }]}>{ann.message}</ThemedText>
  </View>
);

const ReportCard = ({ report, isDarkMode }: { report: Report, isDarkMode: boolean }) => {
  const status = getStatusStyle(report.status);
  const catColors = getCategoryColors(report.category);

  return (
    <View style={[styles.reportItem, isDarkMode && styles.darkCard]}>
      <View style={[styles.categoryLogoTile, { backgroundColor: catColors.bg }]}>
         <Ionicons name={getCategoryIcon(report.category) as any} size={20} color={catColors.icon} />
          <View style={[styles.statusDot, { backgroundColor: catColors.dot }]} />
      </View>
      <View style={styles.reportContent}>
        <View style={styles.reportRow}>
          <ThemedText style={styles.reportCode}>#{report.reportCode}</ThemedText>
          <ThemedText style={[styles.statusText, { color: status.color }]}>{status.label}</ThemedText>
        </View>
        <ThemedText style={[styles.reportTitle, isDarkMode && { color: '#FFF' }]}>{report.title}</ThemedText>
        <ThemedText numberOfLines={1} style={[styles.reportDesc, isDarkMode && { color: '#64748B' }]}>{report.description}</ThemedText>
      </View>
    </View>
  );
};

const NavIcon = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? PRIMARY_RED : '#94A3B8'} />
    <ThemedText style={[styles.navLabel, { color: active ? PRIMARY_RED : '#94A3B8' }]}>{label}</ThemedText>
  </TouchableOpacity>
);

const EmptyState = ({ isDarkMode }: any) => (
  <View style={[styles.emptyContainer, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
    <Ionicons name="shield-checkmark" size={40} color={isDarkMode ? '#475569' : '#CBD5E1'} />
    <ThemedText style={[styles.emptyTitle, isDarkMode && { color: '#F1F5F9' }]}>All Sectors Clear</ThemedText>
    <ThemedText style={styles.emptySubText}>No active incidents detected at this time.</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: DARK_BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 10, fontWeight: '900', color: SLATE_500, letterSpacing: 2 },
  
  // Adjusted: padding increased to shift everything down toward the content
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 50, 
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 140 },
  
  darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },

  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'white', padding: 2, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: '100%', height: '100%', borderRadius: 16 },
  onlinePulse: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#F8FAFC' },
  greeting: { fontSize: 10, fontWeight: '900', color: SLATE_500, letterSpacing: 1.5 },
  userName: { fontSize: 24, fontWeight: '900', color: SLATE_900 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  miniAvatar: { width: 46, height: 46, borderRadius: 15, borderWidth: 2, borderColor: PRIMARY_RED },
  dotBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_RED, borderWidth: 1.5, borderColor: 'white' },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 5 },
  statBox: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNum: { fontSize: 22, fontWeight: '900', color: SLATE_900 },
  statLabel: { fontSize: 9, fontWeight: '800', color: SLATE_500 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: SLATE_500, letterSpacing: 1 },
  viewAll: { fontSize: 11, fontWeight: '900', color: PRIMARY_RED },

  announcementCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  annTag: { fontSize: 9, fontWeight: '900', color: SLATE_500, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  annTitle: { fontSize: 17, fontWeight: '800', color: SLATE_900, marginBottom: 4 },
  annBody: { fontSize: 14, color: '#475569', lineHeight: 20 },

  reportItem: { backgroundColor: 'white', borderRadius: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryLogoTile: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  statusDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
  reportContent: { flex: 1, marginLeft: 14 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reportCode: { fontSize: 10, fontWeight: '700', color: SLATE_500 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: SLATE_900, marginBottom: 2 },
  reportDesc: { fontSize: 13, color: '#64748B' },

  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: SLATE_900, marginTop: 10 },
  emptySubText: { fontSize: 13, color: '#94A3B8', marginTop: 4 },

  navDock: { position: 'absolute', bottom: 30, left: 16, right: 16, height: 75, backgroundColor: 'white', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#E2E8F0' },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  navLabel: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  fab: { position: 'absolute', top: -32, left: '50%', marginLeft: -35, width: 70, height: 70, borderRadius: 24, backgroundColor: PRIMARY_RED, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: '#F8FAFC' }
});