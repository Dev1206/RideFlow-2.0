import { TrafficData } from '../types/traffic';

interface TrafficRequest {
  lat: number;
  lng: number;
  radius: number;
}

export async function getTrafficData(request: TrafficRequest): Promise<TrafficData> {
  try {
    // In a real implementation, this would call an external traffic API
    // For now, we'll return mock data
    return {
      timestamp: new Date(),
      congestionLevel: 0.5, // Medium traffic
      averageSpeed: 30, // mph
      incidents: [],
      region: {
        center: {
          lat: request.lat,
          lng: request.lng
        },
        radius: request.radius
      }
    };
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    // Return default data in case of error
    return {
      timestamp: new Date(),
      congestionLevel: 0.3, // Light traffic as default
      averageSpeed: 35,
      incidents: [],
      region: {
        center: {
          lat: request.lat,
          lng: request.lng
        },
        radius: request.radius
      }
    };
  }
} 