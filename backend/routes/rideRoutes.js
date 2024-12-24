const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { 
  createRide, 
  getUserRides, 
  getAllRides,
  assignDriver,
  updateRideStatus,
  deleteRide,
  getDrivers,
  getDashboardMetrics,
  getCompletedRides
} = require('../controllers/rideController');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const RideGroup = require('../models/RideGroup');
const User = require('../models/User');

// Add middleware consolidation at the top
const adminOnly = [verifyToken, checkRole(['admin', 'developer'])];
const driverAndAdmin = [verifyToken, checkRole(['driver', 'admin', 'developer'])];

// Create a new ride
router.post('/', verifyToken, createRide);

// Get user's rides
router.get('/my-rides', verifyToken, async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id })
      .populate({
        path: 'driverId',
        select: 'name email phone vehicle isAvailable',
        model: 'Driver'
      })
      .sort({ date: -1 });

    // Transform the data to match the frontend expectations
    const transformedRides = rides.map(ride => ({
      ...ride.toObject(),
      driver: ride.driverId ? {
        name: ride.driverId.name,
        phone: ride.driverId.phone,
        email: ride.driverId.email,
        vehicle: ride.driverId.vehicle,
        isAvailable: ride.driverId.isAvailable
      } : null
    }));

    res.json(transformedRides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Error fetching rides' });
  }
});

// Get all rides (admin/developer only)
router.get('/all', adminOnly, async (req, res) => {
  try {
    // Define status priority
    const statusPriority = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4
    };

    // Fetch all rides with populated driver and user info
    const rides = await Ride.find()
      .populate({
        path: 'driverId',
        select: 'name email phone vehicle isAvailable'
      })
      .populate({
        path: 'userId',
        select: 'name email'
      });

    console.log('Sample ride metrics:', rides[0]?.metrics);

    // Transform and sort the rides
    const transformedRides = rides.map(ride => {
      const rideObj = ride.toObject();
      const transformed = {
        ...rideObj,
        user: ride.userId ? {
          name: ride.userId.name,
          email: ride.userId.email
        } : null,
        driver: ride.driverId ? {
          name: ride.driverId.name,
          phone: ride.driverId.phone,
          email: ride.driverId.email,
          vehicle: ride.driverId.vehicle,
          isAvailable: ride.driverId.isAvailable
        } : null,
        metrics: rideObj.metrics
      };
      console.log('Transformed ride metrics:', transformed.metrics);
      return transformed;
    });

    // Sort rides by status priority, then date, then time
    const sortedRides = transformedRides.sort((a, b) => {
      // First, sort by status priority
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;

      // If status is same, sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      // If date is same, sort by time
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      // Compare hours
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      
      // If hours are same, compare minutes
      return timeA[1] - timeB[1];
    });

    console.log('Sorted rides by priority:', sortedRides.map(ride => ({
      status: ride.status,
      date: new Date(ride.date).toLocaleDateString(),
      time: ride.time,
      userName: ride.user?.name || 'Anonymous'
    })));

    res.json(sortedRides);
  } catch (error) {
    console.error('Error fetching all rides:', error);
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

// Assign driver to ride
router.put('/:rideId/assign-driver', adminOnly, assignDriver);

// Update ride status
router.put('/:rideId/status', verifyToken, updateRideStatus);

// Delete ride
router.delete('/:rideId', verifyToken, deleteRide);

// Get dashboard metrics (admin/developer only)
router.get('/metrics', adminOnly, getDashboardMetrics);

// Get completed rides
router.get('/completed', verifyToken, getCompletedRides);

// Get driver's rides
router.get('/driver-rides', verifyToken, checkRole(['driver']), async (req, res) => {
  try {
    console.log('Fetching rides for driver with userId:', req.user.id);
    
    // Get the driver record for the authenticated user
    const driver = await Driver.findOne({ userId: req.user.id });
    
    if (!driver) {
      console.log('Driver not found for userId:', req.user.id);
      return res.status(404).json({ message: 'Driver not found' });
    }

    console.log('Found driver:', driver._id);

    // Define status priority for sorting
    const statusPriority = {
      'confirmed': 1,
      'completed': 2,
      'cancelled': 3
    };

    // Get all rides assigned to this driver (not just pending/confirmed)
    const rides = await Ride.find({ 
      driverId: driver._id
    })
    .populate({
      path: 'driverId',
      select: 'name email phone vehicle isAvailable'
    });

    // Transform and sort the rides
    const transformedRides = rides.map(ride => ({
      ...ride.toObject(),
      driver: ride.driverId ? {
        name: ride.driverId.name,
        phone: ride.driverId.phone,
        email: ride.driverId.email,
        vehicle: ride.driverId.vehicle,
        isAvailable: ride.driverId.isAvailable
      } : null
    }));

    // Sort rides by status priority, then date, then time
    const sortedRides = transformedRides.sort((a, b) => {
      // First, sort by status priority
      const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;

      // If status is same, sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      // If date is same, sort by time
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      // Compare hours
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      
      // If hours are same, compare minutes
      return timeA[1] - timeB[1];
    });

    console.log(`Found and sorted ${sortedRides.length} rides for driver:`, 
      sortedRides.map(ride => ({
        status: ride.status,
        date: new Date(ride.date).toLocaleDateString(),
        time: ride.time
      }))
    );

    res.json(sortedRides);
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    res.status(500).json({ 
      message: 'Failed to fetch driver rides',
      error: error.message 
    });
  }
});

// Add this route for removing driver
router.put('/:rideId/remove-driver', adminOnly, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        $unset: { driverId: 1 },
        status: 'pending'
      },
      { new: true }
    ).populate({
      path: 'driverId',
      select: 'name email phone vehicle isAvailable'
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Error removing driver:', error);
    res.status(500).json({ message: 'Failed to remove driver' });
  }
});

// Add or update the group route handler
router.post('/group', adminOnly, async (req, res) => {
  try {
    const { rideIds } = req.body;
    console.log('Creating ride group with IDs:', rideIds);
    console.log('User in request:', req.user); // Debug user info

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!rideIds || !Array.isArray(rideIds) || rideIds.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty ride IDs provided' });
    }

    // Verify all rides exist and are pending
    const rides = await Ride.find({ 
      _id: { $in: rideIds },
      status: 'pending'
    });
    console.log('Found rides:', rides);

    if (rides.length !== rideIds.length) {
      return res.status(400).json({ 
        message: 'Some rides are not available for grouping' 
      });
    }

    // Create the group
    const group = await RideGroup.create({
      rides: rideIds,
      createdBy: req.user.id, // Use req.user.id instead of req.user._id
      createdAt: new Date()
    });
    console.log('Created group:', group);

    // Update all rides to reference this group
    await Ride.updateMany(
      { _id: { $in: rideIds } },
      { $set: { groupId: group._id } }
    );

    res.json({ 
      groupId: group._id,
      message: 'Ride group created successfully' 
    });
  } catch (error) {
    console.error('Error creating ride group:', error.stack); // Log full error stack
    res.status(500).json({ 
      message: 'Failed to create ride group',
      error: error.message,
      stack: error.stack
    });
  }
});

router.get('/groups', adminOnly, async (req, res) => {
  try {
    const groups = await RideGroup.find()
      .populate('rides', '_id')
      .sort('-createdAt');
    
    console.log('Sending groups:', groups);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching ride groups:', error);
    res.status(500).json({ message: 'Failed to fetch ride groups' });
  }
});

router.put('/groups/:groupId', adminOnly, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { rideIds } = req.body;

    if (!rideIds || !Array.isArray(rideIds)) {
      return res.status(400).json({ message: 'Invalid ride IDs provided' });
    }

    // Remove group reference from old rides
    await Ride.updateMany(
      { groupId: groupId },
      { $unset: { groupId: "" } }
    );

    // Update group with new rides
    const group = await RideGroup.findByIdAndUpdate(
      groupId,
      { rides: rideIds },
      { new: true }
    );

    // Add group reference to new rides
    await Ride.updateMany(
      { _id: { $in: rideIds } },
      { $set: { groupId: groupId } }
    );

    res.json(group);
  } catch (error) {
    console.error('Error updating ride group:', error);
    res.status(500).json({ message: 'Failed to update ride group' });
  }
});

router.delete('/groups/:groupId/rides/:rideId', adminOnly, async (req, res) => {
  try {
    const { groupId, rideId } = req.params;

    // Remove ride from group
    await RideGroup.findByIdAndUpdate(
      groupId,
      { $pull: { rides: rideId } }
    );

    // Remove group reference from ride
    await Ride.findByIdAndUpdate(
      rideId,
      { $unset: { groupId: "" } }
    );

    res.json({ message: 'Ride removed from group successfully' });
  } catch (error) {
    console.error('Error removing ride from group:', error);
    res.status(500).json({ message: 'Failed to remove ride from group' });
  }
});

module.exports = router; 