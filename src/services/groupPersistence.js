const mongoose = require('mongoose');

class GroupPersistenceService {
  async saveGroup(group) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Save group details
        const savedGroup = await RideGroup.create([{
          rides: group.rides,
          status: group.status,
          createdAt: new Date(),
          efficiency: group.efficiency,
          route: group.route,
          driverId: group.driverId,
          groupMetrics: {
            totalDistance: group.totalDistance,
            estimatedDuration: group.estimatedDuration,
            fuelSavings: group.fuelSavings
          }
        }], { session });

        // Update ride statuses
        await Ride.updateMany(
          { _id: { $in: group.rides } },
          { $set: { groupId: savedGroup[0]._id, status: 'GROUPED' } },
          { session }
        );

        await session.commitTransaction();
        return savedGroup[0];
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      throw new Error(`Failed to persist group: ${error.message}`);
    }
  }

  async getGroupHistory(filters = {}) {
    try {
      return await RideGroup.find(filters)
        .populate('rides')
        .populate('driverId')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch group history: ${error.message}`);
    }
  }
}

module.exports = new GroupPersistenceService(); 