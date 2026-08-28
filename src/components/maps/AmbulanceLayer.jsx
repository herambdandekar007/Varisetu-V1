import { useEffect, useState } from 'react';
import { Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { createAmbulanceIcon } from './markerIcons';
import { ambulanceService } from '../../services/ambulanceService';

// Ambulance overlay for the live crowd map.
// - Shows a marker for every APPROVED ambulance that has a location & is not OFFLINE.
// - Draws the hospital route polyline + soft alert-corridor when in EMERGENCY.
// - Only public fields are displayed (ambulance_id, color, status, location).
export default function AmbulanceLayer() {
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    return ambulanceService.subscribe((list) => {
      setAmbulances(Array.isArray(list) ? list : []);
    });
  }, []);

  if (!ambulances.length) return null;

  return (
    <>
      {ambulances.map((a) => {
        const loc = a.current_location;
        if (!loc || loc.lat == null || loc.lng == null) return null;
        if (a.status === 'OFFLINE') return null;
        const isEmergency = a.status === 'EMERGENCY';
        const trail = Array.isArray(a.route_trail) ? a.route_trail : [];
        const geometry = Array.isArray(a.route_geometry) && a.route_geometry.length
          ? a.route_geometry
          : trail.slice(-20).map((p) => [p.lat, p.lng]);

        return (
          <div key={a.id}>
            <Marker
              position={[Number(loc.lat), Number(loc.lng)]}
              icon={createAmbulanceIcon(a.color, isEmergency)}
              zIndexOffset={isEmergency ? 2000 : 500}
            >
              <Popup>
                <div className="wari-popup min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚑</span>
                    <div>
                      <p className="text-sm font-bold text-ink">{a.ambulance_id}</p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {isEmergency ? '🟢 · Emergency' : String(a.status || '').toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {isEmergency && a.destination_hospital?.name && (
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-bold">Destination:</span> {a.destination_hospital.name}
                    </p>
                  )}
                  {a.etas?.distanceKm != null && (
                    <p className="mt-1 text-xs text-slate-600">
                      <span className="font-bold">ETA:</span> {a.etas.distanceKm} km
                      {a.etas.durationMin != null ? ` · ~${a.etas.durationMin} min` : ''}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            {isEmergency && geometry.length >= 2 && (
              <>
                {/* Hospital route polyline */}
                <Polyline
                  positions={geometry}
                  pathOptions={{
                    color: a.color || '#D32F2F',
                    weight: 4,
                    opacity: 0.9,
                    dashArray: '8 6',
                  }}
                />
                {/* Alert corridor: soft translucent buffer around the route */}
                <Polyline
                  positions={geometry}
                  pathOptions={{
                    color: 'rgba(220,38,38,0.12)',
                    weight: 18,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                {loc && (
                  <Circle
                    center={[Number(loc.lat), Number(loc.lng)]}
                    radius={400}
                    pathOptions={{ color: 'rgba(220,38,38,0.28)', fillColor: 'rgba(220,38,38,0.10)', fillOpacity: 0.35 }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
