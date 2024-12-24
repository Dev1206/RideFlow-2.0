export default {
  maxGroupSize: 4,
  minGroupSize: 2,
  maxTimeWindowDifference: 15, // minutes
  maxPickupDistance: 2000, // meters
  maxDetourDistance: 3000, // meters
  trafficThresholds: {
    light: 0.3,
    medium: 0.6,
    heavy: 0.9
  },
  groupSizeByTraffic: {
    light: 4,
    medium: 3,
    heavy: 2
  },
  timeWindowBuffer: 5, // minutes
  maxWaitTime: 10, // minutes
  optimizationWeights: {
    distance: 0.6,
    time: 0.4
  }
}; 