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
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../ThemeContext';

export default function ReportsDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (useRefresh = false) => {
    try {
      if (useRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchReports();
      setReports(data);
    } catch (error) {
      console.log('REPORTS DASHBOARD LOAD ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return reports;
    }

    return reports.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.reportCode.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  const pendingCount = useMemo(() => getPendingReportsCount(reports), [reports]);
  const resolvedCount = useMemo(() => getResolvedReportsCount(reports), [reports]);

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#2F70E9" />
        <ThemedText style={[styles.loadingText, isDarkMode && styles.darkSubText]}>
          Loading your reports...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadReports(true)} />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={isDarkMode ? '#F9FAFB' : '#111827'}
              />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <ThemedText style={[styles.headerTitle, isDarkMode && styles.darkText]}>
                Reports Dashboard
              </ThemedText>
              <ThemedText style={[styles.headerSubTitle, isDarkMode && styles.darkSubText]}>
                This page keeps all of your reports, even old or resolved ones.
              </ThemedText>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, isDarkMode && styles.darkCard]}>
              <ThemedText style={[styles.summaryLabel, isDarkMode && styles.darkSubText]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.summaryValue, isDarkMode && styles.darkText]}>
                {reports.length}
              </ThemedText>
            </View>

            <View style={[styles.summaryCard, isDarkMode && styles.darkCard]}>
              <ThemedText style={[styles.summaryLabel, isDarkMode && styles.darkSubText]}>
                Pending
              </ThemedText>
              <ThemedText style={[styles.summaryValue, isDarkMode && styles.darkText]}>
                {pendingCount}
              </ThemedText>
            </View>

            <View style={[styles.summaryCard, isDarkMode && styles.darkCard]}>
              <ThemedText style={[styles.summaryLabel, isDarkMode && styles.darkSubText]}>
                Resolved
              </ThemedText>
              <ThemedText style={[styles.summaryValue, isDarkMode && styles.darkText]}>
                {resolvedCount}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.searchBox, isDarkMode && styles.darkInput]}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.darkText]}
              placeholder="Search title, category, status, location, or code"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {filteredReports.length === 0 ? (
            <View style={[styles.emptyCard, isDarkMode && styles.darkCard]}>
              <Ionicons name="folder-open-outline" size={28} color="#9CA3AF" />
              <ThemedText style={[styles.emptyTitle, isDarkMode && styles.darkText]}>
                No reports found
              </ThemedText>
              <ThemedText style={[styles.emptyText, isDarkMode && styles.darkSubText]}>
                Try another search term or create a new report.
              </ThemedText>
            </View>
          ) : (
            filteredReports.map((report) => <ReportCard key={report.id} report={report} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ReportCard({ report }: { report: ReportItem }) {
  const { isDarkMode } = useTheme();
  const statusStyle = getStatusStyle(report.status);

  return (
    <View style={[styles.reportCard, isDarkMode && styles.darkCard]}>
      <View style={styles.reportTopRow}>
        <View style={styles.reportMainRow}>
          <View style={styles.reportIconWrap}>
            <Ionicons name={getCategoryIcon(report.category) as any} size={22} color="#4B5563" />
          </View>

          <View style={styles.reportInfo}>
            <ThemedText
              style={[styles.reportTitle, isDarkMode && styles.darkText]}
              numberOfLines={1}
            >
              {report.title}
            </ThemedText>
            <ThemedText style={[styles.reportCode, isDarkMode && styles.darkSubText]}>
              {report.reportCode}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>
            {statusStyle.label}
          </ThemedText>
        </View>
      </View>

      <ThemedText
        style={[styles.reportDescription, isDarkMode && styles.darkSubText]}
        numberOfLines={3}
      >
        {report.description}
      </ThemedText>

      <View style={styles.metaGrid}>
        <MetaItem icon="grid-outline" label={report.category} isDarkMode={isDarkMode} />
        <MetaItem icon="location-outline" label={report.location} isDarkMode={isDarkMode} />
        <MetaItem icon="flash-outline" label={report.urgency} isDarkMode={isDarkMode} />
        <MetaItem icon="calendar-outline" label={formatReportDate(report)} isDarkMode={isDarkMode} />
      </View>
    </View>
  );
}

function MetaItem({
  icon,
  label,
  isDarkMode,
}: {
  icon: any;
  label: string;
  isDarkMode: boolean;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color="#9CA3AF" />
      <ThemedText style={[styles.metaText, isDarkMode && styles.darkSubText]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  darkCard: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  darkInput: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubText: {
    color: '#9CA3AF',
  },
  safeArea: {
    flex: 1,
  },

scrollContent: {
  paddingHorizontal: 20,
  paddingTop: 50, // 👈 slightly more down
  paddingBottom: 30,
},

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2F70E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubTitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reportMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reportCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 14,
  },
  metaGrid: {
    marginTop: 14,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
});