import React from 'react';
import { FiMapPin, FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiCheckCircle, FiX, FiNavigation } from 'react-icons/fi';
import { convertTo12Hour, formatDate, getNextDayDate } from '../utils/dateUtils';
import { Ride } from '../types/ride';

interface DriverRideCardProps {
  ride: Ride;
  onStatusUpdate: (rideId: string, status: string) => void;
  onNavigate?: (location: string) => void;
}

const DriverRideCard: React.FC<DriverRideCardProps> = ({ ride, onStatusUpdate, onNavigate }) => {
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
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-200">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <span className={`px-4 py-1 rounded-xl text-sm font-medium border ${getStatusColor(ride.status)}`}>
            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
          </span>
          {onNavigate && (
            <button
              onClick={() => onNavigate(ride.pickupLocation)}
              className="p-2 bg-blue-400/10 text-blue-400 rounded-xl hover:bg-blue-400/20 transition-colors"
              title="Navigate to pickup"
            >
              <FiNavigation className="w-5 h-5" />
            </button>
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

        {/* Customer Information */}
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Customer Details</h4>
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
        </div>

        {/* Action Buttons */}
        {ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => onStatusUpdate(ride._id, 'completed')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-green-400/10 hover:bg-green-400/20 text-green-400 rounded-xl transition-colors"
            >
              <FiCheckCircle className="w-4 h-4" />
              Complete Ride
            </button>
            <button
              onClick={() => onStatusUpdate(ride._id, 'cancelled')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-xl transition-colors"
            >
              <FiX className="w-4 h-4" />
              Cancel Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRideCard; 