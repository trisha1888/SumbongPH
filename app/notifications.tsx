import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
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
          .filter((item) => {
            return item.userId === currentUser.uid || item.userId === 'all';
          });

        setNotifications(allNotifications);
        setLoading(false);
      },
      (error) => {
        console.log('NOTIFICATIONS ERROR:', error);
        setNotifications([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.read).length;
  }, [notifications]);

  const getNotificationTime = (value: any) => {
    if (!value) return 'Just now';

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
      return 'Just now';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !item.read);
    const batch = writeBatch(db);

    unreadItems.forEach((item) => {
      batch.update(doc(db, 'notifications', item.id), { read: true });
    });

    await batch.commit();
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const handleClearAll = () => {
    Alert.alert('Clear Notifications', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          const batch = writeBatch(db);
          notifications.forEach((item) => {
            batch.delete(doc(db, 'notifications', item.id));
          });
          await batch.commit();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unreadCard]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <Text style={styles.time}>
              {getNotificationTime(item.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleDeleteNotification(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} unread
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Read All</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 15, // 👈 slight move down
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 28, // 👈 MAIN FIX (adjust mo 24–35)
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  headerBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 12,
  },

  listContent: {
    padding: 16,
  },

  card: {
    backgroundColor: '#fff',
    padding: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },

  unreadCard: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  message: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  time: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 5,
  },
});