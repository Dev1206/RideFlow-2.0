import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../services/api';
import { FiCalendar, FiClock, FiArrowRight, FiCheckCircle, FiPlus, FiEdit2, FiTrash2, FiMapPin, FiUser, FiTruck } from 'react-icons/fi';
import { convertTo12Hour, formatDate, getNextDayDate } from '../utils/dateUtils';
import { getStoredToken } from '../services/api';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ErrorMessage } from './shared/ErrorMessage';
import { EmptyState } from './shared/EmptyState';
import { useAsyncData } from '../hooks/useAsyncData';
import { defaultMetrics } from '../constants/metrics';
import { Sidebar } from './shared/Sidebar';
import { Ride, Vehicle, Driver } from '../types/ride';
import { AppError, ErrorType, ErrorCode } from '../utils/errorHandling';

// Add interfaces for components
interface RideCardProps {
  ride: Ride & {
    email?: string;
  };
  isDriverView?: boolean;
  onStatusUpdate?: (rideId: string, status: string) => void;
}

// Update the edit form to use the Vehicle type
interface DriverEditForm {
  phone: string;
  vehicle: Vehicle;
}

// Update VehicleField type to use Vehicle interface keys
type VehicleField = keyof Vehicle;

// Add helper components
const RideCard: React.FC<RideCardProps> = ({ ride, isDriverView = false, onStatusUpdate }) => (
  <div className="p-6">
    <div className="flex justify-between items-start mb-4">
      <span className={`px-4 py-1 rounded-xl text-sm font-medium ${
        ride.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
        ride.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
        ride.status === 'completed' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
        'bg-rose-100 text-rose-700 border border-rose-200'
      }`}>
        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
      </span>
      {ride.isPrivate && (
        <span className="px-4 py-1 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
          Private
        </span>
      )}
    </div>

    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-3 text-gray-600">
          <FiCalendar className="w-5 h-5" />
          <div>
            <p className="text-gray-900">{formatDate(getNextDayDate(ride.date))}</p>
            <p className="text-sm">{convertTo12Hour(ride.time)}</p>
          </div>
        </div>
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3B82F6] to-[#8B5CF6]"></div>
        
        <div className="relative mb-4">
          <div className="absolute -left-8 w-6 h-6 rounded-full bg-[#3B82F6]/10 border-2 border-[#3B82F6] flex items-center justify-center">
            <FiMapPin className="w-3 h-3 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pickup</p>
            <p className="text-gray-900">{ride.pickupLocation}</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -left-8 w-6 h-6 rounded-full bg-[#8B5CF6]/10 border-2 border-[#8B5CF6] flex items-center justify-center">
            <FiMapPin className="w-3 h-3 text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Drop-off</p>
            <p className="text-gray-900">{ride.dropLocation}</p>
          </div>
        </div>
      </div>

      {ride.returnRide && ride.returnDate && ride.returnTime && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Return Journey</h4>
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3B82F6] to-[#8B5CF6]"></div>
            
            <div className="relative mb-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-[#3B82F6]/10 border-2 border-[#3B82F6] flex items-center justify-center">
                <FiMapPin className="w-3 h-3 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Return Pickup</p>
                <p className="text-gray-900">{ride.dropLocation}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-[#8B5CF6]/10 border-2 border-[#8B5CF6] flex items-center justify-center">
                <FiMapPin className="w-3 h-3 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Return Drop-off</p>
                <p className="text-gray-900">{ride.pickupLocation}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiCalendar className="w-5 h-5" />
              <div>
                <p className="text-gray-900">{formatDate(ride.returnDate)} at {convertTo12Hour(ride.returnTime)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {onStatusUpdate && ride.status !== 'completed' && (
        <div className="pt-4">
          <button
            onClick={() => onStatusUpdate(ride._id, 'completed')}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="w-5 h-5" />
            Mark as Completed
          </button>
        </div>
      )}

      {ride.status === 'confirmed' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {isDriverView ? 'Customer Details' : 'Driver Details'}
          </h4>
          {isDriverView ? (
            // Customer Details (shown to drivers)
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center text-white">
                  <FiUser className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ride.name}</p>
                  <p className="text-sm text-gray-600">{ride.phone}</p>
                  {ride.email && (
                    <p className="text-sm text-gray-600">{ride.email}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Driver Details (shown to customers)
            ride.driver ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center text-white">
                    <FiTruck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ride.driver.name}</p>
                    <p className="text-sm text-gray-600">{ride.driver.phone}</p>
                    {ride.driver.vehicle && (
                      <p className="text-sm text-gray-600 mt-1">
                        {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}
                        <br />
                        Plate: {ride.driver.vehicle.plateNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Loading driver details...
              </div>
            )
          )}
        </div>
      )}
    </div>
  </div>
);

// Add this helper function at the top with proper typing
const waitForToken = async (): Promise<string | null> => {
  let attempts = 0;
  while (!getStoredToken() && attempts < 5) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  return getStoredToken();
};

export default function Dashboard(): JSX.Element {
  const { user, userRoles, signOut, isDeveloper } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<Driver | null>(null);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [ridesError, setRidesError] = useState<string | null>(null);
  const [driverFormData, setDriverFormData] = useState<DriverEditForm>({
    phone: '',
    vehicle: {
      make: '',
      model: '',
      color: '',
      plateNumber: ''
    }
  });
  
  // Fix: Pass empty array as dependencies for useAsyncData
  const { data: ridesResponse = { data: [] }, loading: ridesLoading, error: fetchRidesError, refetch: refetchRides } = 
    useAsyncData(async () => {
      try {
        // If admin/developer, get all rides, otherwise get user's rides
        if (userRoles.includes('admin') || isDeveloper()) {
          return await api.getAllRides();
        } else {
          return await api.getUserRides();
        }
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(
          'Failed to fetch rides',
          ErrorType.NETWORK,
          ErrorCode.SERVER_ERROR,
          { originalError: error }
        );
      }
    }, []); // Empty array as dependencies
  
  // Extract rides array from response and ensure it's always an array
  const rides = Array.isArray(ridesResponse) ? ridesResponse : 
                Array.isArray(ridesResponse.data) ? ridesResponse.data : [];
  
  // Filter rides to separate upcoming and completed rides
  const upcomingRides = rides.filter((ride: Ride) => 
    ride.status === 'pending' || ride.status === 'confirmed'
  ) || [];
  
  const completedRides = rides.filter((ride: Ride) => 
    ride.status === 'completed'
  ) || [];
  
  // Fix: Pass empty array as dependencies and handle defaultMetrics in the initial state
  const { data: metrics = defaultMetrics, refetch: refetchMetrics } = 
    useAsyncData(async () => {
      try {
        if (userRoles.includes('admin') || isDeveloper()) {
          return await api.getDashboardMetrics();
        }
        return defaultMetrics;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(
          'Failed to fetch metrics',
          ErrorType.NETWORK,
          ErrorCode.SERVER_ERROR,
          { originalError: error }
        );
      }
    }, []); // Empty array as dependencies

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Wait for token before loading data
        await waitForToken();
        
        if (userRoles.includes('admin') || isDeveloper()) {
          await refetchMetrics();
          await refetchRides();
        } else if (userRoles.includes('driver')) {
          await fetchDriverInfo();
          await fetchDriverRides();
        } else {
          await refetchRides();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [userRoles, isDeveloper]);

  useEffect(() => {
    const fetchAdminEmail = async () => {
      try {
        // Only fetch admin contact if user is admin or developer
        if (userRoles.includes('admin') || isDeveloper()) {
          const response = await api.getAdminContact();
          setDriverFormData({
            phone: response.phone || '',
            vehicle: {
              make: response.vehicle?.make || '',
              model: response.vehicle?.model || '',
              color: response.vehicle?.color || '',
              plateNumber: response.vehicle?.plateNumber || ''
            }
          });
        }
      } catch (error) {
        console.error('Error fetching admin email:', error);
      }
    };

    // Only run for admin/developer users
    if (userRoles.includes('admin') || isDeveloper()) {
      fetchAdminEmail();
    }
  }, [userRoles, isDeveloper]);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (userRoles.includes('driver')) {
        try {
          const response = await api.getDriverInfo();
          if (response) {
            setDriverInfo(response);
            setDriverFormData({
              phone: response.phone || '',
              vehicle: {
                make: response.vehicle?.make || '',
                model: response.vehicle?.model || '',
                color: response.vehicle?.color || '',
                plateNumber: response.vehicle?.plateNumber || ''
              }
            });
          }
        } catch (error) {
          console.error('Error fetching driver info:', error);
        }
      }
    };

    fetchDriverData();
  }, [userRoles]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchDriverInfo = async () => {
    try {
      const response = await api.getDriverInfo();
      if (response) {
        setDriverInfo(response);
        setDriverFormData({
          phone: response.phone || '',
          vehicle: {
            make: response.vehicle?.make || '',
            model: response.vehicle?.model || '',
            color: response.vehicle?.color || '',
            plateNumber: response.vehicle?.plateNumber || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching driver info:', error);
    }
  };

  const fetchDriverRides = async () => {
    try {
      setLoadingRides(true);
      const response = await api.getDriverRides();
      setDriverRides(response || []);
      setRidesError(null);
    } catch (error) {
      console.error('Error fetching driver rides:', error);
      setRidesError('Failed to load rides');
    } finally {
      setLoadingRides(false);
    }
  };

  const handleStatusUpdate = async (rideId: string, newStatus: string) => {
    try {
      setLoadingRides(true);
      await api.updateRideStatus(rideId, newStatus);
      
      // Show success message
      setSuccessMessage('Ride status updated successfully');
      
      // Refresh the rides list
      await fetchDriverRides();
    } catch (error: any) {
      console.error('Error updating ride status:', error);
      // Show error message to user
      alert(error.message || 'Failed to update ride status');
    } finally {
      setLoadingRides(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    try {
      await api.deleteRide(rideId);
      setSuccessMessage('Ride cancelled successfully');
      // Refresh the rides list
      await refetchRides();
    } catch (error: any) {
      console.error('Error deleting ride:', error);
      // Show more specific error message to user
      alert(error.message || 'Failed to cancel ride. Only pending rides can be cancelled.');
    }
  };

  const renderCustomerDashboard = () => (
    <div className="space-y-8">
      {/* Header with Book New Ride Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
            Your Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Manage your rides and bookings</p>
        </div>
        <button
          onClick={() => navigate('/book-ride')}
          className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Book New Ride
        </button>
      </div>

      {/* Upcoming Rides Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-[#3B82F6]" />
            </div>
            Upcoming Booked Rides
          </h3>
        </div>
        
        {ridesLoading ? (
          <LoadingSpinner />
        ) : fetchRidesError ? (
          <ErrorMessage message={fetchRidesError} />
        ) : upcomingRides.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">🚗</span>}
            message="No upcoming rides"
            description="You don't have any rides scheduled"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingRides.map((ride: Ride) => (
              <div key={ride._id} className="group bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200">
                <RideCard 
                  ride={ride}
                  isDriverView={false}
                />
                {ride.status === 'pending' && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleDeleteRide(ride._id)}
                      className="w-full p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                      title="Cancel Ride"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      Cancel Ride
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Rides Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            Recent Completed Rides
          </h3>
          <button
            onClick={() => navigate('/ride-history')}
            className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium group flex items-center gap-2"
          >
            View All
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {ridesLoading ? (
          <LoadingSpinner />
        ) : fetchRidesError ? (
          <ErrorMessage message={fetchRidesError} />
        ) : completedRides.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">🎉</span>}
            message="No completed rides"
            description="You haven't completed any rides yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedRides.slice(0, 3).map((ride: Ride) => (
              <div key={ride._id} className="group bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200">
                <RideCard 
                  ride={ride}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  // Add edit mode state
  const [isEditingDriver, setIsEditingDriver] = useState(false);

  // Add this function to handle form changes
  const handleDriverFormChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'vehicle') {
        setDriverFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            [child]: value
          }
        }));
      }
    } else {
      setDriverFormData(prev => ({
        ...prev,
        [field]: value
      } as DriverEditForm));
    }
  };

  // Add this function to handle form submission
  const handleDriverFormSubmit = async () => {
    try {
      await api.updateDriverInfo(driverFormData);
      setIsEditingDriver(false);
      await fetchDriverInfo(); // Refresh driver info
    } catch (error) {
      console.error('Error updating driver info:', error);
    }
  };

  // Update this function to properly initialize form data with existing info
  const handleEditClick = () => {
    if (driverInfo) {
      setDriverFormData({
        phone: driverInfo.phone || '',
        vehicle: {
          make: driverInfo.vehicle?.make || '',
          model: driverInfo.vehicle?.model || '',
          color: driverInfo.vehicle?.color || '',
          plateNumber: driverInfo.vehicle?.plateNumber || ''
        }
      });
    }
    setIsEditingDriver(true);
  };

  const renderDriverDashboard = () => (
    <div className="space-y-8">
      {/* Driver Info Section */}
      {driverInfo && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                <FiUser className="w-5 h-5 text-[#3B82F6]" />
              </div>
              Driver Information
            </h2>
            {!isEditingDriver && (
              <button
                onClick={handleEditClick}
                className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Info
              </button>
            )}
          </div>
          
          {isEditingDriver ? (
            <div className="space-y-6 bg-gray-50 rounded-xl p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={driverFormData.phone}
                    onChange={(e) => handleDriverFormChange('phone', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] placeholder-gray-400"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['make', 'model', 'color', 'plateNumber'] as VehicleField[]).map((field) => (
                    <input
                      key={field}
                      type="text"
                      value={driverFormData.vehicle[field]}
                      onChange={(e) => handleDriverFormChange(`vehicle.${field}`, e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] placeholder-gray-400"
                      placeholder={`Vehicle ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsEditingDriver(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDriverFormSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 font-medium w-full sm:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-lg text-gray-900 break-all">{driverInfo.phone || 'Not provided'}</p>
              </div>
              {driverInfo.vehicle && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600">Vehicle Details</p>
                  <p className="text-lg text-gray-900 break-words">
                    {driverInfo.vehicle.color} {driverInfo.vehicle.make} {driverInfo.vehicle.model}
                  </p>
                  <p className="text-md text-gray-600 break-all">Plate: {driverInfo.vehicle.plateNumber}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Assigned Rides Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
              <FiClock className="w-5 h-5 text-[#3B82F6]" />
            </div>
            Your Assigned Rides
          </h2>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            {['confirmed', 'completed', 'cancelled'].map((status) => (
              <span
                key={status}
                className={`px-4 py-1 rounded-xl text-sm font-medium ${
                  status === 'confirmed' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {loadingRides ? (
          <LoadingSpinner />
        ) : ridesError ? (
          <ErrorMessage message={ridesError} />
        ) : driverRides.length === 0 ? (
          <EmptyState
            icon={<FiClock className="w-8 h-8 text-[#3B82F6]" />}
            message="No rides assigned"
            description="Check back later for new assignments"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {driverRides.map((ride: any) => (
              <div key={ride._id} className="group bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200">
                <RideCard 
                  ride={ride}
                  isDriverView={true}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Upcoming Booked Rides Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-[#3B82F6]" />
            </div>
            Your Booked Rides
          </h2>
          <button
            onClick={() => navigate('/book-ride')}
            className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Book New Ride
          </button>
        </div>

        {ridesLoading ? (
          <LoadingSpinner />
        ) : fetchRidesError ? (
          <ErrorMessage message={fetchRidesError} />
        ) : upcomingRides.length === 0 ? (
          <EmptyState
            icon={<FiCalendar className="w-8 h-8 text-[#3B82F6]" />}
            message="No upcoming rides"
            description="Book a ride to get started"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingRides.map((ride: Ride) => (
              <div key={ride._id} className="group bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200">
                <RideCard 
                  ride={ride}
                  isDriverView={false}
                />
                {ride.status === 'pending' && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleDeleteRide(ride._id)}
                      className="w-full p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                      title="Cancel Ride"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      Cancel Ride
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Rides Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiTruck className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rides</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRides}</p>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.rideStatus?.pending || 0} pending
              </p>
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiUser className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
              <p className="text-sm text-gray-600 mt-1">
                of {metrics.totalUsers} total
              </p>
            </div>
          </div>
        </div>

        {/* Driver Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiTruck className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalDrivers}</p>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.driverStatus?.available || 0} available
              </p>
            </div>
          </div>
        </div>

        {/* Ride Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.completedRides}</p>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.rideStatus?.inProgress || 0} in progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Rides Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Rides</h3>
              <p className="text-sm text-gray-600 mt-1">Rides awaiting driver assignment</p>
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
              {metrics.rideStatus?.pending || 0} pending
            </div>
          </div>
          <button
            onClick={() => navigate('/manage-rides')}
            className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiMapPin className="w-5 h-5" />
            Assign Drivers
          </button>
        </div>

        {/* Driver Applications Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Driver Management</h3>
              <p className="text-sm text-gray-600 mt-1">Manage driver accounts and status</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              {metrics.totalDrivers} total
            </div>
          </div>
          <button
            onClick={() => navigate('/manage-drivers')}
            className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiTruck className="w-5 h-5" />
            Manage Drivers
          </button>
        </div>

        {/* User Management Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600 mt-1">Manage user accounts and roles</p>
            </div>
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
              {metrics.newUsers?.daily || 0} new today
            </div>
          </div>
          <button
            onClick={() => navigate('/manage-users')}
            className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiUser className="w-5 h-5" />
            Manage Users
          </button>
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => navigate('/manage-rides')}
              className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {(rides || []).slice(0, 5).map((ride: Ride) => (
              <div key={ride._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  ride.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  ride.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  ride.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                  'bg-sky-100 text-sky-700'
                }`}>
                  <FiClock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ride.pickupLocation} → {ride.dropLocation}
                    </p>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                      ride.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      ride.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      ride.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(getNextDayDate(ride.date))} • {convertTo12Hour(ride.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Status and Alerts */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
          
          <div className="space-y-4">
            {/* Active Rides Status */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">Active Rides</h4>
                <span className="text-emerald-700 text-sm">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(metrics.rideStatus?.inProgress || 0) / metrics.totalRides * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.rideStatus?.inProgress || 0} active
                </span>
              </div>
            </div>

            {/* Driver Availability Status */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">Driver Availability</h4>
                <span className="text-[#3B82F6] text-sm">
                  {((metrics.driverStatus?.available || 0) / metrics.totalDrivers * 100).toFixed(0)}% Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3B82F6] rounded-full"
                    style={{ width: `${(metrics.driverStatus?.available || 0) / metrics.totalDrivers * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.driverStatus?.available || 0}/{metrics.totalDrivers}
                </span>
              </div>
            </div>

            {/* User Activity Status */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">User Activity</h4>
                <span className="text-[#8B5CF6] text-sm">
                  {((metrics.activeUsers || 0) / metrics.totalUsers * 100).toFixed(0)}% Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8B5CF6] rounded-full"
                    style={{ width: `${(metrics.activeUsers || 0) / metrics.totalUsers * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.activeUsers || 0}/{metrics.totalUsers}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => navigate('/ride-history')}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FiCheckCircle className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ride History</p>
                    <p className="text-xs text-gray-600 mt-0.5">View all completed rides</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/manage-rides')}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <FiMapPin className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Live Map</p>
                    <p className="text-xs text-gray-600 mt-0.5">Track active rides</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 fixed inset-0">
      {!getStoredToken() ? (
        <LoadingSpinner />
      ) : (
        <>
          <Sidebar onLogout={handleLogout} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3B82F6]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl"></div>

            <div className="p-8 relative">
              {/* Welcome Message */}
              <header className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
                  Welcome back, {user?.displayName?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's what's happening with your rides today.
                </p>
              </header>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200 flex justify-between items-center animate-fade-in-out">
                  {successMessage}
                  <button 
                    onClick={() => setSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-800"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Role-specific Dashboard Content */}
              {userRoles.includes('admin') || isDeveloper() 
                ? renderAdminDashboard()
                : userRoles.includes('driver')
                ? renderDriverDashboard()
                : renderCustomerDashboard()
              }
            </div>
          </main>
        </>
      )}
    </div>
  );
} 
