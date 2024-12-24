const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const User = require('../models/User');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working' });
});

// Profile route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Profile request:', {
      userId: req.user?.id,
      firebaseUID: req.user?.firebaseUID
    });

    const user = await User.findOne({ 
      firebaseUID: req.user.firebaseUID 
    });

    if (!user) {
      console.log('User not found for firebaseUID:', req.user.firebaseUID);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      roles: user.roles
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile',
      error: error.message 
    });
  }
});

// Admin contact route
router.get('/admin-contact', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const adminUser = await User.findOne({ 
      roles: 'admin',
      firebaseUID: req.user.firebaseUID 
    });

    if (!adminUser) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      email: adminUser.email,
      name: adminUser.name
    });
  } catch (error) {
    console.error('Admin contact error:', error);
    res.status(500).json({ 
      message: 'Error fetching admin contact',
      error: error.message 
    });
  }
});

// Get all users (admin only)
router.get('/all', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

// Update user roles and handle driver creation/deletion
router.put('/:firebaseUID/roles', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { roles } = req.body;
    const Driver = require('../models/Driver');

    // Find user first
    const user = await User.findOne({ firebaseUID: req.params.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if driver role is being added
    const isBecomingDriver = roles.includes('driver') && !user.roles.includes('driver');
    // Check if driver role is being removed
    const isLosingDriver = !roles.includes('driver') && user.roles.includes('driver');

    // Update user roles
    user.roles = roles;
    await user.save();

    // If user is becoming a driver, create driver document
    if (isBecomingDriver) {
      console.log('Creating new driver document for user:', user.email);
      
      const newDriver = new Driver({
        userId: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: '',
        vehicle: {
          make: '',
          model: '',
          color: '',
          plateNumber: ''
        },
        isAvailable: false
      });

      await newDriver.save();
      console.log('Driver document created:', newDriver);
    }

    // If driver role is being removed, delete driver document
    if (isLosingDriver) {
      console.log('Removing driver document for user:', user.email);
      await Driver.findOneAndDelete({ userId: user._id });
    }

    res.json({ 
      user,
      message: isBecomingDriver 
        ? 'User roles updated and driver profile created' 
        : isLosingDriver 
          ? 'User roles updated and driver profile removed'
          : 'User roles updated'
    });
  } catch (error) {
    console.error('Error updating roles:', error);
    res.status(500).json({ 
      message: 'Error updating user roles',
      error: error.message 
    });
  }
});

// Create user route
router.post('/', async (req, res) => {
  try {
    console.log('Create user request:', req.body);
    
    // Get Firebase token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify Firebase token
    const admin = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const { firebaseUID, email, name } = req.body;
    
    // Verify that the token UID matches the provided firebaseUID
    if (decodedToken.uid !== firebaseUID) {
      return res.status(403).json({ message: 'Token does not match user ID' });
    }

    if (!firebaseUID || !email || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });
    
    if (user) {
      // Update existing user's information
      user.email = email;
      user.name = name;
      await user.save();
      
      // Generate JWT token for existing user
      const token = require('../middleware/auth').generateToken(user);
      return res.json({ 
        success: true,
        data: { user, token }
      });
    }

    // Create new user
    user = new User({
      firebaseUID,
      email,
      name,
      roles: ['customer'] // Default role
    });

    await user.save();
    console.log('New user created:', user);

    // Generate JWT token for new user
    const jwtToken = require('../middleware/auth').generateToken(user);
    
    res.status(201).json({ 
      success: true,
      data: { user, token: jwtToken }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating user',
      error: error.message 
    });
  }
});

// Add this route to check token validity
router.get('/verify-token', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles
    }
  });
});

// Get all drivers
router.get('/drivers', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    console.log('Fetching all drivers');
    
    const drivers = await Driver.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${drivers.length} drivers`);
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch drivers',
      error: error.message 
    });
  }
});

// Get driver by ID
router.get('/drivers/:id', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ 
      message: 'Failed to fetch driver',
      error: error.message 
    });
  }
});

// Update driver
router.put('/drivers/:id', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const { phone, vehicle, isAvailable } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { 
        phone,
        vehicle,
        isAvailable,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ 
      message: 'Failed to update driver',
      error: error.message 
    });
  }
});

// Delete driver
router.delete('/drivers/:id', verifyToken, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findByIdAndDelete(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update the user's roles if needed
    const User = require('../models/User');
    await User.findByIdAndUpdate(driver.userId, {
      $pull: { roles: 'driver' }
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ 
      message: 'Failed to delete driver',
      error: error.message 
    });
  }
});

// Add these routes for driver info
router.get('/driver-info', verifyToken, checkRole(['driver']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findOne({ firebaseUID: req.user.firebaseUID });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver info:', error);
    res.status(500).json({ 
      message: 'Failed to fetch driver info',
      error: error.message 
    });
  }
});

// Add route to update driver info
router.put('/driver-info', verifyToken, checkRole(['driver']), async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const { phone, vehicle } = req.body;
    
    let driver = await Driver.findOne({ firebaseUID: req.user.firebaseUID });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Update driver info
    driver.phone = phone;
    driver.vehicle = vehicle;
    await driver.save();
    
    res.json(driver);
  } catch (error) {
    console.error('Error updating driver info:', error);
    res.status(500).json({ 
      message: 'Failed to update driver info',
      error: error.message 
    });
  }
});

module.exports = router;