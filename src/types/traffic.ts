import { Coordinates } from './common';

export interface TrafficIncident {
  type: string;
  severity: number; // 1-5 scale
  location: Coordinates;
  description: string;
  startTime: Date;
  endTime?: Date;
}

export interface TrafficData {
  timestamp: Date;
  congestionLevel: number; // 0-1 scale
  averageSpeed: number; // mph
  incidents: TrafficIncident[];
  region: {
    center: Coordinates;
    radius: number; // meters
  };
} 