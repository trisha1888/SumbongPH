import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const reports = [
  {
    id: '1',
    title: 'Garbage Issue',
    description: 'Trash not collected',
    latitude: 14.5995,
    longitude: 120.9842,
    status: 'Pending',
  },
  {
    id: '2',
    title: 'Flood Area',
    description: 'Water level rising',
    latitude: 14.601,
    longitude: 120.98,
    status: 'Resolved',
  },
];

function getStatusColor(status: string) {
  const s = status.toLowerCase();

  if (s === 'resolved') return 'green';
  if (s === 'in progress') return 'blue';
  if (s === 'under review') return 'orange';
  if (s === 'pending') return 'gray';

  return 'gray';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default function MapsDashboardView() {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 14.5995,
          longitude: 120.9842,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            title={report.title}
            description={report.description}
            pinColor={getStatusColor(report.status)} 
          />
        ))}
      </MapView>
    </View>
  );
}