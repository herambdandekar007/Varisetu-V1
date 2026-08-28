import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, CheckCircleIcon, TruckIcon, ArrowPathIcon, CameraIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { ambulanceService } from '../../services/ambulanceService';
import { routeAdvisorService } from '../../services/routeAdvisorService';
import { supabase } from '../../services/supabase';
import { cn } from '../../utils/format';
import { createAmbulanceIcon } from '../../components/maps/markerIcons';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MODES = [
  { id: 'AVAILABLE', label: 'Available', emoji: '🟢', tone: 'green' },
  { id: 'ON_DUTY', label: 'On Duty', emoji: '🟡', tone: 'orange' },
  { id: 'EMERGENCY', label: 'Emergency', emoji: '🔴', tone: 'red' },
  { id: 'OFFLINE', label: 'Offline', emoji: '⚫', tone: 'slate' },
];

const APPROVAL_META = {
  pending: { label: 'Pending approval', tone: 'orange' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
};

export default function AmbulanceConsole() {
  const navigate = useNavigate();
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [gpsState, setGpsState] = useState('idle'); // idle | requesting | tracking | denied | unavailable
  const [gpsError, setGpsError] = useState('');

  const [destQuery, setDestQuery] = useState('');
  const [destResults, setDestResults] = useState([]);
  const [destSelected, setDestSelected] = useState(null);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  const watchIdRef = useRef(null);

  // Driver detail editing (owner-only private fields).
  const [editing, setEditing] = useState(false);
  const [det, setDet] = useState({ registrationNumber: '', driverLicense: '', ambulanceType: '', hospitalAffiliation: '', color: '' });
  const [newPhoto, setNewPhoto] = useState(null);
  const [detSaving, setDetSaving] = useState(false);

  const beginEdit = () => {
    setDet({
      registrationNumber: ambulance?.registration_number || '',
      driverLicense: ambulance?.driver_license || '',
      ambulanceType: ambulance?.ambulance_type || 'BLS',
      hospitalAffiliation: ambulance?.hospital_affiliation || '',
      color: ambulance?.color || 'white',
    });
    setNewPhoto(null);
    setEditing(true);
  };

  const saveDetails = async () => {
    setDetSaving(true);
    let photoUrl = ambulance?.driver_photo_url || null;
    if (newPhoto) {
      const r = await ambulanceService.setDriverPhoto(newPhoto);
      if (r.error) { toast.error(r.error); setDetSaving(false); return; }
      photoUrl = r.data.driverPhotoUrl;
    }
    const { error } = await ambulanceService.updateRegistrationDetails({
      registration_number: det.registrationNumber.trim() || null,
      driver_license: det.driverLicense.trim() || null,
      ambulance_type: det.ambulanceType,
      hospital_affiliation: det.hospitalAffiliation.trim() || null,
      color: det.color,
      driver_photo_url: photoUrl,
    });
    setDetSaving(false);
    if (error) { toast.error(error); return; }
    toast.success('Ambulance details updated.');
    setNewPhoto(null);
    setEditing(false);
    loadOwn();
  };

  const handleRemovePhoto = async () => {
    const r = await ambulanceService.setDriverPhoto(null);
    if (r.error) { toast.error(r.error); return; }
    toast.success('Driver photo removed.');
    if (editing) setNewPhoto(null);
    loadOwn();
  };

  const loadOwn = useCallback(async () => {
    const own = await ambulanceService.getOwn();
    setAmbulance(own);
    setLoading(false);
    if (own?.destination_hospital) {
      setDestSelected(own.destination_hospital);
      setDestQuery(own.destination_hospital.name || '');
    }
  }, []);

  useEffect(() => {
    loadOwn();
  }, [loadOwn]);

  // Subscribe to realtime updates of our own ambulance so the console stays live.
  useEffect(() => {
    if (!ambulance?.id) return;
    const channel = supabaseChannel(ambulance.id, loadOwn);
    return () => channel?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambulance?.id]);

  // Stop geolocation on unmount.
  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const handleSetStatus = async (status) => {
    if (!ambulance) return;
    if (status === 'EMERGENCY' && !ambulance.destination_hospital) {
      toast.error('Select a destination hospital before starting an emergency.');
      return;
    }
    if (status === 'EMERGENCY') {
      // Start live tracking.
      startTracking();
    } else if (ambulance.status === 'EMERGENCY' && status !== 'EMERGENCY') {
      // Ending emergency without "securely reached" — just switch mode.
      await ambulanceService.resolveEmergency({ nextStatus: status });
      stopTracking();
      toast.success('Emergency ended. Status set to ' + MODES.find((m) => m.id === status)?.label);
      loadOwn();
      return;
    }
    const { error } = await ambulanceService.setStatus(status);
    if (error) { toast.error(error); return; }
    if (status === 'EMERGENCY') {
      toast('🚨 Emergency started. Location tracking enabled.', { icon: '🚨' });
    } else {
      toast.success('Status set to ' + MODES.find((m) => m.id === status)?.label);
    }
    loadOwn();
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsState('unavailable'); setGpsError('GPS not supported by this browser.');
      return;
    }
    setGpsState('requesting');
    setGpsError('');
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsState('tracking');
        setTracking(true);
        await ambulanceService.updateLocation({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) { setGpsState('denied'); setGpsError('Location permission denied. Enable GPS to track the ambulance.'); }
        else { setGpsState('unavailable'); setGpsError('Could not obtain your location.'); }
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    setGpsState('idle');
  };

  // Destination hospital search via Nominatim (reuse routeAdvisorService).
  const handleDestSearch = useCallback(async (q) => {
    setDestQuery(q);
    if (q.length < 3) { setDestResults([]); return; }
    setDestLoading(true);
    const results = await routeAdvisorService.geocode(q);
    setDestResults(results);
    setDestLoading(false);
    setShowDestDropdown(true);
  }, []);

  const handleSelectDestination = async (r) => {
    setDestSelected(r);
    setDestQuery(r.name.split(',')[0]);
    setShowDestDropdown(false);
    setDestResults([]);
    setDestLoading(true);
    const { error } = await ambulanceService.setDestinationHospital({
      name: r.name.split(',')[0],
      lat: r.lat,
      lng: r.lng,
    });
    setDestLoading(false);
    if (error) { toast.error(error); return; }
    toast.success('Destination hospital set. Route computed.');
    loadOwn();
  };

  // Compute proximity targets & create alerts for users ahead of the ambulance.
  const computeAndRecordTargets = async () => {
    // Always use the freshest location from the DB, not stale React state.
    const fresh = await ambulanceService.getOwn();
    if (!fresh?.current_location) return;
    const { lat, lng } = fresh.current_location;
    const targets = await ambulanceService.computeProximityTargets({
      lat,
      lng,
      trail: Array.isArray(fresh.route_trail) ? fresh.route_trail : [],
      radiusM: 400,
      limit: 50,
    });
    if (targets.length) {
      const { count, error } = await ambulanceService.createAlerts({
        userIds: targets.map((t) => t.userId),
        distanceM: targets[0]?.distanceM || 0,
      });
      if (error) console.warn('[AmbulanceConsole] alert create error:', error);
      else if (count) console.info(`[AmbulanceConsole] Targeted ${count} new users near route.`);
    }
  };

  const approval = APPROVAL_META[ambulance?.approval_status] || APPROVAL_META.pending;
  const isApproved = ambulance?.approval_status === 'approved';
  const isEmergency = ambulance?.status === 'EMERGENCY';

  // Periodically re-compute targeted alerts while an emergency is active.
  useEffect(() => {
    if (!isEmergency) return;
    computeAndRecordTargets();
    const t = setInterval(computeAndRecordTargets, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmergency]);

  const handleResolveReached = async () => {
    if (!window.confirm('Mark this ambulance as SECURELY REACHED the hospital?')) return;
    stopTracking();
    await ambulanceService.resolveEmergency({ nextStatus: 'ON_DUTY' });
    toast.success('✅ Ambulance safely reached — Thank you for giving the path.');
    loadOwn();
  };

  if (loading) {
    return (
      <div className="surface flex flex-col items-center py-24 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading your ambulance...</p>
      </div>
    );
  }

  if (!ambulance) {
    return (
      <div className="surface flex flex-col items-center py-20 text-center">
        <TruckIcon className="h-14 w-14 text-slate-300" />
        <p className="mt-4 text-lg font-bold text-ink">No ambulance registered for this account</p>
        <p className="mt-1 text-sm text-slate-500">Register your ambulance to use the driver console.</p>
        <Button className="mt-6" onClick={() => navigate('/ambulance/register')}>Register Ambulance</Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Ambulance Driver Console"
        title="Ambulance Console"
        description="Control your status, destination, and emergency routing."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ambulance ID</p>
          <p className="text-base font-bold text-ink">{ambulance.ambulance_id}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Color</p>
          <p className="text-base font-bold text-ink capitalize">
            <span className="mr-1.5 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: ambulance.color || '#D32F2F' }} />
            {ambulance.color || 'white'}
          </p>
        </div>
        <Badge tone={approval.tone} dot>{approval.label}</Badge>
        <Badge tone={isEmergency ? 'red' : ambulance.status === 'AVAILABLE' ? 'green' : ambulance.status === 'ON_DUTY' ? 'orange' : 'slate'} dot>
          {isEmergency ? '🔴 Emergency' : MODES.find((m) => m.id === ambulance.status)?.label || ambulance.status}
        </Badge>
      </div>

      {!isApproved && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-bold text-amber-700">Account pending approval</p>
          <p className="mt-1 text-xs text-amber-600">
            Your ambulance will appear to pilgrims only after an admin approves your account.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* Status modes */}
        <section className="surface p-5">
          <p className="eyebrow">Change Status</p>
          <h2 className="text-lg font-bold text-ink">Current Mode</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MODES.map((m) => {
              const active = ambulance.status === m.id;
              return (
                <button
                  key={m.id}
                  disabled={!isApproved && m.id !== 'OFFLINE'}
                  onClick={() => handleSetStatus(m.id)}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition',
                    active
                      ? 'border-saffron bg-saffron/5'
                      : 'border-slate-100 bg-white hover:border-slate-300',
                    !isApproved && m.id !== 'OFFLINE' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-sm font-bold text-ink">{m.label}</span>
                  {active && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-saffron" />}
                </button>
              );
            })}
          </div>

          {/* GPS state */}
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <MapPinIcon className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-xs font-bold text-ink">Live GPS</p>
              <p className="text-[11px] text-slate-500">
                {gpsState === 'tracking' ? 'Tracking active — updating location' :
                 gpsState === 'requesting' ? 'Requesting device location...' :
                 gpsState === 'denied' ? gpsError :
                 gpsState === 'unavailable' ? gpsError || 'Location unavailable' :
                 isEmergency ? 'Emergency active — tracking will begin on GPS fix' : 'Idle'}
              </p>
            </div>
            {isEmergency && !tracking && (
              <Button variant="outline" icon={ArrowPathIcon} onClick={() => { startTracking(); toast.success('GPS tracking started'); }}>
                Start tracking
              </Button>
            )}
            {tracking && (
              <Badge tone="green" dot>Live</Badge>
            )}
          </div>

          {/* Destination hospital */}
          <div className="mt-5">
            <label className="label">Destination Hospital</label>
            <div className="relative mt-2">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-9 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                placeholder="Search a hospital, e.g. Sassoon General Hospital"
                value={destQuery}
                onChange={(e) => handleDestSearch(e.target.value)}
                onFocus={() => setShowDestDropdown(true)}
              />
              <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              {showDestDropdown && (destResults.length > 0 || destLoading) && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {destLoading && <p className="px-3 py-2.5 text-sm text-slate-400">Searching...</p>}
                  {destResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDestination(r)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-ink">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {destSelected && (
              <p className="mt-1.5 text-[11px] font-semibold text-forest">
                {destSelected.name.split(',').slice(0, 2).join(',')}
              </p>
            )}
            {ambulance.etas?.distanceKm != null && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-emerald-50 p-4 text-center">
                <div>
                  <p className="text-lg font-bold text-forest">{ambulance.etas.distanceKm} km</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">Distance</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-forest">
                    {ambulance.etas.durationMin != null ? `~${ambulance.etas.durationMin} min` : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">ETA</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Emergency control */}
        <section className="surface p-5">
          <p className="eyebrow">Emergency Control</p>
          <h2 className="text-lg font-bold text-ink">Respond to Emergency</h2>

          <div className="mt-4 space-y-4">
            {!isEmergency ? (
              <button
                disabled={!isApproved || !destSelected}
                onClick={() => handleSetStatus('EMERGENCY')}
                className={cn(
                  'flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center transition hover:bg-red-100',
                  (!isApproved || !destSelected) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="text-4xl">🚨</span>
                <span className="text-lg font-bold text-red-700">START EMERGENCY</span>
                <span className="text-xs text-red-500">
                  {!destSelected
                    ? 'Select a destination hospital first'
                    : !isApproved
                      ? 'Awaiting admin approval'
                      : 'Begins live tracking and alerts nearby pilgrims'}
                </span>
              </button>
            ) : (
              <>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                  <p className="animate-pulse text-sm font-bold text-red-700">🚨 EMERGENCY ACTIVE</p>
                  <p className="mt-1 text-xs text-red-500">Live location + alerts are broadcasting to nearby pilgrims.</p>
                </div>
                <button
                  onClick={handleResolveReached}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,140,69,.25)] transition hover:bg-forest-600"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  SECURELY REACHED
                </button>
                <button
                  onClick={() => handleSetStatus('AVAILABLE')}
                  className="w-full rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  End emergency → Available
                </button>
              </>
            )}

            {ambulance.current_location?.lat != null && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Current Location</p>
                <p className="mt-1 text-sm font-bold text-ink">
                  {Number(ambulance.current_location.lat).toFixed(5)}, {Number(ambulance.current_location.lng).toFixed(5)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {ambulance.current_location.updatedAt
                    ? `Updated ${new Date(ambulance.current_location.updatedAt).toLocaleTimeString()}`
                    : ''}
                </p>
              </div>
            )}

            {ambulance.route_trail?.length > 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Route Trail Points</p>
                <p className="mt-1 text-sm font-bold text-ink">{ambulance.route_trail.length} pts recorded</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Ambulance routing map */}
      <section className="surface mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Routing</p>
            <h2 className="text-lg font-bold text-ink">Ambulance Route Map</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={isEmergency ? 'red' : 'slate'} dot>{isEmergency ? '🔴 Live route' : 'Track on emergency'}</Badge>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <ConsoleRouteMap
            current={ambulance.current_location}
            trail={ambulance.route_trail}
            geometry={ambulance.route_geometry}
            destination={ambulance.destination_hospital}
            color={ambulance.color}
            ambulanceId={ambulance.ambulance_id}
            isEmergency={isEmergency}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-400">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#D32F2F]" />Ambulance</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-forest" />Destination hospital</span>
          <span><span className="mr-1 inline-block border-t-2 border-dashed border-[#D32F2F] w-5 align-middle" />Route</span>
        </div>
      </section>

      {/* Driver details (owner-only private fields) */}
      <section className="surface mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">My Ambulance</p>
            <h2 className="text-lg font-bold text-ink">Driver & Vehicle Details</h2>
          </div>
          {!editing && (
            <Button variant="outline" icon={PencilIcon} onClick={beginEdit}>Edit details</Button>
          )}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr]">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-3xl">
              {newPhoto ? (
                <img src={URL.createObjectURL(newPhoto)} alt="Driver" className="h-full w-full object-cover" />
              ) : ambulance?.driver_photo_url ? (
                <img src={ambulance.driver_photo_url} alt="Driver" className="h-full w-full object-cover" />
              ) : (
                <TruckIcon className="h-9 w-9 text-slate-300" />
              )}
            </div>
            {editing ? (
              <div className="flex flex-col items-center gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                  <CameraIcon className="h-3.5 w-3.5" />
                  {newPhoto ? 'Choose another' : 'Upload photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setNewPhoto(f);
                  }} />
                </label>
                {(ambulance?.driver_photo_url || newPhoto) && (
                  <button onClick={handleRemovePhoto} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50">
                    <TrashIcon className="h-3.5 w-3.5" /> Remove photo
                  </button>
                )}
              </div>
            ) : ambulance?.driver_photo_url ? (
              <button onClick={handleRemovePhoto} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline">
                <TrashIcon className="h-3.5 w-3.5" /> Remove photo
              </button>
            ) : null}
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ambulance ID" value={ambulance.ambulance_id} />
            <Field label="Driver Name" value={ambulance.driver_name} />
            {editing ? (
              <>
                <EditableField label="Registration Number" value={det.registrationNumber} onChange={(v) => setDet((s) => ({ ...s, registrationNumber: v }))} />
                <EditableField label="Driver License" value={det.driverLicense} onChange={(v) => setDet((s) => ({ ...s, driverLicense: v }))} />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ambulance Type</p>
                  <select value={det.ambulanceType} onChange={(e) => setDet((s) => ({ ...s, ambulanceType: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-200">
                    <option value="BLS">BLS</option><option value="ALS">ALS</option><option value="Van">Van</option><option value="Oxygen">Oxygen</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Color</p>
                  <select value={det.color} onChange={(e) => setDet((s) => ({ ...s, color: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-200">
                    <option value="white">White</option><option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option><option value="yellow">Yellow</option><option value="orange">Orange</option>
                  </select>
                </div>
                <EditableField label="Hospital / Org" value={det.hospitalAffiliation} onChange={(v) => setDet((s) => ({ ...s, hospitalAffiliation: v }))} />
              </>
            ) : (
              <>
                <Field label="Registration Number" value={ambulance.registration_number} />
                <Field label="Driver License" value={ambulance.driver_license} />
                <Field label="Ambulance Type" value={ambulance.ambulance_type || '—'} />
                <Field label="Color" value={ambulance.color || 'white'} />
                <Field label="Hospital / Org" value={ambulance.hospital_affiliation || '—'} />
              </>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-5 flex items-center gap-3 border-t pt-4">
            <Button icon={CheckIcon} onClick={saveDetails} disabled={detSaving}>
              {detSaving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setNewPhoto(null); }}>Cancel</Button>
          </div>
        )}
      </section>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">{value || '—'}</p>
    </div>
  );
}

function EditableField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200"
      />
    </div>
  );
}

// Self-contained routing map for the driver console (uses only public fields).
function ConsoleRouteMap({ current, trail, geometry, destination, color, ambulanceId, isEmergency }) {
  const loc = current && current.lat != null ? current : null;
  if (!loc) {
    return <div className="grid h-72 place-items-center bg-slate-50 text-center">
      <div className="px-6">
        <MapPinIcon className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 text-sm font-bold text-slate-500">No live position yet</p>
        <p className="mt-1 text-xs text-slate-400">Start an emergency (or tap "Start tracking") to see your route here.</p>
      </div>
    </div>;
  }

  const pts = (geometry && geometry.length ? geometry : trail || []).map((p) => [Number(p.lat), Number(p.lng)]);

  return (
    <MapContainer
      center={[Number(loc.lat), Number(loc.lng)]}
      zoom={15}
      style={{ height: 320, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pts.length >= 2 && (
        <Polyline positions={pts} pathOptions={{ color: color || '#D32F2F', weight: 4, opacity: 0.9, dashArray: '8 6' }} />
      )}
      {destination?.lat != null && (
        <Marker position={[Number(destination.lat), Number(destination.lng)]}>
          <Popup><span className="text-xs font-bold">🏥 {destination.name}</span></Popup>
        </Marker>
      )}
      <Marker
        position={[Number(loc.lat), Number(loc.lng)]}
        icon={createAmbulanceIcon(color, isEmergency)}
        zIndexOffset={2000}
      >
        <Popup>
          <span className="text-xs font-bold">🚑 {ambulanceId} {isEmergency ? '· 🔴 EMERGENCY' : ''}</span>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

// Helper: subscribe to realtime update on our own ambulance row (refreshes console).
function supabaseChannel(ambulanceId, onChange) {
  let channel = null;
  try {
    channel = supabase
      .channel(`realtime:own:ambulance:${ambulanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ambulances', filter: `id=eq.${ambulanceId}` },
        () => { onChange(); },
      )
      .subscribe();
  } catch (err) { console.error('[AmbulanceConsole] realtime error:', err); }
  return channel;
}
