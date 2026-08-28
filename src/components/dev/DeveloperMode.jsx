import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getHomeRoute } from '../../routes/roleRoutes';
import { useNavigate } from 'react-router-dom';
import { routeAdvisorService } from '../../services/routeAdvisorService';

const roles = [
  { id: 'pilgrim', label: 'Pilgrim', emoji: '🚶', color: 'bg-saffron-50 text-saffron' },
  { id: 'volunteer', label: 'Volunteer', emoji: '🫱', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'medical', label: 'Medical', emoji: '🏥', color: 'bg-red-50 text-red-600' },
  { id: 'police', label: 'Controller', emoji: '🎛️', color: 'bg-blue-50 text-blue-700' },
  { id: 'municipality', label: 'Municipality', emoji: '🏛️', color: 'bg-purple-50 text-purple-700' },
];

export default function DeveloperMode() {
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
  } = useApp();
  const navigate = useNavigate();
  const activeRole = role || 'pilgrim';

  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState([]);
  const [locSearching, setLocSearching] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);

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
    { label: 'Normal', value: 1.0, tone: 'bg-emerald-500 text-white' },
    { label: '+30%', value: 1.3, tone: 'bg-amber-500 text-white' },
    { label: '+60%', value: 1.6, tone: 'bg-red-500 text-white' },
  ];

  const tempOptions = [
    { label: '32°C', value: 32, tone: 'bg-blue-500 text-white' },
    { label: '36°C', value: 36, tone: 'bg-orange-500 text-white' },
    { label: '40°C', value: 40, tone: 'bg-red-600 text-white' },
  ];

  const incidentOptions = [
    { label: 'None', value: null, tone: 'bg-slate-200 text-slate-700' },
    { label: 'Medical', value: 'MEDICAL', tone: 'bg-red-500 text-white' },
    { label: 'Crowd Surge', value: 'CROWD_SURGE', tone: 'bg-orange-600 text-white' },
  ];

const roadOptions = [
  { label: 'Open', value: 'OPEN', tone: 'bg-emerald-500 text-white' },
  { label: 'Blocked', value: 'BLOCKED', tone: 'bg-red-500 text-white' },
];

const healthOptions = [
  { label: 'Walk 2 km', km: 2, minutes: 30, tempC: null, restedMinutes: 0, tone: 'bg-emerald-500 text-white', desc: 'Easy start' },
  { label: 'Walk 8 km', km: 8, minutes: 110, tempC: null, restedMinutes: 0, tone: 'bg-amber-500 text-white', desc: 'Focus mode' },
  { label: 'Heat 40°C', km: 6, minutes: 80, tempC: 40, restedMinutes: 0, tone: 'bg-red-500 text-white', desc: 'Heat stress' },
  { label: 'Take rest', km: 0, minutes: 0, tempC: null, restedMinutes: 45, tone: 'bg-blue-500 text-white', desc: 'Recovery' },
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
        title="Developer Mode (Dev Only)"
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
                  <p className="label">Developer Mode</p>
                  <p className="text-xs text-slate-400">Demo simulation controls</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                  Demo
                </span>
              </div>

              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-4 text-amber-800 ring-1 ring-amber-100">
                DEMO · SIMULATED LIVE DATA<br />
                Changes here propagate live to pilgrim / controller / volunteer pages.
              </div>

              <div className="mb-4 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role switch</p>
                {roles.map((r) => {
                  const isActive = r.id === activeRole;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSwitch(r)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-slate-100 text-ink' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}
                    >
                      <span className="text-lg">{r.emoji}</span>
                      <span className="flex-1 text-left">{r.label}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              <div className="mb-4 space-y-3 border-t border-dashed border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crowd simulator</p>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-600">8-step Crowd Watch</span>
                  <button
                    onClick={toggleCrowdSimulation}
                    className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${activeDemo === 'crowd-simulation' ? 'bg-red-500 text-white' : 'bg-forest text-white'}`}
                  >
                    {activeDemo === 'crowd-simulation' ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-t border-dashed border-slate-100 pt-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crowd level</p>
                    <span className="text-[10px] font-bold text-slate-500">Multiplier ×{simulation.crowdMultiplier || 1}</span>
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Temperature</p>
                    <span className="text-[10px] font-bold text-slate-500">Now {weather?.temperature ?? simulation.temperature ?? 32}°C</span>
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trigger incident</p>
                    <span className="text-[10px] font-bold text-slate-500">{simulation.incidentType || 'None'}</span>
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Road status</p>
                    <span className="text-[10px] font-bold text-slate-500">{simulation.roadStatus || 'OPEN'}</span>
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Health exposure</p>
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Camp stock</p>
                    {simulation.campStress ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        Stress ×{simulation.campStress}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Normal', value: 0, tone: 'bg-emerald-500 text-white' },
                      { label: 'Low stock', value: 1, tone: 'bg-amber-500 text-white' },
                      { label: 'Deplete', value: 2, tone: 'bg-red-600 text-white' },
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
                  ↺ Reset simulation baseline
                </button>

                <div className="space-y-3 border-t border-dashed border-slate-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group Separation</p>
                  {groupMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-bold text-slate-600">{m.name}</span>
                      {m.separated ? (
                        <button
                          onClick={() => recallGroupMember(m.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white"
                        >
                          Recall
                        </button>
                      ) : (
                        <button
                          onClick={() => simulateGroupSeparation(m.id)}
                          className="rounded-lg bg-red-500 px-3 py-1 text-[11px] font-bold text-white"
                        >
                          Separate 200m+
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-dashed border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location simulator</p>
                    {pilgrimLocation?.source === 'simulated' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        SIMULATED
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                      placeholder="Search location (e.g. Pune Station)"
                      value={locQuery}
                      onChange={(e) => handleLocSearch(e.target.value)}
                      onFocus={() => locResults.length > 0 && setShowLocDropdown(true)}
                    />
                    {locSearching && (
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400">Searching...</span>
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
                      Use real GPS location
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-4 text-[10px] text-slate-300">Hidden in production builds</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
