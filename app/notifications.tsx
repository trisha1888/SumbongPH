import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// --- Local Imports ---
import { auth, db } from '@/firebaseConfig';
import { useTheme } from './ThemeContext'; // Import your theme hook

// --- Constants ---
const PRIMARY_BLUE = '#3B82F6'; 
const DANGER_RED = '#EF4444';
const SUCCESS_GREEN = '#10B981';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type?: 'report' | 'announcement' | 'warning' | 'success' | 'general';
  read?: boolean;
  reportId?: string;
  createdAt?: any;
  userId?: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme(); // Access global theme state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Dynamic Theme Object ---
  const theme = {
    bg: isDarkMode ? '#020617' : '#F8FAFC',
    card: isDarkMode ? '#111827' : '#FFFFFF',
    cardSecondary: isDarkMode ? '#1E293B' : '#F1F5F9',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#94A3B8' : '#64748B',
    unreadBg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#F0F7FF',
    unreadBorder: isDarkMode ? '#3B82F6' : '#BFDBFE',
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications: NotificationItem[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as NotificationItem))
        .filter((item) => item.userId === currentUser.uid || item.userId === 'all');

      setNotifications(allNotifications);
      setLoading(false);
    }, () => setLoading(false));

    return unsubscribe;
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const triggerHaptic = (style: 'light' | 'medium' | 'success' | 'warning') => {
    if (Platform.OS === 'web') return;
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (style === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    triggerHaptic('light');
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) { console.log(e); }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter(i => !i.read);
    if (unreadItems.length === 0) return;
    triggerHaptic('success');
    const batch = writeBatch(db);
    unreadItems.forEach(item => batch.update(doc(db, 'notifications', item.id), { read: true }));
    await batch.commit();
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    triggerHaptic('warning');
    Alert.alert('Clear History', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => {
          const batch = writeBatch(db);
          notifications.forEach(item => batch.delete(doc(db, 'notifications', item.id)));
          await batch.commit();
          triggerHaptic('success');
      }}
    ]);
  };

  const getStyleByType = (type?: string) => {
    switch (type) {
      case 'report': return { icon: 'document-text', color: PRIMARY_BLUE, bg: 'rgba(59, 130, 246, 0.15)' };
      case 'warning': return { icon: 'alert-triangle', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'success': return { icon: 'checkmark-circle', color: SUCCESS_GREEN, bg: 'rgba(16, 185, 129, 0.15)' };
      case 'announcement': return { icon: 'megaphone', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      default: return { icon: 'notifications', color: theme.textMuted, bg: theme.cardSecondary };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = getStyleByType(item.type);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
            styles.card, 
            { backgroundColor: theme.card, borderColor: theme.border },
            !item.read && { backgroundColor: theme.unreadBg, borderColor: theme.unreadBorder }
        ]}
        onPress={() => handleMarkAsRead(item.id, !!item.read)}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, { backgroundColor: item.read ? theme.cardSecondary : config.bg }]}>
            <Ionicons name={config.icon as any} size={22} color={item.read ? theme.textMuted : config.color} />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.title, { color: theme.text }, !item.read && { fontWeight: '900' }]}>{item.title}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>

            <Text style={[styles.message, { color: theme.textMuted }]} numberOfLines={2}>{item.message}</Text>

            <View style={styles.bottomRow}>
              <Text style={styles.time}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}</Text>
              <TouchableOpacity 
                onPress={() => { triggerHaptic('light'); deleteDoc(doc(db, 'notifications', item.id)); }}
                style={[styles.smallDelete, { backgroundColor: theme.cardSecondary }]}
              >
                <Ionicons name="trash-outline" size={14} color={DANGER_RED} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>
          <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* ACTION BAR */}
      {notifications.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionPill, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color={PRIMARY_BLUE} />
            <Text style={[styles.actionPillText, { color: PRIMARY_BLUE }]}>Read All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionPill, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color={DANGER_RED} />
            <Text style={[styles.actionPillText, { color: DANGER_RED }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="mail-open-outline" size={60} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Clear Skies</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>No notifications found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 15 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  actionPillText: { fontSize: 13, fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_BLUE },
  message: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  time: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  smallDelete: { padding: 6, borderRadius: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginTop: 15 },
  emptySubtitle: { fontSize: 14, marginTop: 5 },
});