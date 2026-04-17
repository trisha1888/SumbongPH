import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

// --- Local Imports ---
import { auth, db } from '@/firebaseConfig';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from './ThemeContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Pro Constants ---
const PRIMARY_BLUE = '#2563EB';
const URGENT_RED = '#DC2626';
const AMBER_GOLD = '#D97706';
const SUCCESS_GREEN = '#059669';

type UserProfile = { uid?: string; name?: string; barangay?: string; };
type AnnouncementItem = { 
  id: string; 
  title: string; 
  message: string; 
  priority?: 'high' | 'medium' | 'low'; 
  isPinned?: boolean; 
  isActive?: boolean; 
  createdAt?: any; 
  scope?: 'all' | 'barangay'; 
  barangay?: string; 
};

export default function UsersAnnouncementsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const theme = {
    bg: isDarkMode ? '#0F172A' : '#F1F5F9',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#94A3B8' : '#64748B',
    secondaryBg: isDarkMode ? '#334155' : '#E2E8F0',
  };

  const triggerHaptic = (style: 'light' | 'medium') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { router.replace('/(login)/login'); return; }
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          setUserProfile({ uid: currentUser.uid, ...userSnap.data() });
        }
      } catch (e) { 
        console.error(e); 
      } finally { 
        setLoadingUser(false); 
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AnnouncementItem));
      setAnnouncements(data);
      setLoadingAnnouncements(false);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const userBarangay = (userProfile?.barangay || '').trim().toLowerCase();
    return announcements.filter(item => {
      if (!item.isActive) return false;
      if (!item.scope || item.scope === 'all') return true;
      return (item.barangay || '').trim().toLowerCase() === userBarangay;
    });
  }, [announcements, userProfile]);

  if (loadingUser || loadingAnnouncements) {
    return (
      <ThemedView style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* ENHANCED HEADER - Adjusted paddingTop to move content down */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backIcon, { backgroundColor: theme.card }]} 
            onPress={() => { triggerHaptic('light'); router.back(); }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Bulletins</ThemedText>
            <View style={styles.liveIndicator}>
              <View style={styles.dot} />
              <ThemedText style={styles.liveText}>LIVE UPDATES</ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.backIcon, { backgroundColor: theme.card }]}
            onPress={() => { triggerHaptic('light'); setRefreshing(true); }}
          >
            <Ionicons name="refresh" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={PRIMARY_BLUE} />
          }
        >
          {filteredAnnouncements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyCircle, { backgroundColor: theme.card }]}>
                <Ionicons name="notifications-off-outline" size={40} color={theme.textMuted} />
              </View>
              <ThemedText style={[styles.emptyText, { color: theme.text }]}>All Caught Up</ThemedText>
              <ThemedText style={[styles.emptySub, { color: theme.textMuted }]}>No new announcements for your area.</ThemedText>
            </View>
          ) : (
            filteredAnnouncements.map((item) => (
              <AnnouncementCard key={item.id} item={item} theme={theme} isDarkMode={isDarkMode} triggerHaptic={triggerHaptic} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const AnnouncementCard = ({ item, theme, isDarkMode, triggerHaptic }: any) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityStyle = () => {
    switch (item.priority) {
      case 'high': return { color: URGENT_RED, bg: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2' };
      case 'medium': return { color: AMBER_GOLD, bg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB' };
      default: return { color: SUCCESS_GREEN, bg: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#F0FDF4' };
    }
  };

  const priority = getPriorityStyle();

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => {
        triggerHaptic('light');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
      }}
      style={[
        styles.card, 
        { backgroundColor: theme.card, borderColor: theme.border },
        item.priority === 'high' && { borderColor: URGENT_RED + '40', backgroundColor: priority.bg }
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.titleWrapper}>
          <View style={styles.labelRow}>
            {item.isPinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={12} color={PRIMARY_BLUE} />
                <ThemedText style={styles.pinText}>PINNED</ThemedText>
              </View>
            )}
            <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: priority.color }]} />
              <ThemedText style={[styles.priorityText, { color: priority.color }]}>
                {item.priority?.toUpperCase() || 'NORMAL'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{item.title}</ThemedText>
        </View>
      </View>

      <ThemedText 
        numberOfLines={expanded ? undefined : 3} 
        style={[styles.msg, { color: theme.text, opacity: isDarkMode ? 0.8 : 0.9 }]}
      >
        {item.message}
      </ThemedText>

      {!expanded && item.message.length > 120 && (
        <ThemedText style={styles.readMore}>Read more...</ThemedText>
      )}

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.footerInfo}>
          <Ionicons name="location-sharp" size={14} color={PRIMARY_BLUE} />
          <ThemedText style={[styles.locationText, { color: theme.textMuted }]}>
            {item.scope === 'all' ? 'Community Wide' : `Brgy. ${item.barangay}`}
          </ThemedText>
        </View>
        <ThemedText style={[styles.dateText, { color: theme.textMuted }]}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header - Increased paddingTop to move the title and buttons down
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  backIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', 
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 2 } })
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: URGENT_RED, marginRight: 5 },
  liveText: { fontSize: 10, fontWeight: '800', color: URGENT_RED, letterSpacing: 1 },

  scroll: { padding: 20, paddingBottom: 40 },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 5 },

  // Cards
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({ 
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 }, 
        android: { elevation: 4 } 
    })
  },
  cardTop: { marginBottom: 12 },
  titleWrapper: { width: '100%' }, 
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  pinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(37, 99, 235, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pinText: { fontSize: 10, fontWeight: '900', color: PRIMARY_BLUE },
  priorityPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 10, fontWeight: '900' },
  cardTitle: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  msg: { fontSize: 15, lineHeight: 22 },
  readMore: { fontSize: 13, fontWeight: '700', color: PRIMARY_BLUE, marginTop: 8 },
  cardFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 11, fontWeight: '600' },
});