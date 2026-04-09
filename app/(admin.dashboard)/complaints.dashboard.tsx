import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

const ComplaintsDashboard = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const router = useRouter();

  // --- 1. SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Statuses');
  const [priority, setPriority] = useState('All Priorities');

  // Updated data with your new categories
  const complaintsData = [
    { id: 'SBP-2025-0142', title: 'Loud karaoke past 10PM', complainant: 'Jose Rizal', category: 'Noise', priority: 'Medium', status: 'In Progress', assigned: 'Pedro Penduko', pColor: '#FEF3C7', pText: '#B45309', sColor: '#DBEAFE', sText: '#1E40AF' },
    { id: 'SBP-2025-0143', title: 'Clogged drainage on Rizal Street', complainant: 'Andres Bonifacio', category: 'Flood', priority: 'High', status: 'Under Review', assigned: 'Unassigned', pColor: '#FFEDD5', pText: '#9A3412', sColor: '#E0F2FE', sText: '#0369A1' },
    { id: 'SBP-2025-0144', title: 'Stray dogs near daycare center', complainant: 'Gabriela Silang', category: 'Safety', priority: 'Critical', status: 'Resolved', assigned: 'Pedro Penduko', pColor: '#FEE2E2', pText: '#991B1B', sColor: '#DCFCE7', sText: '#166534' },
    { id: 'SBP-2025-0145', title: 'Busted bulb near Park', complainant: 'Apolinario Mabini', category: 'Street Light', priority: 'Low', status: 'Pending', assigned: 'Unassigned', pColor: '#F3F4F6', pText: '#374151', sColor: '#FEF3C7', sText: '#B45309' },
    { id: 'SBP-2025-0146', title: 'Uncollected trash pile', complainant: 'Juan Luna', category: 'Garbage', priority: 'Medium', status: 'Pending', assigned: 'Unassigned', pColor: '#FEF3C7', pText: '#B45309', sColor: '#FEF3C7', sText: '#B45309' },
  ];

  // --- 2. FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return complaintsData.filter((item) => {
      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = category === 'All Categories' || item.category === category;
      const matchesStat = status === 'All Statuses' || item.status === status;
      const matchesPri = priority === 'All Priorities' || item.priority === priority;

      return matchesSearch && matchesCat && matchesStat && matchesPri;
    });
  }, [searchQuery, category, status, priority]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={isDesktop ? styles.desktopPadding : styles.mobilePadding}
        showsVerticalScrollIndicator={false}
      >
        {/* --- NAVBAR --- */}
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
              
              <TouchableOpacity onPress={() => router.push('/maps.dashboard')}>
                <Text style={styles.navItem}>Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/users.dashboard')}>
                <Text style={styles.navItem}>Users</Text>
              </TouchableOpacity>
              <Text style={styles.navItem}>Reports</Text>
            </View>
          )}
          <Text style={styles.userName}>Kap. Roberto Santos</Text>
        </View>

        {/* --- TITLE SECTION --- */}
        <View style={styles.headerTitleContainer}>
          <View>
            <Text style={styles.mainTitle}>Complaints Management</Text>
            <Text style={styles.subtitle}>View, filter, and manage all barangay complaints.</Text>
          </View>
        </View>

        {/* --- WORKING FILTER BAR --- */}
        <View style={styles.filterBar}>
          <View style={styles.searchContainer}>
            <TextInput 
                style={styles.searchInput} 
                placeholder="Search ID or Subject..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.dropdowns}>
            
            {/* UPDATED CATEGORIES DROPDOWN */}
            <View style={styles.dropdown}>
              <select 
                style={webSelectStyle} 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All Categories</option>
                <option>Flood</option>
                <option>Garbage</option>
                <option>Road</option>
                <option>Street Light</option>
                <option>Noise</option>
                <option>Safety</option>
                <option>others</option>
              </select>
            </View>

            {/* Status Dropdown */}
            <View style={styles.dropdown}>
              <select 
                style={webSelectStyle} 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Under Review</option>
                <option>Resolved</option>
              </select>
            </View>

            {/* Priority Dropdown */}
            <View style={styles.dropdown}>
              <select 
                style={webSelectStyle} 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </View>

            <TouchableOpacity style={styles.filterIconBtn} onPress={() => {
                setSearchQuery('');
                setCategory('All Categories');
                setStatus('All Statuses');
                setPriority('All Priorities');
            }}>
              <Ionicons name="refresh-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- TABLE --- */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.checkCol}><View style={styles.checkbox} /></View>
            <Text style={[styles.columnLabel, { flex: 2 }]}>ID & Subject</Text>
            <Text style={styles.columnLabel}>Complainant</Text>
            <Text style={styles.columnLabel}>Category</Text>
            <Text style={styles.columnLabel}>Priority</Text>
            <Text style={styles.columnLabel}>Status</Text>
            <Text style={styles.columnLabel}>Assigned To</Text>
          </View>

          {filteredData.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.checkCol}><View style={styles.checkbox} /></View>
              <View style={{ flex: 2 }}>
                <Text style={styles.rowId}>{item.id}</Text>
                <Text style={styles.rowTitle}>{item.title}</Text>
              </View>
              <Text style={styles.rowText}>{item.complainant}</Text>
              <Text style={styles.rowText}>{item.category}</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: item.pColor }]}><Text style={[styles.badgeText, { color: item.pText }]}>{item.priority}</Text></View>
              </View>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: item.sColor, borderRadius: 12 }]}><Text style={[styles.badgeText, { color: item.sText }]}>{item.status}</Text></View>
              </View>
              <Text style={styles.rowText}>{item.assigned}</Text>
            </View>
          ))}
          
          {filteredData.length === 0 && (
              <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No matching complaints found.</Text>
              </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styling for standard web select elements
const webSelectStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: '#374151',
    width: '100%',
    cursor: 'pointer'
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  mobilePadding: { padding: 24 },
  desktopPadding: { paddingHorizontal: '10%', paddingVertical: 40 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 70 },
  logo: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 30, alignItems: 'center' },
  navItem: { fontSize: 13, color: '#AAA', fontWeight: '500' },
  activeTabWrapper: { borderBottomWidth: 2, borderBottomColor: '#FF6B00', paddingBottom: 4 },
  activeNavItem: { fontSize: 13, color: '#000', fontWeight: '700' },
  userName: { fontSize: 13, fontWeight: '600' },
  headerTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  searchContainer: { flex: 1, maxWidth: 400 },
  searchInput: { height: 44, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#FFF' },
  dropdowns: { flexDirection: 'row', gap: 10 },
  dropdown: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', minWidth: 150 },
  filterIconBtn: { width: 44, height: 44, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tableCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  columnLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tableRow: { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  checkCol: { width: 40, alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4 },
  rowId: { fontSize: 13, fontWeight: '700', color: '#FF6B00', marginBottom: 2 },
  rowTitle: { fontSize: 13, color: '#6B7280' },
  rowText: { flex: 1, fontSize: 13, color: '#374151' },
  badgeContainer: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  noResults: { padding: 40, alignItems: 'center' },
  noResultsText: { color: '#AAA', fontSize: 14 }
});

export default ComplaintsDashboard;