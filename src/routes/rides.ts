import { Router, RequestHandler } from 'express';
import { Types } from 'mongoose';
import { Ride } from '@/models/ride';

interface GroupRideRequest {
  rideIds: string[];
}

const router = Router();

// Group rides endpoint
const groupRidesHandler: RequestHandler<{}, any, GroupRideRequest> = async (req, res) => {
  try {
    const { rideIds } = req.body;
    
    if (!Array.isArray(rideIds) || rideIds.length === 0) {
      res.status(400).json({ message: 'Invalid ride IDs provided' });
      return;
    }

    // Update all rides in the group to be linked together
    const groupId = new Types.ObjectId();
    await Ride.updateMany(
      { _id: { $in: rideIds } },
      { 
        $set: { 
          groupId,
          status: 'confirmed',
          updatedAt: new Date()
        } 
      }
    );

    res.json({ message: 'Rides grouped successfully', groupId });
  } catch (error) {
    console.error('Error grouping rides:', error);
    res.status(500).json({ message: 'Failed to group rides' });
  }
};

router.post('/group', groupRidesHandler);

export default router; 