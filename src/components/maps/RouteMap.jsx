import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DensityLayers from './DensityLayers';
import RouteLine from './RouteLine';
import MapMarkers from './MapMarkers';
import MapLegend from './MapLegend';
import MapControls from './MapControls';
import LayersPanel from './LayersPanel';
import LiveStatusBar from './LiveStatusBar';
import WariTimeline from './WariTimeline';
import EmergencyActions from './EmergencyActions';
import ResourceSummary from './ResourceSummary';

const defaultLayers = {
  crowd: true,
  resources: true,
  medical: true,
  police: true,
  parking: false,
  food: true,
  toilets: false,
  family: false,
  palkhi: true,
  weather: false,
};

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize); };
  }, [map]);
  return null;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function RouteMap({ mode = 'route', className = '' }) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState(defaultLayers);

  const toggleLayer = useCallback((id) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl h-full ${className}`}>
      <WariTimeline />
      <LiveStatusBar />
      <div className="relative flex-1">
        <MapContainer
          center={[18.49, 74.10]}
          zoom={12}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full z-0"
          style={{ minHeight: '300px', height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapResizeHandler />
          {mode !== 'resources' && <DensityLayers activeLayers={activeLayers} />}
          {mode !== 'resources' && <RouteLine />}
          <MapMarkers activeLayers={activeLayers} />
          <MapControls onToggleLayers={() => setLayersOpen((o) => !o)} />
        </MapContainer>
        <LayersPanel
          open={layersOpen}
          onClose={() => setLayersOpen(false)}
          activeLayers={activeLayers}
          onToggleLayer={toggleLayer}
        />
        <MapLegend />
        <EmergencyActions />
        <ResourceSummary />
      </div>
    </div>
  );
}
