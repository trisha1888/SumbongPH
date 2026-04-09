import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

const UsersDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Staff');

  const usersData = [
    { initials: 'KS', name: 'Kap. Roberto Santos', email: 'roberto.santos@barangay.gov.ph', role: 'Admin', dept: 'Executive', status: 'Active', login: '10/24/2025', color: '#A7D7C5' },
    { initials: 'MR', name: 'Maria Clara Reyes', email: 'mcreyes@barangay.gov.ph', role: 'Staff', dept: 'Public Service', status: 'Active', login: '10/24/2025', color: '#A0CED9' },
    { initials: 'JC', name: 'Juanito Dela Cruz', email: 'jdelacruz@barangay.gov.ph', role: 'Staff', dept: 'Engineering', status: 'Active', login: '10/24/2025', color: '#B0E0E6' },
    { initials: 'EB', name: 'Elena Bautista', email: 'ebautista@barangay.gov.ph', role: 'Admin', dept: 'Records', status: 'Active', login: '10/24/2025', color: '#5C8D58' },
    { initials: 'PP', name: 'Pedro Penduko', email: 'ppenduko@barangay.gov.ph', role: 'Staff', dept: 'Security (Tanod)', status: 'Active', login: '10/24/2025', color: '#45ADA8' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}
      >
        {/* --- NAVBAR --- */}
        <View style={styles.navBar}>
          <Text style={styles.logo}>SumbongPH</Text>
          {isDesktop && (
            <View style={styles.navLinks}>
              <TouchableOpacity onPress={() => router.push('/(admin.dashboard)/admin.dashboard')}>
                <Text style={styles.navItem}>Overview</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/complaints.dashboard')}>
                <Text style={styles.navItem}>Complaints</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/maps.dashboard')}>
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>
              <View style={styles.activeTabWrapper}>
                <Text style={styles.activeNavItem}>Users</Text>
              </View>
              <Text style={styles.navItem}>Reports</Text>
            </View>
          )}
          <Text style={styles.userName}>Kap. Roberto Santos</Text>
        </View>

        {/* --- HEADER --- */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>User Management</Text>
            <Text style={styles.subtitle}>Manage staff access and resident accounts.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>Add Staff Member</Text>
          </TouchableOpacity>
        </View>

        {/* --- CONTROLS BAR --- */}
        <View style={styles.controlsBar}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity 
              style={[styles.segment, activeTab === 'Staff' && styles.segmentActive]} 
              onPress={() => setActiveTab('Staff')}
            >
              <Text style={[styles.segmentText, activeTab === 'Staff' && styles.segmentTextActive]}>Staff Accounts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segment, activeTab === 'Resident' && styles.segmentActive]} 
              onPress={() => setActiveTab('Resident')}
            >
              <Text style={[styles.segmentText, activeTab === 'Resident' && styles.segmentTextActive]}>Resident Accounts</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput style={styles.searchInput} placeholder="Search staff..." />
          </View>
        </View>

        {/* --- TABLE --- */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnLabel, { flex: 2 }]}>Name & Email</Text>
            <Text style={styles.columnLabel}>Role</Text>
            <Text style={styles.columnLabel}>Department</Text>
            <Text style={styles.columnLabel}>Status</Text>
            <Text style={styles.columnLabel}>Last Login</Text>
            <View style={{ width: 30 }} />
          </View>

          {usersData.map((user, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.avatarRow, { flex: 2 }]}>
                <View style={[styles.avatar, { backgroundColor: user.color }]}>
                  <Text style={styles.avatarText}>{user.initials}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.rowName}>{user.name}</Text>
                  <Text style={styles.rowEmail}>{user.email}</Text>
                </View>
              </View>
              
              <View style={styles.cell}>
                <View style={[styles.roleBadge, { backgroundColor: user.role === 'Admin' ? '#F3E8FF' : '#DBEAFE' }]}>
                  <Text style={[styles.roleText, { color: user.role === 'Admin' ? '#7E22CE' : '#1E40AF' }]}>{user.role}</Text>
                </View>
              </View>

              <Text style={styles.rowText}>{user.dept}</Text>
              
              <View style={styles.cell}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{user.status}</Text>
                </View>
              </View>

              <Text style={styles.rowText}>{user.login}</Text>
              
              <TouchableOpacity style={styles.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color="#AAA" />
              </TouchableOpacity>
            </View>
          ))}
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
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 },
  logo: { fontSize: 18, fontWeight: '900' },
  navLinks: { flexDirection: 'row', gap: 30 },
  navItem: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  activeTabWrapper: { borderBottomWidth: 2, borderBottomColor: '#FF6B00', paddingBottom: 4 },
  activeNavItem: { fontSize: 13, color: '#000', fontWeight: '700' },
  userName: { fontSize: 13, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  mainTitle: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  addBtn: { backgroundColor: '#FF9F00', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center', gap: 8 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  controlsBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 10 },
  segment: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  segmentText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  segmentTextActive: { color: '#1F2937' },
  searchContainer: { width: 300 },
  searchInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 15, height: 40 },
  tableCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#FAFAFA', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  columnLabel: { flex: 1, fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', color: '#374151', fontSize: 12 },
  rowName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  rowEmail: { fontSize: 11, color: '#6B7280' },
  cell: { flex: 1 },
  rowText: { flex: 1, fontSize: 13, color: '#4B5563' },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  roleText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  moreBtn: { width: 30, alignItems: 'center' }
});

export default UsersDashboard;