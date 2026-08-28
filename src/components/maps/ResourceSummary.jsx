import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import { campService } from '../../services/campService';
import { routeAdvisorService } from '../../services/routeAdvisorService';
import toast from 'react-hot-toast';

const RESOURCE_CATEGORIES = [
  { id: 'water', label: 'Water', emoji: '🚰', dbType: 'WATER', color: '#1976D2' },
  { id: 'medical', label: 'Medical', emoji: '🏥', dbType: 'MEDICAL', color: '#E53935' },
  { id: 'food', label: 'Food', emoji: '🍛', dbType: 'FOOD', color: '#F9A825' },
  { id: 'toilet', label: 'Toilet', emoji: '🚻', dbType: 'TOILET', color: '#78909C' },
];

function toRad(d) { return (d * Math.PI) / 180; }
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ResourceSummary() {
  const { pilgrimLocation } = useApp();
  const [resourcesByCategory, setResourcesByCategory] = useState({});
  const [selectedResource, setSelectedResource] = useState(null);
  const [routeToResource, setRouteToResource] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = {};
      for (const cat of RESOURCE_CATEGORIES) {
        const items = await campService.listByCategory(cat.dbType);
        if (cancelled) return;
        const withCoords = items
          .filter((r) => r.latitude != null && r.longitude != null)
          .map((r) => ({
            ...r,
            _distance: pilgrimLocation?.latitude
              ? haversine(pilgrimLocation.latitude, pilgrimLocation.longitude, r.latitude, r.longitude)
              : Infinity,
          }))
          .sort((a, b) => a._distance - b._distance);
        results[cat.id] = withCoords[0] || null;
      }
      if (!cancelled) setResourcesByCategory(results);
    }
    load();
    const unsub = campService.subscribe(() => load());
    return () => { cancelled = true; unsub(); };
  }, [pilgrimLocation?.latitude, pilgrimLocation?.longitude]);

  const formatDistance = useCallback((km) => {
    if (km == null || km === Infinity) return '';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }, []);

  const handleResourceClick = useCallback(async (cat, resource) => {
    if (!resource) return;
    setSelectedResource({ ...resource, category: cat });
    setRouteToResource(null);

    if (pilgrimLocation?.latitude && resource.latitude) {
      const result = await routeAdvisorService.quickRoute(
        [pilgrimLocation.latitude, pilgrimLocation.longitude],
        [resource.latitude, resource.longitude],
      );
      if (result && !result.error) {
        setRouteToResource(result);
      }
    }
  }, [pilgrimLocation]);

  const handleCall = useCallback((contact) => {
    if (contact) {
      window.location.href = `tel:${contact}`;
    } else {
      toast.error('No contact number available');
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedResource(null);
    setRouteToResource(null);
  }, []);

  return (
    <>
      <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-2">
        {RESOURCE_CATEGORIES.map((cat, i) => {
          const resource = resourcesByCategory[cat.id];
          if (!resource) return null;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleResourceClick(cat, resource)}
              className="flex items-center gap-3 rounded-xl bg-white/95 p-2.5 shadow-lg backdrop-blur border border-slate-100 min-w-[170px] text-left transition hover:shadow-xl hover:border-slate-200 active:scale-[0.98]"
            >
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white text-sm"
                style={{ background: cat.color }}
              >
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-ink">{cat.label}</p>
                  <span className="text-[10px] text-slate-400">
                    {formatDistance(resource._distance)}
                  </span>
                </div>
                <p className="truncate text-[10px] text-slate-500">{resource.name}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedResource && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[600] bg-black/20 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 left-4 right-4 z-[601] max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-float"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white text-lg"
                    style={{ background: selectedResource.category.color }}
                  >
                    {selectedResource.category.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{selectedResource.name}</p>
                    <p className="text-[11px] text-slate-500">{selectedResource.area || selectedResource.zone_name}</p>
                  </div>
                </div>
                <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {selectedResource.stock_liters != null && (
                  <div className="rounded-xl bg-blue-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-blue-700">{selectedResource.stock_liters}</p>
                    <p className="text-[10px] text-blue-500">Stock (L)</p>
                  </div>
                )}
                {selectedResource.beds_available != null && (
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-emerald-700">{selectedResource.beds_available}</p>
                    <p className="text-[10px] text-emerald-500">Beds free</p>
                  </div>
                )}
                {selectedResource.waiting_count != null && (
                  <div className="rounded-xl bg-amber-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-amber-700">{selectedResource.waiting_count}</p>
                    <p className="text-[10px] text-amber-500">Waiting</p>
                  </div>
                )}
                {selectedResource.meals_remaining != null && (
                  <div className="rounded-xl bg-orange-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-orange-700">{selectedResource.meals_remaining}</p>
                    <p className="text-[10px] text-orange-500">Meals left</p>
                  </div>
                )}
                {selectedResource.ambulance_available != null && (
                  <div className="rounded-xl bg-red-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-red-700">{selectedResource.ambulance_available}</p>
                    <p className="text-[10px] text-red-500">Ambulances</p>
                  </div>
                )}
                {selectedResource.stock_pct != null && (
                  <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                    <p className="text-sm font-bold text-slate-700">{selectedResource.stock_pct}%</p>
                    <p className="text-[10px] text-slate-500">Stock level</p>
                  </div>
                )}
              </div>

              {routeToResource && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                  <p className="text-[11px] font-bold text-emerald-700">Walking route</p>
                  <p className="mt-1 text-xs text-emerald-600">
                    {routeToResource.distanceKm} km · ~{routeToResource.durationMin} min
                  </p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {selectedResource.contact && (
                  <button
                    onClick={() => handleCall(selectedResource.contact)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Call
                  </button>
                )}
                {selectedResource.latitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedResource.latitude}&mlon=${selectedResource.longitude}#map=16/${selectedResource.latitude}/${selectedResource.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Open in map
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
