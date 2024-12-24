const User = require('../models/User');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

exports.getRecentActivities = async (req, res) => {
  console.log('Getting recent activities');
  try {
    // Get recent rides
    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name');
    console.log('Recent rides:', recentRides);

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    console.log('Recent users:', recentUsers);

    // Get recent drivers
    const recentDrivers = await Driver.find()
      .sort({ createdAt: -1 })
      .limit(5);
    console.log('Recent drivers:', recentDrivers);

    // Combine activities
    const activities = [
      ...recentRides.map(ride => ({
        _id: ride._id,
        type: ride.status === 'completed' ? 'ride_completed' : 
              ride.status === 'cancelled' ? 'ride_cancelled' : 'new_ride',
        title: `Ride ${ride.status}`,
        description: `${ride.userId?.name || 'User'} - ${ride.pickupLocation} to ${ride.dropLocation}`,
        timestamp: ride.createdAt
      })),
      ...recentUsers.map(user => ({
        _id: user._id,
        type: 'new_user',
        title: 'New User Registered',
        description: `${user.name} joined the platform`,
        timestamp: user.createdAt
      })),
      ...recentDrivers.map(driver => ({
        _id: driver._id,
        type: 'driver_registered',
        title: 'New Driver Registered',
        description: `${driver.name} registered as a driver`,
        timestamp: driver.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    console.log('Sending activities:', activities);
    res.json(activities);
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch recent activities',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 