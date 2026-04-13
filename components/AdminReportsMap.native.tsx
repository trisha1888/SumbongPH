import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

type ReportMapItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
};

type Props = {
  reports: ReportMapItem[];
  selectedReport: ReportMapItem | null;
  onSelectReport: (report: ReportMapItem) => void;
};

export default function AdminReportsMap({
  reports,
  selectedReport,
  onSelectReport,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  const defaultRegion: Region = useMemo(() => {
    if (selectedReport) {
      return {
        latitude: selectedReport.latitude,
        longitude: selectedReport.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    if (reports.length > 0) {
      return {
        latitude: reports[0].latitude,
        longitude: reports[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return {
      latitude: 14.676,
      longitude: 121.043,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [reports, selectedReport]);

  useEffect(() => {
    if (!mapRef.current || !selectedReport) return;

    mapRef.current.animateToRegion(
      {
        latitude: selectedReport.latitude,
        longitude: selectedReport.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  }, [selectedReport]);

  const getMarkerColor = (status: string) => {
    const normalized = status.toLowerCase();

    if (['resolved', 'completed', 'done'].includes(normalized)) return 'green';
    if (['in progress', 'ongoing', 'processing'].includes(normalized)) return 'orange';
    if (['pending', 'new'].includes(normalized)) return 'red';

    return 'violet';
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            title={report.title}
            description={`${report.category} • ${report.status}`}
            pinColor={getMarkerColor(report.status)}
            onPress={() => onSelectReport(report)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 560,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 560,
  },
});