import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  status?: string;
  disabled?: boolean;
  createdAt?: any;
  profilePic?: string;
};

const UsersDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList: UserItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          const resolvedName =
            data.fullName ||
            data.name ||
            `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
            'No Name';

          const isDisabled = data.disabled ?? false;

          return {
            id: docSnap.id,
            fullName: resolvedName,
            email: data.email || 'No Email',
            role: data.role || 'User',
            status: data.status || (isDisabled ? 'Disabled' : 'Active'),
            disabled: isDisabled,
            createdAt: data.createdAt || null,
            profilePic: data.profilePic || '',
          };
        });

        usersList.sort((a, b) => a.fullName.localeCompare(b.fullName));

        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.log('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users from Firebase.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        (user.role || '').toLowerCase().includes(keyword) ||
        (user.status || '').toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (
      parts[0].charAt(0).toUpperCase() +
      parts[1].charAt(0).toUpperCase()
    );
  };

  const formatDate = (value: any) => {
    if (!value) return 'No record';

    try {
      if (value?.toDate) {
        return value.toDate().toLocaleDateString();
      }

      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }

      return 'No record';
    } catch (error) {
      return 'No record';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return 'User';

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const toggleDisableAccount = async (user: UserItem) => {
    const actionText = user.disabled ? 'enable' : 'disable';

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Account`,
      `Are you sure you want to ${actionText} ${user.fullName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setProcessingId(user.id);

              const userRef = doc(db, 'users', user.id);
              const nextDisabled = !user.disabled;

              await updateDoc(userRef, {
                disabled: nextDisabled,
                status: nextDisabled ? 'Disabled' : 'Active',
              });

              Alert.alert(
                'Success',
                `Account has been ${nextDisabled ? 'disabled' : 'enabled'}.`
              );
            } catch (error) {
              console.log('Error updating account status:', error);
              Alert.alert('Error', 'Failed to update account status.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          isDesktop ? styles.desktopPadding : styles.mobilePadding
        }
      >
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>

          {isDesktop && (
            <View style={styles.navLinks}>
              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/admin.dashboard')
                }
              >
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/complaints.dashboard')
                }
              >
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/announcements.dashboard')
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

              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Users</Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(admin.dashboard)/analytics.dashboard')
                }
              >
                <Text style={styles.navItem}>Report Analytics</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.userName}>Admin</Text>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>User Management</Text>
            <Text style={styles.subtitle}>
              Manage registered user accounts stored in Firebase.
            </Text>
          </View>
        </View>

        <View style={styles.controlsBar}>
          <View style={styles.usersCountBox}>
            <Text style={styles.usersCountLabel}>Total Users</Text>
            <Text style={styles.usersCountValue}>{users.length}</Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnLabel, { flex: 2.2 }]}>
              Name & Email
            </Text>
            <Text style={styles.columnLabel}>Role</Text>
            <Text style={styles.columnLabel}>Status</Text>
            <Text style={styles.columnLabel}>Created</Text>
            <View style={{ width: 120 }} />
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#FF9F00" />
              <Text style={styles.stateText}>Loading Firebase users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={40} color="#9CA3AF" />
              <Text style={styles.stateTitle}>No users found</Text>
              <Text style={styles.stateText}>
                No matching user accounts were found in Firebase.
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.tableRow}>
                <View style={[styles.avatarRow, { flex: 2.2 }]}>
                  <View
                    style={[
                      styles.avatar,
                      !user.profilePic && {
                        backgroundColor: user.disabled ? '#E5E7EB' : '#FFE7C2',
                      },
                    ]}
                  >
                    {user.profilePic ? (
                      <Image
                        source={{ uri: user.profilePic }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {getInitials(user.fullName)}
                      </Text>
                    )}
                  </View>

                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.rowName}>{user.fullName}</Text>
                    <Text style={styles.rowEmail}>{user.email}</Text>
                  </View>
                </View>

                <View style={styles.cell}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {formatRole(user.role)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cell}>
                  <View
                    style={[
                      styles.statusBadge,
                      user.disabled
                        ? styles.statusDisabledBadge
                        : styles.statusActiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        user.disabled
                          ? styles.statusDisabledText
                          : styles.statusActiveText,
                      ]}
                    >
                      {user.disabled ? 'Disabled' : 'Active'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.rowText}>{formatDate(user.createdAt)}</Text>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    user.disabled ? styles.enableBtn : styles.disableBtn,
                    processingId === user.id && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleDisableAccount(user)}
                  disabled={processingId === user.id}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      user.disabled
                        ? styles.enableBtnText
                        : styles.disableBtnText,
                    ]}
                  >
                    {processingId === user.id
                      ? 'Processing...'
                      : user.disabled
                      ? 'Enable'
                      : 'Disable'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 20 },
  desktopPadding: { paddingHorizontal: '10%', paddingVertical: 40 },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: { fontSize: 18, fontWeight: '900' },
  navLinks: { flexDirection: 'row', gap: 30 },
  navItem: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  activeTabWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
    paddingBottom: 4,
  },
  activeNavItem: { fontSize: 13, color: '#000', fontWeight: '700' },
  userName: { fontSize: 13, fontWeight: '600' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
    gap: 14,
  },
  usersCountBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  usersCountLabel: {
    fontSize: 12,
    color: '#9A3412',
    fontWeight: '600',
  },
  usersCountValue: {
    fontSize: 22,
    color: '#EA580C',
    fontWeight: '800',
    marginTop: 2,
  },

  searchContainer: { width: 320, maxWidth: '100%' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 42,
    color: '#111827',
  },

  tableCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  columnLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  avatarText: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 12,
  },

  rowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  rowEmail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  cell: { flex: 1 },
  rowText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActiveBadge: {
    backgroundColor: '#DCFCE7',
  },
  statusDisabledBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusActiveText: {
    color: '#166534',
  },
  statusDisabledText: {
    color: '#991B1B',
  },

  actionBtn: {
    width: 100,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  enableBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disableBtnText: {
    color: '#B91C1C',
  },
  enableBtnText: {
    color: '#047857',
  },

  centerState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
});

export default UsersDashboard;