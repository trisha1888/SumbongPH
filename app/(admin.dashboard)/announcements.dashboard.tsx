import { auth, db } from '@/firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type AnnouncementScope = 'all' | 'barangay';
type AnnouncementPriority = 'normal' | 'important' | 'urgent';

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
  isActive?: boolean;
  createdAt?: any;
  createdBy?: string;
  createdByName?: string;
  scope?: AnnouncementScope;
  barangay?: string;
};

export default function AdminAnnouncementsDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [adminName, setAdminName] = useState('Admin');

  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [isPinned, setIsPinned] = useState(false);

  // ✅ NEW
  const [scope, setScope] = useState<AnnouncementScope>('all');
  const [barangay, setBarangay] = useState('');

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

    const announcementsRef = collection(db, 'announcements');
    const announcementsQuery = query(
      announcementsRef,
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const data: AnnouncementItem[] = snapshot.docs.map((docSnap) => {
          const item = docSnap.data();

          return {
            id: docSnap.id,
            title: item.title || '',
            message: item.message || '',
            priority: item.priority || 'normal',
            isPinned: item.isPinned ?? false,
            isActive: item.isActive ?? true,
            createdAt: item.createdAt || null,
            createdBy: item.createdBy || '',
            createdByName: item.createdByName || 'Admin',
            scope: item.scope || 'all',
            barangay: item.barangay || '',
          };
        });

        setAnnouncements(data);
        setLoadingAnnouncements(false);
      },
      (error) => {
        console.log('ANNOUNCEMENTS LOAD ERROR:', error);
        Alert.alert('Error', 'Failed to load announcements.');
        setLoadingAnnouncements(false);
      }
    );

    return () => unsubscribe();
  }, [isMounted]);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setPriority('normal');
    setIsPinned(false);
    setScope('all');
    setBarangay('');
  };

  const sortAnnouncements = (items: AnnouncementItem[]) => {
    return [...items].sort((a, b) => {
      if ((a.isPinned ?? false) && !(b.isPinned ?? false)) return -1;
      if (!(a.isPinned ?? false) && (b.isPinned ?? false)) return 1;

      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;

      return bTime - aTime;
    });
  };

  const handleCreateAnnouncement = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'No logged-in admin found.');
      return;
    }

    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please enter both title and message.');
      return;
    }

    if (scope === 'barangay' && !barangay.trim()) {
      Alert.alert('Missing Barangay', 'Please enter a barangay for this announcement.');
      return;
    }

    try {
      setSubmitting(true);

      const localNow = Timestamp.now();
      const tempId = `temp-${Date.now()}`;

      const finalBarangay = scope === 'barangay' ? barangay.trim() : '';

      const optimisticAnnouncement: AnnouncementItem = {
        id: tempId,
        title: title.trim(),
        message: message.trim(),
        priority,
        isPinned,
        isActive: true,
        createdAt: localNow,
        createdBy: currentUser.uid,
        createdByName: adminName,
        scope,
        barangay: finalBarangay,
      };

      setAnnouncements((prev) => {
        const withoutTempDupes = prev.filter(
          (item) =>
            !(
              item.id.startsWith('temp-') &&
              item.title === optimisticAnnouncement.title &&
              item.message === optimisticAnnouncement.message
            )
        );

        return sortAnnouncements([optimisticAnnouncement, ...withoutTempDupes]);
      });

      resetForm();

      const announcementRef = await addDoc(collection(db, 'announcements'), {
        title: optimisticAnnouncement.title,
        message: optimisticAnnouncement.message,
        priority: optimisticAnnouncement.priority,
        isPinned: optimisticAnnouncement.isPinned,
        isActive: true,
        scope: optimisticAnnouncement.scope,
        barangay: optimisticAnnouncement.barangay,
        createdAt: localNow,
        createdAtServer: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: adminName,
      });

      await addDoc(collection(db, 'notifications'), {
        title: `New Announcement: ${optimisticAnnouncement.title}`,
        message: optimisticAnnouncement.message,
        type: 'announcement',
        userId: 'all',
        read: false,
        relatedId: announcementRef.id,
        scope: optimisticAnnouncement.scope,
        barangay: optimisticAnnouncement.barangay,
        createdAt: localNow,
        createdAtServer: serverTimestamp(),
      });

      setAnnouncements((prev) =>
        sortAnnouncements(
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: announcementRef.id,
                }
              : item
          )
        )
      );

      Alert.alert('Success', 'Announcement posted successfully.');
    } catch (error) {
      console.log('CREATE ANNOUNCEMENT ERROR:', error);

      setAnnouncements((prev) => prev.filter((item) => !item.id.startsWith('temp-')));

      Alert.alert('Error', 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isActive: !currentValue } : item
        )
      );

      await updateDoc(doc(db, 'announcements', id), {
        isActive: !currentValue,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update announcement status.');
    }
  };

  const handleTogglePinned = async (id: string, currentValue: boolean) => {
    try {
      const updated = announcements.map((item) =>
        item.id === id ? { ...item, isPinned: !currentValue } : item
      );
      setAnnouncements(sortAnnouncements(updated));

      await updateDoc(doc(db, 'announcements', id), {
        isPinned: !currentValue,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update pinned status.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(login)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const getPriorityStyle = (value?: string) => {
    switch (value) {
      case 'urgent':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'important':
        return { bg: '#FEF3C7', text: '#B45309' };
      default:
        return { bg: '#DBEAFE', text: '#1D4ED8' };
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

  if (!isMounted || checkingAccess) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
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
              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/admin.dashboard')}>
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/complaints.dashboard')}>
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>

              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Announcements</Text>
              </View>

              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/maps.dashboard')}>
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/users.dashboard')}>
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/analytics.dashboard')}>
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
            <Text style={styles.mainTitle}>Announcements</Text>
            <Text style={styles.subtitle}>
              Post updates that will appear on the user dashboard and notifications.
            </Text>
          </View>
        </View>

        <View style={[styles.grid, !isDesktop && styles.gridMobile]}>
          <View style={styles.leftColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Create Announcement</Text>
              <Text style={styles.panelSubtitle}>
                Publish a notice for all users or for a specific barangay.
              </Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter announcement title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your announcement here..."
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['normal', 'important', 'urgent'] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.priorityButton,
                      priority === item && styles.priorityButtonActive,
                    ]}
                    onPress={() => setPriority(item)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        priority === item && styles.priorityButtonTextActive,
                      ]}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Scope</Text>
              <View style={styles.scopeRow}>
                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    scope === 'all' && styles.scopeButtonActive,
                  ]}
                  onPress={() => setScope('all')}
                >
                  <Text
                    style={[
                      styles.scopeButtonText,
                      scope === 'all' && styles.scopeButtonTextActive,
                    ]}
                  >
                    All Users
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    scope === 'barangay' && styles.scopeButtonActive,
                  ]}
                  onPress={() => setScope('barangay')}
                >
                  <Text
                    style={[
                      styles.scopeButtonText,
                      scope === 'barangay' && styles.scopeButtonTextActive,
                    ]}
                  >
                    Specific Barangay
                  </Text>
                </TouchableOpacity>
              </View>

              {scope === 'barangay' && (
                <>
                  <Text style={styles.inputLabel}>Barangay</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter barangay name"
                    value={barangay}
                    onChangeText={setBarangay}
                    placeholderTextColor="#9CA3AF"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.pinToggle, isPinned && styles.pinToggleActive]}
                onPress={() => setIsPinned(!isPinned)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pinToggleText, isPinned && styles.pinToggleTextActive]}>
                  {isPinned ? 'Pinned Announcement' : 'Pin this announcement'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleCreateAnnouncement}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Posted Announcements</Text>
              <Text style={styles.panelSubtitle}>
                Manage what users see on their dashboard.
              </Text>

              {loadingAnnouncements ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color="#F97316" />
                  <Text style={styles.stateText}>Loading announcements...</Text>
                </View>
              ) : announcements.length === 0 ? (
                <View style={styles.centerState}>
                  <Text style={styles.stateText}>No announcements yet.</Text>
                </View>
              ) : (
                <View style={styles.listWrap}>
                  {announcements.map((item) => {
                    const priorityStyle = getPriorityStyle(item.priority);

                    return (
                      <View key={item.id} style={styles.announcementCard}>
                        <View style={styles.announcementTopRow}>
                          <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                            <Text style={[styles.priorityBadgeText, { color: priorityStyle.text }]}>
                              {(item.priority || 'normal').toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.topRightBadges}>
                            {item.isPinned && (
                              <View style={styles.smallBadge}>
                                <Text style={styles.smallBadgeText}>PINNED</Text>
                              </View>
                            )}

                            <View
                              style={[
                                styles.smallBadge,
                                { backgroundColor: item.isActive ? '#DCFCE7' : '#F3F4F6' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallBadgeText,
                                  { color: item.isActive ? '#166534' : '#6B7280' },
                                ]}
                              >
                                {item.isActive ? 'ACTIVE' : 'HIDDEN'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardMessage}>{item.message}</Text>

                        <Text style={styles.scopeMeta}>
                          Scope: {item.scope === 'barangay'
                            ? `Barangay - ${item.barangay || 'No barangay'}`
                            : 'All Users'}
                        </Text>

                        <Text style={styles.cardMeta}>
                          By {item.createdByName || 'Admin'} • {getRelativeTime(item.createdAt)}
                        </Text>

                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleTogglePinned(item.id, !!item.isPinned)}
                          >
                            <Text style={styles.secondaryButtonText}>
                              {item.isPinned ? 'Unpin' : 'Pin'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.secondaryButton,
                              item.isActive ? styles.warningButton : styles.successButton,
                            ]}
                            onPress={() => handleToggleActive(item.id, !!item.isActive)}
                          >
                            <Text
                              style={[
                                styles.secondaryButtonText,
                                item.isActive ? styles.warningButtonText : styles.successButtonText,
                              ]}
                            >
                              {item.isActive ? 'Hide' : 'Show'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
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
    marginBottom: 32,
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
  },
  rightColumn: {
    flex: 1,
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

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 130,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#F97316',
  },

  scopeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  scopeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scopeButtonActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  scopeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scopeButtonTextActive: {
    color: '#F97316',
  },

  pinToggle: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pinToggleActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  pinToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  pinToggleTextActive: {
    color: '#F97316',
  },

  submitButton: {
    marginTop: 18,
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  centerState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  listWrap: {
    gap: 14,
  },
  announcementCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  announcementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  smallBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F97316',
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  cardMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  scopeMeta: {
    marginTop: 10,
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },
  cardMeta: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  warningButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  warningButtonText: {
    color: '#B91C1C',
  },
  successButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  successButtonText: {
    color: '#166534',
  },
});