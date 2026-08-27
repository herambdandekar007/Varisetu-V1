// Alert model - FLOW D Controller → Pilgrim
import { AlertSeverity } from './common';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  zoneId?: string;
  zoneName?: string;
  routeId?: string;
  category: 'CROWD' | 'WEATHER' | 'MEDICAL' | 'SECURITY' | 'RESOURCE' | 'ROUTE' | 'SYSTEM';
  source: 'CONTROLLER' | 'AI' | 'SYSTEM' | 'PILGRIM_SOS';
  broadcastBy?: string;
  affectedUsers?: string[];     // can be empty = broadcast all
  createdAt: string;
  expiresAt?: string;
  acknowledged?: boolean;
  recommendedAction?: string;   // e.g. "Take canal-side safer route"
  demoOnly?: boolean;           // when true, UI shows Demo / Simulated label
}
