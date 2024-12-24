const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  dropLocation: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  returnRide: {
    type: Boolean,
    default: false
  },
  returnDate: {
    type: Date
  },
  returnTime: {
    type: String
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  pickupCoordinates: {
    lat: Number,
    lng: Number
  },
  dropCoordinates: {
    lat: Number,
    lng: Number
  },
  metrics: {
    distance: {
      text: String,    // e.g., "5.2 km"
      value: Number    // distance in meters
    },
    duration: {
      text: String,    // e.g., "15 mins"
      value: Number    // duration in seconds
    }
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideGroup',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for populated driver details
rideSchema.virtual('driverDetails', {
  ref: 'Driver',
  localField: 'driverId',
  foreignField: '_id',
  justOne: true
});

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 