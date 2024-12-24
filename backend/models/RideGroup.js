const mongoose = require('mongoose');

const rideGroupSchema = new mongoose.Schema({
  rides: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  route: {
    type: {
      type: String,
      enum: ['optimized', 'sequential'],
      default: 'optimized'
    },
    waypoints: [{
      location: {
        type: String,
        required: true
      },
      coordinates: {
        lat: Number,
        lng: Number
      },
      type: {
        type: String,
        enum: ['pickup', 'dropoff'],
        required: true
      },
      rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
      },
      estimatedArrival: Date
    }]
  },
  metrics: {
    totalDistance: {
      value: Number, // in meters
      text: String
    },
    totalDuration: {
      value: Number, // in seconds
      text: String
    },
    fuelSavings: {
      value: Number, // in liters
      text: String
    },
    efficiency: {
      value: Number, // percentage
      text: String
    }
  },
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'driver_assigned', 'status_changed', 'ride_added', 'ride_removed'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for common queries
rideGroupSchema.index({ status: 1, createdAt: -1 });
rideGroupSchema.index({ driverId: 1, status: 1 });
rideGroupSchema.index({ 'route.waypoints.rideId': 1 });

// Validation middleware
rideGroupSchema.pre('save', async function(next) {
  // Validate group size
  if (this.rides.length < 2 || this.rides.length > 4) {
    throw new Error('Group size must be between 2 and 4 rides');
  }

  // Update timestamps
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
    } else if (this.status === 'cancelled') {
      this.cancelledAt = new Date();
    }
  }

  this.updatedAt = new Date();
  next();
});

// Methods
rideGroupSchema.methods.addRide = async function(rideId, userId) {
  if (this.rides.length >= 4) {
    throw new Error('Maximum group size reached');
  }
  
  this.rides.push(rideId);
  this.history.push({
    action: 'ride_added',
    performedBy: userId,
    details: { rideId }
  });
  
  return this.save();
};

rideGroupSchema.methods.removeRide = async function(rideId, userId) {
  if (this.rides.length <= 2) {
    throw new Error('Minimum group size is 2 rides');
  }
  
  this.rides = this.rides.filter(id => id.toString() !== rideId.toString());
  this.history.push({
    action: 'ride_removed',
    performedBy: userId,
    details: { rideId }
  });
  
  return this.save();
};

rideGroupSchema.methods.assignDriver = async function(driverId, userId) {
  this.driverId = driverId;
  this.status = 'confirmed';
  this.history.push({
    action: 'driver_assigned',
    performedBy: userId,
    details: { driverId }
  });
  
  return this.save();
};

rideGroupSchema.methods.updateStatus = async function(status, userId) {
  this.status = status;
  this.history.push({
    action: 'status_changed',
    performedBy: userId,
    details: { oldStatus: this.status, newStatus: status }
  });
  
  return this.save();
};

module.exports = mongoose.model('RideGroup', rideGroupSchema); 