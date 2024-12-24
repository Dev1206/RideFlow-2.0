import { Coordinates } from '../types/common';

interface Distance {
  [key: string]: {
    [key: string]: number;
  };
}

/**
 * Implements the Lin-Kernighan heuristic for solving TSP
 * This is one of the most efficient algorithms for route optimization
 */
export function optimizeRoute(points: Coordinates[]): number[] {
  if (points.length <= 2) return points.map((_, i) => i);

  // Calculate distance matrix
  const distances: Distance = {};
  for (let i = 0; i < points.length; i++) {
    distances[i] = {};
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        distances[i][j] = calculateDistance(points[i], points[j]);
      }
    }
  }

  // Initialize with nearest neighbor solution
  let currentRoute = nearestNeighborSolution(distances, points.length);
  let bestDistance = calculateRouteDistance(currentRoute, distances);
  let improved = true;

  // Lin-Kernighan improvement
  while (improved) {
    improved = false;
    for (let size = 2; size <= Math.min(5, points.length - 2); size++) {
      for (let i = 0; i < points.length - size; i++) {
        const newRoute = twoOpt(currentRoute, i, i + size);
        const newDistance = calculateRouteDistance(newRoute, distances);

        if (newDistance < bestDistance) {
          currentRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return currentRoute;
}

/**
 * Calculates Euclidean distance between two points
 */
function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Generates initial solution using nearest neighbor approach
 */
function nearestNeighborSolution(distances: Distance, n: number): number[] {
  const route: number[] = [0];
  const unvisited = new Set(Array.from({ length: n - 1 }, (_, i) => i + 1));

  while (unvisited.size > 0) {
    const current = route[route.length - 1];
    let nearest = -1;
    let minDistance = Infinity;

    for (const next of unvisited) {
      const distance = distances[current][next];
      if (distance < minDistance) {
        minDistance = distance;
        nearest = next;
      }
    }

    route.push(nearest);
    unvisited.delete(nearest);
  }

  return route;
}

/**
 * Implements 2-opt improvement for route optimization
 */
function twoOpt(route: number[], i: number, j: number): number[] {
  const newRoute = [...route];
  while (i < j) {
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    i++;
    j--;
  }
  return newRoute;
}

/**
 * Calculates total route distance
 */
function calculateRouteDistance(route: number[], distances: Distance): number {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distances[route[i]][route[i + 1]];
  }
  return totalDistance;
}

/**
 * Optimizes pickup and dropoff sequence
 */
export function optimizePickupDropoffSequence(
  rides: Array<{
    id: string;
    pickup: Coordinates;
    dropoff: Coordinates;
    timeWindow: {
      start: Date;
      end: Date;
    };
  }>,
  vehicleCapacity: number
): Array<{
  type: 'pickup' | 'dropoff';
  rideId: string;
  location: Coordinates;
  estimatedTime: Date;
}> {
  // Convert to array of points while maintaining constraints
  const points: Array<{
    type: 'pickup' | 'dropoff';
    rideId: string;
    location: Coordinates;
    timeWindow?: {
      start: Date;
      end: Date;
    };
  }> = [];

  rides.forEach(ride => {
    points.push({
      type: 'pickup',
      rideId: ride.id,
      location: ride.pickup,
      timeWindow: ride.timeWindow
    });
    points.push({
      type: 'dropoff',
      rideId: ride.id,
      location: ride.dropoff
    });
  });

  // Get optimal route considering constraints
  const route = optimizeRouteWithConstraints(points, vehicleCapacity);

  // Calculate estimated times
  const baseTime = new Date();
  let currentTime = baseTime.getTime();
  const averageSpeed = 40; // km/h

  return route.map((point, index) => {
    if (index > 0) {
      const distance = calculateDistance(
        route[index - 1].location,
        point.location
      );
      currentTime += (distance / (averageSpeed * 1000/3600)) * 1000;
    }

    return {
      ...point,
      estimatedTime: new Date(currentTime)
    };
  });
}

/**
 * Optimizes route while respecting constraints
 */
function optimizeRouteWithConstraints(
  points: Array<{
    type: 'pickup' | 'dropoff';
    rideId: string;
    location: Coordinates;
    timeWindow?: {
      start: Date;
      end: Date;
    };
  }>,
  vehicleCapacity: number
): typeof points {
  let bestRoute = [...points];
  let bestScore = evaluateRoute(bestRoute, vehicleCapacity);

  // Local search optimization
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 1; j < points.length; j++) {
        // Skip if violates pickup-before-dropoff constraint
        if (!canSwap(bestRoute, i, j)) continue;

        const newRoute = [...bestRoute];
        [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
        
        const score = evaluateRoute(newRoute, vehicleCapacity);
        if (score < bestScore) {
          bestRoute = newRoute;
          bestScore = score;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Checks if two points can be swapped while maintaining constraints
 */
function canSwap(
  route: Array<{
    type: 'pickup' | 'dropoff';
    rideId: string;
    location: Coordinates;
  }>,
  i: number,
  j: number
): boolean {
  const point1 = route[i];
  const point2 = route[j];

  // Can't swap pickup and dropoff of same ride if it violates order
  if (point1.rideId === point2.rideId) {
    if (
      (point1.type === 'pickup' && point2.type === 'dropoff') ||
      (point1.type === 'dropoff' && point2.type === 'pickup')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates route quality considering constraints
 */
function evaluateRoute(
  route: Array<{
    type: 'pickup' | 'dropoff';
    rideId: string;
    location: Coordinates;
    timeWindow?: {
      start: Date;
      end: Date;
    };
  }>,
  vehicleCapacity: number
): number {
  let score = 0;
  let currentLoad = 0;
  const pickupTimes: { [key: string]: number } = {};

  // Calculate total distance
  for (let i = 0; i < route.length - 1; i++) {
    score += calculateDistance(route[i].location, route[i + 1].location);
  }

  // Check capacity and time window constraints
  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    
    if (point.type === 'pickup') {
      currentLoad++;
      pickupTimes[point.rideId] = i;
      
      // Penalize capacity violations
      if (currentLoad > vehicleCapacity) {
        score += 10000;
      }
    } else {
      currentLoad--;
      
      // Penalize if dropoff comes before pickup
      if (pickupTimes[point.rideId] === undefined) {
        score += 10000;
      }
    }

    // Penalize time window violations
    if (point.timeWindow) {
      const estimatedTime = new Date().getTime() + i * 5 * 60 * 1000; // Rough estimate
      if (estimatedTime < point.timeWindow.start.getTime()) {
        score += 5000;
      }
      if (estimatedTime > point.timeWindow.end.getTime()) {
        score += 5000;
      }
    }
  }

  return score;
} 