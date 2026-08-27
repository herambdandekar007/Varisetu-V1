// Common string-enum helpers for risk/status severity buckets
// These match the UX language: LOW / MEDIUM / HIGH / CRITICAL.

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type IncidentType =
  | 'MEDICAL'
  | 'CROWD_SURGE'
  | 'MISSING_PERSON'
  | 'ROAD_BLOCK'
  | 'WEATHER'
  | 'CAMP_SHORTAGE'
  | 'SOS'
  | 'OTHER';

export type IncidentStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED';

export type RoadStatus = 'OPEN' | 'SLOW' | 'BLOCKED' | 'DIVERSION';

export type RouteRisk = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
