// Geographic Crowd Cell / Crowd Zone data model
// Location → Cell → PeopleCount → Density → Risk
import { CrowdLevel, RiskLevel } from './common';

export interface CrowdCell {
  id: string;                 // e.g. "zone-24"
  zoneName: string;           // e.g. "Loni Market", "Zone 24"
  latitude: number;
  longitude: number;
  bounds?: [[number, number], [number, number]]; // SW, NE
  peopleCount: number;
  capacity: number;           // max comfortable capacity
  density: CrowdLevel;
  riskScore: number;          // 0..100
  risk: RiskLevel;
  growthPct: number;          // percentage change over last window
  forecast30m?: number;       // predicted 30-min people count
  forecast60m?: number;       // predicted 60-min people count
  reasonsHighRisk?: string[]; // narrative why risk is elevated
  updatedAt: string;          // ISO timestamp
}

export interface CrowdTrendPoint {
  window: string;             // "12:00" or "12:45"
  pilgrims: number;
  timestamp?: string;
}

export interface CrowdSummary {
  activePilgrims: number;
  zonesTotal: number;
  zonesAtRisk: number;        // HIGH + CRITICAL
  trendPct: number;           // overall trend %
  riskLevel: RiskLevel;
  predictedCrowd: number;     // aggregated prediction
  history: CrowdTrendPoint[]; // recent history for charts
}
