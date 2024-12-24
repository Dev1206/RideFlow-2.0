module.exports = {
  // Distance thresholds
  maxPickupDistance: 5000, // meters
  maxDropoffDistance: 7000, // meters
  maxTotalRouteDeviation: 0.3, // 30% maximum route deviation

  // Time constraints
  maxTimeWindow: 900, // 15 minutes in seconds
  maxWaitTime: 600, // 10 minutes in seconds
  maxTotalTripDuration: 3600, // 1 hour in seconds

  // Direction and routing
  maxDirectionDeviation: 30, // degrees
  minRouteEfficiency: 0.2, // 20% minimum efficiency gain
  
  // Group constraints
  minGroupSize: 2,
  maxGroupSize: 4,
  
  // Scoring weights
  weights: {
    distance: 0.3,
    time: 0.3,
    direction: 0.2,
    efficiency: 0.2
  },

  // UI configuration
  ui: {
    colors: {
      compatible: '#87d068',
      incompatible: '#f5222d',
      warning: '#faad14',
      neutral: '#1890ff'
    },
    refreshInterval: 30000, // 30 seconds
    timelineFormat: 'HH:mm',
    distanceUnit: 'km',
    timeUnit: 'min'
  },

  // Error thresholds
  errorThresholds: {
    distanceTooFar: 10000, // meters
    timeTooLong: 1800, // 30 minutes in seconds
    maxRetries: 3
  }
}; 