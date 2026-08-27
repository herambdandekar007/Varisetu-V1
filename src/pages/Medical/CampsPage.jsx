import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { BuildingOffice2Icon, PhoneIcon, MapPinIcon, XMarkIcon, UserGroupIcon, BoltIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { cn } from '../../utils/format';

const statusTone = (s) => {
  if (s === 'OPEN' || s === 'SERVING') return 'green';
  if (s === 'LOW_STOCK') return 'orange';
  if (s === 'CLOSED' || s === 'MAINTENANCE') return 'slate';
  return 'slate';
};

const invTone = (s) => (s === 'OUT' ? 'red' : s === 'LOW' ? 'orange' : 'green');

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CampsPage() {
  const { t } = useTranslation();
  const { camps, campInventory, pilgrimLocation } = useApp();
  const [selectedCamp, setSelectedCamp] = useState(null);

  const medicalCamps = useMemo(() => camps.filter((c) => c.type === 'MEDICAL' || c.type === 'CAMP'), [camps]);

  const inventoryByCamp = useMemo(() => {
    const map = {};
    for (const item of campInventory || []) {
      if (!map[item.resource_id]) map[item.resource_id] = [];
      map[item.resource_id].push(item);
    }
    return map;
  }, [campInventory]);

  const lowStockCount = useMemo(() => (campInventory || []).filter((i) => i.status !== 'OK').length, [campInventory]);

  const distanceToCamp = (camp) => {
    if (!pilgrimLocation?.latitude || !pilgrimLocation?.longitude || !camp.latitude || !camp.longitude) return null;
    return haversineKm(pilgrimLocation.latitude, pilgrimLocation.longitude, Number(camp.latitude), Number(camp.longitude));
  };

  const handleCall = (e, camp) => {
    e.stopPropagation();
    const phone = camp.contact || '108';
    window.open(`tel:${phone}`, '_self');
    toast.success(`Calling ${camp.name} at ${phone}...`);
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Medical Camps', 'Medical Camps')}
        description={t('Overview of all medical camps on the route.', 'Overview of all medical camps on the route.')}
      />
      {lowStockCount > 0 && (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <span className="font-bold">{lowStockCount}</span> inventory item{lowStockCount !== 1 ? 's' : ''} at or below low stock — flagged for resupply.
        </div>
      )}
      {medicalCamps.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <BuildingOffice2Icon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medical camps found', 'No medical camps found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No medical or camp resources are registered.', 'No medical or camp resources are registered.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medicalCamps.map((camp) => {
            const items = (inventoryByCamp[camp.id] || []).filter((i) => i.category !== 'CAMP');
            const dist = distanceToCamp(camp);
            return (
              <button
                key={camp.id}
                onClick={() => setSelectedCamp(camp)}
                className="surface p-5 text-left transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50"><BuildingOffice2Icon className="h-5 w-5 text-red-500" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink truncate">{camp.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(camp.status)}>{camp.status}</Badge>
                      {dist != null && (
                        <span className="text-[11px] text-slate-400">{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`} away</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-1"><MapPinIcon className="h-3 w-3" />{camp.zone_name}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-ink">{camp.beds_available ?? 0}/{camp.beds_total ?? 0}</p>
                    <p className="label">{t('Beds', 'Beds')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink">{camp.doctors ?? 0}</p>
                    <p className="label">{t('Doctors', 'Doctors')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink">{camp.beds_total ? Math.round(((camp.beds_total - (camp.beds_available ?? 0)) / camp.beds_total) * 100) : 0}%</p>
                    <p className="label">{t('Occupied', 'Occupied')}</p>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="mt-3 border-t border-dashed border-slate-100 pt-3">
                    <div className="space-y-1.5">
                      {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 truncate text-slate-600">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.status === 'OUT' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            <span className="truncate">{item.item_name}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className="font-semibold text-ink">{Number(item.quantity ?? 0).toLocaleString()} {item.unit}</span>
                            <Badge tone={invTone(item.status)}>{item.status}</Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={(e) => handleCall(e, camp)}
                    className="flex h-8 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {camp.contact || '108'}
                  </button>
                  {dist != null && (
                    <span className="flex h-8 items-center gap-1 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Camp detail modal */}
      {selectedCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCamp(null)}>
          <div className="mx-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50"><BuildingOffice2Icon className="h-6 w-6 text-red-500" /></div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{selectedCamp.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(selectedCamp.status)}>{selectedCamp.status}</Badge>
                    <span className="text-xs text-slate-400">{selectedCamp.zone_name}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCamp(null)} className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-ink">{selectedCamp.beds_available ?? 0}<span className="text-base text-slate-400">/{selectedCamp.beds_total ?? 0}</span></p>
                <p className="label mt-1">Beds Free</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-ink">{selectedCamp.doctors ?? 0}</p>
                <p className="label mt-1">Doctors</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-ink">{selectedCamp.queue ?? 0}</p>
                <p className="label mt-1">In Queue</p>
              </div>
            </div>

            {selectedCamp.latitude && selectedCamp.longitude && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <MapPinIcon className="h-4 w-4 text-slate-400" />
                <span>{Number(selectedCamp.latitude).toFixed(4)}, {Number(selectedCamp.longitude).toFixed(4)}</span>
                {distanceToCamp(selectedCamp) != null && (
                  <span className="ml-auto font-bold text-ink">{distanceToCamp(selectedCamp) < 1 ? `${Math.round(distanceToCamp(selectedCamp) * 1000)}m` : `${distanceToCamp(selectedCamp).toFixed(1)} km`} away</span>
                )}
              </div>
            )}

            {(() => {
              const items = (inventoryByCamp[selectedCamp.id] || []).filter((i) => i.category !== 'CAMP');
              if (!items.length) return null;
              return (
                <div className="mt-4">
                  <p className="label mb-2">Inventory</p>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 truncate text-slate-600">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.status === 'OUT' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                          <span className="truncate">{item.item_name}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="font-semibold text-ink">{Number(item.quantity ?? 0).toLocaleString()} {item.unit}</span>
                          <Badge tone={invTone(item.status)}>{item.status}</Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  const phone = selectedCamp.contact || '108';
                  window.open(`tel:${phone}`, '_self');
                  toast.success(`Calling ${selectedCamp.name} at ${phone}...`);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <PhoneIcon className="h-4 w-4" />
                Call {selectedCamp.contact || '108'}
              </button>
              <button
                onClick={() => setSelectedCamp(null)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
