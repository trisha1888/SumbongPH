import { auth, db } from '@/firebaseConfig';
import { ReportItem } from '@/models/report';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  isDarkMode?: boolean;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const fallbackCenter = {
  lat: 14.5995,
  lng: 120.9842,
};

const libraries: ('places')[] = ['places'];

function getStatusColor(status: string) {
  switch (status) {
    case 'Resolved':
      return 'green';
    case 'In Progress':
      return 'blue';
    case 'Under Review':
      return 'orange';
    default:
      return 'red';
  }
}

function normalizeReport(doc: any): ReportItem {
  const data = doc.data();

  const latitude =
    typeof data?.coordinates?.latitude === 'number'
      ? data.coordinates.latitude
      : typeof data?.latitude === 'number'
        ? data.latitude
        : 0;

  const longitude =
    typeof data?.coordinates?.longitude === 'number'
      ? data.coordinates.longitude
      : typeof data?.longitude === 'number'
        ? data.longitude
        : 0;

  const address =
    typeof data?.coordinates?.address === 'string' && data.coordinates.address.trim()
      ? data.coordinates.address
      : data.location || '';

  return {
    id: doc.id,
    reportCode: data.reportCode || '',
    category: data.category || 'Other',
    title: data.title || '',
    description: data.description || '',
    location: data.location || address || '',
    latitude,
    longitude,
    coordinates: {
      latitude,
      longitude,
      address,
    },
    urgency: data.urgency || 'Low',
    status: data.status || 'Pending',
    barangay: data.barangay || '',
    userId: data.userId || '',
    userName: data.userName || '',
    userEmail: data.userEmail || '',
    mobileNumber: data.mobileNumber || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolvedAt: data.resolvedAt,
    isRead: data.isRead ?? false,
  };
}

export default function MapsDashboardView({ isDarkMode = false }: Props) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setReports([]);
      return;
    }

    const reportsQuery = query(collection(db, 'reports'), where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const mapped = snapshot.docs.map(normalizeReport);
      setReports(mapped);
    });

    return () => unsubscribe();
  }, []);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  const center = useMemo(() => {
    if (
      selectedReport &&
      typeof selectedReport.latitude === 'number' &&
      typeof selectedReport.longitude === 'number'
    ) {
      return {
        lat: selectedReport.latitude,
        lng: selectedReport.longitude,
      };
    }

    const firstValid = filteredReports.find(
      (report) => typeof report.latitude === 'number' && typeof report.longitude === 'number'
    );

    if (firstValid) {
      return {
        lat: firstValid.latitude,
        lng: firstValid.longitude,
      };
    }

    return fallbackCenter;
  }, [filteredReports, selectedReport]);

  if (!apiKey) {
    return (
      <View style={[styles.stateContainer, isDarkMode && styles.darkCard]}>
        <Text style={[styles.stateTitle, isDarkMode && styles.darkText]}>
          Google Maps API key not found
        </Text>
        <Text style={[styles.stateText, isDarkMode && styles.darkSubText]}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.
        </Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.stateContainer, isDarkMode && styles.darkCard]}>
        <Text style={[styles.stateTitle, isDarkMode && styles.darkText]}>
          Failed to load Google Maps
        </Text>
        <Text style={[styles.stateText, isDarkMode && styles.darkSubText]}>
          Check your API key, enabled APIs, and website restrictions.
        </Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={[styles.stateContainer, isDarkMode && styles.darkCard]}>
        <ActivityIndicator size="large" color="#2F70E9" />
        <Text style={[styles.loadingText, isDarkMode && styles.darkSubText]}>
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.filterRow, isDarkMode && styles.darkFilterRow]}>
        {['All', 'Pending', 'In Progress', 'Under Review', 'Resolved'].map((item) => (
          <Pressable
            key={item}
            onPress={() => setStatusFilter(item)}
            style={[
              styles.filterChip,
              statusFilter === item && styles.activeChip,
              isDarkMode && statusFilter !== item && styles.darkChip,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === item && styles.activeChipText,
                isDarkMode && statusFilter !== item && styles.darkSubText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.mapArea}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {filteredReports.map((report) => {
            if (
              typeof report.latitude !== 'number' ||
              typeof report.longitude !== 'number'
            ) {
              return null;
            }

            return (
              <Marker
                key={report.id}
                position={{
                  lat: report.latitude,
                  lng: report.longitude,
                }}
                onClick={() => setSelectedReport(report)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: getStatusColor(report.status),
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                }}
              />
            );
          })}

          {selectedReport && (
            <InfoWindow
              position={{
                lat: selectedReport.latitude,
                lng: selectedReport.longitude,
              }}
              onCloseClick={() => setSelectedReport(null)}
            >
              <div style={{ maxWidth: 220 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {selectedReport.title || 'Untitled Report'}
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  {selectedReport.category} • {selectedReport.status}
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  {selectedReport.location || selectedReport.coordinates.address}
                </div>
                <div style={{ fontSize: 12 }}>
                  {selectedReport.description || 'No description provided.'}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  filterRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  darkFilterRow: {},
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeChip: {
    backgroundColor: '#2F70E9',
    borderColor: '#2F70E9',
  },
  darkChip: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  filterText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  mapArea: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  darkText: {
    color: '#F9FAFB',
  },
  darkSubText: {
    color: '#D1D5DB',
  },
});