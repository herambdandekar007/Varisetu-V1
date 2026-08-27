import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BoltIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { cn } from '../../utils/format';
import { useApp } from '../../context/AppContext';

const emergencyContacts = [
  { name: 'Police', number: '112', icon: ShieldCheckIcon, tone: 'bg-blue-500' },
  { name: 'Ambulance', number: '108', icon: HeartIcon, tone: 'bg-red-500' },
  { name: 'Fire', number: '101', icon: ExclamationTriangleIcon, tone: 'bg-orange-500' },
  { name: 'Volunteer Support', number: '1097', icon: UserGroupIcon, tone: 'bg-emerald-500' },
];

const emptyLostForm = {
  name: '', age: '', gender: '', clothingDescription: '',
  contactPhone: '', lastSeenLocation: '', description: '',
};
const emptySightingForm = { location: '', notes: '', reporterName: '', reporterPhone: '' };
const emptyFoundForm = { foundLocation: '', foundNearby: '', foundNotes: '' };

export default function EmergencyPage() {
  const { t } = useTranslation();
  const { createEmergency, pilgrimLocation, crowdSummary, incidents = [], lostFoundService, sightings } = useApp();

  const sosIncidents = useMemo(
    () => incidents.filter((i) => i.type === 'SOS' || i.type === 'EMERGENCY' || i.severity === 'CRITICAL' || i.severity === 'HIGH'),
    [incidents],
  );

  const [activeSection, setActiveSection] = useState('medical');
  const [activeLostTab, setActiveLostTab] = useState('missing');

  // Lost person form state
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostForm, setLostForm] = useState({ ...emptyLostForm });
  const [lostPhotoFile, setLostPhotoFile] = useState(null);
  const [lostPhotoPreview, setLostPhotoPreview] = useState(null);
  const [lostSubmitting, setLostSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const lostFileInputRef = useRef(null);

  // Sighting form state
  const [showSightingForm, setShowSightingForm] = useState(null); // holds incident being sighted
  const [sightingForm, setSightingForm] = useState({ ...emptySightingForm });
  const [sightingSubmitting, setSightingSubmitting] = useState(false);

  // Found form state
  const [showFoundForm, setShowFoundForm] = useState(null); // holds incident to mark found
  const [foundForm, setFoundForm] = useState({ ...emptyFoundForm });
  const [foundSubmitting, setFoundSubmitting] = useState(false);

  // Report found person (new person found by someone)
  const [showReportFoundForm, setShowReportFoundForm] = useState(false);

  const [lostPeople, setLostPeople] = useState([]);
  const [foundPeople, setFoundPeople] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Sighting counts per incident
  const sightingCounts = useMemo(() => {
    const counts = {};
    for (const s of sightings || []) {
      counts[s.incident_id] = (counts[s.incident_id] || 0) + 1;
    }
    return counts;
  }, [sightings]);

  // Fetch lost & found from database on mount and when section active
  useEffect(() => {
    if (activeSection !== 'lost' && activeSection !== 'found') return;
    let cancelled = false;
    async function fetch() {
      setLoadingLists(true);
      const [lost, found] = await Promise.all([
        lostFoundService?.listLost() || [],
        lostFoundService?.listFound() || [],
      ]);
      if (!cancelled) {
        setLostPeople(lost);
        setFoundPeople(found);
        setLoadingLists(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [activeSection, lostFoundService, sightings]);

  // Duplicate name check on form name change
  useEffect(() => {
    if (!lostForm.name.trim() || lostForm.name.trim().length < 2) {
      setDuplicateWarning('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const isDup = await lostFoundService?.checkDuplicate(lostForm.name);
      if (!cancelled) {
        setDuplicateWarning(isDup ? 'A report for this person already exists. Please check the list.' : '');
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [lostForm.name, lostFoundService]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5 MB.');
      return;
    }
    setLostPhotoFile(file);
    const url = URL.createObjectURL(file);
    setLostPhotoPreview(url);
  };

  const clearLostForm = () => {
    setLostForm({ ...emptyLostForm });
    setLostPhotoFile(null);
    setLostPhotoPreview(null);
    setDuplicateWarning('');
    if (lostFileInputRef.current) lostFileInputRef.current.value = '';
  };

  // Submit lost person report
  const handleLostSubmit = async (e) => {
    e.preventDefault();
    if (!lostForm.name.trim()) { toast.error('Person name is required.'); return; }
    if (!lostForm.contactPhone.trim()) { toast.error('Contact phone is required.'); return; }
    if (duplicateWarning) { toast.error(duplicateWarning); return; }

    setLostSubmitting(true);
    try {
      const result = await lostFoundService?.reportLost({
        name: lostForm.name.trim(),
        age: lostForm.age ? parseInt(lostForm.age, 10) : null,
        gender: lostForm.gender || null,
        clothingDescription: lostForm.clothingDescription.trim() || null,
        contactPhone: lostForm.contactPhone.trim(),
        lastSeenLocation: lostForm.lastSeenLocation.trim() || null,
        description: lostForm.description.trim() || null,
        photoFile: lostPhotoFile,
        reportedBy: null,
        zoneId: pilgrimLocation?.zoneId || null,
        zoneName: pilgrimLocation?.zoneName || null,
      });
      if (result?.success) {
        toast.success(`Lost person report submitted for ${lostForm.name}.`);
        clearLostForm();
        setShowLostForm(false);
        const lost = await lostFoundService?.listLost() || [];
        setLostPeople(lost);
      } else {
        toast.error(result?.error || 'Failed to submit report.');
      }
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setLostSubmitting(false);
    }
  };

  // Submit sighting report
  const handleSightingSubmit = async (e) => {
    e.preventDefault();
    if (!sightingForm.location.trim()) { toast.error('Location is required.'); return; }

    setSightingSubmitting(true);
    try {
      const result = await lostFoundService?.reportSighting({
        incidentId: showSightingForm.id,
        sightingLocation: sightingForm.location.trim(),
        sightingNotes: sightingForm.notes.trim() || null,
        reporterName: sightingForm.reporterName.trim() || null,
        reporterPhone: sightingForm.reporterPhone.trim() || null,
      });
      if (result?.success) {
        toast.success('Sighting reported. The family has been notified.');
        setSightingForm({ ...emptySightingForm });
        setShowSightingForm(null);
      } else {
        toast.error(result?.error || 'Failed to report sighting.');
      }
    } catch {
      toast.error('Failed to report sighting.');
    } finally {
      setSightingSubmitting(false);
    }
  };

  // Mark person as found
  const handleFoundSubmit = async (e) => {
    e.preventDefault();
    if (!foundForm.foundLocation.trim()) { toast.error('Location is required.'); return; }

    setFoundSubmitting(true);
    try {
      const result = await lostFoundService?.markAsFound({
        incidentId: showFoundForm.id,
        foundLocation: foundForm.foundLocation.trim(),
        foundNearby: foundForm.foundNearby.trim() || null,
        foundNotes: foundForm.foundNotes.trim() || null,
      });
      if (result?.success) {
        toast.success(`${showFoundForm.pilgrim_name || 'Person'} marked as found!`);
        setFoundForm({ ...emptyFoundForm });
        setShowFoundForm(null);
        const [lost, found] = await Promise.all([
          lostFoundService?.listLost() || [],
          lostFoundService?.listFound() || [],
        ]);
        setLostPeople(lost);
        setFoundPeople(found);
      } else {
        toast.error(result?.error || 'Failed to mark as found.');
      }
    } catch {
      toast.error('Failed to mark as found.');
    } finally {
      setFoundSubmitting(false);
    }
  };

  const handleSOS = (source) => {
    createEmergency({
      pilgrimName: 'Pilgrim Emergency',
      description: `Pilgrim pressed SOS from ${source} — immediate assistance requested.`,
      latitude: pilgrimLocation?.latitude ?? 18.647,
      longitude: pilgrimLocation?.longitude ?? 74.084,
      zoneId: crowdSummary?.highestRiskZone?.id || pilgrimLocation?.zoneId || 'zone-21',
      zoneName: crowdSummary?.highestRiskZone?.zoneName || pilgrimLocation?.zoneName || 'Loni Market',
    });
    toast.error('SOS transmitted. Emergency services have been notified.');
  };

  const sections = [
    { id: 'medical', label: t('emergency.medicalHelp'), icon: HeartIcon },
    { id: 'sos', label: t('emergency.sosRequests'), icon: ExclamationTriangleIcon },
    { id: 'lost', label: t('emergency.lostPerson'), icon: MagnifyingGlassIcon },
    { id: 'found', label: t('emergency.foundPerson'), icon: UserIcon },
  ];

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ─── LOST PERSON CARD ───
  const LostPersonCard = ({ person }) => {
    const count = sightingCounts[person.id] || 0;
    return (
      <div className="surface overflow-hidden transition-all duration-200 hover:shadow-card-hover">
        {/* Photo header */}
        {person.photo_url ? (
          <div className="relative h-44 overflow-hidden bg-slate-100">
            <img src={person.photo_url} alt={person.pilgrim_name || 'Missing person'} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-lg font-bold text-white drop-shadow">{person.pilgrim_name || 'Unknown'}</h3>
              <div className="mt-1 flex items-center gap-2">
                {person.person_age && <span className="text-xs font-medium text-white/90">Age ~{person.person_age}</span>}
                {person.person_gender && <span className="text-xs font-medium text-white/90">{person.person_gender}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-saffron-50 p-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-saffron-100 text-2xl font-bold text-saffron">
              {(person.pilgrim_name || '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-ink">{person.pilgrim_name || 'Unknown'}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {person.person_age && <span>Age ~{person.person_age}</span>}
                {person.person_gender && <span>{person.person_gender}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 p-5">
          {person.clothing_description && (
            <div className="rounded-xl bg-saffron-50 p-3">
              <p className="text-xs font-bold text-saffron-700">Clothing</p>
              <p className="mt-0.5 text-sm text-slate-700">{person.clothing_description}</p>
            </div>
          )}
          {person.description && (
            <p className="text-sm leading-5 text-slate-600">{person.description}</p>
          )}
          {person.last_seen_location && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPinIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              Last seen: {person.last_seen_location}
              {person.last_seen_time && <span className="text-xs text-slate-400">{formatTimeAgo(person.last_seen_time)}</span>}
            </p>
          )}
          <div className="flex items-center justify-between">
            {person.contact_phone ? (
              <a href={`tel:${person.contact_phone}`} className="flex items-center gap-1.5 text-sm font-bold text-saffron hover:underline">
                <PhoneIcon className="h-4 w-4" /> {person.contact_phone}
              </a>
            ) : (
              <span className="text-xs text-slate-400">No phone listed</span>
            )}
            <Badge tone="red" dot>Missing</Badge>
          </div>

          {/* Sighting count */}
          {count > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
              <EyeIcon className="h-4 w-4" />
              {count} {count === 1 ? 'sighting' : 'sightings'} reported
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="soft"
              icon={EyeIcon}
              className="flex-1 !text-xs"
              onClick={() => { setSightingForm({ ...emptySightingForm }); setShowSightingForm(person); }}
            >
              I saw this person
            </Button>
            <Button
              variant="secondary"
              icon={CheckCircleIcon}
              className="flex-1 !text-xs"
              onClick={() => { setFoundForm({ ...emptyFoundForm }); setShowFoundForm(person); }}
            >
              Mark Found
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── FOUND PERSON CARD ───
  const FoundPersonCard = ({ person }) => (
    <div className="surface overflow-hidden transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-center gap-4 bg-emerald-50 p-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-600">
          {person.photo_url ? (
            <img src={person.photo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            (person.pilgrim_name || '?')[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink">{person.pilgrim_name || 'Found Person'}</h3>
          <p className="text-sm text-emerald-600 font-medium">Reunited safely</p>
        </div>
      </div>
      <div className="space-y-2 p-5">
        {person.found_location && (
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPinIcon className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            Found at: {person.found_location}
          </p>
        )}
        {person.found_nearby && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            Nearby: {person.found_nearby}
          </p>
        )}
        {person.found_notes && (
          <p className="text-sm text-slate-500 italic">{person.found_notes}</p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">{formatTimeAgo(person.updated_at || person.created_at)}</span>
          <Badge tone="green">Reunited</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow={t('emergency.eyebrow')}
        title={t('emergency.title')}
        description={t('emergency.description')}
        actions={
          <Button variant="danger" icon={BoltIcon} onClick={() => handleSOS('Emergency Center Header')}>
            Trigger SOS
          </Button>
        }
      />

      {/* Section tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition-all',
              activeSection === s.id
                ? 'bg-ink text-white shadow-md'
                : 'bg-white text-slate-600 shadow-sm hover:text-ink hover:shadow-md',
            )}
          >
            <s.icon className="h-5 w-5" aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── MEDICAL SECTION ─── */}
      {activeSection === 'medical' && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {emergencyContacts.map((contact) => (
              <button
                key={contact.name}
                onClick={() => { window.open(`tel:${contact.number}`, '_self'); toast.success(`Calling ${contact.name} at ${contact.number}...`); }}
                className="surface flex items-center gap-4 p-5 text-left transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className={cn('grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-md', contact.tone)}>
                  <contact.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-bold text-ink">{contact.name}</p>
                  <p className="mt-0.5 text-lg font-bold text-saffron">{contact.number}</p>
                </div>
              </button>
            ))}
          </section>
          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="eyebrow">{t('emergency.nearbyAmbulance')}</p>
                <h2 className="text-lg font-bold text-ink">{t('emergency.ambulance')}</h2>
              </div>
              <Badge tone="green" dot>{t('common.live')}</Badge>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
                    <HeartIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Medic 08 - Ambulance MH-12-AB-4321</p>
                    <p className="mt-0.5 text-sm text-slate-500">ETA: 2 min - Loni Market</p>
                  </div>
                </div>
                <Badge tone="red" dot>Responding</Badge>
              </div>
            </div>
          </section>
          <section className="surface p-6">
            <p className="eyebrow">{t('emergency.emergencyInstructions')}</p>
            <h2 className="text-lg font-bold text-ink">{t('common.safe')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-saffron-50 p-4">
                <p className="text-sm font-bold text-saffron">1. Stay calm</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Stop walking. Assess the situation. Do not panic.</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-bold text-forest">2. Call for help</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Dial 108 for ambulance, 112 for police.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-600">3. Share location</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Tell responders your exact location and situation.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── SOS SECTION ─── */}
      {activeSection === 'sos' && (
        <section className="surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">{t('emergency.sosRequests')}</p>
              <h2 className="text-lg font-bold text-ink">{t('emergency.sosRequests')}</h2>
            </div>
            <Badge tone="red" dot>{sosIncidents.length} {t('common.active')}</Badge>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sosIncidents.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-12 text-center">
                <ShieldCheckIcon className="h-10 w-10 text-emerald-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No active SOS requests</p>
                <p className="mt-1 text-xs text-slate-400">All pilgrims are safe in this zone.</p>
              </div>
            ) : sosIncidents.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{item.zone_name || item.zoneName || 'Unknown zone'}</p>
                    <p className="mt-1 text-base font-bold text-ink">{item.title || item.description || 'SOS Request'}</p>
                  </div>
                  <Badge tone={item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'red' : item.severity === 'MEDIUM' ? 'orange' : 'green'}>{(item.severity || 'HIGH').toLowerCase()}</Badge>
                </div>
                <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
                  <MapPinIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.zone_name || item.zoneName || 'Unknown zone'}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                  <span className="text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                  <span className={cn(item.status === 'RESOLVED' ? 'text-forest' : 'text-saffron')}>{(item.status || 'OPEN').replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button variant="danger" icon={PlusIcon} onClick={() => handleSOS('SOS Requests Section')}>Submit SOS Request</Button>
          </div>
        </section>
      )}

      {/* ─── LOST PERSON SECTION ─── */}
      {activeSection === 'lost' && (
        <div className="space-y-6">
          {/* Sub-tabs: Missing / Reunited */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: 'missing', label: 'Missing', count: lostPeople.length },
                { id: 'reunited', label: 'Reunited', count: foundPeople.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLostTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                    activeLostTab === tab.id
                      ? tab.id === 'missing' ? 'bg-saffron-100 text-saffron' : 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {tab.label}
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', activeLostTab === tab.id ? 'bg-white/80' : 'bg-white')}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <Button icon={PlusIcon} onClick={() => { clearLostForm(); setShowLostForm(true); }}>
              Report Lost Person
            </Button>
          </div>

          {activeLostTab === 'missing' && (
            <>
              {loadingLists ? (
                <div className="surface flex flex-col items-center py-16 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Loading reports...</p>
                </div>
              ) : lostPeople.length === 0 ? (
                <div className="surface flex flex-col items-center py-16 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-slate-300" aria-hidden="true" />
                  <p className="mt-4 text-base font-bold text-slate-500">No lost person reports</p>
                  <p className="mt-1 text-sm text-slate-400">Click "Report Lost Person" to file a report.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {lostPeople.map((person) => <LostPersonCard key={person.id} person={person} />)}
                </div>
              )}
            </>
          )}

          {activeLostTab === 'reunited' && (
            <>
              {loadingLists ? (
                <div className="surface flex flex-col items-center py-16 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Loading...</p>
                </div>
              ) : foundPeople.length === 0 ? (
                <div className="surface flex flex-col items-center py-16 text-center">
                  <CheckCircleIcon className="h-12 w-12 text-emerald-200" aria-hidden="true" />
                  <p className="mt-4 text-base font-bold text-slate-500">No reunited persons yet</p>
                  <p className="mt-1 text-sm text-slate-400">Persons found and reunited will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {foundPeople.map((person) => <FoundPersonCard key={person.id} person={person} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── FOUND PERSON SECTION ─── */}
      {activeSection === 'found' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">{t('emergency.foundPerson')}</p>
              <h2 className="text-lg font-bold text-ink">Found Person Reports</h2>
            </div>
            <Button icon={PlusIcon} onClick={() => setShowReportFoundForm(true)}>
              Report Found Person
            </Button>
          </div>
          {loadingLists ? (
            <div className="surface flex flex-col items-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="mt-3 text-sm font-bold text-slate-500">Loading...</p>
            </div>
          ) : foundPeople.length === 0 ? (
            <div className="surface flex flex-col items-center py-16 text-center">
              <UserIcon className="h-12 w-12 text-slate-300" aria-hidden="true" />
              <p className="mt-4 text-base font-bold text-slate-500">{t('common.noData')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('emergency.foundPerson')}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {foundPeople.map((person) => <FoundPersonCard key={person.id} person={person} />)}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── REPORT LOST PERSON MODAL ─── */}
      {/* ═══════════════════════════════════════════════ */}
      {showLostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowLostForm(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Report Lost Person</h2>
              <button onClick={() => setShowLostForm(false)} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLostSubmit} className="space-y-4 p-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Person Name *</label>
                <input
                  type="text" required value={lostForm.name}
                  onChange={(e) => setLostForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="Enter the missing person's name"
                />
                {duplicateWarning && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-600">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" /> {duplicateWarning}
                  </p>
                )}
              </div>

              {/* Age + Gender row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Age (approx.)</label>
                  <input
                    type="number" min="0" max="120" value={lostForm.age}
                    onChange={(e) => setLostForm((f) => ({ ...f, age: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                    placeholder="e.g. 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Gender</label>
                  <select
                    value={lostForm.gender}
                    onChange={(e) => setLostForm((f) => ({ ...f, gender: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Clothing */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Clothing Description</label>
                <input
                  type="text" value={lostForm.clothingDescription}
                  onChange={(e) => setLostForm((f) => ({ ...f, clothingDescription: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="e.g. Red saree, white kurta, blue cap..."
                />
              </div>

              {/* Contact phone */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Contact Phone *</label>
                <input
                  type="tel" required value={lostForm.contactPhone}
                  onChange={(e) => setLostForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="Phone number for this report"
                />
              </div>

              {/* Last seen location */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Last Seen Location</label>
                <input
                  type="text" value={lostForm.lastSeenLocation}
                  onChange={(e) => setLostForm((f) => ({ ...f, lastSeenLocation: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="e.g. Near Loni Market Gate 3"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Photo (optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => lostFileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 hover:border-saffron hover:text-saffron transition-colors"
                  >
                    <CameraIcon className="h-5 w-5" />
                    {lostPhotoPreview ? 'Change photo' : 'Choose photo'}
                  </button>
                  <input ref={lostFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  {lostPhotoPreview && (
                    <div className="relative">
                      <img src={lostPhotoPreview} alt="Preview" className="h-14 w-14 rounded-xl object-cover ring-2 ring-saffron-200" />
                      <button
                        type="button"
                        onClick={() => { setLostPhotoFile(null); setLostPhotoPreview(null); if (lostFileInputRef.current) lostFileInputRef.current.value = ''; }}
                        className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">Max 5 MB. JPG, PNG.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700">Additional Notes</label>
                <textarea
                  rows={3} value={lostForm.description}
                  onChange={(e) => setLostForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none resize-none"
                  placeholder="Any other details (health conditions, distinguishing marks...)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowLostForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={lostSubmitting} disabled={!!duplicateWarning}>
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── SIGHTING MODAL ─── */}
      {/* ═══════════════════════════════════════════════ */}
      {showSightingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSightingForm(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Report Sighting</h2>
                <p className="text-sm text-slate-500">You saw: {showSightingForm.pilgrim_name}</p>
              </div>
              <button onClick={() => setShowSightingForm(null)} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSightingSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-bold text-slate-700">Where did you see them? *</label>
                <input
                  type="text" required value={sightingForm.location}
                  onChange={(e) => setSightingForm((f) => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="e.g. Near Loni Market Gate 3"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Additional notes</label>
                <textarea
                  rows={2} value={sightingForm.notes}
                  onChange={(e) => setSightingForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none resize-none"
                  placeholder="What were they doing? Direction of travel?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Your name (optional)</label>
                  <input
                    type="text" value={sightingForm.reporterName}
                    onChange={(e) => setSightingForm((f) => ({ ...f, reporterName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Your phone (optional)</label>
                  <input
                    type="tel" value={sightingForm.reporterPhone}
                    onChange={(e) => setSightingForm((f) => ({ ...f, reporterPhone: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                    placeholder="Your phone"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowSightingForm(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={sightingSubmitting}>
                  Submit Sighting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── MARK AS FOUND MODAL ─── */}
      {/* ═══════════════════════════════════════════════ */}
      {showFoundForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowFoundForm(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Mark as Found</h2>
                <p className="text-sm text-slate-500">{showFoundForm.pilgrim_name}</p>
              </div>
              <button onClick={() => setShowFoundForm(null)} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleFoundSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-bold text-slate-700">Where was the person found? *</label>
                <input
                  type="text" required value={foundForm.foundLocation}
                  onChange={(e) => setFoundForm((f) => ({ ...f, foundLocation: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="e.g. Near Loni Market Gate 2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Nearby camp or landmark</label>
                <input
                  type="text" value={foundForm.foundNearby}
                  onChange={(e) => setFoundForm((f) => ({ ...f, foundNearby: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none"
                  placeholder="e.g. Near medical camp, water station"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Notes</label>
                <textarea
                  rows={2} value={foundForm.foundNotes}
                  onChange={(e) => setFoundForm((f) => ({ ...f, foundNotes: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron-200 focus:outline-none resize-none"
                  placeholder="Condition, state, anything notable..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowFoundForm(null)}>Cancel</Button>
                <Button type="submit" variant="secondary" className="flex-1" loading={foundSubmitting}>
                  Confirm Found
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── REPORT FOUND PERSON MODAL ─── */}
      {/* ═══════════════════════════════════════════════ */}
      {showReportFoundForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReportFoundForm(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Report Found Person</h2>
              <button onClick={() => setShowReportFoundForm(false)} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                If you found a person who was reported missing, please use the <strong>"Mark Found"</strong> button on their card in the Missing tab. This ensures the report is properly linked and the family is notified.
              </p>
              <p className="text-sm text-slate-600">
                If you found someone who does <strong>not</strong> appear in the Missing list, please contact the nearest volunteer or call <strong>112</strong> (Police) / <strong>108</strong> (Ambulance).
              </p>
              <Button variant="primary" className="w-full" onClick={() => setShowReportFoundForm(false)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
