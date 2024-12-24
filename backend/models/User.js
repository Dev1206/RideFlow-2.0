const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: ['customer'],
    enum: ['customer', 'driver', 'admin', 'developer']
  },
  profilePicture: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add index for better query performance
userSchema.index({ email: 1, firebaseUID: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;