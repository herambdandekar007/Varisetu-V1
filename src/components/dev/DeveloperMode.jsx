import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getHomeRoute } from '../../routes/roleRoutes';
import { useNavigate } from 'react-router-dom';
import { routeAdvisorService } from '../../services/routeAdvisorService';
import { useTranslation } from 'react-i18next';

const roles = [
  { id: 'pilgrim', labelKey: 'topbar.pilgrim', emoji: '🚶', color: 'bg-saffron-50 text-saffron' },
  { id: 'volunteer', labelKey: 'topbar.volunteer', emoji: '🫱', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'medical', labelKey: 'topbar.medical', emoji: '🏥', color: 'bg-red-50 text-red-600' },
  { id: 'police', labelKey: 'topbar.controller', emoji: '🎛️', color: 'bg-blue-50 text-blue-700' },
  { id: 'municipality', labelKey: 'topbar.municipality', emoji: '🏛️', color: 'bg-purple-50 text-purple-700' },
  { id: 'ambulance_driver', labelKey: 'topbar.ambulanceDriver', emoji: '🚑', color: 'bg-red-50 text-red-600' },
];

export default function DeveloperMode() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { role, selectRole } = useAuth();
  const {
    applyCrowdMultiplier,
    setSimulationTemperature,
    triggerIncidentDemo,
    setSimulationRoadStatus,
    simulation,
    resetDemoScenario,
    toggleCrowdSimulation,
    activeDemo,
    simulateHealthExposure,
    simulateCampStress,
    latestHealth,
    weather,
    groupMembers,
    simulateGroupSeparation,
    recallGroupMember,
    groupSeparationActive,
    locationService,
    pilgrimLocation,
    pilgrimCount,
    setPilgrimCount,
    resumePilgrimAutoIncrement,
  } = useApp();
  const navigate = useNavigate();
  const activeRole = role || 'pilgrim';

  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState([]);
  const [locSearching, setLocSearching] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [pilgrimCountInput, setPilgrimCountInput] = useState('');

  const handleLocSearch = useCallback(async (q) => {
    setLocQuery(q);
    if (q.length < 3) { setLocResults([]); return; }
    setLocSearching(true);
    const results = await routeAdvisorService.geocode(q);
    setLocResults(results);
    setLocSearching(false);
    setShowLocDropdown(true);
  }, []);

  const handleLocSelect = useCallback(async (result) => {
    setLocQuery(result.name.split(',')[0]);
    setShowLocDropdown(false);
    setLocResults([]);
    await locationService.setPilgrimLocation(result.lat, result.lng, 10);
  }, [locationService]);

  const handleClearSimLocation = useCallback(() => {
    locationService.clearSimulatedLocation();
    setLocQuery('');
  }, [locationService]);

  if (import.meta.env.PROD) return null;

  const handleSwitch = (newRole) => {
    selectRole(newRole.id);
    setOpen(false);
    navigate(getHomeRoute(newRole.id));
  };

  const crowdOptions = [
    { label: t('developerMode.normal'), value: 1.0, tone: 'bg-emerald-500 text-white' },
    { label: '+30%', value: 1.3, tone: 'bg-amber-500 text-white' },
    { label: '+60%', value: 1.6, tone: 'bg-red-500 text-white' },
  ];

  const tempOptions = [
    { label: '32°C', value: 32, tone: 'bg-blue-500 text-white' },
    { label: '36°C', value: 36, tone: 'bg-orange-500 text-white' },
    { label: '40°C', value: 40, tone: 'bg-red-600 text-white' },
  ];

  const incidentOptions = [
    { label: t('developerMode.none'), value: null, tone: 'bg-slate-200 text-slate-700' },
    { label: t('topbar.medical'), value: 'MEDICAL', tone: 'bg-red-500 text-white' },
    { label: t('developerMode.crowdSurge'), value: 'CROWD_SURGE', tone: 'bg-orange-600 text-white' },
  ];

const roadOptions = [
  { label: t('developerMode.open'), value: 'OPEN', tone: 'bg-emerald-500 text-white' },
  { label: t('developerMode.blocked'), value: 'BLOCKED', tone: 'bg-red-500 text-white' },
];

const healthOptions = [
  { label: t('developerMode.walkTwoKm'), km: 2, minutes: 30, tempC: null, restedMinutes: 0, tone: 'bg-emerald-500 text-white', desc: t('developerMode.easyStart') },
  { label: t('developerMode.walkEightKm'), km: 8, minutes: 110, tempC: null, restedMinutes: 0, tone: 'bg-amber-500 text-white', desc: t('developerMode.focusMode') },
  { label: t('developerMode.heatForty'), km: 6, minutes: 80, tempC: 40, restedMinutes: 0, tone: 'bg-red-500 text-white', desc: t('developerMode.heatStress') },
  { label: t('developerMode.takeRest'), km: 0, minutes: 0, tempC: null, restedMinutes: 45, tone: 'bg-blue-500 text-white', desc: t('developerMode.recovery') },
];

  const activeCrowd = crowdOptions.find((o) => Math.abs((simulation.crowdMultiplier || 1) - o.value) < 0.01)?.value || 1;
  const activeTemp = tempOptions.find((o) => o.value === simulation.temperature)?.value ?? 32;
  const activeIncident = incidentOptions.find((o) => o.value === simulation.incidentType)?.value ?? null;
  const activeRoad = roadOptions.find((o) => o.value === simulation.roadStatus)?.value || 'OPEN';

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lg font-bold text-white shadow-float transition hover:scale-105 active:scale-95"
        title={t('developerMode.title')}
      >
        ⚡
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="fixed bottom-24 left-6 z-50 max-h-[80vh] w-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-float"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="label">{t('developerMode.title')}</p>
                  <p className="text-xs text-slate-400">{t('developerMode.controls')}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                  {t('developerMode.demo')}
                </span>
              </div>

              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-4 text-amber-800 ring-1 ring-amber-100">
                {t('developerMode.simulatedLiveData')}<br />
                {t('developerMode.propagationNote')}
              </div>

              <div className="mb-4 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.roleSwitch')}</p>
                {roles.map((r) => {
                  const isActive = r.id === activeRole;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSwitch(r)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-slate-100 text-ink' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}
                    >
                      <span className="text-lg">{r.emoji}</span>
                      <span className="flex-1 text-left">{t(r.labelKey)}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              <div className="mb-4 space-y-3 border-t border-dashed border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.crowdSimulator')}</p>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-600">{t('developerMode.eightStepCrowdWatch')}</span>
                  <button
                    onClick={toggleCrowdSimulation}
                    className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${activeDemo === 'crowd-simulation' ? 'bg-red-500 text-white' : 'bg-forest text-white'}`}
                  >
                    {activeDemo === 'crowd-simulation' ? t('developerMode.stop') : t('developerMode.start')}
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-t border-dashed border-slate-100 pt-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.crowdLevel')}</p>
                    <span className="text-[10px] font-bold text-slate-500">{t('developerMode.multiplier', { value: simulation.crowdMultiplier || 1 })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {crowdOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => applyCrowdMultiplier(opt.value, 'zone-24')}
                        className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${activeCrowd === opt.value ? opt.tone + ' ring-2 ring-offset-2 ring-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.temperature')}</p>
                    <span className="text-[10px] font-bold text-slate-500">{t('developerMode.nowTemperature', { value: weather?.temperature ?? simulation.temperature ?? 32 })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {tempOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSimulationTemperature(opt.value)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${activeTemp === opt.value ? opt.tone + ' ring-2 ring-offset-2 ring-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.triggerIncident')}</p>
                    <span className="text-[10px] font-bold text-slate-500">{simulation.incidentType || t('developerMode.none')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {incidentOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => triggerIncidentDemo(opt.value)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${activeIncident === opt.value ? opt.tone + ' ring-2 ring-offset-2 ring-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.roadStatus')}</p>
                    <span className="text-[10px] font-bold text-slate-500">{simulation.roadStatus === 'BLOCKED' ? t('developerMode.blocked') : t('developerMode.open')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {roadOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSimulationRoadStatus(opt.value)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${activeRoad === opt.value ? opt.tone + ' ring-2 ring-offset-2 ring-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-dashed border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.healthExposure')}</p>
                    {latestHealth && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {latestHealth.risk_level} · {latestHealth.risk_score}/100
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {healthOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => simulateHealthExposure({ km: opt.km, minutes: opt.minutes, tempC: opt.tempC, restedMinutes: opt.restedMinutes })}
                        className="rounded-xl bg-slate-50 px-2 py-2 text-left transition hover:bg-slate-100"
                      >
                        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${opt.tone}`}>{opt.label}</span>
                        <p className="mt-1 text-[10px] text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-dashed border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.campStock')}</p>
                    {simulation.campStress ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {t('developerMode.stress', { value: simulation.campStress })}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t('developerMode.normal'), value: 0, tone: 'bg-emerald-500 text-white' },
                      { label: t('developerMode.lowStock'), value: 1, tone: 'bg-amber-500 text-white' },
                      { label: t('developerMode.deplete'), value: 2, tone: 'bg-red-600 text-white' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => simulateCampStress(opt.value)}
                        className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${(simulation.campStress || 0) === opt.value ? opt.tone + ' ring-2 ring-offset-2 ring-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    resetDemoScenario();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100"
                >
                  ↺ {t('developerMode.resetSimulation')}
                </button>

                <div className="space-y-3 border-t border-dashed border-slate-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.groupSeparation')}</p>
                  {groupMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-bold text-slate-600">{m.name}</span>
                      {m.separated ? (
                        <button
                          onClick={() => recallGroupMember(m.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white"
                        >
                          {t('developerMode.recall')}
                        </button>
                      ) : (
                        <button
                          onClick={() => simulateGroupSeparation(m.id)}
                          className="rounded-lg bg-red-500 px-3 py-1 text-[11px] font-bold text-white"
                        >
                          {t('developerMode.separate')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-dashed border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.locationSimulator')}</p>
                    {pilgrimLocation?.source === 'simulated' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {t('developerMode.simulated')}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                      placeholder={t('developerMode.searchLocation')}
                      value={locQuery}
                      onChange={(e) => handleLocSearch(e.target.value)}
                      onFocus={() => locResults.length > 0 && setShowLocDropdown(true)}
                    />
                    {locSearching && (
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400">{t('developerMode.searching')}</span>
                    )}
                    {showLocDropdown && locResults.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                        {locResults.slice(0, 5).map((r, i) => (
                          <button
                            key={i}
                            onClick={() => handleLocSelect(r)}
                            className="flex w-full items-start gap-2 px-3 py-2 text-left text-[11px] hover:bg-slate-50"
                          >
                            <span className="truncate text-ink">{r.name.split(',').slice(0, 2).join(',')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {pilgrimLocation?.source === 'simulated' && (
                    <button
                      onClick={handleClearSimLocation}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      {t('developerMode.useRealGps')}
                    </button>
                  )}
                </div>

                <div className="space-y-3 border-t border-dashed border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('developerMode.totalPilgrimsToday')}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {pilgrimCount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                      placeholder={t('developerMode.pilgrimCountPlaceholder')}
                      value={pilgrimCountInput}
                      onChange={(e) => setPilgrimCountInput(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(pilgrimCountInput, 10);
                        if (val > 0) {
                          setPilgrimCount(val);
                          setPilgrimCountInput('');
                        }
                      }}
                      disabled={!pilgrimCountInput}
                      className="shrink-0 rounded-xl bg-forest px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                    >
                      {t('developerMode.set')}
                    </button>
                  </div>
                  <button
                    onClick={resumePilgrimAutoIncrement}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    {t('developerMode.resumeAutoIncrement')}
                  </button>
                </div>

              </div>

              <p className="mt-4 text-[10px] text-slate-300">{t('developerMode.hiddenInProduction')}</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
