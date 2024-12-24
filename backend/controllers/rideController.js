const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');
const emailService = require('../services/emailService');
const { calculateRouteMetrics } = require('../utils/googleMaps');
const RideGroup = require('../models/RideGroup');
const { validateGroup } = require('../utils/groupingUtils');
const mongoose = require('mongoose');

// Helper function to get admin email
const getAdminEmail = async () => {
  const admin = await User.findOne({ roles: 'admin' }).select('email').sort({ createdAt: 1 });
  return admin?.email;
};

exports.createRide = async (req, res) => {
  try {
    const {
      name,
      phone,
      pickupLocation,
      dropLocation,
      pickupCoordinates,
      dropCoordinates,
      date,
      time,
      isPrivate,
      notes,
      returnRide,
      returnDate,
      returnTime
    } = req.body;

    // Calculate route metrics
    const metrics = await calculateRouteMetrics(pickupLocation, dropLocation);
    console.log('Calculated metrics:', metrics);

    // Get user by firebaseUID
    const user = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert date string to Date object while preserving the local date
    const localDate = new Date(date + 'T00:00:00');
    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);

    // Create the main ride
    const ride = new Ride({
      userId: user._id,
      firebaseUID: req.user.firebaseUID,
      name,
      phone,
      pickupLocation,
      dropLocation,
      pickupCoordinates,
      dropCoordinates,
      date: utcDate, // Use the corrected date
      time,
      isPrivate,
      notes,
      status: 'pending',
      metrics: metrics || undefined
    });

    await ride.save();
    console.log('Saved ride with metrics:', ride.metrics);

    // If return ride is requested, create another ride with swapped locations
    let returnRideDoc = null;
    if (returnRide && returnDate && returnTime) {
      // Convert return date string to Date object while preserving the local date
      const localReturnDate = new Date(returnDate + 'T00:00:00');
      const utcReturnDate = new Date(localReturnDate.getTime() - localReturnDate.getTimezoneOffset() * 60000);

      returnRideDoc = new Ride({
        userId: user._id,
        firebaseUID: req.user.firebaseUID,
        name,
        phone,
        pickupLocation: dropLocation,
        dropLocation: pickupLocation,
        pickupCoordinates: dropCoordinates,
        dropCoordinates: pickupCoordinates,
        date: utcReturnDate, // Use the corrected return date
        time: returnTime,
        isPrivate,
        notes,
        status: 'pending',
        returnRide: true
      });

      await returnRideDoc.save();
    }

    const adminEmail = await getAdminEmail();

    if (adminEmail) {
      await emailService.sendNewBookingNotifications(ride, user, adminEmail);
    }

    res.status(201).json({
      message: 'Ride booked successfully',
      ride,
      returnRide: returnRideDoc
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ 
      message: 'Failed to book ride',
      error: error.message 
    });
  }
};

exports.getUserRides = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get rides with populated driver details
    const rides = await Ride.find({ userId: user._id })
      .populate({
        path: 'driverId',
        select: 'name phone vehicle email',
        model: 'Driver'
      })
      .sort({ date: 1 });

    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ 
      message: 'Failed to fetch rides',
      error: error.message 
    });
  }
};

// Get all rides
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate({
        path: 'driverId',
        select: 'name email phone vehicle isAvailable'
      })
      .populate({
        path: 'userId',
        select: 'name email'
      });

    // Transform the rides to include metrics
    const transformedRides = rides.map(ride => {
      const rideObj = ride.toObject();
      return {
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
        } : null
      };
    });

    console.log('Transformed rides with metrics:', 
      transformedRides.map(ride => ({
        id: ride._id,
        hasMetrics: !!ride.metrics,
        metrics: ride.metrics
      }))
    );

    res.json(transformedRides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
};

// Assign driver to ride
exports.assignDriver = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { driverId } = req.body;

    // Find the driver first
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update the ride with driver details
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { 
        driverId: driver._id,
        status: 'confirmed'
      },
      { new: true }
    ).populate({
      path: 'driverId',
      select: 'name email phone vehicle isAvailable'
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Transform the response to include driver details
    const transformedRide = {
      ...ride.toObject(),
      driver: {
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        vehicle: driver.vehicle,
        isAvailable: driver.isAvailable
      }
    };

    console.log('Transformed ride metrics:', transformedRide.metrics);

    const user = await User.findById(ride.userId);
    const adminEmail = await getAdminEmail();

    if (adminEmail) {
      await emailService.sendDriverAssignedNotifications(ride, user, driver, adminEmail);
    }

    res.json(transformedRide);
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Failed to assign driver' });
  }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { rideId } = req.params;

    console.log('Updating ride status:', { rideId, status });

    // Find the ride with populated driver info
    const ride = await Ride.findById(rideId)
      .populate({
        path: 'driverId',
        select: 'userId'
      });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    console.log('Found ride:', {
      rideId: ride._id,
      currentStatus: ride.status,
      driverId: ride.driverId?._id,
      driverUserId: ride.driverId?.userId
    });

    // Check if user has permission to update status
    const isAdmin = req.user.roles.includes('admin');
    const isDeveloper = req.user.roles.includes('developer');
    const isAssignedDriver = ride.driverId && 
      ride.driverId.userId.toString() === req.user.id.toString();

    console.log('Permission check:', {
      isAdmin,
      isDeveloper,
      isAssignedDriver,
      requestedStatus: status
    });

    if (!isAdmin && !isDeveloper && !isAssignedDriver) {
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient permissions',
        details: 'Only assigned drivers, admins, or developers can update ride status'
      });
    }

    // If user is driver, only allow updating from 'confirmed' to 'completed'
    if (isAssignedDriver && 
        !(ride.status === 'confirmed' && status === 'completed')) {
      return res.status(403).json({ 
        message: 'Drivers can only mark confirmed rides as completed',
        details: {
          currentStatus: ride.status,
          requestedStatus: status
        }
      });
    }

    // Update the status
    ride.status = status;
    await ride.save();

    // Get the updated ride with populated data
    const updatedRide = await Ride.findById(rideId)
      .populate({
        path: 'driverId',
        select: 'name email phone vehicle isAvailable'
      });

    if (status === 'completed') {
      console.log('Ride marked as completed, preparing notifications');
      
      const user = await User.findById(ride.userId);
      const driver = await Driver.findById(ride.driverId);
      const adminEmail = await getAdminEmail();

      console.log('Found related entities:', {
        userFound: !!user,
        driverFound: !!driver,
        adminEmail: adminEmail ? 'Found' : 'Not found'
      });

      if (adminEmail) {
        console.log('Sending completion notifications');
        await emailService.sendRideCompletedNotifications(ride, user, driver, adminEmail);
        console.log('Completion notifications sent successfully');
      } else {
        console.warn('No admin email found - skipping notifications');
      }
    }

    res.json(updatedRide);
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ 
      message: 'Failed to update status',
      error: error.message 
    });
  }
};

// Delete ride
exports.deleteRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // Find the ride first
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if user has permission to delete this ride
    const isAdmin = req.user.roles.includes('admin');
    const isDeveloper = req.user.roles.includes('developer');
    const isOwner = ride.userId.toString() === req.user.id.toString();

    if (!isAdmin && !isDeveloper && !isOwner) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this ride',
        details: 'Only ride owner, admin, or developer can delete rides'
      });
    }

    // Only allow deletion of pending rides (unless admin/developer)
    if (!isAdmin && !isDeveloper && ride.status !== 'pending') {
      return res.status(403).json({ 
        message: 'Cannot delete ride that has already been assigned or completed',
        details: 'Only pending rides can be cancelled by customers'
      });
    }

    // Delete the ride
    await Ride.findByIdAndDelete(rideId);

    const user = await User.findById(ride.userId);
    const adminEmail = await getAdminEmail();

    if (adminEmail) {
      await emailService.sendCancellationNotification(ride, user, adminEmail);
    }

    res.json({ 
      message: 'Ride deleted successfully',
      deletedRideId: rideId
    });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ 
      message: 'Failed to delete ride',
      error: error.message 
    });
  }
};

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('userId', 'name email')
      .sort({ name: 1 }); // Sort alphabetically by name
    
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch drivers',
      error: error.message 
    });
  }
};

// Get driver's rides
exports.getDriverRides = async (req, res) => {
  try {
    // First find the driver
    const driver = await Driver.findOne({ firebaseUID: req.user.firebaseUID });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get rides assigned to this driver
    const rides = await Ride.find({ driverId: driver._id })
      .sort({ date: -1, time: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    res.status(500).json({ 
      message: 'Failed to fetch driver rides',
      error: error.message 
    });
  }
};

// Get dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    // Get counts from your database
    const [
      totalRides,
      totalUsers,
      totalDrivers,
      activeRides,
      completedRides,
      pendingRides,
      cancelledRides,
      availableDrivers,
      unavailableDrivers
    ] = await Promise.all([
      Ride.countDocuments(),
      User.countDocuments(),
      Driver.countDocuments(),
      Ride.countDocuments({ status: 'confirmed' }),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'pending' }),
      Ride.countDocuments({ status: 'cancelled' }),
      Driver.countDocuments({ isAvailable: true }),
      Driver.countDocuments({ isAvailable: false })
    ]);

    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [dailyBookings, dailyNewUsers] = await Promise.all([
      Ride.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } })
    ]);

    // Get weekly new users
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklyNewUsers = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    res.json({
      totalRides,
      totalUsers,
      totalDrivers,
      activeRides,
      completedRides,
      dailyBookings,
      activeUsers: totalUsers,
      newUsers: {
        daily: dailyNewUsers,
        weekly: weeklyNewUsers
      },
      rideStatus: {
        pending: pendingRides,
        inProgress: activeRides,
        completed: completedRides,
        cancelled: cancelledRides
      },
      driverStatus: {
        available: availableDrivers,
        unavailable: unavailableDrivers
      }
    });
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics' });
  }
};

exports.getCompletedRides = async (req, res) => {
  try {
    // Find user first
    const user = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = { status: 'completed' };

    // If user is a customer, show only their rides
    if (req.user.roles.includes('customer')) {
      query.userId = user._id;
    }
    // If user is a driver, show rides they completed
    else if (req.user.roles.includes('driver')) {
      const driver = await Driver.findOne({ firebaseUID: req.user.firebaseUID });
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      query.driverId = driver._id;
    }
    // Admin and developer can see all completed rides

    const rides = await Ride.find(query)
      .sort({ date: -1, time: -1 }) // Most recent first
      .populate({
        path: 'driverId',
        select: 'name phone vehicle email',
        model: 'Driver'
      })
      .populate('userId', 'name email');

    const ridesWithDriverInfo = rides.map(ride => ({
      ...ride.toObject(),
      driver: ride.driverId
    }));

    res.json(ridesWithDriverInfo);
  } catch (error) {
    console.error('Error fetching completed rides:', error);
    res.status(500).json({ 
      message: 'Failed to fetch completed rides',
      error: error.message 
    });
  }
};

exports.groupRides = async (req, res) => {
  try {
    const { rideIds } = req.body;
    
    // Validate all rides exist and are pending
    const rides = await Ride.find({ 
      _id: { $in: rideIds },
      status: 'pending'
    });

    if (rides.length !== rideIds.length) {
      return res.status(400).json({ 
        message: 'Some rides are not available for grouping' 
      });
    }

    const group = await RideGroup.create({
      rides: rideIds,
      createdBy: req.user._id
    });

    await Ride.updateMany(
      { _id: { $in: rideIds } },
      { $set: { groupId: group._id } }
    );

    res.json({ groupId: group._id });
  } catch (error) {
    console.error('Error grouping rides:', error);
    res.status(500).json({ message: 'Failed to group rides' });
  }
};

exports.createRideGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rideIds } = req.body;
    console.log('Creating ride group with IDs:', rideIds);

    // Validation
    if (!rideIds || !Array.isArray(rideIds) || rideIds.length < 2) {
      return res.status(400).json({
        message: 'Invalid request: At least 2 ride IDs are required',
        code: 'INVALID_REQUEST'
      });
    }

    // Fetch rides and validate
    const rides = await Ride.find({
      _id: { $in: rideIds },
      status: 'pending'
    }).session(session);

    if (rides.length !== rideIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Some rides are not available for grouping',
        code: 'INVALID_RIDES'
      });
    }

    // Validate group compatibility
    if (!validateGroup(rides)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Rides are not compatible for grouping',
        code: 'INCOMPATIBLE_RIDES'
      });
    }

    // Calculate route metrics
    const waypoints = rides.flatMap(ride => [
      { location: ride.pickupLocation, coordinates: ride.pickupCoordinates },
      { location: ride.dropLocation, coordinates: ride.dropCoordinates }
    ]);

    const routeMetrics = await calculateRouteMetrics(waypoints);

    // Create group with metrics
    const group = new RideGroup({
      rides: rideIds,
      createdBy: req.user._id,
      status: 'pending',
      route: {
        type: 'optimized',
        waypoints: waypoints.map((wp, index) => ({
          location: wp.location,
          coordinates: wp.coordinates,
          type: index % 2 === 0 ? 'pickup' : 'dropoff',
          rideId: rides[Math.floor(index/2)]._id,
          estimatedArrival: null // Will be set when driver is assigned
        }))
      },
      metrics: {
        totalDistance: {
          value: routeMetrics.distance.value,
          text: routeMetrics.distance.text
        },
        totalDuration: {
          value: routeMetrics.duration.value,
          text: routeMetrics.duration.text
        },
        efficiency: {
          value: routeMetrics.efficiency,
          text: `${(routeMetrics.efficiency * 100).toFixed(1)}%`
        },
        fuelSavings: {
          value: routeMetrics.fuelSavings,
          text: `${routeMetrics.fuelSavings.toFixed(1)}L`
        }
      }
    });

    // Add creation to history
    group.history.push({
      action: 'created',
      performedBy: req.user._id,
      details: {
        rideIds,
        metrics: group.metrics
      }
    });

    await group.save({ session });

    // Update ride statuses
    await Ride.updateMany(
      { _id: { $in: rideIds } },
      { 
        $set: { 
          groupId: group._id,
          status: 'pending'
        }
      },
      { session }
    );

    await session.commitTransaction();

    // Populate response data
    const populatedGroup = await RideGroup.findById(group._id)
      .populate('rides')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Ride group created successfully',
      group: populatedGroup
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating ride group:', error);
    res.status(500).json({
      message: 'Failed to create ride group',
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  } finally {
    session.endSession();
  }
};

exports.updateRideGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { groupId } = req.params;
    const { rideIds, driverId, status } = req.body;

    // Fetch existing group
    const group = await RideGroup.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(404).json({
        message: 'Group not found',
        code: 'GROUP_NOT_FOUND'
      });
    }

    // Handle ride updates
    if (rideIds) {
      // Validate new rides
      const rides = await Ride.find({
        _id: { $in: rideIds },
        status: 'pending'
      }).session(session);

      if (rides.length !== rideIds.length) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Some rides are not available for grouping',
          code: 'INVALID_RIDES'
        });
      }

      if (!validateGroup(rides)) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Rides are not compatible for grouping',
          code: 'INCOMPATIBLE_RIDES'
        });
      }

      // Remove old ride associations
      await Ride.updateMany(
        { groupId: group._id },
        { $unset: { groupId: 1 } },
        { session }
      );

      // Update group rides
      group.rides = rideIds;

      // Add rides to group
      await Ride.updateMany(
        { _id: { $in: rideIds } },
        { $set: { groupId: group._id } },
        { session }
      );

      // Update route and metrics
      const waypoints = rides.flatMap(ride => [
        { location: ride.pickupLocation, coordinates: ride.pickupCoordinates },
        { location: ride.dropLocation, coordinates: ride.dropCoordinates }
      ]);

      const routeMetrics = await calculateRouteMetrics(waypoints);
      
      group.route = {
        type: 'optimized',
        waypoints: waypoints.map((wp, index) => ({
          location: wp.location,
          coordinates: wp.coordinates,
          type: index % 2 === 0 ? 'pickup' : 'dropoff',
          rideId: rides[Math.floor(index/2)]._id,
          estimatedArrival: null
        }))
      };

      group.metrics = {
        totalDistance: {
          value: routeMetrics.distance.value,
          text: routeMetrics.distance.text
        },
        totalDuration: {
          value: routeMetrics.duration.value,
          text: routeMetrics.duration.text
        },
        efficiency: {
          value: routeMetrics.efficiency,
          text: `${(routeMetrics.efficiency * 100).toFixed(1)}%`
        },
        fuelSavings: {
          value: routeMetrics.fuelSavings,
          text: `${routeMetrics.fuelSavings.toFixed(1)}L`
        }
      };
    }

    // Handle driver assignment
    if (driverId) {
      const driver = await Driver.findById(driverId).session(session);
      if (!driver) {
        await session.abortTransaction();
        return res.status(404).json({
          message: 'Driver not found',
          code: 'DRIVER_NOT_FOUND'
        });
      }

      if (!driver.isAvailable) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Driver is not available',
          code: 'DRIVER_UNAVAILABLE'
        });
      }

      group.driverId = driverId;
      group.status = 'confirmed';

      // Update driver availability
      await Driver.findByIdAndUpdate(
        driverId,
        { isAvailable: false },
        { session }
      );
    }

    // Handle status update
    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Invalid status',
          code: 'INVALID_STATUS'
        });
      }

      group.status = status;
      if (status === 'completed') {
        group.completedAt = new Date();
      } else if (status === 'cancelled') {
        group.cancelledAt = new Date();
      }
    }

    // Add history entry
    group.history.push({
      action: 'updated',
      performedBy: req.user._id,
      details: {
        rideIds: rideIds ? group.rides : undefined,
        driverId: driverId ? group.driverId : undefined,
        status: status ? group.status : undefined
      }
    });

    await group.save({ session });
    await session.commitTransaction();

    // Populate response data
    const populatedGroup = await RideGroup.findById(group._id)
      .populate('rides')
      .populate('driverId')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Group updated successfully',
      group: populatedGroup
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating ride group:', error);
    res.status(500).json({
      message: 'Failed to update ride group',
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  } finally {
    session.endSession();
  }
}; 