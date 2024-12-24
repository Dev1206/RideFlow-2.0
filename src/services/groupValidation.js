class GroupValidationService {
  validateGroupCreation(rides, driver) {
    const errors = [];
    
    // Validate ride statuses
    const invalidStatusRides = rides.filter(ride => 
      !['PENDING', 'CONFIRMED'].includes(ride.status)
    );
    if (invalidStatusRides.length > 0) {
      errors.push({
        code: 'INVALID_RIDE_STATUS',
        message: 'Some rides have invalid status for grouping',
        rides: invalidStatusRides.map(r => r._id)
      });
    }

    // Validate driver availability
    if (driver && driver.status !== 'AVAILABLE') {
      errors.push({
        code: 'DRIVER_UNAVAILABLE',
        message: 'Selected driver is not available'
      });
    }

    // Validate group size
    if (rides.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_RIDES',
        message: 'At least 2 rides are required for grouping'
      });
    }

    // Validate schedule conflicts
    const scheduleConflicts = this.checkScheduleConflicts(rides);
    if (scheduleConflicts.length > 0) {
      errors.push({
        code: 'SCHEDULE_CONFLICT',
        message: 'Schedule conflicts detected between rides',
        conflicts: scheduleConflicts
      });
    }

    // Validate distance constraints
    const distanceViolations = this.checkDistanceConstraints(rides);
    if (distanceViolations.length > 0) {
      errors.push({
        code: 'DISTANCE_CONSTRAINT_VIOLATION',
        message: 'Some rides exceed maximum allowed distance',
        violations: distanceViolations
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  checkScheduleConflicts(rides) {
    const conflicts = [];
    for (let i = 0; i < rides.length; i++) {
      for (let j = i + 1; j < rides.length; j++) {
        const time1 = new Date(rides[i].scheduledTime);
        const time2 = new Date(rides[j].scheduledTime);
        const timeDiff = Math.abs(time1 - time2) / (1000 * 60); // in minutes

        if (timeDiff > 15) { // 15 minutes threshold
          conflicts.push({
            ride1: rides[i]._id,
            ride2: rides[j]._id,
            timeDifference: timeDiff
          });
        }
      }
    }
    return conflicts;
  }

  checkDistanceConstraints(rides) {
    const violations = [];
    for (let i = 0; i < rides.length; i++) {
      for (let j = i + 1; j < rides.length; j++) {
        const distance = this.calculateDistance(
          rides[i].pickupLocation,
          rides[j].pickupLocation
        );

        if (distance > 5000) { // 5km threshold
          violations.push({
            ride1: rides[i]._id,
            ride2: rides[j]._id,
            distance
          });
        }
      }
    }
    return violations;
  }

  calculateDistance(point1, point2) {
    // Haversine formula implementation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.coordinates[1] * Math.PI/180;
    const φ2 = point2.coordinates[1] * Math.PI/180;
    const Δφ = (point2.coordinates[1] - point1.coordinates[1]) * Math.PI/180;
    const Δλ = (point2.coordinates[0] - point1.coordinates[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

module.exports = new GroupValidationService(); 