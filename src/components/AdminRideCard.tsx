import { useState } from 'react';
import * as api from '../services/api';
import { FiClock, FiMap } from 'react-icons/fi';
import { Ride, Driver, RideMetrics } from '../types/ride';

// Define valid status types
type RideStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AdminRideCardProps {
  ride: Omit<Ride, 'driver'> & {
    driver?: Driver;
    userEmail: string;
    metrics?: RideMetrics;
  };
  onUpdate: () => void;
  onDelete?: (rideId: string) => void;
  onStatusChange?: (rideId: string, status: RideStatus) => void;
  onDriverAssign?: (rideId: string, driverId: string) => void;
  onDriverRemove?: (rideId: string) => void;
}

// Add state interfaces
interface AdminRideCardState {
  isEditing: boolean;
  showDetails: boolean;
  status: string;
  loading: boolean;
  error: string | null;
  availableDrivers: Driver[];
  selectedDriver: string;
  showDriverSelect: boolean;
  showStatusSelect: boolean;
}

export default function AdminRideCard({ ride, onUpdate }: AdminRideCardProps) {
  const [state, setState] = useState<AdminRideCardState>({
    isEditing: false,
    showDetails: false,
    status: ride.status,
    loading: false,
    error: null,
    availableDrivers: [],
    selectedDriver: ride.driverId || '',
    showDriverSelect: false,
    showStatusSelect: false,
  });

  const availableDrivers = state.availableDrivers.filter(driver => 
    (driver.isAvailable || driver._id === ride.driverId)
  );

  const handleApiOperation = async (operation: () => Promise<void>, errorMessage: string) => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      await operation();
      onUpdate();
    } catch (error: any) {
      setState(prevState => ({ ...prevState, error: error.message || errorMessage }));
    } finally {
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };

  const handleAssignDriver = () => {
    if (!state.selectedDriver) return;
    handleApiOperation(
      () => api.assignDriver(ride._id, state.selectedDriver),
      'Failed to assign driver'
    );
  };

  const handleRemoveDriver = () => {
    if (!window.confirm('Are you sure you want to remove the assigned driver?')) {
      return;
    }
    handleApiOperation(
      () => api.assignDriver(ride._id, ''),
      'Failed to remove driver'
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (isValidStatus(newStatus)) {
      handleApiOperation(
        async () => {
          await api.updateRideStatus(ride._id, newStatus);
          setState(prevState => ({ ...prevState, status: newStatus as RideStatus }));
        },
        'Failed to update status'
      );
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this ride?')) return;
    handleApiOperation(
      () => api.deleteRide(ride._id),
      'Failed to delete ride'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Add timezone offset to get the correct local date
      const date = new Date(dateString);
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      
      return localDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const renderMetrics = () => {
    if (!ride.metrics) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <FiMap className="w-4 h-4 text-indigo-500" />
          Route Details
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiMap className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Distance</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {ride.metrics.distance.text}
            </p>
            <p className="text-xs text-gray-500">
              ({(ride.metrics.distance.value / 1000).toFixed(1)} km)
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiClock className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Est. Duration</p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {ride.metrics.duration.text}
            </p>
            <p className="text-xs text-gray-500">
              ({Math.round(ride.metrics.duration.value / 60)} mins)
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Add status validation function
  const isValidStatus = (status: string): status is RideStatus => {
    return ['pending', 'confirmed', 'completed', 'cancelled'].includes(status);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        {/* Date and Time Header */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(state.status)}`}>
              {state.status}
            </span>
            {ride.isPrivate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Private
              </span>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">
              {formatDate(ride.date)}
            </h3>
            <p className="text-lg font-semibold text-indigo-600 mt-1">
              {formatTime(ride.time)}
            </p>
          </div>
        </div>

        {/* User Details */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900">{ride.name}</h4>
          <div className="space-y-1 mt-1">
            <p className="text-sm text-gray-600">{ride.phone}</p>
            <p className="text-sm text-gray-600">{ride.userEmail}</p>
          </div>
        </div>

        {/* Ride Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-3">
              <div className="mt-1">🔵</div>
              <div>
                <p className="text-sm font-medium text-gray-700">Pickup</p>
                <p className="text-sm text-gray-600">{ride.pickupLocation}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-3">
              <div className="mt-1">📍</div>
              <div>
                <p className="text-sm font-medium text-gray-700">Drop-off</p>
                <p className="text-sm text-gray-600">{ride.dropLocation}</p>
              </div>
            </div>
          </div>

          {ride.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{ride.notes}</p>
            </div>
          )}

          {/* Return Ride Details */}
          {ride.returnRide && ride.returnDate && ride.returnTime && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Return Journey</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">🔵</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pickup</p>
                    <p className="text-sm text-gray-600">{ride.dropLocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1">📍</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Drop-off</p>
                    <p className="text-sm text-gray-600">{ride.pickupLocation}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Date: </span>{formatDate(ride.returnDate)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Time: </span>{formatTime(ride.returnTime)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-4">
          {state.isEditing ? (
            <div className="space-y-4">
              <select
                value={state.selectedDriver}
                onChange={(e) => setState(prevState => ({ ...prevState, selectedDriver: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Driver</option>
                {availableDrivers.map(driver => (
                  <option 
                    key={driver._id} 
                    value={driver._id}
                    className={!driver.isAvailable && driver._id !== ride.driverId ? 'text-gray-400' : ''}
                  >
                    {driver.name} ({driver.email})
                    {!driver.isAvailable && driver._id === ride.driverId ? ' (Currently Assigned)' : ''}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleAssignDriver}
                  disabled={state.loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {state.loading ? 'Assigning...' : 'Assign Driver'}
                </button>
                <button
                  onClick={() => setState(prevState => ({ ...prevState, isEditing: false }))}
                  disabled={state.loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {ride.driverId && ride.status !== 'completed' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setState(prevState => ({ ...prevState, isEditing: true }))}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                    >
                      Edit Driver
                    </button>
                    <button
                      onClick={handleRemoveDriver}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      disabled={state.loading}
                    >
                      Remove Driver
                    </button>
                  </div>
                ) : !ride.driverId && ride.status !== 'completed' ? (
                  <button
                    onClick={() => setState(prevState => ({ ...prevState, isEditing: true }))}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Assign Driver
                  </button>
                ) : null}
                
                <select
                  value={state.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-gray-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              {/* Show driver info regardless of ride status */}
              {ride.driver && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {ride.status === 'completed' ? 'Completed by' : 'Assigned Driver'}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🚘</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ride.driver.name}</p>
                      <p className="text-sm text-gray-500">{ride.driver.email}</p>
                      <p className="text-sm text-gray-500">{ride.driver.phone}</p>
                      {ride.driver.vehicle && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">
                            Vehicle: {ride.driver.vehicle.make} {ride.driver.vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            Color: {ride.driver.vehicle.color}
                          </p>
                          <p className="text-sm text-gray-500">
                            Plate Number: {ride.driver.vehicle.plateNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          {availableDrivers.length === 0 && (
            <p className="mt-2 text-sm text-yellow-600">
              No available drivers at the moment
            </p>
          )}
        </div>

        {renderMetrics()}
      </div>
    </div>
  );
} 