import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

declare global {
  interface Window {
    google: any;
    initGoogleMap?: () => void;
  }
}

const BARANGAY_MANGGA_POLYGON = [
  { lat: 14.627500, lng: 121.062050 },
  { lat: 14.627500, lng: 121.063300 },
  { lat: 14.624150, lng: 121.063300 },
  { lat: 14.624150, lng: 121.062050 },
];

const DEFAULT_CENTER = {
  lat: 14.625825,
  lng: 121.062675,
};

function isPointInsidePolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const reverseGeocode = (
    lat: number,
    lng: number,
    geocoder: any
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error('No address found'));
          }
        }
      );
    });
  };

  const placeMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.google) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
    });
  };

  const fitMapToAllowedArea = () => {
    if (!window.google || !mapInstanceRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();

    BARANGAY_MANGGA_POLYGON.forEach((point) => {
      bounds.extend(point);
    });

    mapInstanceRef.current.fitBounds(bounds, 40);
  };

  const handlePointSelection = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    const isAllowed = isPointInsidePolygon({ lat, lng }, BARANGAY_MANGGA_POLYGON);

    if (!isAllowed) {
      setError('You can only place the pin inside Barangay Mangga.');
      Alert.alert(
        'Outside allowed area',
        'You can only place the pin inside Barangay Mangga.'
      );
      return;
    }

    setError('');
    placeMarker(lat, lng);

    try {
      const address = await reverseGeocode(lat, lng, geocoderRef.current);
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address,
      });
    } catch {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: `${lat}, ${lng}`,
      });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if (!mapInstanceRef.current || !geocoderRef.current) {
      setError('Map is not ready yet.');
      return;
    }

    setError('');
    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const isAllowed = isPointInsidePolygon({ lat, lng }, BARANGAY_MANGGA_POLYGON);

        if (!isAllowed) {
          setError('Your current location is outside Barangay Mangga.');
          setIsGettingLocation(false);
          Alert.alert(
            'Outside allowed area',
            'Your current location is outside Barangay Mangga.'
          );
          return;
        }

        const map = mapInstanceRef.current;
        const geocoder = geocoderRef.current;

        map.setCenter({ lat, lng });
        map.setZoom(18);

        placeMarker(lat, lng);

        try {
          const address = await reverseGeocode(lat, lng, geocoder);

          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address,
          });
        } catch {
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: `${lat}, ${lng}`,
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setError('Failed to get your location. Please allow browser location access.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!apiKey) {
      setError('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
      setLoading(false);
      return;
    }

    const initializeMap = () => {
      if (!window.google || !mapRef.current) return;

      const center =
        value &&
        isPointInsidePolygon(
          { lat: value.latitude, lng: value.longitude },
          BARANGAY_MANGGA_POLYGON
        )
          ? { lat: value.latitude, lng: value.longitude }
          : DEFAULT_CENTER;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 17,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      const geocoder = new window.google.maps.Geocoder();

      mapInstanceRef.current = map;
      geocoderRef.current = geocoder;

      polygonRef.current = new window.google.maps.Polygon({
        paths: BARANGAY_MANGGA_POLYGON,
        strokeColor: '#2F70E9',
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: '#2F70E9',
        fillOpacity: 0.15,
        clickable: false,
      });

      polygonRef.current.setMap(map);

      fitMapToAllowedArea();

      if (
        value &&
        isPointInsidePolygon(
          { lat: value.latitude, lng: value.longitude },
          BARANGAY_MANGGA_POLYGON
        )
      ) {
        markerRef.current = new window.google.maps.Marker({
          position: { lat: value.latitude, lng: value.longitude },
          map,
        });
        map.setCenter({ lat: value.latitude, lng: value.longitude });
        map.setZoom(18);
      }

      map.addListener('click', async (event: any) => {
        if (!event.latLng) return;
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        await handlePointSelection(lat, lng);
      });

      setLoading(false);
    };

    const existingScript = document.getElementById('google-maps-script');

    if (existingScript) {
      if (window.google) {
        initializeMap();
      } else {
        window.initGoogleMap = initializeMap;
      }
      return;
    }

    window.initGoogleMap = initializeMap;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Failed to load Google Maps script');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (window.initGoogleMap) {
        delete window.initGoogleMap;
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !value) return;

    const position = {
      lat: value.latitude,
      lng: value.longitude,
    };

    if (!isPointInsidePolygon(position, BARANGAY_MANGGA_POLYGON)) {
      return;
    }

    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(18);
    placeMarker(value.latitude, value.longitude);
  }, [value?.latitude, value?.longitude]);

  return (
    <View style={[styles.wrapper, { height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading Google Maps...</Text>
        </View>
      )}

      <View style={styles.topActions}>
        <Pressable
          style={[
            styles.locationButton,
            (loading || isGettingLocation) && styles.locationButtonDisabled,
          ]}
          onPress={handleUseMyLocation}
          disabled={loading || isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.locationButtonText}>Use My Location</Text>
          )}
        </Pressable>
      </View>

      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16 }} />

      {!!error && !loading && (
        <View style={styles.inlineErrorBox}>
          <Text style={styles.inlineErrorText}>{error}</Text>
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
    zIndex: 20,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#374151',
  },
  topActions: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 30,
  },
  locationButton: {
    backgroundColor: '#2F70E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineErrorBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    zIndex: 30,
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});