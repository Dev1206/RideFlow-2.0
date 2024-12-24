import { Ride } from '../types/ride';
import { calculateDistance } from './distanceUtils';
import config from '../config/grouping';
import { getTrafficData } from '../services/trafficService';
import { optimizeRoute } from './routeOptimization';

/**
 * Validates if a group of rides can be combined based on time and distance constraints
 */
export function validateGroup(rides: Ride[]): boolean {
  if (rides.length < config.minGroupSize || rides.length > config.maxGroupSize) {
    return false;
  }

  // Check if all rides have coordinates
  if (!rides.every(ride => ride.pickupCoordinates && ride.dropCoordinates)) {
    return false;
  }

  // Check time compatibility
  const times = rides.map(ride => new Date(`2000-01-01T${ride.time}`).getTime());
  const timeDiff = Math.max(...times) - Math.min(...times);
  if (timeDiff > config.maxTimeWindowDifference * 60 * 1000) {
    return false;
  }

  // Check distance compatibility
  for (let i = 0; i < rides.length; i++) {
    for (let j = i + 1; j < rides.length; j++) {
      const ride1 = rides[i];
      const ride2 = rides[j];

      if (!ride1.pickupCoordinates || !ride2.pickupCoordinates) {
        return false;
      }

      const pickup1 = {
        lat: ride1.pickupCoordinates.lat,
        lng: ride1.pickupCoordinates.lng
      };
      const pickup2 = {
        lat: ride2.pickupCoordinates.lat,
        lng: ride2.pickupCoordinates.lng
      };

      const distance = calculateDistance(pickup1, pickup2);
      if (distance > config.maxPickupDistance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Groups rides based on compatibility and optimization criteria
 */
export async function groupRides(rides: Ride[]): Promise<Ride[][]> {
  if (rides.length < 2) return [];

  // Filter out rides without coordinates
  const validRides = rides.filter(
    ride => ride.pickupCoordinates && ride.dropCoordinates
  );

  if (validRides.length < 2) return [];

  // Get traffic data for the area
  const trafficData = await getTrafficData({
    lat: validRides[0].pickupCoordinates!.lat,
    lng: validRides[0].pickupCoordinates!.lng,
    radius: config.maxPickupDistance
  });

  // Adjust max group size based on traffic
  const maxGroupSize = getMaxGroupSizeByTraffic(trafficData.congestionLevel);

  const groups: Ride[][] = [];
  const ungroupedRides = [...validRides];

  while (ungroupedRides.length >= 2) {
    const baseRide = ungroupedRides[0];
    const compatibleRides = findCompatibleRides(
      baseRide,
      ungroupedRides.slice(1),
      maxGroupSize - 1
    );

    if (compatibleRides.length > 0) {
      const group = [baseRide, ...compatibleRides];
      groups.push(group);
      
      // Remove grouped rides from ungrouped list
      compatibleRides.forEach(ride => {
        const index = ungroupedRides.indexOf(ride);
        if (index > -1) {
          ungroupedRides.splice(index, 1);
        }
      });
    }
    
    ungroupedRides.shift(); // Remove base ride
  }

  return groups;
}

/**
 * Finds compatible rides for grouping
 */
function findCompatibleRides(
  baseRide: Ride,
  candidates: Ride[],
  maxCount: number
): Ride[] {
  if (!baseRide.pickupCoordinates) return [];

  const compatibleRides: Ride[] = [];
  const baseTime = new Date(`2000-01-01T${baseRide.time}`).getTime();

  for (const candidate of candidates) {
    if (compatibleRides.length >= maxCount) break;
    if (!candidate.pickupCoordinates) continue;

    const candidateTime = new Date(`2000-01-01T${candidate.time}`).getTime();
    const timeDiff = Math.abs(candidateTime - baseTime);

    if (timeDiff <= config.maxTimeWindowDifference * 60 * 1000) {
      const distance = calculateDistance(
        baseRide.pickupCoordinates,
        candidate.pickupCoordinates
      );

      if (distance <= config.maxPickupDistance) {
        compatibleRides.push(candidate);
      }
    }
  }

  return compatibleRides;
}

/**
 * Determines maximum group size based on traffic conditions
 */
function getMaxGroupSizeByTraffic(congestionLevel: number): number {
  if (congestionLevel >= config.trafficThresholds.heavy) {
    return config.groupSizeByTraffic.heavy;
  } else if (congestionLevel >= config.trafficThresholds.medium) {
    return config.groupSizeByTraffic.medium;
  }
  return config.groupSizeByTraffic.light;
}

/**
 * Calculates the optimal route for a group of rides
 */
export function calculateOptimalRoute(rides: Ride[]): number[] {
  if (!rides.every(ride => ride.pickupCoordinates && ride.dropCoordinates)) {
    return [];
  }

  const points = rides.map(ride => ride.pickupCoordinates!);
  return optimizeRoute(points);
}

/**
 * Checks if two rides can be grouped together
 */
export function areRidesCompatible(ride1: Ride, ride2: Ride): boolean {
  if (!ride1.pickupCoordinates || !ride2.pickupCoordinates) {
    return false;
  }

  const time1 = new Date(`2000-01-01T${ride1.time}`).getTime();
  const time2 = new Date(`2000-01-01T${ride2.time}`).getTime();
  const timeDiff = Math.abs(time2 - time1);

  if (timeDiff > config.maxTimeWindowDifference * 60 * 1000) {
    return false;
  }

  const distance = calculateDistance(
    ride1.pickupCoordinates,
    ride2.pickupCoordinates
  );

  return distance <= config.maxPickupDistance;
}

/**
 * Optimizes the pickup sequence for a group of rides
 */
export function optimizePickupSequence(rides: Ride[]): number[] {
  const pickupPoints = rides.map(ride => ride.pickupCoordinates!);
  return optimizeRoute(pickupPoints);
} 