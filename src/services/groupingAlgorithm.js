const config = require('../config');
const { calculateDistance, calculateBearingAngle } = require('../utils/geoUtils');

class GroupingAlgorithm {
  constructor() {
    this.config = {
      maxDistance: config.grouping.maxDistance || 5000, // meters
      maxTimeWindow: config.grouping.maxTimeWindow || 900, // 15 minutes in seconds
      maxDirectionDeviation: config.grouping.maxDirectionDeviation || 30, // degrees
      minEfficiencyGain: config.grouping.minEfficiencyGain || 0.2 // 20% minimum efficiency gain
    };
  }

  async findCompatibleRides(ride, availableRides) {
    try {
      const compatibleRides = [];
      const rideDirection = this.calculateTravelDirection(ride);

      for (const candidate of availableRides) {
        if (ride._id === candidate._id) continue;

        const compatibility = await this.checkCompatibility(ride, candidate, rideDirection);
        if (compatibility.isCompatible) {
          compatibleRides.push({
            ride: candidate,
            score: compatibility.score,
            metrics: compatibility.metrics
          });
        }
      }

      return compatibleRides.sort((a, b) => b.score - a.score);
    } catch (error) {
      throw new Error(`Failed to find compatible rides: ${error.message}`);
    }
  }

  async checkCompatibility(ride1, ride2, ride1Direction) {
    try {
      const ride2Direction = this.calculateTravelDirection(ride2);
      const directionDiff = Math.abs(ride1Direction - ride2Direction);
      
      const distance = calculateDistance(
        ride1.pickupLocation.coordinates,
        ride2.pickupLocation.coordinates
      );

      const timeOverlap = this.calculateTimeOverlap(
        ride1.scheduledTime,
        ride2.scheduledTime
      );

      const efficiencyGain = this.calculateEfficiencyGain(ride1, ride2);

      const isCompatible = 
        distance <= this.config.maxDistance &&
        timeOverlap >= 0 &&
        timeOverlap <= this.config.maxTimeWindow &&
        directionDiff <= this.config.maxDirectionDeviation &&
        efficiencyGain >= this.config.minEfficiencyGain;

      return {
        isCompatible,
        score: isCompatible ? this.calculateCompatibilityScore(
          distance,
          timeOverlap,
          directionDiff,
          efficiencyGain
        ) : 0,
        metrics: {
          distance,
          timeOverlap,
          directionDiff,
          efficiencyGain
        }
      };
    } catch (error) {
      throw new Error(`Failed to check ride compatibility: ${error.message}`);
    }
  }

  calculateTravelDirection(ride) {
    return calculateBearingAngle(
      ride.pickupLocation.coordinates,
      ride.dropoffLocation.coordinates
    );
  }

  calculateTimeOverlap(time1, time2) {
    return Math.abs(new Date(time1) - new Date(time2)) / 1000; // in seconds
  }

  calculateEfficiencyGain(ride1, ride2) {
    const individualDistance = 
      calculateDistance(ride1.pickupLocation.coordinates, ride1.dropoffLocation.coordinates) +
      calculateDistance(ride2.pickupLocation.coordinates, ride2.dropoffLocation.coordinates);

    const combinedDistance = 
      calculateDistance(ride1.pickupLocation.coordinates, ride2.pickupLocation.coordinates) +
      calculateDistance(ride2.pickupLocation.coordinates, ride2.dropoffLocation.coordinates) +
      calculateDistance(ride2.dropoffLocation.coordinates, ride1.dropoffLocation.coordinates);

    return (individualDistance - combinedDistance) / individualDistance;
  }

  calculateCompatibilityScore(distance, timeOverlap, directionDiff, efficiencyGain) {
    const distanceScore = 1 - (distance / this.config.maxDistance);
    const timeScore = 1 - (timeOverlap / this.config.maxTimeWindow);
    const directionScore = 1 - (directionDiff / this.config.maxDirectionDeviation);
    const efficiencyScore = efficiencyGain;

    return (distanceScore + timeScore + directionScore + efficiencyScore) / 4;
  }
}

module.exports = new GroupingAlgorithm(); 