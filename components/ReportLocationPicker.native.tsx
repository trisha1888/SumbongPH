import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  MapPressEvent,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

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

type LatLng = {
  latitude: number;
  longitude: number;
};

const BARANGAY_MANGGA_POLYGON: LatLng[] = [
  { latitude: 14.627500, longitude: 121.062050 },
  { latitude: 14.627500, longitude: 121.063300 },
  { latitude: 14.624150, longitude: 121.063300 },
  { latitude: 14.624150, longitude: 121.062050 },
];

const DEFAULT_REGION: Region = {
  latitude: 14.625825,
  longitude: 121.062675,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

function isPointInsidePolygon(point: LatLng, polygon: LatLng[]) {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export default function ReportLocationPicker({
  value,
  onLocationSelect,
  height = 320,
}: Props) {
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo<Region>(() => {
    if (
      value &&
      isPointInsidePolygon(
        { latitude: value.latitude, longitude: value.longitude },
        BARANGAY_MANGGA_POLYGON
      )
    ) {
      return {
        latitude: value.latitude,
        longitude: value.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
    }
    return DEFAULT_REGION;
  }, [value]);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.animateToRegion(region, 500);
  }, [region]);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
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

    return address;
  };

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const isAllowed = isPointInsidePolygon(
      { latitude, longitude },
      BARANGAY_MANGGA_POLYGON
    );

    if (!isAllowed) {
      setError('You can only place the pin inside Barangay Mangga.');
      Alert.alert(
        'Outside allowed area',
        'You can only place the pin inside Barangay Mangga.'
      );
      return;
    }

    setError('');
    setIsResolvingAddress(true);

    try {
      const address = await getAddressFromCoords(latitude, longitude);

      onLocationSelect({
        latitude,
        longitude,
        address,
      });
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleUseMyLocation = async () => {
    try {
      setIsGettingCurrentLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = currentLocation.coords.latitude;
      const longitude = currentLocation.coords.longitude;

      const isAllowed = isPointInsidePolygon(
        { latitude, longitude },
        BARANGAY_MANGGA_POLYGON
      );

      if (!isAllowed) {
        setError('You are outside Barangay Mangga.');
        Alert.alert(
          'Outside allowed area',
          'Your current location is outside Barangay Mangga.'
        );
        return;
      }

      const address = await getAddressFromCoords(latitude, longitude);

      onLocationSelect({
        latitude,
        longitude,
        address,
      });

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        500
      );
    } finally {
      setIsGettingCurrentLocation(false);
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
        <Polygon
          coordinates={BARANGAY_MANGGA_POLYGON}
          strokeWidth={2}
          strokeColor="rgba(47,112,233,0.95)"
          fillColor="rgba(47,112,233,0.15)"
        />

        {value &&
          isPointInsidePolygon(
            { latitude: value.latitude, longitude: value.longitude },
            BARANGAY_MANGGA_POLYGON
          ) && (
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

      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleUseMyLocation}
        activeOpacity={0.85}
        disabled={isGettingCurrentLocation}
      >
        {isGettingCurrentLocation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.locationButtonText}>Use My Location</Text>
        )}
      </TouchableOpacity>

      {isResolvingAddress && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>Getting address...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
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

  locationButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#2F70E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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

  errorBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },

  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});