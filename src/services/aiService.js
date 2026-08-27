import { crowdService } from './crowdService.js';
import { incidentService } from './incidentService.js';
import { routeService } from './routeService.js';
import { weatherService } from './weatherService.js';
import { cellCountService } from './cellCountService.js';
import { locationService } from './locationService.js';

// Time-of-day crowd multiplier (Wari procession pattern)
// Peaks: morning 8-11am, evening 4-7pm. Lulls: midday, night.
function timeOfDayMultiplier() {
  const hour = new Date().getHours();
  if (hour >= 8 && hour <= 11) return 1.3;   // Morning peak
  if (hour >= 16 && hour <= 19) return 1.4;   // Evening peak (aarti time)
  if (hour >= 12 && hour <= 15) return 1.0;   // Midday steady
  if (hour >= 20 && hour <= 23) return 0.7;   // Evening wind-down
  return 0.5; // Night/early morning
}

// Weather impact on crowd movement
function weatherImpactFactor(weather) {
  if (!weather) return 1.0;
  const temp = weather.temperature || 30;
  const rain = weather.rainChance;
  const wind = weather.windSpeed || 0;

  let factor = 1.0;
  if (temp >= 40) factor *= 0.7;  // Extreme heat reduces outdoor movement
  if (temp >= 35) factor *= 0.85;
  if (rain) factor *= 0.6;        // Rain significantly reduces crowd
  if (wind > 30) factor *= 0.8;   // Strong wind
  if (temp < 20) factor *= 0.9;   // Cool weather — slightly fewer people
  return factor;
}

// Active incident impact on zone risk
function incidentImpact(zones, incidents) {
  const zoneIncidentCount = {};
  for (const inc of incidents || []) {
    if (['RESOLVED', 'CLOSED'].includes(inc.status)) continue;
    const zid = inc.zone_id || inc.zoneId;
    if (zid) {
      zoneIncidentCount[zid] = (zoneIncidentCount[zid] || 0) + 1;
    }
  }
  return zoneIncidentCount;
}

export const aiService = {
  // Calculate dynamic risk score for a zone (0-100)
  calculateZoneRisk(zone, weather, zoneIncidents = 0) {
    const base = Number(zone.risk_score) || 0;
    const people = Number(zone.people_count) || 0;
    const capacity = Number(zone.capacity) || 10000;
    const growth = Number(zone.growth_rate) || 0;
    const todMult = timeOfDayMultiplier();
    const weatherMult = weatherImpactFactor(weather);

    // Crowd pressure: how full is the zone relative to capacity
    const fillRatio = Math.min(2, people / (capacity || 10000));
    const crowdPressure = Math.min(100, Math.round(fillRatio * 50));

    // Growth pressure: rapid growth increases risk
    const growthPressure = Math.min(30, Math.max(0, Math.round(growth * 0.8)));

    // Time-of-day pressure
    const timePressure = Math.round((todMult - 1) * 40);

    // Incident pressure
    const incidentPressure = Math.min(20, zoneIncidents * 7);

    // Weather modifier (reduces risk in bad weather since fewer people)
    const weatherModifier = weatherMult < 1 ? -Math.round((1 - weatherMult) * 20) : Math.round((weatherMult - 1) * 15);

    // Combined weighted score
    const raw = base * 0.25 + crowdPressure * 0.30 + growthPressure * 0.15 + timePressure * 0.10 + incidentPressure * 0.10 + weatherModifier * 0.10;
    return Math.min(99, Math.max(5, Math.round(raw)));
  },

  // Calculate overall pilgrim pressure score (used on Dashboard)
  async calculateOverallPressure() {
    const [zones, incidents, weather, cells, pilgrimRaw] = await Promise.all([
      crowdService.list(),
      incidentService.list(),
      weatherService.get(),
      cellCountService.list(),
      locationService.getPilgrimLocation(),
    ]);

    const zoneIncidents = incidentImpact(zones, incidents);
    const todMult = timeOfDayMultiplier();
    const weatherMult = weatherImpactFactor(weather);

    // Build zoneId -> { people, testPeople, growth } from live cell_counts telemetry.
    const liveByZone = new Map();
    let liveTotal = 0;
    let liveTestTotal = 0;
    for (const c of cells) {
      if (!c.zoneId) continue;
      if (!liveByZone.has(c.zoneId)) liveByZone.set(c.zoneId, { people: 0, testPeople: 0, growth: 0 });
      const agg = liveByZone.get(c.zoneId);
      agg.people += c.count;
      agg.testPeople += c.testCount;
      const trend = cellCountService.getCellTrend(c, 30);
      if (trend.samples >= 2) agg.growth += trend.ratePerMin * 60;
      liveTotal += c.count;
      liveTestTotal += c.testCount;
    }
    for (const agg of liveByZone.values()) agg.growth = Math.min(100, agg.growth);

    // Zones currently tracked by the GPS layer (real pilgrim devices on the route)
    const trackedPilgrimCount = pilgrimRaw && pilgrimRaw.latitude != null ? 1 : 0;

    const totalPeople = liveTotal + trackedPilgrimCount; // telemetry-driven, not legacy stubs
    const totalCapacity = zones.reduce((s, z) => s + (Number(z.capacity) || 10000), 0);

    // Real growth: aggregate live cell growth for zones that have a measurement
    const growthEntries = [...liveByZone.values()];
    const totalGrowth = growthEntries.length
      ? growthEntries.reduce((s, g) => s + g.growth, 0) / growthEntries.length
      : 0;

    // Risk from the aggregation layer (crowd_zones.risk_score is telemetry-driven)
    const avgRisk = zones.length
      ? Math.round(zones.reduce((s, z) => s + (Number(z.risk_score) || 0), 0) / zones.length)
      : 0;
    const activeIncidents = (incidents || []).filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status)).length;
    const criticalZones = zones.filter((z) => (Number(z.risk_score) || 0) >= 80).length;

    // Overall risk score (0-99)
    const fillRatio = Math.min(2, totalPeople / (totalCapacity || 1));
    const crowdComponent = Math.min(40, Math.round(fillRatio * 25));
    const growthComponent = Math.min(15, Math.max(0, Math.round(totalGrowth * 0.5)));
    const incidentComponent = Math.min(15, activeIncidents * 3);
    const criticalComponent = Math.min(15, criticalZones * 5);
    const timeComponent = Math.round((todMult - 1) * 15);
    const weatherComponent = weatherMult < 1 ? -Math.round((1 - weatherMult) * 10) : 0;

    const riskScore = Math.min(99, Math.max(5, Math.round(avgRisk * 0.3 + crowdComponent + growthComponent + incidentComponent + criticalComponent + timeComponent + weatherComponent)));

    // Prediction: what will the risk be in 30-60 minutes?
    const predictedPeople = Math.round(totalPeople * (1 + (totalGrowth / 100) * 0.5) * todMult * weatherMult);
    const predictedRisk = Math.min(99, Math.max(5, Math.round(riskScore * (1 + totalGrowth / 200))));

    // Confidence: higher with real history volume; lower if everything is synthetic
    const sampleCounts = cells.map((c) => (c.history || []).length);
    const maxSamples = sampleCounts.length ? Math.max(...sampleCounts) : 0;
    const sampleFactor = Math.min(15, Math.round(maxSamples / 4));
    const simulatedFraction = liveTotal > 0 ? liveTestTotal / liveTotal : 1;
    const simulatedDeduction = Math.round(simulatedFraction * 10);
    const confidence = Math.min(95, Math.max(40, 60 + sampleFactor + (weather ? 10 : 0) + (activeIncidents > 0 ? 5 : 0) - simulatedDeduction));

    // Determine risk level
    let riskLevel = 'LOW';
    if (riskScore >= 85) riskLevel = 'CRITICAL';
    else if (riskScore >= 65) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    // Generate dynamic description
    const hotZones = zones.filter((z) => (Number(z.risk_score) || 0) >= 60).map((z) => z.name);
    let description = '';
    if (riskLevel === 'CRITICAL') {
      description = hotZones.length
        ? `Severe congestion at ${hotZones.join(', ')}. Take the safer route immediately.`
        : 'Severe crowd pressure detected. Use alternate routes.';
    } else if (riskLevel === 'HIGH') {
      description = hotZones.length
        ? `High crowd density near ${hotZones.join(', ')}. Canal-side route recommended.`
        : 'Elevated crowd levels. Monitor conditions and consider alternate routes.';
    } else if (riskLevel === 'MEDIUM') {
      description = 'Moderate crowd levels. Stay alert and follow volunteer guidance.';
    } else {
      description = 'Conditions are comfortable. Proceed on your chosen route.';
    }

    if (weather?.rainChance) description += ' Rain expected — carry rain gear.';
    if (weather?.temperature >= 35) description += ' Heat advisory active — stay hydrated.';

    // Prediction time window (next 30-60 min from now)
    const now = new Date();
    const predStart = new Date(now.getTime() + 30 * 60000);
    const predEnd = new Date(now.getTime() + 60 * 60000);
    const predictionTime = `${predStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${predEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Find highest risk zone name
    const highestRiskZone = [...zones].sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0))[0];

    return {
      riskScore,
      riskLevel,
      confidence,
      description,
      predictionTime,
      predictedPeople,
      predictedRisk,
      currentPeople: totalPeople,
      avgGrowthRate: Math.round(totalGrowth * 10) / 10,
      activeIncidents,
      criticalZones,
      hotZones,
      highestRiskZoneName: highestRiskZone?.name || 'Loni Market',
      timeOfDayFactor: todMult,
      weatherFactor: weatherMult,
      weatherCondition: weather?.condition || 'Unknown',
      temperature: weather?.temperature,
      // PHASE 1 flags — lets the UI show whether numbers are live or simulated
      liveZoneCount: liveByZone.size,
      simulatedFraction: Math.round(simulatedFraction * 100) / 100,
      dataMode: simulatedFraction > 0.5 ? 'SIMULATED' : 'LIVE',
      forecastBase: Math.abs(totalGrowth) > 0.5 ? 'realtime' : 'time-of-day',
    };
  },

  // Dynamic route recommendation based on real data
  async calculateRouteRecommendation() {
    const [zones, incidents, routes, weather, cells] = await Promise.all([
      crowdService.list(),
      incidentService.list(),
      routeService.list(),
      weatherService.get(),
      cellCountService.list(),
    ]);

    const zoneIncidents = incidentImpact(zones, incidents);
    const liveByZone = new Map(cells.filter((c) => c.zoneId).map((c) => [c.zoneId, c]));

    // Score each route based on real conditions
    const scoredRoutes = routes.map((route) => {
      const baseCrowd = Number(route.crowd_score) || 30;
      const baseRisk = Number(route.risk_score) || 20;
      const baseDistance = Number(route.distance_km) || 8;
      const baseTime = Number(route.estimated_minutes) || 140;

      // Adjust crowd score based on real zone data along route
      const isMainRoute = (route.id === 'route-main' || route.name?.toLowerCase().includes('main'));
      const routeZone = isMainRoute
        ? zones.find((z) => z.name?.includes('Loni') || z.id === 'zone-24')
        : null;

      let adjustedCrowd = baseCrowd;
      let adjustedRisk = baseRisk;

      if (routeZone) {
        const zoneRisk = Number(routeZone.risk_score) || 0;
        const live = routeZone.id ? liveByZone.get(routeZone.id) : null;
        // Prefer live cell telemetry when present; fall back to zone snapshot
        const zonePeople = live ? live.total : (Number(routeZone.people_count) || 0);
        const zoneGrowth = live
          ? cellCountService.getCellTrend(live, 30).ratePerMin * 60 || (Number(routeZone.growth_rate) || 0)
          : (Number(routeZone.growth_rate) || 0);
        adjustedCrowd = Math.min(100, Math.round(baseCrowd * 0.3 + zoneRisk * 0.4 + Math.min(50, zonePeople / 200) * 0.3));
        adjustedRisk = Math.min(100, Math.round(baseRisk * 0.3 + zoneRisk * 0.5 + Math.min(100, zoneGrowth) * 0.2));
      }

      // Weather modifier
      const weatherMult = weatherImpactFactor(weather);
      if (weatherMult < 1) {
        adjustedCrowd = Math.round(adjustedCrowd * weatherMult);
        adjustedRisk = Math.round(adjustedRisk * weatherMult);
      }

      // Time-of-day modifier
      const todMult = timeOfDayMultiplier();
      adjustedCrowd = Math.min(100, Math.round(adjustedCrowd * todMult));
      adjustedRisk = Math.min(100, Math.round(adjustedRisk * (0.7 + todMult * 0.3)));

      // Compute composite score (lower is better)
      const score = (adjustedCrowd / 100) * 0.35 + (adjustedRisk / 100) * 0.35 + (baseDistance / 15) * 0.15 + (baseTime / 300) * 0.15;

      // Determine status
      let status = 'OPEN';
      if (adjustedCrowd >= 80 || adjustedRisk >= 80) status = 'BLOCKED';
      else if (adjustedCrowd >= 55 || adjustedRisk >= 55) status = 'SLOW';

      // Determine risk level
      let risk = 'LOW';
      if (adjustedRisk >= 80) risk = 'CRITICAL';
      else if (adjustedRisk >= 60) risk = 'HIGH';
      else if (adjustedRisk >= 35) risk = 'MEDIUM';

      return {
        ...route,
        adjustedCrowd,
        adjustedRisk,
        score,
        computedStatus: status,
        computedRisk: risk,
      };
    });

    // Sort by score (lower is better)
    scoredRoutes.sort((a, b) => a.score - b.score);

    const best = scoredRoutes[0];
    const alternative = scoredRoutes[1];

    // Generate reason
    let reason = '';
    if (best) {
      if (best.computedRisk === 'CRITICAL' || best.computedRisk === 'HIGH') {
        reason = `Crowd risk detected — ${best.computedRisk.toLowerCase()} density on this route`;
      } else if (weather?.rainChance) {
        reason = 'Rain expected — route adjusted for weather conditions';
      } else if (best.adjustedCrowd > 50) {
        reason = `Moderate crowd levels (${best.adjustedCrowd}% capacity) — route optimized`;
      } else {
        reason = 'Conditions favorable — main route is clear';
      }
    }

    // Crowd pressure comparison
    const crowdReduction = best && alternative
      ? Math.max(0, Math.round((alternative.adjustedCrowd - best.adjustedCrowd)))
      : 43;

    // Time saved comparison
    const timeSaved = best && alternative
      ? Math.max(0, Math.round((Number(alternative.estimated_minutes) || 149) - (Number(best.estimated_minutes) || 138)))
      : 11;

    return {
      recommended: best,
      alternative: alternative,
      allRoutes: scoredRoutes,
      reason,
      crowdReduction,
      timeSaved,
      recommendationTime: new Date().toISOString(),
      factors: {
        timeOfDay: todMult,
        weather: weather?.condition || 'Clear',
        temperature: weather?.temperature,
        activeIncidents: (incidents || []).filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status)).length,
        criticalZones: zones.filter((z) => (Number(z.risk_score) || 0) >= 80).length,
      },
    };
  },

  // Per-zone forecast (30-min and 60-min predictions)
  async forecastZone(zoneId) {
    const [zone, weather] = await Promise.all([
      crowdService.getById(zoneId),
      weatherService.get(),
    ]);
    if (!zone) return null;

    const todMult = timeOfDayMultiplier();
    const weatherMult = weatherImpactFactor(weather);

    // Real growth from cell_counts history when the zone has a grid cell
    const liveCell = await cellCountService.getByZoneId(zoneId);
    const trend = liveCell ? cellCountService.getCellTrend(liveCell, 30) : null;
    const realGrowth = trend && trend.samples >= 2 ? trend.ratePerMin * 60 : null;

    const current = realGrowth != null && liveCell ? liveCell.total : (Number(zone.people_count) || 0);
    const growth = realGrowth != null ? realGrowth : (Number(zone.growth_rate) || 0);

    // 30-min forecast
    const forecast30m = Math.round(current * (1 + (growth / 100) * 0.5) * todMult * weatherMult);
    // 60-min forecast
    const forecast60m = Math.round(current * (1 + (growth / 100) * 1.0) * todMult * weatherMult);

    const baseRisk = Number(zone.risk_score) || 0;
    const risk30m = Math.min(99, Math.round(baseRisk * (forecast30m / (current || 1))));
    const risk60m = Math.min(99, Math.round(baseRisk * (forecast60m / (current || 1))));

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      currentPeople: current,
      currentRisk: baseRisk,
      forecast30m,
      forecast60m,
      riskForecast30m: risk30m,
      riskForecast60m: risk60m,
      growthRate: growth,
      growthSource: realGrowth != null ? 'realtime' : 'snapshot',
      timeOfDayFactor: todMult,
      weatherFactor: weatherMult,
    };
  },

  // Get dynamic stops for a route based on real zone data
  async getRouteStops() {
    const zones = await crowdService.list();
    const sorted = [...zones]
      .filter((z) => z.center_latitude)
      .sort((a, b) => (a.center_latitude || 0) - (b.center_latitude || 0));

    return sorted.map((z, i) => {
      const risk = Number(z.risk_score) || 0;
      const people = Number(z.people_count) || 0;
      let status = 'future';
      if (i < Math.floor(sorted.length * 0.4)) status = 'passed';
      else if (i === Math.floor(sorted.length * 0.4)) status = 'current';
      else if (i <= Math.floor(sorted.length * 0.6)) status = 'next';

      return {
        name: z.name,
        people,
        risk,
        density: z.density || 'LOW',
        status,
        zoneId: z.id,
      };
    });
  },
};
