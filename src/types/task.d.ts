// VolunteerTask model - FLOW C Controller → Volunteer
import { Priority, TaskStatus } from './common';

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  instructions?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  zoneId?: string;
  zoneName?: string;
  distanceKm?: number;
  assignedTo?: string;           // volunteer id
  assignedToName?: string;
  incidentId?: string;           // optional link to incident
  incidentTitle?: string;        // quick display on task card
  relatedAlertId?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  etaMinutes?: number;           // travel time estimate
  category?: 'CROWD' | 'MEDICAL' | 'RESCUE' | 'CAMP' | 'TRAFFIC' | 'OTHER';
}
