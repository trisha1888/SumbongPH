import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

type PickerValue = {
  latitude: number;
  longitude: number;
  address: string;
};

type Props = {
  value?: PickerValue | null;
  onLocationSelect: (value: PickerValue) => void;
  height?: number;
};

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function ReportLocationPicker({
  value,
  onLocationSelect,
  height = 320,
}: Props) {
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo<Region>(() => {
    if (value) {
      return {
        latitude: value.latitude,
        longitude: value.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [value]);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (value && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: value.latitude,
          longitude: value.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [value]);

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setIsResolvingAddress(true);

    try {
      let address = `${latitude}, ${longitude}`;

      if (apiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.results?.length > 0) {
          address = data.results[0].formatted_address;
        }
      }

      onLocationSelect({
        latitude,
        longitude,
        address,
      });
    } catch (error) {
      onLocationSelect({
        latitude,
        longitude,
        address: `${latitude}, ${longitude}`,
      });
    } finally {
      setIsResolvingAddress(false);
    }
  };

  return (
    <View style={[styles.wrapper, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onPress={handleMapPress}
      >
        {value && (
          <Marker
            coordinate={{
              latitude: value.latitude,
              longitude: value.longitude,
            }}
            title="Selected location"
            description={value.address}
          />
        )}
      </MapView>

      {isResolvingAddress && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>Getting address...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
  },
});