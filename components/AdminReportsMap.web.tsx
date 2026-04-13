import { useEffect, useRef } from 'react';

type ReportMapItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt?: any;
};

type Props = {
  reports?: ReportMapItem[];
  selectedReport?: ReportMapItem | null;
  onSelectReport?: (report: ReportMapItem) => void;
};

declare global {
  interface Window {
    google: any;
  }
}

export default function AdminReportsMap({
  reports = [],
  selectedReport = null,
  onSelectReport,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();

    if (['resolved', 'completed', 'done'].includes(normalized)) return '#22C55E';
    if (['in progress', 'ongoing', 'processing'].includes(normalized)) return '#FF6B00';
    if (['pending', 'new'].includes(normalized)) return '#3B82F6';

    return '#9CA3AF';
  };

  const createMarkerIcon = (color: string, isSelected: boolean = false) => {
    const scale = isSelected ? 12 : 10;

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      scale,
    };
  };

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const center = selectedReport
        ? {
            lat: selectedReport.latitude,
            lng: selectedReport.longitude,
          }
        : reports.length > 0
        ? {
            lat: reports[0].latitude,
            lng: reports[0].longitude,
          }
        : {
            lat: 14.5995,
            lng: 120.9842,
          };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: selectedReport ? 15 : reports.length > 0 ? 13 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      renderMarkers();
    };

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, selectedReport]);

  const renderMarkers = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    reports.forEach((report) => {
      const isSelected = selectedReport?.id === report.id;
      const pinColor = getStatusColor(report.status);

      const marker = new window.google.maps.Marker({
        position: {
          lat: report.latitude,
          lng: report.longitude,
        },
        map: mapInstanceRef.current,
        title: report.title,
        icon: createMarkerIcon(pinColor, isSelected),
      });

      const popupContent = `
        <div style="min-width: 200px; font-family: Arial, sans-serif;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">
            ${report.title}
          </div>
          <div style="margin-bottom: 4px;"><strong>Category:</strong> ${report.category}</div>
          <div style="margin-bottom: 4px;"><strong>Status:</strong> ${report.status}</div>
          <div style="margin-bottom: 8px;"><strong>Address:</strong> ${report.address}</div>
          <button
            id="select-report-${report.id}"
            style="
              padding: 8px 12px;
              border: none;
              border-radius: 8px;
              background: ${pinColor};
              color: white;
              font-weight: 600;
              cursor: pointer;
            "
          >
            Select report
          </button>
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(popupContent);
          infoWindowRef.current.open({
            anchor: marker,
            map: mapInstanceRef.current,
          });

          window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
            const button = document.getElementById(`select-report-${report.id}`);
            if (button) {
              button.addEventListener('click', () => {
                onSelectReport?.(report);
              });
            }
          });
        }

        onSelectReport?.(report);
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (selectedReport) {
      mapInstanceRef.current.panTo({
        lat: selectedReport.latitude,
        lng: selectedReport.longitude,
      });
      mapInstanceRef.current.setZoom(15);
    } else if (reports.length > 1) {
      mapInstanceRef.current.fitBounds(bounds);
    } else if (reports.length === 1) {
      mapInstanceRef.current.setCenter({
        lat: reports[0].latitude,
        lng: reports[0].longitude,
      });
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div
      ref={mapRef}
      style={{
        height: '560px',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
      }}
    />
  );
}