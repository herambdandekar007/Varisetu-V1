// Incident model (used by Controller Live Incidents panel, SOS flow B)
import { IncidentType, IncidentStatus, Priority } from './common';

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  priority: Priority;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  zoneId?: string;            // e.g. zone-24
  zoneName?: string;          // display name
  reportedBy?: string;        // pilgrim name or auto (SOS)
  source?: 'SOS' | 'OBSERVER' | 'AI' | 'POLICE' | 'MEDICAL' | 'SYSTEM';
  assignedVolunteerId?: string;
  pilgrimId?: string;         // for SOS / missing person
  pilgrimName?: string;       // for display
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  contacts?: {
    name?: string;
    phone?: string;
  };
  distanceKm?: number;
}
