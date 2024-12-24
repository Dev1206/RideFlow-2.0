import React from 'react';
import { FiMapPin, FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiTruck, FiCheckCircle, FiX } from 'react-icons/fi';
import { convertTo12Hour, formatDate, getNextDayDate } from '../utils/dateUtils';
import { Ride } from '../types/ride';

interface RideCardProps {
  ride: Ride;
  isDriverView?: boolean;
  onStatusUpdate?: (rideId: string, status: string) => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, isDriverView = false, onStatusUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'pending':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'cancelled':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <span className={`px-4 py-1 rounded-xl text-sm font-medium border ${getStatusColor(ride.status)}`}>
          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
        </span>
        {ride.isPrivate && (
          <span className="px-4 py-1 rounded-xl text-sm font-medium bg-purple-400/10 text-purple-400 border border-purple-400/20">
            Private
          </span>
        )}
      </div>

      {/* Date and Time */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 text-gray-400">
          <FiCalendar className="w-5 h-5" />
          <div>
            <p className="text-white">{formatDate(getNextDayDate(ride.date))}</p>
            <p className="text-sm">{convertTo12Hour(ride.time)}</p>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="relative pl-8 mb-6">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-400 to-purple-400"></div>
        
        <div className="relative mb-4">
          <div className="absolute -left-8 w-6 h-6 rounded-full bg-indigo-400/20 border-2 border-indigo-400 flex items-center justify-center">
            <FiMapPin className="w-3 h-3 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Pickup</p>
            <p className="text-white">{ride.pickupLocation}</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -left-8 w-6 h-6 rounded-full bg-purple-400/20 border-2 border-purple-400 flex items-center justify-center">
            <FiMapPin className="w-3 h-3 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Drop-off</p>
            <p className="text-white">{ride.dropLocation}</p>
          </div>
        </div>
      </div>

      {/* Route Metrics */}
      {ride.metrics && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FiMapPin className="w-4 h-4" />
              <p className="text-sm">Distance</p>
            </div>
            <p className="text-white font-medium">{ride.metrics.distance.text}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FiClock className="w-4 h-4" />
              <p className="text-sm">Duration</p>
            </div>
            <p className="text-white font-medium">{ride.metrics.duration.text}</p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-gray-400">
          <FiUser className="w-4 h-4" />
          <p className="text-white">{ride.name}</p>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <FiPhone className="w-4 h-4" />
          <p className="text-white">{ride.phone}</p>
        </div>
        {ride.email && (
          <div className="flex items-center gap-3 text-gray-400">
            <FiMail className="w-4 h-4" />
            <p className="text-white">{ride.email}</p>
          </div>
        )}
      </div>

      {/* Driver Information */}
      {ride.driver && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full flex items-center justify-center text-white border border-white/10">
                <FiTruck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white">{ride.driver.name}</p>
                <p className="text-sm text-gray-400">{ride.driver.phone}</p>
                {ride.driver.vehicle && (
                  <p className="text-sm text-gray-400 mt-1">
                    {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}
                    <br />
                    Plate: {ride.driver.vehicle.plateNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Buttons for Driver View */}
      {isDriverView && onStatusUpdate && ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => onStatusUpdate(ride._id, 'completed')}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-green-400/10 hover:bg-green-400/20 text-green-400 rounded-xl transition-colors"
          >
            <FiCheckCircle className="w-4 h-4" />
            Complete
          </button>
          <button
            onClick={() => onStatusUpdate(ride._id, 'cancelled')}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-xl transition-colors"
          >
            <FiX className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default RideCard; 