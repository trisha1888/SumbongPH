import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
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
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type AdminComplaintItem = {
  id: string;
  reportCode: string;
  title: string;
  complainant: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  description: string;
  imageUrl?: string;
  userEmail?: string;
  mobileNumber?: string;
};

const CATEGORY_OPTIONS = ['All Categories', 'Flood', 'Garbage', 'Road', 'Streetlight', 'Noise', 'Safety', 'Other'];
const STATUS_OPTIONS = ['All Statuses', 'Pending', 'Under Review', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['All Priorities', 'Low', 'Medium', 'High', 'Critical'];
const STATUS_CHOICES = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

const normalizeStatus = (status: unknown) => {
  const value = String(status ?? '').trim().toLowerCase();
  switch (value) {
    case 'resolved':
      return 'Resolved';
    case 'in progress':
    case 'in-progress':
      return 'In Progress';
    case 'under review':
    case 'under-review':
      return 'Under Review';
    case 'pending':
    default:
      return 'Pending';
  }
};

const getPriorityStyle = (priority: string) => {
  switch (String(priority).trim().toLowerCase()) {
    case 'critical': return { bg: '#FEE2E2', text: '#991B1B' };
    case 'high': return { bg: '#FFEDD5', text: '#9A3412' };
    case 'medium': return { bg: '#FEF3C7', text: '#B45309' };
    case 'low':
    default: return { bg: '#F3F4F6', text: '#374151' };
  }
};

const getStatusStyle = (status: string) => {
  switch (normalizeStatus(status)) {
    case 'Resolved': return { bg: '#DCFCE7', text: '#166534' };
    case 'In Progress': return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'Under Review': return { bg: '#E0F2FE', text: '#0369A1' };
    case 'Pending':
    default: return { bg: '#FEF3C7', text: '#B45309' };
  }
};

const getCategoryDotColor = (category: string) => {
  switch (category) {
    case 'Flood': return '#A855F7';
    case 'Garbage': return '#22C55E';
    case 'Road': return '#F97316';
    case 'Streetlight': return '#EF4444';
    case 'Noise': return '#8B5CF6';
    case 'Safety': return '#DC2626';
    default: return '#D1D5DB';
  }
};

const FilterChip = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
    <Ionicons name="chevron-down" size={14} color={isActive ? '#FF6B00' : '#6B7280'} />
  </TouchableOpacity>
);

const ComplaintsDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Statuses');
  const [priority, setPriority] = useState('All Priorities');

  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<{
    title: string;
    options: string[];
    current: string;
    onSelect: (val: string) => void;
  } | null>(null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaintItem | null>(null);

  const [complaintsData, setComplaintsData] = useState<AdminComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        const data: AdminComplaintItem[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data() as any;
          return {
            id: docSnap.id,
            reportCode: raw.reportCode || 'No Code',
            title: raw.title || 'Untitled Complaint',
            complainant: raw.userName || raw.userEmail || 'Unknown User',
            category: raw.category || 'Other',
            priority: raw.urgency || 'Low',
            status: normalizeStatus(raw.status),
            location: raw.location || raw.coordinates?.address || 'No location',
            description: raw.description || 'No description provided.',
            imageUrl: raw.imageUrl || '',
            userEmail: raw.userEmail || '',
            mobileNumber: raw.mobileNumber || '',
          };
        });

        setComplaintsData(data);
        setLoading(false);
      },
      (error) => {
        console.log('ADMIN COMPLAINTS ERROR:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredData = useMemo(() => {
    return complaintsData.filter((item) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        item.reportCode.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.complainant.toLowerCase().includes(query);

      const matchesCat = category === 'All Categories' || item.category === category;
      const matchesStat = status === 'All Statuses' || item.status === status;
      const matchesPri = priority === 'All Priorities' || item.priority === priority;

      return matchesSearch && matchesCat && matchesStat && matchesPri;
    });
  }, [complaintsData, searchQuery, category, status, priority]);

  const openPicker = (
    title: string,
    options: string[],
    current: string,
    setter: (val: string) => void
  ) => {
    setPickerConfig({ title, options, current, onSelect: setter });
    setPickerModalVisible(true);
  };

  const openComplaintDetails = (item: AdminComplaintItem) => {
    setSelectedComplaint(item);
    setDetailsModalVisible(true);
  };

  const openStatusModal = (item: AdminComplaintItem) => {
    setSelectedComplaint(item);
    setStatusModalVisible(true);
  };

  const handleSetStatus = async (newStatus: string) => {
    if (!selectedComplaint) return;

    try {
      setUpdatingId(selectedComplaint.id);

      const reportRef = doc(db, 'reports', selectedComplaint.id);

      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data() as any;

      if (reportData.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: reportData.userId,
          reportId: selectedComplaint.id,
          title: 'Report Status Updated',
          message: `Your report ${selectedComplaint.reportCode} is now marked as ${newStatus}.`,
          type: 'report_status',
          status: newStatus,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setStatusModalVisible(false);
      Alert.alert('Success', `Status updated to ${newStatus}.`);
    } catch (error) {
      Alert.alert('Update Failed', 'Could not update complaint status.');
    } finally {
      setUpdatingId(null);
    }
  };

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

              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Complaints</Text>
              </View>

              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/announcements.dashboard')}>
                <Text style={styles.navItem}>Announcements</Text>
              </TouchableOpacity>

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

          <Text style={styles.userName}>Cesar R. Dela Fuente, Jr.</Text>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>Complaints Management</Text>
            <Text style={styles.subtitle}>Review, assign, and resolve resident complaints.</Text>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by code, title, complainant..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterChipsRow}>
            <FilterChip
              label={category}
              isActive={category !== 'All Categories'}
              onPress={() => openPicker('Select Category', CATEGORY_OPTIONS, category, setCategory)}
            />
            <FilterChip
              label={status}
              isActive={status !== 'All Statuses'}
              onPress={() => openPicker('Select Status', STATUS_OPTIONS, status, setStatus)}
            />
            <FilterChip
              label={priority}
              isActive={priority !== 'All Priorities'}
              onPress={() => openPicker('Select Priority', PRIORITY_OPTIONS, priority, setPriority)}
            />

            {(category !== 'All Categories' ||
              status !== 'All Statuses' ||
              priority !== 'All Priorities') && (
              <TouchableOpacity
                onPress={() => {
                  setCategory('All Categories');
                  setStatus('All Statuses');
                  setPriority('All Priorities');
                }}
              >
                <Text style={styles.resetText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnLabel, { flex: 2.4 }]}>Complaint</Text>
            <Text style={styles.columnLabel}>Category</Text>
            <Text style={styles.columnLabel}>Priority</Text>
            <Text style={styles.columnLabel}>Status</Text>
            <Text style={[styles.columnLabel, { flex: 2.2 }]}>Actions</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 40 }} color="#FF9F00" />
          ) : filteredData.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No complaints found.</Text>
            </View>
          ) : (
            filteredData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.tableRow}
                activeOpacity={0.9}
                onPress={() => openComplaintDetails(item)}
              >
                <View style={[styles.complaintCell, { flex: 2.4 }]}>
                  <View style={[styles.dot, { backgroundColor: getCategoryDotColor(item.category) }]} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.rowId}>{item.reportCode}</Text>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowSub}>📍 {item.location}</Text>
                    <Text style={styles.rowReporter}>By: {item.complainant}</Text>
                  </View>
                </View>

                <Text style={styles.rowText}>{item.category}</Text>

                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: getPriorityStyle(item.priority).bg }]}>
                    <Text style={[styles.badgeText, { color: getPriorityStyle(item.priority).text }]}>
                      {item.priority}
                    </Text>
                  </View>
                </View>

                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: getStatusStyle(item.status).bg }]}>
                    <Text style={[styles.badgeText, { color: getStatusStyle(item.status).text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsCell}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.detailsBtn]}
                    onPress={() => openComplaintDetails(item)}
                  >
                    <Text style={styles.actionBtnText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.updateBtn]}
                    onPress={() => openStatusModal(item)}
                  >
                    <Text style={styles.actionBtnText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={pickerModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerConfig?.title}</Text>

            {pickerConfig?.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.statusChoiceBtn,
                  pickerConfig.current === option && styles.statusChoiceActive,
                ]}
                onPress={() => {
                  pickerConfig.onSelect(option);
                  setPickerModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.statusChoiceText,
                    pickerConfig.current === option && { color: '#FF6B00' },
                  ]}
                >
                  {option}
                </Text>
                {pickerConfig.current === option && (
                  <Ionicons name="checkmark" size={18} color="#FF6B00" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Status</Text>

            {STATUS_CHOICES.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.statusChoiceBtn}
                onPress={() => handleSetStatus(s)}
                disabled={updatingId !== null}
              >
                {updatingId === selectedComplaint?.id ? (
                  <ActivityIndicator size="small" color="#FF6B00" />
                ) : (
                  <Text style={styles.statusChoiceText}>{s}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDetailsModalVisible(false)}>
          <Pressable style={styles.detailsModalCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedComplaint && (
                <>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Report Code</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.reportCode}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Title</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.title}</Text>
                  </View>

                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{selectedComplaint.category}</Text>
                    </View>

                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>Priority</Text>
                      <Text style={styles.detailValue}>{selectedComplaint.priority}</Text>
                    </View>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: getStatusStyle(selectedComplaint.status).bg, marginTop: 6 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: getStatusStyle(selectedComplaint.status).text },
                        ]}
                      >
                        {selectedComplaint.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Reporter Name</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.complainant}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Reporter Email</Text>
                    <Text style={styles.detailValue}>
                      {selectedComplaint.userEmail || 'No email provided'}
                    </Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Mobile Number</Text>
                    <Text style={styles.detailValue}>
                      {selectedComplaint.mobileNumber || 'No mobile number provided'}
                    </Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.location}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.description}</Text>
                  </View>

                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Proof Image</Text>
                    {selectedComplaint.imageUrl ? (
                      <Image
                        source={{ uri: selectedComplaint.imageUrl }}
                        style={styles.proofImage}
                      />
                    ) : (
                      <View style={styles.noImageBox}>
                        <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                        <Text style={styles.noImageText}>No proof image uploaded.</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailsButtonRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.updateBtn, { flex: 1 }]}
                      onPress={() => {
                        setDetailsModalVisible(false);
                        setStatusModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Update Status</Text>
                    </TouchableOpacity>
                  </View>
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
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 20 },
  desktopPadding: { paddingHorizontal: '10%', paddingVertical: 40 },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: { fontSize: 18, fontWeight: '900' },
  navLinks: { flexDirection: 'row', gap: 30, alignItems: 'center' },
  navItem: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  activeTabWrapper: { borderBottomWidth: 2, borderBottomColor: '#FF6B00', paddingBottom: 4 },
  activeNavItem: { fontSize: 13, color: '#000', fontWeight: '700' },
  userName: { fontSize: 13, fontWeight: '600' },

  headerRow: { marginBottom: 28 },
  mainTitle: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  filtersCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#111827' },

  filterChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipActive: { borderColor: '#FF6B00', backgroundColor: '#FFF7ED' },
  filterChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  filterChipTextActive: { color: '#FF6B00' },
  resetText: { fontSize: 12, color: '#EF4444', fontWeight: '700', marginLeft: 5 },

  tableCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  complaintCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.4,
    marginRight: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowId: { fontSize: 12, fontWeight: '700', color: '#FF6B00' },
  rowTitle: { fontSize: 13, color: '#374151', fontWeight: '600' },
  rowSub: { fontSize: 11, color: '#9CA3AF' },
  rowReporter: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  rowText: { flex: 1, fontSize: 13, color: '#374151' },

  badgeContainer: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },

  actionsCell: {
    flex: 2.2,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsBtn: {
    backgroundColor: '#F59E0B',
  },
  updateBtn: {
    backgroundColor: '#2563EB',
  },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
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
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15 },

  statusChoiceBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusChoiceActive: { backgroundColor: '#FFF7ED' },
  statusChoiceText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  noResults: { padding: 40, alignItems: 'center' },
  noResultsText: { color: '#AAA', fontSize: 14 },

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
  detailsButtonRow: {
    marginTop: 10,
    marginBottom: 4,
  },
});

export default ComplaintsDashboard;