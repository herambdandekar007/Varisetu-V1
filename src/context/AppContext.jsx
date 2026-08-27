import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  crowdTrend as initialCrowdTrend,
  crowdZones as initialCrowdZones,
  mapPoints as initialMapPoints,
  notifications as initialNotifications,
  resources as initialResources,
  wariStatus as initialWariStatus,
  zones as initialZones,
} from '../data/mockData';
import { crowdService } from '../services/crowdService';
import { incidentService } from '../services/incidentService';
import { taskService } from '../services/taskService';
import { alertService } from '../services/alertService';
import { routeService } from '../services/routeService';
import { campService } from '../services/campService';
import { locationService } from '../services/locationService';
import { lostFoundService } from '../services/lostFoundService';
import { weatherService } from '../services/weatherService';
import { aiService } from '../services/aiService';

const AppContext = createContext(null);

const cloneItems = (items) => items.map((item) => ({ ...item }));

const crowdSimulationSnapshots = [
  { pilgrims: 12000, predicted: 14500, risk: 52, level: 'moderate', density: 'Moderate', color: '#F4B400', crowdStatus: 'Moderate', factor: 0.95 },
  { pilgrims: 14500, predicted: 17000, risk: 65, level: 'high', density: 'High', color: '#E85D04', crowdStatus: 'High', factor: 1.15 },
  { pilgrims: 17000, predicted: 20000, risk: 78, level: 'high', density: 'High', color: '#E53935', crowdStatus: 'High', factor: 1.35 },
  { pilgrims: 20000, predicted: 23000, risk: 88, level: 'severe', density: 'Severe', color: '#B71C1C', crowdStatus: 'High risk', factor: 1.6 },
  { pilgrims: 23000, predicted: 21000, risk: 94, level: 'severe', density: 'Severe', color: '#B71C1C', crowdStatus: 'High risk', factor: 1.85 },
  { pilgrims: 20500, predicted: 17500, risk: 82, level: 'high', density: 'High', color: '#E85D04', crowdStatus: 'High', factor: 1.6 },
  { pilgrims: 17000, predicted: 14000, risk: 65, level: 'high', density: 'High', color: '#E85D04', crowdStatus: 'High', factor: 1.35 },
  { pilgrims: 14000, predicted: 11500, risk: 48, level: 'moderate', density: 'Moderate', color: '#F4B400', crowdStatus: 'Moderate', factor: 1.1 },
];

const initialSimulation = {
  running: false,
  currentCrowdCount: 14820,
  predictedCrowdCount: 18100,
  riskLevel: 'high',
  riskScore: 78,
  zoneStatus: 'High',
  timestamp: null,
  history: [],
  routeRisk: 'Low',
  routeRiskScore: 28,
  recommendedRoute: 'Main procession route',
  activeAlerts: [],
  step: 0,
  temperatureC: 32,
  temperature: 32,
  incidentMode: 'NONE',
  incidentType: null,
  roadStatus: 'OPEN',
  crowdMultiplier: 1.0,
};

const DEMO_VOLUNTEER_ID = 'v-volunteer-demo';
const DEMO_VOLUNTEER_NAME = 'Demo Volunteer';

const initialGroupMembers = [
  { id: 'gm-1', name: 'Savitri Tai', lat: 18.487, lng: 74.090, separated: false },
  { id: 'gm-2', name: 'Rahul', lat: 18.488, lng: 74.091, separated: false },
  { id: 'gm-3', name: 'Aaji', lat: 18.486, lng: 74.089, separated: false },
];

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function AppProvider({ children }) {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Pilgrim');

  // Legacy state kept for backward compat with older pages/map components
  const [resources, setResources] = useState(initialResources);
  const [mapPoints, setMapPoints] = useState(initialMapPoints);
  const [crowdZones, setCrowdZones] = useState(() => cloneItems(initialCrowdZones));
  const [zones, setZones] = useState(() => cloneItems(initialZones));
  const [notifications, setNotifications] = useState(() => cloneItems(initialNotifications));
  const [crowdTrend, setCrowdTrend] = useState(() => cloneItems(initialCrowdTrend));
  const [wariStatus, setWariStatus] = useState({ ...initialWariStatus });

  // Service-driven state for the three main experiences
  const [crowdCells, setCrowdCells] = useState(() => crowdService.getCells());
  const [incidents, setIncidents] = useState(() => incidentService.listActive());
  const [tasks, setTasks] = useState(() => taskService.list());
  const [alerts, setAlerts] = useState(() => alertService.listActive());
  const [routes, setRoutes] = useState(() => routeService.list());
  const [routeRecommendation, setRouteRecommendation] = useState(() => routeService.getRecommendedRoute());
  const [camps, setCamps] = useState(() => campService.list());
  const [pilgrimLocation, setPilgrimLocation] = useState(() => locationService.getPilgrimLocation());
  const [sightings, setSightings] = useState([]);

  const [weather, setWeather] = useState(() => weatherService.get());
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [aiPressure, setAiPressure] = useState(null);
  const [aiRouteRec, setAiRouteRec] = useState(null);
  const aiPressureTimerRef = useRef(null);

  const [crowdSummary, setCrowdSummary] = useState(() => crowdService.getSummary());
  const [crowdKPIs, setCrowdKPIs] = useState(() => crowdService.getKPIs());
  const [activeDemo, setActiveDemo] = useState(null);
  const [simulation, setSimulation] = useState({ ...initialSimulation });
  const [groupMembers, setGroupMembers] = useState(initialGroupMembers);
  const [groupSeparationActive, setGroupSeparationActive] = useState(false);

  const simulationTimerRef = useRef(null);
  const lastNotificationRiskRef = useRef(null);
  const subscriberCleanupRef = useRef([]);

  // Register subscribers to all services on mount
  useEffect(() => {
    const cleanups = [
      crowdService.subscribeCells((next) => {
        setCrowdCells(next);
        setCrowdSummary(crowdService.getSummary());
        setCrowdKPIs(crowdService.getKPIs());
      }),
      crowdService.subscribeTrend((next) => setCrowdTrend(next.map((p) => ({ time: p.window, pilgrims: Math.round(p.pilgrims / 1000), risk: Math.min(75, Math.round(p.pilgrims / 1200)) })))),
      incidentService.subscribe((next) => setIncidents(next.filter((i) => i.status !== 'RESOLVED'))),
      taskService.subscribe((next) => setTasks(next)),
      alertService.subscribe((next) => setAlerts(next.filter((a) => !a.expiresAt || new Date(a.expiresAt) > new Date()))),
      routeService.subscribeRoutes((next) => {
        setRoutes(next);
        setRouteRecommendation(routeService.getRecommendedRoute());
      }),
      campService.subscribe((next) => setCamps(next)),
      locationService.subscribePilgrimLocation((next) => setPilgrimLocation(next)),
      lostFoundService.subscribeSightings((next) => setSightings(next)),
      locationService.subscribePermission((next) => setLocationPermission(next)),
      weatherService.subscribe((next) => {
        setWeather(next);
        if (next?.temperature != null) {
          setSimulation((prev) => ({ ...prev, temperature: next.temperature, temperatureC: next.temperature }));
        }
      }),
    ];

    // Request geolocation permission on app load
    locationService.requestPermission();

    // Immediately fetch weather for Wari route area (Pune) so data shows fast
    // This uses known coordinates for the pilgrimage route
    weatherService.fetch(18.486, 74.089);

    subscriberCleanupRef.current = cleanups;
    return () => { cleanups.forEach((fn) => fn && fn()); };
  }, []);

  // When real GPS arrives, re-fetch weather for the actual location
  useEffect(() => {
    if (pilgrimLocation?.latitude && pilgrimLocation?.longitude && pilgrimLocation.source === 'gps') {
      weatherService.fetch(pilgrimLocation.latitude, pilgrimLocation.longitude);
    }
  }, [pilgrimLocation?.latitude, pilgrimLocation?.longitude, pilgrimLocation?.source]);

  // Recalculate AI pressure and route recommendation periodically (every 60s) and on data changes
  useEffect(() => {
    let cancelled = false;

    async function recalculate() {
      try {
        const [pressure, routeRec] = await Promise.all([
          aiService.calculateOverallPressure(),
          aiService.calculateRouteRecommendation(),
        ]);
        if (!cancelled) {
          setAiPressure(pressure);
          setAiRouteRec(routeRec);
          // Update simulation risk score with dynamic AI data
          setSimulation((prev) => ({
            ...prev,
            riskScore: pressure.riskScore,
            riskLevel: pressure.riskLevel,
          }));
        }
      } catch (err) {
        console.error('[AppContext] AI recalculation error:', err);
      }
    }

    recalculate();

    // Recalculate every 60 seconds
    aiPressureTimerRef.current = window.setInterval(recalculate, 60000);

    return () => {
      cancelled = true;
      if (aiPressureTimerRef.current) {
        clearInterval(aiPressureTimerRef.current);
        aiPressureTimerRef.current = null;
      }
    };
  }, [incidents, weather, simulation.running]);

  const clearSimulationTimer = useCallback(() => {
    if (simulationTimerRef.current) {
      window.clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((current) => {
      if (current.some((n) => n.id === notification.id)) return current;
      return [{ ...notification, time: 'now' }, ...current].slice(0, 50);
    });
  }, []);

  const applySimulationSnapshot = useCallback((snapshot, stepIndex) => {
    const isCritical = snapshot.risk >= 85;
    const isHigh = snapshot.risk >= 65 && snapshot.risk < 85;

    crowdService.applySimulationMultiplier(snapshot.factor, 'zone-24');
    routeService.applyCrowdRiskToMain(snapshot.factor);

    setSimulation((prev) => {
      const newHistory = [
        ...prev.history,
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pilgrims: Math.round(snapshot.pilgrims / 1000),
          risk: snapshot.risk,
        },
      ].slice(-12);

      let routeRisk = 'Low';
      let routeRiskScore = 28;
      let recommendedRoute = 'Main procession route';

      if (isCritical) {
        routeRisk = 'Severe';
        routeRiskScore = 88;
        recommendedRoute = 'Canal-side safer route';
      } else if (isHigh) {
        routeRisk = 'High';
        routeRiskScore = 68;
        recommendedRoute = 'Canal-side safer route';
      }

      let newAlerts = [...prev.activeAlerts];
      if (isCritical && !newAlerts.includes('severe-crowd')) newAlerts.push('severe-crowd');
      if (isHigh && !newAlerts.includes('high-crowd')) newAlerts.push('high-crowd');
      if (!isHigh && !isCritical) newAlerts = newAlerts.filter((a) => a !== 'severe-crowd' && a !== 'high-crowd');

      return {
        ...prev,
        running: true,
        currentCrowdCount: snapshot.pilgrims,
        predictedCrowdCount: snapshot.predicted,
        riskLevel: snapshot.level,
        riskScore: snapshot.risk,
        zoneStatus: snapshot.density,
        timestamp: Date.now(),
        history: newHistory,
        routeRisk,
        routeRiskScore,
        recommendedRoute,
        activeAlerts: newAlerts,
        step: stepIndex,
      };
    });

    setCrowdZones((current) => current.map((zone) => (
      zone.name === 'Loni Market'
        ? {
            ...zone,
            level: snapshot.level,
            pilgrims: snapshot.pilgrims,
            predicted: snapshot.predicted,
            risk: snapshot.risk,
            recommendation: isCritical
              ? 'Avoid Loni Market now. Take the Canal Side Route.'
              : isHigh
                ? 'Monitor the market crossing. Canal Side Route remains safer.'
                : 'Normal flow, follow posted directions.',
          }
        : zone
    )));
    setZones((current) => current.map((zone) => (
      zone.name === 'Loni Market'
        ? {
            ...zone,
            density: snapshot.density,
            people: snapshot.pilgrims.toLocaleString('en-IN'),
            risk: snapshot.risk,
            color: snapshot.color,
            detail: isCritical
              ? 'Demo: Simulated severe crowd. Canal-side diversion is active.'
              : isHigh
                ? 'Demo: Simulated high crowd. The market crossing is being monitored.'
                : 'Demo: Simulated live data · Normal monitored flow.',
            areaRisk: snapshot.level,
          }
        : zone
    )));
    setCrowdTrend((current) => {
      const updated = current.map((point) => {
        if (point.time === '10:00') return { ...point, pilgrims: Math.round(snapshot.pilgrims / 1000), risk: snapshot.risk };
        if (point.time === '12:00') return { ...point, pilgrims: Math.round(snapshot.predicted / 1000), risk: Math.max(snapshot.risk - 8, 0) };
        return point;
      });
      return updated;
    });
    setWariStatus((current) => ({
      ...current,
      crowdStatus: snapshot.crowdStatus,
      aiStatus: isCritical ? 'Attention' : isHigh ? 'Watch' : 'Monitoring',
    }));

    const prevRisk = lastNotificationRiskRef.current;
    const currentBucket = isCritical ? 'severe' : isHigh ? 'high' : snapshot.risk >= 45 ? 'moderate' : 'low';

    if (prevRisk !== currentBucket) {
      if (currentBucket === 'severe' && prevRisk !== 'severe') {
        addNotification({
          id: 'demo-crowd-severe',
          title: 'Demo: Severe crowd congestion detected',
          text: 'Safer canal-side route is strongly recommended. Avoid Loni Market corridor.',
          type: 'crowd-severe',
        });
      } else if (currentBucket === 'high' && prevRisk !== 'severe' && prevRisk !== 'high') {
        addNotification({
          id: 'demo-crowd-high',
          title: 'Demo: High crowd density detected at Loni Market',
          text: 'Monitor movement. Consider the canal-side route if travelling soon.',
          type: 'crowd-high',
        });
      } else if ((currentBucket === 'low' || currentBucket === 'moderate') && (prevRisk === 'severe' || prevRisk === 'high')) {
        addNotification({
          id: 'demo-crowd-recovery',
          title: 'Demo: Crowd levels recovering at Loni Market',
          text: 'Congestion has eased. Main procession route is now acceptable.',
          type: 'crowd-recovery',
        });
      }
      lastNotificationRiskRef.current = currentBucket;
    }
  }, [addNotification]);

  const activateCrowdSurge = useCallback(() => {
    if (activeDemo === 'crowd-simulation') return;

    clearSimulationTimer();
    lastNotificationRiskRef.current = null;
    setActiveDemo('crowd-simulation');
    setSimulation({ ...initialSimulation, running: true });

    const firstSnapshot = crowdSimulationSnapshots[0];
    applySimulationSnapshot(firstSnapshot, 0);
  }, [activeDemo, clearSimulationTimer, applySimulationSnapshot]);

  const stopCrowdSurge = useCallback(() => {
    clearSimulationTimer();
    lastNotificationRiskRef.current = null;
    setActiveDemo(null);
    setCrowdZones(cloneItems(initialCrowdZones));
    setZones(cloneItems(initialZones));
    setCrowdTrend(cloneItems(initialCrowdTrend));
    setWariStatus({ ...initialWariStatus });
    setSimulation({ ...initialSimulation });
  }, [clearSimulationTimer]);

  const toggleCrowdSimulation = useCallback(() => {
    if (activeDemo === 'crowd-simulation') {
      stopCrowdSurge();
    } else {
      activateCrowdSurge();
    }
  }, [activeDemo, activateCrowdSurge, stopCrowdSurge]);

  useEffect(() => {
    if (activeDemo !== 'crowd-simulation') return undefined;

    clearSimulationTimer();

    simulationTimerRef.current = window.setTimeout(() => {
      setSimulation((prev) => {
        const nextStep = (prev.step + 1) % crowdSimulationSnapshots.length;
        const nextSnapshot = crowdSimulationSnapshots[nextStep];
        applySimulationSnapshot(nextSnapshot, nextStep);
        return { ...prev, step: nextStep };
      });
    }, 4000);

    return () => clearSimulationTimer();
  }, [activeDemo, simulation.step, clearSimulationTimer, applySimulationSnapshot]);

  useEffect(() => () => {
    clearSimulationTimer();
  }, [clearSimulationTimer]);

  const resetDemoScenario = useCallback(() => {
    stopCrowdSurge();
    setNotifications(cloneItems(initialNotifications));
    setGroupMembers(initialGroupMembers);
    setGroupSeparationActive(false);
  }, [stopCrowdSurge]);

  const simulateGroupSeparation = useCallback((memberId) => {
    setGroupMembers((prev) =>
      prev.map((m) => m.id === memberId ? { ...m, lat: 18.520, lng: 74.120, separated: true } : m),
    );
    setGroupSeparationActive(true);
  }, []);

  const recallGroupMember = useCallback((memberId) => {
    const original = initialGroupMembers.find((m) => m.id === memberId);
    if (original) {
      setGroupMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...original, separated: false } : m),
      );
    }
  }, []);

  const updateResource = useCallback((resourceId, updates) => {
    setResources((prev) =>
      prev.map((res) => (res.id === resourceId ? { ...res, ...updates } : res))
    );
    setMapPoints((prev) =>
      prev.map((mp) => {
        if (mp.type === 'water' && mp.label.includes('W-14') && resourceId === 1) {
          return { ...mp, detail: `Available: ${updates.available}% · Queue: ${updates.queue} people` };
        }
        if (mp.type === 'food' && mp.label.includes('F-02') && resourceId === 2) {
          return { ...mp, detail: `Available: ${updates.available}% · Queue: ${updates.queue} people` };
        }
        if (mp.type === 'medical' && mp.label.includes('M-03') && resourceId === 3) {
          return { ...mp, detail: `Available: ${updates.available}% · Queue: ${updates.queue} people` };
        }
        if (mp.type === 'toilet' && mp.label.includes('T-01') && resourceId === 5) {
          return { ...mp, detail: `Available: ${updates.available} units · Queue: ${updates.queue} people` };
        }
        return mp;
      })
    );
  }, []);

  // =========== CONTROLLER ACTIONS (FLOW C + FLOW D) ===========

  const broadcastAlert = useCallback(({ zoneId, zoneName, severity = 'HIGH', message, title, recommendedAction }) => {
    const alert = alertService.broadcastFromController({ zoneId, zoneName, severity, message, title, recommendedAction });
    addNotification({
      id: alert.id,
      title: `Alert broadcast: ${alert.title}`,
      text: alert.message,
      type: `alert-${severity.toLowerCase()}`,
    });
    toast.success(`Alert broadcast to ${zoneName || 'all pilgrims'}`);
    setSimulation((prev) => ({ ...prev, activeAlerts: [...prev.activeAlerts, alert.id].slice(-10) }));
    return alert;
  }, [addNotification]);

  const assignVolunteerTask = useCallback(({ taskId, incidentId, volunteerId = DEMO_VOLUNTEER_ID, volunteerName = DEMO_VOLUNTEER_NAME, title, description, priority, location, zoneId, zoneName }) => {
    let task;
    if (taskId) {
      task = taskService.assign(taskId, volunteerId, volunteerName);
    } else if (incidentId) {
      const incident = incidentService.getById(incidentId);
      if (!incident) throw new Error('Incident not found');
      task = taskService.createFromIncident(incident, {
        title: title ? `Respond: ${title}` : undefined,
        description,
        priority: priority || incident.priority,
        zoneId: zoneId || incident.zoneId,
        zoneName: zoneName || incident.zoneName,
        location: location || { latitude: incident.latitude, longitude: incident.longitude },
      });
      task = taskService.assign(task.id, volunteerId, volunteerName);
      incidentService.startResponding(incidentId, volunteerId);
    } else {
      task = taskService.create({
        title: title || 'Controller-assigned task',
        description: description || '',
        priority: priority || 'HIGH',
        location: location || { latitude: 18.493, longitude: 74.100 },
        zoneId, zoneName,
      });
      task = taskService.assign(task.id, volunteerId, volunteerName);
    }
    addNotification({
      id: `task-assign-${task.id}`,
      title: `Task assigned: ${task.title}`,
      text: `Volunteer: ${volunteerName} · Priority: ${task.priority}`,
      type: 'task-assign',
    });
    toast.success(`Task created and assigned to ${volunteerName}`);
    return task;
  }, [addNotification]);

  const recommendRoute = useCallback(({ routeId, reason, riskAtFrontKm = 1.0 }) => {
    const rec = routeService.setRecommendation(routeId, reason, riskAtFrontKm);
    if (rec) {
      addNotification({
        id: `route-rec-${Date.now()}`,
        title: `Route recommendation updated`,
        text: reason,
        type: 'route-change',
      });
      toast.success('Route recommendation broadcast to pilgrims');
    }
    return rec;
  }, [addNotification]);

  const createEmergency = useCallback(({ pilgrimName = 'Unknown Pilgrim', description = 'SOS pressed', latitude, longitude, zoneId, zoneName, contacts } = {}) => {
    const loc = locationService.getPilgrimLocation();
    const incident = incidentService.createEmergencyFromSOS({
      pilgrimName,
      description,
      latitude: latitude ?? loc.latitude,
      longitude: longitude ?? loc.longitude,
      zoneId: zoneId ?? loc.zoneId,
      zoneName: zoneName ?? loc.zoneName,
      contacts,
    });
    addNotification({
      id: `emergency-${incident.id}`,
      title: `SOS received — ${incident.title || incident.zoneName || 'Emergency'}`,
      text: `${incident.title} at ${incident.zoneName}`,
      type: 'sos',
    });
    toast.error('SOS emergency created. Controller notified.', { icon: '🚨', duration: 4000 });
    return incident;
  }, [addNotification]);

  // =========== VOLUNTEER TASK LIFECYCLE ACTIONS (FLOW C) ===========

  const volunteerAcceptTask = useCallback((taskId, volunteerId = DEMO_VOLUNTEER_ID, volunteerName = DEMO_VOLUNTEER_NAME) => {
    const result = taskService.accept(taskId, volunteerId, volunteerName);
    if (result) toast.success(`Accepted: ${result.title}`);
    return result;
  }, []);

  const volunteerStartTask = useCallback((taskId) => {
    const result = taskService.start(taskId);
    if (result) toast(`Task in progress: ${result.title}`);
    return result;
  }, []);

  const volunteerCompleteTask = useCallback((taskId) => {
    const result = taskService.complete(taskId);
    if (result) {
      toast.success(`Task completed: ${result.title}`);
      if (result.incidentId) incidentService.resolve(result.incidentId);
    }
    return result;
  }, []);

  // =========== SIMULATION DEMO CONTROLS (STEP 16) ===========

  const applyCrowdMultiplier = useCallback((multiplier, zoneId = null) => {
    crowdService.applySimulationMultiplier(multiplier, zoneId);
    routeService.applyCrowdRiskToMain(multiplier);
    setSimulation((prev) => ({
      ...prev,
      currentCrowdCount: Math.round(prev.currentCrowdCount * multiplier),
      crowdMultiplier: multiplier,
    }));
  }, []);

  const setSimulationTemperature = useCallback((temperatureC) => {
    setSimulation((prev) => ({
      ...prev,
      temperatureC,
      temperature: temperatureC,
    }));
  }, []);

  const triggerIncidentDemo = useCallback((incidentMode) => {
    setSimulation((prev) => ({
      ...prev,
      incidentMode,
      incidentType: incidentMode,
    }));
    if (incidentMode === 'MEDICAL') {
      return createEmergency({
        pilgrimName: 'Demo Heat Exhaustion Patient',
        description: 'Simulated medical emergency — heat exhaustion at Loni Market Gate 3',
        latitude: 18.491, longitude: 74.102, zoneId: 'zone-24', zoneName: 'Loni Market',
      });
    }
    if (incidentMode === 'CROWD_SURGE') {
      const incident = incidentService.create({
        type: 'CROWD_SURGE',
        title: 'Simulated crowd surge',
        description: 'Demo incident: crowd density increasing rapidly at Loni Market crossing',
        priority: 'CRITICAL',
        latitude: 18.493, longitude: 74.100, zoneId: 'zone-24', zoneName: 'Loni Market',
        source: 'AI',
      });
      addNotification({ id: `demo-inc-${incident.id}`, title: `Demo incident: ${incident.title}`, text: incident.description, type: 'incident' });
      crowdService.applySimulationMultiplier(1.6, 'zone-24');
      routeService.applyCrowdRiskToMain(1.6);
      return incident;
    }
    return null;
  }, [createEmergency, addNotification]);

  const setSimulationRoadStatus = useCallback((roadStatus) => {
    setSimulation((prev) => ({ ...prev, roadStatus }));
    if (roadStatus === 'BLOCKED') {
      routeService.blockRoute('route-main', 'Demo: Road ahead blocked. Use canal-side diversion.');
      routeService.setRecommendation('route-canal', 'Main route blocked ahead. Canal-side is now recommended.', 2.0);
      toast('Demo: Main route marked BLOCKED. Route recommendation updated.');
    }
  }, []);

  const value = useMemo(() => ({
    // Legacy state / actions (backward compat)
    isAccessibilityMode,
    setIsAccessibilityMode,
    isNotificationOpen,
    setIsNotificationOpen,
    selectedRole,
    setSelectedRole,
    resources,
    setResources,
    mapPoints,
    setMapPoints,
    updateResource,
    crowdZones,
    zones,
    notifications,
    crowdTrend,
    wariStatus,
    activeDemo,
    simulation,
    activateCrowdSurge,
    stopCrowdSurge,
    toggleCrowdSimulation,
    resetDemoScenario,

    // Service-driven state
    crowdCells,
    crowdSummary,
    crowdKPIs,
    incidents,
    tasks,
    alerts,
    routes,
    routeRecommendation,
    camps,
    pilgrimLocation,
    sightings,

    // Real-time weather & location permission
    weather,
    locationPermission,

    // Dynamic AI predictions
    aiPressure,
    aiRouteRec,

    // Service accessors
    crowdService,
    incidentService,
    taskService,
    alertService,
    routeService,
    campService,
    locationService,
    lostFoundService,
    weatherService,
    aiService,

    // Controller actions (FLOW B/C/D)
    broadcastAlert,
    assignVolunteerTask,
    recommendRoute,
    createEmergency,

    // Volunteer task lifecycle
    volunteerAcceptTask,
    volunteerStartTask,
    volunteerCompleteTask,
    DEMO_VOLUNTEER_ID,
    DEMO_VOLUNTEER_NAME,

    // Demo simulation controls
    applyCrowdMultiplier,
    setSimulationTemperature,
    triggerIncidentDemo,
    setSimulationRoadStatus,

    // Group separation
    groupMembers,
    groupSeparationActive,
    simulateGroupSeparation,
    recallGroupMember,
    haversineDistance,
  }), [
    isAccessibilityMode,
    isNotificationOpen,
    selectedRole,
    resources,
    mapPoints,
    updateResource,
    crowdZones,
    zones,
    notifications,
    crowdTrend,
    wariStatus,
    activeDemo,
    simulation,
    activateCrowdSurge,
    stopCrowdSurge,
    toggleCrowdSimulation,
    resetDemoScenario,
    crowdCells,
    crowdSummary,
    crowdKPIs,
    incidents,
    tasks,
    alerts,
    routes,
    routeRecommendation,
    camps,
    pilgrimLocation,
    sightings,
    weather,
    locationPermission,
    aiPressure,
    aiRouteRec,
    broadcastAlert,
    assignVolunteerTask,
    recommendRoute,
    createEmergency,
    volunteerAcceptTask,
    volunteerStartTask,
    volunteerCompleteTask,
    applyCrowdMultiplier,
    setSimulationTemperature,
    triggerIncidentDemo,
    setSimulationRoadStatus,
    groupMembers,
    groupSeparationActive,
    simulateGroupSeparation,
    recallGroupMember,
    haversineDistance,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
