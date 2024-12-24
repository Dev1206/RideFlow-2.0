const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateToken } = require('../middleware/auth');
const Ride = require('../models/Ride');
const mongoose = require('mongoose');

// Get user by Firebase UID
exports.getUserByFirebaseUID = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.params.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { email, firebaseUID, name, profilePicture } = req.body;
    
    let user = await User.findOne({ 
      $or: [{ firebaseUID }, { email }] 
    });
    
    if (user) {
      const token = generateToken(user);
      return res.status(200).json({
        user,
        token
      });
    }

    let userRoles = ['customer'];
    if (email === 'rideflowdeveloper@gmail.com') {
      userRoles = ['developer', 'admin', 'driver', 'customer'];
    }

    user = new User({
      email,
      firebaseUID,
      name,
      profilePicture,
      roles: userRoles
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    console.log('Fetching drivers...');
    const drivers = await Driver.find()
      .populate('userId', 'name email');
    
    console.log('Found drivers:', drivers);
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch drivers',
      error: error.message 
    });
  }
};

// Update user roles
exports.updateUserRoles = async (req, res) => {
  try {
    const { roles } = req.body;
    const { firebaseUID } = req.params;

    console.log('Updating roles for user:', firebaseUID);
    console.log('New roles:', roles);

    // Find user by firebaseUID
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      console.log('User not found:', firebaseUID);
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRoles = [...user.roles];
    const wasDriver = oldRoles.includes('driver');
    const willBeDriver = roles.includes('driver');

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!wasDriver && willBeDriver) {
        // Adding driver role
        console.log('Adding driver role - creating driver record');
        
        // Check if driver record already exists
        let existingDriver = await Driver.findOne({ userId: user._id }).session(session);
        
        if (!existingDriver) {
          // Create new driver record
          const newDriver = new Driver({
            userId: user._id,
            firebaseUID: user.firebaseUID,
            name: user.name || '',
            email: user.email || '',
            phone: '',
            vehicle: {
              make: '',
              model: '',
              color: '',
              plateNumber: ''
            },
            isAvailable: true
          });

          await newDriver.save({ session });
          console.log('Created new driver entry');
        }
      } else if (wasDriver && !willBeDriver) {
        // Removing driver role
        console.log('Removing driver role - deleting driver record');
        await Driver.findOneAndDelete({ userId: user._id }).session(session);
      }

      // Update user roles
      user.roles = roles;
      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      // Fetch the updated driver info if needed
      const driverInfo = willBeDriver ? 
        await Driver.findOne({ userId: user._id }) : null;

      res.json({
        message: 'User roles updated successfully',
        user: {
          ...user.toObject(),
          roles,
          driverInfo
        }
      });

    } catch (error) {
      // If anything fails, abort transaction
      await session.abortTransaction();
      console.error('Transaction aborted:', error);
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error updating user roles:', error);
    res.status(400).json({ 
      message: 'Failed to update roles',
      error: error.message,
      details: error.stack
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    
    // Get booking counts for each user
    const usersWithBookings = await Promise.all(users.map(async (user) => {
      const activeBookings = await Ride.countDocuments({
        userId: user._id,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      const totalBookings = await Ride.countDocuments({
        userId: user._id
      });

      return {
        ...user.toObject(),
        activeBookings,
        totalBookings
      };
    }));

    res.json(usersWithBookings);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
};

// Update driver information
exports.updateDriver = async (req, res) => {
  try {
    const { name, phone, vehicle, isAvailable } = req.body;
    console.log('Updating driver:', req.params.driverId, req.body);

    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update driver information
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (vehicle) driver.vehicle = vehicle;
    if (typeof isAvailable === 'boolean') driver.isAvailable = isAvailable;

    const updatedDriver = await driver.save();
    console.log('Driver updated:', updatedDriver);

    // Also update the user name if it changed
    if (name) {
      await User.findByIdAndUpdate(driver.userId, { name });
    }

    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ 
      message: 'Failed to update driver',
      error: error.message 
    });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ 
        message: 'Invalid driver ID format',
        details: `Received ID: ${driverId}`
      });
    }

    console.log(`Attempting to delete driver with ID: ${driverId}`);

    // Find the driver first
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ 
        message: 'Driver not found',
        details: `No driver found with ID: ${driverId}`
      });
    }

    // Find the associated user and remove the driver role
    const user = await User.findById(driver.userId);
    if (user) {
      user.roles = user.roles.filter(role => role !== 'driver');
      await user.save();
      console.log(`Removed driver role from user ${user._id}`);
    }

    // Delete the driver
    await Driver.findByIdAndDelete(driverId);
    console.log(`Successfully deleted driver with ID: ${driverId}`);
    
    res.json({ 
      message: 'Driver deleted successfully',
      deletedId: driverId,
      updatedUser: user ? {
        id: user._id,
        roles: user.roles
      } : null
    });

  } catch (error) {
    console.error('Error in delete driver:', error);
    res.status(500).json({ 
      message: 'Server error while deleting driver',
      error: error.message 
    });
  }
};

exports.getAdminContact = async (req, res) => {
  try {
    const admin = await User.findOne({ roles: 'admin' })
      .select('email')
      .sort({ createdAt: 1 }); // Get the first admin

    if (!admin) {
      return res.status(404).json({ message: 'Admin contact not found' });
    }

    res.json({ email: admin.email });
  } catch (error) {
    console.error('Error fetching admin contact:', error);
    res.status(500).json({ 
      message: 'Failed to fetch admin contact',
      error: error.message 
    });
  }
};

exports.getDriverInfo = async (req, res) => {
  try {
    console.log('Fetching driver info for user:', req.user.id);
    
    // Find driver by userId instead of firebaseUID
    const driver = await Driver.findOne({ userId: req.user.id });
    
    if (!driver) {
      console.log('Driver not found for user:', req.user.id);
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error in getDriverInfo:', error);
    res.status(500).json({ 
      message: 'Failed to fetch driver info',
      error: error.message 
    });
  }
};

exports.updateDriverInfo = async (req, res) => {
  try {
    const { phone, vehicle } = req.body;
    const driver = await Driver.findOne({ firebaseUID: req.user.firebaseUID });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (phone) driver.phone = phone;
    if (vehicle) driver.vehicle = vehicle;

    await driver.save();
    console.log('Driver info updated:', driver);
    res.json(driver);
  } catch (error) {
    console.error('Error updating driver info:', error);
    res.status(500).json({ 
      message: 'Failed to update driver info',
      error: error.message 
    });
  }
};

// Create driver
exports.createDriver = async (req, res) => {
  try {
    // Find user to get firebaseUID
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if driver already exists by userId
    const existingDriver = await Driver.findOne({ userId: req.body.userId });
    
    if (existingDriver) {
      // If driver exists, update their information instead
      existingDriver.name = req.body.name;
      existingDriver.email = req.body.email;
      existingDriver.phone = req.body.phone || '';
      existingDriver.vehicle = {
        make: req.body.vehicle?.make || '',
        model: req.body.vehicle?.model || '',
        color: req.body.vehicle?.color || '',
        plateNumber: req.body.vehicle?.plateNumber || ''
      };
      existingDriver.isAvailable = true;
      existingDriver.firebaseUID = user.firebaseUID;

      const updatedDriver = await existingDriver.save();
      return res.json(updatedDriver);
    }

    // Create new driver if doesn't exist
    const driver = new Driver({
      userId: req.body.userId,
      firebaseUID: user.firebaseUID,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      vehicle: {
        make: req.body.vehicle?.make || '',
        model: req.body.vehicle?.model || '',
        color: req.body.vehicle?.color || '',
        plateNumber: req.body.vehicle?.plateNumber || ''
      },
      isAvailable: true
    });

    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error creating/updating driver:', error);
    res.status(500).json({ 
      message: 'Failed to create/update driver',
      error: error.message 
    });
  }
};