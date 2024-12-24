interface Coordinates {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

function toRad(degrees: number): number {
  return degrees * (Math.PI/180);
}

// Check if two locations are within the proximity threshold
export function isWithinProximity(coord1: Coordinates, coord2: Coordinates, thresholdKm: number = 5): boolean {
  const distance = calculateDistance(coord1, coord2);
  return distance <= thresholdKm;
}

// Check if two times are within the time threshold
export function isWithinTimeThreshold(time1: string, time2: string, thresholdMinutes: number = 15): boolean {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;
  
  return Math.abs(totalMinutes1 - totalMinutes2) <= thresholdMinutes;
}

// Group rides based on proximity and time
export const groupRides = (rides: any[]) => {
  console.log('Starting grouping process with rides:', rides.map(r => ({
    id: r._id,
    status: r.status,
    time: r.time,
    coordinates: r.pickupCoordinates
  })));

  if (!rides.length) {
    console.log('No rides to group');
    return [];
  }

  // Sort rides by time
  const sortedRides = [...rides].sort((a, b) => {
    const timeA = a.time.split(':').map(Number);
    const timeB = b.time.split(':').map(Number);
    const minutesA = timeA[0] * 60 + timeA[1];
    const minutesB = timeB[0] * 60 + timeB[1];
    return minutesA - minutesB;
  });

  console.log('Sorted rides by time:', sortedRides.map(r => ({
    id: r._id,
    time: r.time
  })));

  const groups: any[][] = [];
  const MAX_GROUP_SIZE = 4;
  const MAX_TIME_DIFF = 15; // 15 minutes

  // First pass: Group by time
  sortedRides.forEach(ride => {
    let addedToGroup = false;

    // Try to add to existing groups
    for (const group of groups) {
      if (group.length >= MAX_GROUP_SIZE) continue;

      // Check if this ride's time is within 15 minutes of all rides in the group
      const canAddToGroup = group.every(existingRide => {
        const rideMinutes = getMinutes(ride.time);
        const existingMinutes = getMinutes(existingRide.time);
        const timeDiff = Math.abs(rideMinutes - existingMinutes);

        console.log('Time comparison:', {
          ride1: ride._id,
          ride2: existingRide._id,
          time1: ride.time,
          time2: existingRide.time,
          timeDiff,
          withinLimit: timeDiff <= MAX_TIME_DIFF
        });

        return timeDiff <= MAX_TIME_DIFF;
      });

      if (canAddToGroup) {
        group.push(ride);
        addedToGroup = true;
        console.log(`Added ride ${ride._id} to group ${groups.indexOf(group)}`);
        break;
      }
    }

    if (!addedToGroup) {
      groups.push([ride]);
      console.log(`Created new group with ride ${ride._id}`);
    }
  });

  // Second pass: Split groups by distance if needed
  const finalGroups: any[][] = [];
  const MAX_DISTANCE = 5; // 5 kilometers

  groups.forEach(timeGroup => {
    if (timeGroup.length === 1) {
      finalGroups.push(timeGroup);
      return;
    }

    const distanceGroups: any[][] = [];
    timeGroup.forEach(ride => {
      let addedToGroup = false;

      for (const group of distanceGroups) {
        if (group.length >= MAX_GROUP_SIZE) continue;

        const canAddToGroup = group.every(existingRide => {
          if (!ride.pickupCoordinates || !existingRide.pickupCoordinates) {
            return false;
          }

          const distance = calculateDistance(
            ride.pickupCoordinates,
            existingRide.pickupCoordinates
          );

          console.log('Distance comparison:', {
            ride1: ride._id,
            ride2: existingRide._id,
            distance,
            withinLimit: distance <= MAX_DISTANCE
          });

          return distance <= MAX_DISTANCE;
        });

        if (canAddToGroup) {
          group.push(ride);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        distanceGroups.push([ride]);
      }
    });

    finalGroups.push(...distanceGroups);
  });

  console.log('Final groups:', finalGroups.map((group, index) => ({
    groupIndex: index,
    size: group.length,
    rides: group.map(r => ({
      id: r._id,
      time: r.time,
      location: r.pickupLocation
    }))
  })));

  return finalGroups;
};

const getMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}; 