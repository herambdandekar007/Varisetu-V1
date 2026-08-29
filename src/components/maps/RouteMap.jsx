// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, CircleMarker, Popup } from 'react-leaflet';
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
import AmbulanceLayer from './AmbulanceLayer';
import { createPilgrimIcon, createFamilyMemberIcon } from './markerIcons';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

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
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

function FlyToLocation({ position }) {
  const map = useMap();
  const prevRef = useState({ lat: null, lng: null })[0];
  useEffect(() => {
    if (!position?.[0] || !position?.[1]) return;
    if (prevRef.lat === null) {
      map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 1.2 });
    } else {
      const dist = Math.sqrt(
        (position[0] - prevRef.lat) ** 2 + (position[1] - prevRef.lng) ** 2,
      );
      if (dist > 0.0005) {
        map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.8 });
      }
    }
    prevRef.lat = position[0];
    prevRef.lng = position[1];
  }, [position?.[0], position?.[1]]);
  return null;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function PilgrimArrow({ position, heading, isSimulated }) {
  if (!position) return null;
  return (
    <Marker
      position={position}
      icon={createPilgrimIcon(isSimulated)}
      zIndexOffset={1000}
    />
  );
}

const FAMILY_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

function FamilyMarkers({ members }) {
  const { t } = useTranslation();
  if (!members?.length) return null;
  return members.map((m, i) => (
    <Marker
      key={m.id}
      position={[m.lat, m.lng]}
      icon={createFamilyMemberIcon(FAMILY_COLORS[i % FAMILY_COLORS.length])}
    >
      <Popup>
        <div className="text-center">
          <p className="text-sm font-bold text-ink">{m.name}</p>
          <p className="text-[11px] text-slate-500">
            {m.separated ? t('map.separated') : t('map.withYou')}
          </p>
        </div>
      </Popup>
    </Marker>
  ));
}

export default function RouteMap({ mode = 'route', className = '' }) {
  const { t } = useTranslation();
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState(defaultLayers);
  const { pilgrimLocation, routeData, locationPermission, liveRoute, groupMembers } = useApp();

  const toggleLayer = useCallback((id) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const hasLocation = pilgrimLocation?.latitude && pilgrimLocation?.longitude;
  const isSimulated = pilgrimLocation?.source === 'simulated';
  const isDenied = locationPermission === 'denied' || locationPermission === 'unavailable';

  const center = useMemo(
    () => (hasLocation ? [pilgrimLocation.latitude, pilgrimLocation.longitude] : [18.49, 74.10]),
    [hasLocation, pilgrimLocation?.latitude, pilgrimLocation?.longitude],
  );

  const flyPosition = useMemo(
    () => (hasLocation ? [pilgrimLocation.latitude, pilgrimLocation.longitude] : null),
    [hasLocation, pilgrimLocation?.latitude, pilgrimLocation?.longitude],
  );

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl h-full ${className}`}>
      <WariTimeline />
      <LiveStatusBar />
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          center={center}
          zoom={hasLocation ? 14 : 12}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full z-0"
          style={{ minHeight: '300px', height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapResizeHandler />
          <FlyToLocation position={flyPosition} />
          {mode !== 'resources' && <DensityLayers activeLayers={activeLayers} />}
          {mode !== 'resources' && <RouteLine geometry={liveRoute?.geometry || routeData?.geometry} />}
          <MapMarkers activeLayers={activeLayers} />
          {hasLocation && (
            <PilgrimArrow
              position={[pilgrimLocation.latitude, pilgrimLocation.longitude]}
              heading={pilgrimLocation.headingDeg}
              isSimulated={isSimulated}
            />
          )}
          {activeLayers.family && <FamilyMarkers members={groupMembers} />}
          <AmbulanceLayer />
          <MapControls onToggleLayers={() => setLayersOpen((o) => !o)} />
        </MapContainer>

        {isSimulated && (
          <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {t('map.demoSimulatedLocation')}
          </div>
        )}

        {isDenied && (
          <div className="absolute top-4 left-4 z-[500] max-w-xs rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur border border-slate-200">
            <p className="text-xs font-bold text-ink">{t('map.locationAccessNeeded')}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {t('map.enableGps')}
            </p>
          </div>
        )}

        {(liveRoute || routeData) && (
          <div className="absolute top-4 right-14 bg-emerald-50 rounded-xl shadow-lg p-3 z-[450] max-w-[200px]">
            <h4 className="text-xs font-bold text-ink truncate">{liveRoute ? t('map.liveOsrmRoute') : t('map.liveRoute')}</h4>
            <p className="mt-1 text-sm font-bold text-emerald-700 truncate">
              {t('map.routeDistanceDuration', { distance: liveRoute?.distanceKm || routeData.distanceKm, duration: liveRoute?.durationMin || routeData.durationMin })}
            </p>
            {liveRoute?.steps?.length > 0 && (
              <p className="mt-0.5 text-[10px] text-slate-500 truncate">{t('map.turns', { count: liveRoute.steps.length })}</p>
            )}
          </div>
        )}

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
