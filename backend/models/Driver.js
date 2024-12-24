const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  vehicle: {
    make: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: ''
    },
    plateNumber: {
      type: String,
      default: ''
    }
  },
  isAvailable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
driverSchema.index({ userId: 1, firebaseUID: 1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 