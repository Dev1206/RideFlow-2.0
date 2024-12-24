const config = {
  maxPickupDistance: 5000, // meters
  maxTimeWindowDifference: 15, // minutes
  trafficThresholds: {
    heavy: 0.8,
    medium: 0.5
  },
  groupSizeByTraffic: {
    heavy: 2,
    medium: 3,
    light: 4
  }
};

/**
 * Validates if rides can be grouped together
 */
function validateGroup(rides) {
  if (!Array.isArray(rides) || rides.length < 2 || rides.length > 4) {
    return false;
  }

  // Check if all rides have necessary data
  const validRides = rides.filter(ride => 
    ride.pickupLocation && 
    ride.dropLocation && 
    ride.time &&
    ride.status === 'pending'
  );

  if (validRides.length !== rides.length) {
    return false;
  }

  // Check time compatibility
  const baseTime = new Date(`2000-01-01T${rides[0].time}`).getTime();
  for (let i = 1; i < rides.length; i++) {
    const rideTime = new Date(`2000-01-01T${rides[i].time}`).getTime();
    const timeDiff = Math.abs(rideTime - baseTime);
    if (timeDiff > config.maxTimeWindowDifference * 60 * 1000) {
      return false;
    }
  }

  // Check location compatibility
  for (let i = 0; i < rides.length - 1; i++) {
    for (let j = i + 1; j < rides.length; j++) {
      const distance = calculateDistance(
        rides[i].pickupLocation.coordinates,
        rides[j].pickupLocation.coordinates
      );
      if (distance > config.maxPickupDistance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculates distance between two points using Haversine formula
 */
function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI/180;
  const φ2 = point2.lat * Math.PI/180;
  const Δφ = (point2.lat - point1.lat) * Math.PI/180;
  const Δλ = (point2.lng - point1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = {
  validateGroup,
  calculateDistance,
  config
}; 