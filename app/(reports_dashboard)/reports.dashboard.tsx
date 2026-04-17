import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ReportItem } from '@/models/report';
import {
  fetchReports,
  formatReportDate,
  getCategoryIcon,
  getPendingReportsCount,
  getResolvedReportsCount,
  getStatusStyle,
} from '@/services/reportService';
import { useTheme } from '../ThemeContext';

const PRIMARY_BLUE = '#2F70E9';

export default function ReportsDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const theme = useMemo(() => ({
    background: isDarkMode ? '#020617' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    accent: isDarkMode ? '#38bdf8' : '#2F70E9',
  }), [isDarkMode]);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent'>('all');

  const loadReports = useCallback(async (useRefresh = false) => {
    try {
      if (useRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchReports();
      setReports(data);
    } catch (error) {
      console.error('[ReportsDashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

  const filteredReports = useMemo(() => {
    let list = [...reports].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA; // Sort Newest First
    });

    if (activeFilter === 'recent') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter(item => (item.createdAt?.toDate ? item.createdAt.toDate().getTime() : 0) > oneDayAgo);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(i => 
        i.title?.toLowerCase().includes(q) || 
        i.reportCode?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reports, search, activeFilter]);

  const toggleFilter = (filter: 'all' | 'recent') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER AREA - Adjusted paddingTop for positioning */}
        <View style={styles.headerArea}>
           <View style={styles.topNav}>
              <TouchableOpacity 
                style={[styles.backIcon, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={22} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.headerTextGroup}>
                 <ThemedText style={styles.brandTag}>COMMUNITY PULSE</ThemedText>
                 <ThemedText style={[styles.titleText, { color: theme.text }]}>Incident Logs</ThemedText>
              </View>
           </View>

           <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.subText} />
              <TextInput 
                style={[styles.inputField, { color: theme.text }]}
                placeholder="Search incident ID or type..."
                placeholderTextColor={theme.subText}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={18} color={theme.subText} />
                  </TouchableOpacity>
              )}
           </View>

           <View style={styles.tabRow}>
              <TouchableOpacity 
                onPress={() => toggleFilter('all')}
                style={[styles.pill, activeFilter === 'all' ? { backgroundColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              >
                <ThemedText style={[styles.pillText, activeFilter === 'all' && { color: '#FFF' }]}>Display All</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => toggleFilter('recent')}
                style={[styles.pill, activeFilter === 'recent' ? { backgroundColor: theme.accent } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              >
                <Ionicons name="time" size={14} color={activeFilter === 'recent' ? '#FFF' : theme.subText} />
                <ThemedText style={[styles.pillText, activeFilter === 'recent' && { color: '#FFF' }]}>Recent 24h</ThemedText>
              </TouchableOpacity>
           </View>
        </View>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReports(true)} />}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        >
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} theme={theme} />
          ))}

          {filteredReports.length === 0 && (
            <View style={styles.emptyContainer}>
               <Ionicons name="file-tray-outline" size={60} color={theme.subText} />
               <ThemedText style={{ color: theme.subText, fontWeight: '700', marginTop: 15 }}>No Matches Found</ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ReportCard({ report, theme }: { report: ReportItem; theme: any }) {
  const router = useRouter();
  const status = getStatusStyle(report.status);
  const time = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';

  const viewOnMap = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/(maps.dashboard)/maps.dashboard',
      params: { lat: report.latitude, lng: report.longitude, title: report.title }
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={viewOnMap} style={[styles.reportCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
         <View style={styles.idGroup}>
            <View style={[styles.catIconBox, { backgroundColor: 'rgba(47, 112, 233, 0.1)' }]}>
                <Ionicons name={getCategoryIcon(report.category) as any} size={20} color={PRIMARY_BLUE} />
            </View>
            <View>
                <ThemedText style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{report.title}</ThemedText>
                <ThemedText style={[styles.cardCode, { color: theme.subText }]}>REPORT ID: {report.reportCode}</ThemedText>
            </View>
         </View>
         <View style={[styles.statusPill, { backgroundColor: status.backgroundColor }]}>
            <ThemedText style={[styles.statusTxt, { color: status.color }]}>{status.label}</ThemedText>
         </View>
      </View>

      <ThemedText style={[styles.cardDescription, { color: theme.subText }]} numberOfLines={3}>
        {report.description}
      </ThemedText>

      {report.imageUrl && (
        <View style={styles.imageWrapper}>
            <Image source={{ uri: report.imageUrl }} style={styles.image} />
            <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={20} color="white" />
            </View>
        </View>
      )}

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
         <View style={styles.footerInfo}>
            <View style={styles.footerItem}>
               <Ionicons name="calendar-clear" size={14} color={theme.subText} />
               <ThemedText style={[styles.footerText, { color: theme.subText }]}>{formatReportDate(report)}</ThemedText>
            </View>
            <View style={styles.footerItem}>
               <Ionicons name="time" size={14} color={PRIMARY_BLUE} />
               <ThemedText style={[styles.footerText, { color: PRIMARY_BLUE, fontWeight: '800' }]}>{time}</ThemedText>
            </View>
         </View>
         <View style={styles.mapPrompt}>
            <ThemedText style={styles.mapPromptText}>VIEW ON MAP</ThemedText>
            <Ionicons name="chevron-forward" size={14} color={PRIMARY_BLUE} />
         </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Adjusted: padding increased to shift the header items down
  headerArea: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15 },
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
  backIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTextGroup: { flex: 1 },
  brandTag: { fontSize: 10, fontWeight: '900', color: PRIMARY_BLUE, letterSpacing: 1.5 },
  titleText: { fontSize: 26, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, marginBottom: 15 },
  inputField: { flex: 1, marginLeft: 10, fontSize: 15 },
  tabRow: { flexDirection: 'row', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 25, gap: 6 },
  pillText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  reportCard: { padding: 20, borderRadius: 30, borderWidth: 1, marginBottom: 18, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 }, android: { elevation: 4 } }) },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  idGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardCode: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusTxt: { fontSize: 9, fontWeight: '900' },
  cardDescription: { fontSize: 14, lineHeight: 21, marginBottom: 15 },
  imageWrapper: { width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 15 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 5, borderRadius: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15 },
  footerInfo: { flexDirection: 'row', gap: 15 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, fontWeight: '600' },
  mapPrompt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapPromptText: { fontSize: 10, fontWeight: '900', color: PRIMARY_BLUE },
  emptyContainer: { alignItems: 'center', marginTop: 100 }
});