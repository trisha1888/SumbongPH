import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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

const DEFAULT_CENTER = {
  lat: 14.5995,
  lng: 120.9842,
};

export default function ReportLocationPicker({
  value,
  onLocationSelect,
  height = 320,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
      setLoading(false);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');

    const initializeMap = () => {
      if (!window.google || !mapRef.current) return;

      const center = value
        ? { lat: value.latitude, lng: value.longitude }
        : DEFAULT_CENTER;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: value ? 17 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      const geocoder = new window.google.maps.Geocoder();

      mapInstanceRef.current = map;
      geocoderRef.current = geocoder;

      if (value) {
        markerRef.current = new window.google.maps.Marker({
          position: center,
          map,
        });
      }

      map.addListener('click', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
        });

        try {
          const result = await reverseGeocode(lat, lng, geocoder);
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: result,
          });
        } catch (err) {
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: `${lat}, ${lng}`,
          });
        }
      });

      setLoading(false);
    };

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

    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(17);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
    });
  }, [value?.latitude, value?.longitude]);

  const reverseGeocode = (lat: number, lng: number, geocoder: any): Promise<string> => {
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

  if (error) {
    return (
      <View style={[styles.wrapper, { height }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading Google Maps...</Text>
        </View>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
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
    zIndex: 10,
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
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    padding: 16,
  },
});