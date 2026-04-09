import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ThemeContext';

export default function IdeasDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [filter, setFilter] = useState('Popular');

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, isDarkMode && styles.darkText]}>Community Suggestions</ThemedText>
          {/* New Button also pointing to Category Selection */}
          <TouchableOpacity 
            style={styles.newButton} 
            onPress={() => router.push('/category.dashboard')}
          >
            <Ionicons name="add" size={20} color="white" />
            <ThemedText style={styles.newButtonText}>New</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.filterContainer, isDarkMode && styles.darkCard]}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'Popular' && styles.activeFilterTab]} 
            onPress={() => setFilter('Popular')}
          >
            <ThemedText style={[styles.filterText, filter === 'Popular' && styles.activeFilterText]}>Popular</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'Newest' && styles.activeFilterTab]} 
            onPress={() => setFilter('Newest')}
          >
            <ThemedText style={[styles.filterText, filter === 'Newest' && styles.activeFilterText]}>Newest</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <IdeaCard author="Maria Santos" time="2 days ago" title="Install solar streetlights in Purok 3" desc="The alleyways are very dark at night." likes={45} comments={12} status="Under Review" statusColor="#FEF9C3" textColor="#854D0E" />
          <IdeaCard author="Juan Dela Cruz" time="5 days ago" title="Weekly community cleanup drive" desc="Let's organize a Saturday morning cleanup." likes={32} comments={8} status="Approved" statusColor="#DCFCE7" textColor="#166534" />
        </ScrollView>

        {/* FAB Navigating to Category Dashboard */}
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => router.push('/category.dashboard')}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <View style={[styles.tabBar, isDarkMode && styles.darkCard]}>
          <TabIcon icon="home-outline" label="Home" onPress={() => router.push('/(home_dasborad)/home.dashboard')} />
          <TabIcon icon="document-text-outline" label="Reports" onPress={() => router.push('/(reports_dashboard)/reports.dashboard')} />
          <TabIcon icon="map-outline" label="Maps" onPress={() => router.push('/(maps.dashboard)/maps.dashboard')} />
          <TabIcon icon="bulb" label="Ideas" active onPress={() => router.push('/(ideas_dashboard)/ideas_dashboard')} />
          <TabIcon icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function IdeaCard({ author, time, title, desc, likes, comments, status, statusColor, textColor }: any) {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.card, isDarkMode && styles.darkCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}><ThemedText style={styles.avatarText}>{author.charAt(0)}</ThemedText></View>
          <View><ThemedText style={[styles.userName, isDarkMode && styles.darkText]}>{author}</ThemedText><ThemedText style={[styles.timeText, isDarkMode && styles.darkSubText]}>{time}</ThemedText></View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}> 
          <ThemedText style={[styles.statusText, { color: textColor }]}>{status}</ThemedText>
        </View>
      </View>
      <ThemedText style={[styles.ideaTitle, isDarkMode && styles.darkText]}>{title}</ThemedText>
      <ThemedText style={[styles.ideaDesc, isDarkMode && styles.darkSubText]}>{desc}</ThemedText>
      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <View style={styles.statItem}><Ionicons name="thumbs-up-outline" size={20} color="#6B7280" /><ThemedText style={[styles.statText, isDarkMode && styles.darkSubText]}>{likes}</ThemedText></View>
          <View style={styles.statItem}><Ionicons name="chatbubble-outline" size={20} color="#6B7280" /><ThemedText style={[styles.statText, isDarkMode && styles.darkSubText]}>{comments}</ThemedText></View>
        </View>
        <TouchableOpacity><ThemedText style={[styles.readMore, isDarkMode && styles.darkText]}>Read more</ThemedText></TouchableOpacity>
      </View>
    </View>
  );
}

function TabIcon({ icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity style={{ alignItems: 'center' }} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? '#2F70E9' : '#9CA3AF'} />
      <ThemedText style={{ fontSize: 10, color: active ? '#2F70E9' : '#9CA3AF', marginTop: 4, fontWeight: '600' }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  darkCard: { backgroundColor: '#1F2937', borderColor: '#374151' },
  darkText: { color: '#F9FAFB' },
  darkSubText: { color: '#9CA3AF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  newButton: { backgroundColor: '#2F70E9', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, gap: 4 },
  newButtonText: { color: 'white', fontWeight: '700' },
  filterContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 15 },
  darkContainer: { backgroundColor: '#111827' },
  darkCard: { backgroundColor: '#1F2937', borderColor: '#374151' },
  darkText: { color: '#F9FAFB' },
  darkSubText: { color: '#9CA3AF' },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeFilterTab: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  filterText: { color: '#6B7280', fontWeight: '600' },
  activeFilterText: { color: '#111827' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#2F70E9', fontWeight: '700' },
  userName: { fontWeight: '700', color: '#111827' },
  timeText: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ideaTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 8 },
  ideaDesc: { color: '#4B5563', lineHeight: 20, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', gap: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#6B7280', fontSize: 14 },
  readMore: { color: '#2F70E9', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#2F70E9', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 10 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 20 },
});