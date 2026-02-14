import { useEffect, useRef } from 'react';
import maplibregl, { Marker } from 'maplibre-gl';

type OrderMarker = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  status?: string;
  serviceType?: string;
  lat: number;
  lng: number;
};

interface OrderMapProps {
  markers: OrderMarker[];
}

const mapStyle = (() => {
  const key = import.meta.env.VITE_MAPTILER_KEY;
  // Prefer MapTiler (free tier with generous limits). Fallback to MapLibre demo if no key is set.
  return key
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
    : 'https://demotiles.maplibre.org/style.json';
})();

export function OrderMap({ markers }: OrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [0, 0],
      zoom: 2,
      attributionControl: true,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing markers
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    if (markers.length === 0) {
      map.setCenter([0, 0]);
      map.setZoom(2);
      return;
    }

    const bounds = new maplibregl.LngLatBounds();

    markers.forEach((m) => {
      const marker = new maplibregl.Marker({ color: '#e14171' })
        .setLngLat([m.lng, m.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(`
            <div style="font-family: Inter, sans-serif; min-width: 180px">
              <div style="font-weight:600; color:#111;">${m.customerName || 'Customer'}</div>
              ${m.orderNumber ? `<div style="color:#555; font-size:12px;">Order ${m.orderNumber}</div>` : ''}
              ${m.serviceType ? `<div style="color:#555; font-size:12px; text-transform:capitalize;">${m.serviceType}</div>` : ''}
              ${m.status ? `<div style="margin-top:4px; color:#e14171; font-size:12px; font-weight:600;">${m.status}</div>` : ''}
            </div>
          `)
        )
        .addTo(map);

      markerRefs.current.push(marker);
      bounds.extend([m.lng, m.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 400 });
    }
  }, [markers]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-white/70 backdrop-blur-sm">
          No locations with coordinates yet.
        </div>
      )}
    </div>
  );
}
