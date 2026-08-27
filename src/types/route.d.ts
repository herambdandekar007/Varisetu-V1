// Route model - FLOW A Crowd → Route recommendation
import { RoadStatus, RouteRisk } from './common';

export interface RoutePoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WariRoute {
  id: string;
  name: string;
  type: 'PRIMARY' | 'ALTERNATE' | 'CANAL' | 'EMERGENCY';
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  risk: RouteRisk;
  riskScore: number;             // 0..100
  status: RoadStatus;
  crowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  highlights: string[];          // e.g. ["Medical camps every 3 km", "Water points"]
  geometry?: Array<[number, number]>; // lat, lng polyline
  recommendedByAI?: boolean;     // AI says this is the safer route
  description?: string;
}

export interface RouteRecommendation {
  recommendedRouteId: string;
  reason: string;
  riskAtFrontKm: number;         // where the risk starts (distance ahead of pilgrim)
  alternatives: WariRoute[];
  updatedAt: string;
}
