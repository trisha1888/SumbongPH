import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type UserProfile = { uid?: string; name?: string; barangay?: string; };
type AnnouncementItem = { id: string; title: string; message: string; priority?: string; isPinned?: boolean; isActive?: boolean; createdAt?: any; scope?: string; barangay?: string; };

export default function UsersAnnouncementsScreen() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { router.replace('/(login)/login'); return; }
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserProfile({ uid: currentUser.uid, name: data.name, barangay: data.barangay || '' });
        }
      } catch (e) { console.log(e); } finally { setLoadingUser(false); }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
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
      if (item.scope === 'barangay') {
        const itemBarangay = (item.barangay || '').trim().toLowerCase();
        return itemBarangay === userBarangay;
      }
      return false;
    });
  }, [announcements, userProfile]);

  if (loadingUser || loadingAnnouncements) {
    return <ThemedView style={styles.loading}><ActivityIndicator size="large" color="#2F70E9" /></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#2F70E9" />
            <ThemedText style={{ fontWeight: '700', color: '#2F70E9' }}>Back</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.title}>Announcements</ThemedText>
          <ThemedText style={styles.subtitle}>Updates for {userProfile?.barangay || 'your community'}.</ThemedText>

          {filteredAnnouncements.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                {item.isPinned && <View style={styles.pin}><ThemedText style={styles.pinText}>PINNED</ThemedText></View>}
              </View>
              <ThemedText style={styles.msg}>{item.message}</ThemedText>
              <View style={styles.footer}>
                <ThemedText style={styles.footerText}>{item.scope === 'all' ? 'Public' : `Barangay: ${item.barangay}`}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  pin: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  pinText: { fontSize: 10, fontWeight: '800', color: '#1D4ED8' },
  msg: { marginTop: 10, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  footer: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEE' },
  footerText: { fontSize: 12, color: '#F97316', fontWeight: '700' }
});