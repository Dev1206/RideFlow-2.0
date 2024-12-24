import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { useAsyncData } from '../hooks/useAsyncData';
import * as api from '../services/api';
import { FiCalendar, FiMapPin, FiUser, FiTruck, FiClock, FiTrash2, FiCheck, FiChevronDown, FiUserX, FiUsers, FiMap, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { TfiNotepad } from "react-icons/tfi";
import RidesMap from '../components/RidesMap';
import { convertTo12Hour, formatDate, getNextDayDate } from '../utils/dateUtils';
import { groupRides as groupRidesUtil } from '../utils/distanceUtils';
import { Ride, Driver, RideGroup as IRideGroup } from '../types/ride';
import { AppError, ErrorType } from '../utils/errorHandling';

// Define the status config type
interface StatusConfig {
  label: string;
  color: string;
  hoverColor: string;
}

interface StatusConfigs {
  pending: StatusConfig;
  confirmed: StatusConfig;
  completed: StatusConfig;
  cancelled: StatusConfig;
}

// Update the status configurations with light theme colors
const statusConfigs: StatusConfigs = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border border-amber-200',
    hoverColor: 'hover:bg-amber-200'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    hoverColor: 'hover:bg-emerald-200'
  },
  completed: {
    label: 'Completed',
    color: 'bg-sky-100 text-sky-700 border border-sky-200',
    hoverColor: 'hover:bg-sky-200'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-rose-100 text-rose-700 border border-rose-200',
    hoverColor: 'hover:bg-rose-200'
  }
};

// Update the RideWithUser interface
interface RideWithUser extends Ride {
  driver?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    isAvailable: boolean;
  };
  userEmail?: string;
}

export default function ManageRidesPage() {
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: rides = [], loading, error, refetch: refetchRides } = useAsyncData(() => api.getAllRides(), []);
  const { data: drivers = [] } = useAsyncData(() => api.getDrivers(), []);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupedRides, setGroupedRides] = useState<any[][]>([]);
  const [rideGroups, setRideGroups] = useState<IRideGroup[]>([]);
  const [groupColors] = useState<string[]>([
    'bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-purple-500/10 hover:from-violet-500/15 hover:via-fuchsia-500/15 hover:to-purple-500/15',
    'bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 hover:from-cyan-500/15 hover:via-blue-500/15 hover:to-indigo-500/15',
    'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 hover:from-emerald-500/15 hover:via-teal-500/15 hover:to-green-500/15',
    'bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 hover:from-rose-500/15 hover:via-pink-500/15 hover:to-fuchsia-500/15',
    'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 hover:from-amber-500/15 hover:via-orange-500/15 hover:to-yellow-500/15'
  ]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideWithUser | null>(null);

  useEffect(() => {
    if (rides.length > 0) {
      console.log('Rides with coordinates:', rides.map((ride: RideWithUser) => ({
        id: ride._id,
        status: ride.status,
        hasPickupCoords: !!ride.pickupCoordinates,
        pickupCoords: ride.pickupCoordinates,
        location: ride.pickupLocation
      })));
    }
  }, [rides]);

  // Add this useEffect to monitor rides data
  useEffect(() => {
    if (rides.length > 0) {
      console.log('Loaded rides:', rides.map((ride: RideWithUser) => ({
        id: ride._id,
        status: ride.status,
        pickupLocation: ride.pickupLocation,
        time: ride.time
      })));
    }
  }, [rides]);

  useEffect(() => {
    console.log('Current rides state:', {
      total: rides.length,
      pending: rides.filter((ride: RideWithUser) => ride.status === 'pending').length,
      statuses: rides.map((ride: RideWithUser) => ride.status)
    });
  }, [rides]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Update the handleGroupRides function signature
  const handleGroupRides = async (): Promise<void> => {
    try {
      // Log all rides with their status and coordinates
      console.log('All rides:', rides.map((ride: RideWithUser) => ({
        id: ride._id,
        status: ride.status,
        time: ride.time,
        hasCoordinates: !!ride.pickupCoordinates,
        coordinates: ride.pickupCoordinates,
        pickupLocation: ride.pickupLocation
      })));

      // Filter pending rides
      const pendingRides = rides.filter((ride: RideWithUser) => {
        const isPending = ride.status === 'pending';
        const hasCoordinates = !!ride.pickupCoordinates;
        
        console.log('Checking ride for grouping:', {
          id: ride._id,
          status: ride.status,
          isPending,
          hasCoordinates,
          time: ride.time,
          coordinates: ride.pickupCoordinates,
          location: ride.pickupLocation
        });

        return isPending && hasCoordinates;
      });

      if (pendingRides.length === 0) {
        throw new AppError(
          'No pending rides available for grouping',
          ErrorType.VALIDATION
        );
      }

      // Get groups
      const groups = groupRidesUtil(pendingRides);
      console.log('Generated groups:', groups);

      // Set groups and available rides
      setGroupedRides(groups);
      setShowGroupModal(true);
    } catch (error) {
      if (error instanceof AppError) {
        alert(error.message);
      } else {
        console.error('Error grouping rides:', error);
        alert('Failed to group rides. Please try again.');
      }
    }
  };

  // Update the handleAssignDriver function signature
  const handleAssignDriver = async (rideId: string, driverId: string): Promise<void> => {
    try {
      await api.assignDriver(rideId, driverId);
      await refetchRides();
    } catch (error) {
      if (error instanceof AppError) {
        alert(error.message);
      } else {
        console.error('Error assigning driver:', error);
        alert('Failed to assign driver. Please try again.');
      }
    }
  };

  // Update the handleDeleteRide function signature
  const handleDeleteRide = async (rideId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this ride?')) return;
    
    try {
      await api.deleteRide(rideId);
      await refetchRides();
      alert('Ride deleted successfully');
    } catch (error) {
      console.error('Error deleting ride:', error);
      alert('Failed to delete ride');
    }
  };

  // Update the handleStatusChange function signature
  const handleStatusChange = async (rideId: string, newStatus: string): Promise<void> => {
    try {
      setUpdatingStatus(rideId);
      await api.updateRideStatus(rideId, newStatus);
      await refetchRides();
      setStatusDropdownOpen(null);
      alert('Status updated successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Update the handleRemoveDriver function signature
  const handleRemoveDriver = async (rideId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to remove the driver from this ride?')) {
      return;
    }

    try {
      await api.removeDriver(rideId);
      await refetchRides();
      alert('Driver removed successfully');
    } catch (error) {
      console.error('Error removing driver:', error);
      alert('Failed to remove driver');
    }
  };

  // Update the handleRemoveFromGroup function signature
  const handleRemoveFromGroup = (rideId: string, groupIndex: number): void => {
    setGroupedRides(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = newGroups[groupIndex].filter((r: Ride) => r._id !== rideId);
      return newGroups;
    });
  };

  // Update the handleAddToGroup function signature
  const handleAddToGroup = (rideId: string, groupIndex: number): void => {
    const rideToAdd = rides.find((r: Ride) => r._id === rideId);
    if (!rideToAdd) return;

    setGroupedRides(prevGroups => {
      const newGroups = [...prevGroups];
      const group = newGroups[groupIndex];

      if (group.length >= 4) {
        alert('Maximum group size is 4 rides');
        return prevGroups;
      }

      newGroups[groupIndex] = [...group, rideToAdd];
      return newGroups;
    });
  };

  // Update the handleConfirmGroups function signature
  const handleConfirmGroups = async (): Promise<void> => {
    try {
      const userProfile = await api.getUserProfile();
      if (!userProfile) {
        throw new Error('User not authenticated');
      }

      for (const group of groupedRides) {
        const rideIds = group.map(ride => ride._id);
        const groupId = await api.groupRides(rideIds);
        
        const newGroup = {
          _id: groupId,
          rides: rideIds,
          color: groupColors[rideGroups.length % groupColors.length],
          createdBy: userProfile._id,
          createdAt: new Date().toISOString()
        } as IRideGroup;
        
        setRideGroups(prev => [...prev, newGroup]);
      }
      
      await refetchRides();
      setShowGroupModal(false);
    } catch (error: any) {
      console.error('Error creating groups:', error);
      alert('Failed to create groups');
    }
  };

  // Update the filteredRides logic
  const filteredRides = rides.filter((ride: RideWithUser) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      ride.name?.toLowerCase().includes(searchLower) ||
      ride.phone?.toLowerCase().includes(searchLower) ||
      ride.userEmail?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  console.log('Received rides data:', rides.map((ride: RideWithUser) => ({
    id: ride._id,
    hasMetrics: !!ride.metrics,
    metrics: ride.metrics
  })));

  // Update the useEffect that loads ride groups
  useEffect(() => {
    const loadRideGroups = async () => {
      try {
        setLoadingGroups(true);
        const groups = await api.getRideGroups();
        
        // Map groups and assign colors
        const coloredGroups = groups.map((group: any, index: number) => ({
          _id: group._id,
          rides: group.rides.map((r: any) => r._id), // Extract ride IDs
          createdBy: group.createdBy,
          createdAt: group.createdAt,
          color: groupColors[index % groupColors.length]
        }));

        console.log('Loaded ride groups with colors:', coloredGroups);
        setRideGroups(coloredGroups);
      } catch (error) {
        console.error('Error loading ride groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadRideGroups();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3B82F6]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {/* Header with updated styling */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-12 md:mt-0">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
                  Manage Rides
                </h1>
                <p className="text-gray-600 mt-2">View and manage all ride requests</p>
              </div>
              
              {/* Updated button and search styles */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleGroupRides}
                  disabled={loadingGroups}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50"
                >
                  {loadingGroups ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiUsers className="w-5 h-5" />
                  )}
                  Group Rides
                </button>
                <div className="relative flex-1 md:flex-none">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rides..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
            </header>

            {/* Map View with updated styling */}
            <div className="mb-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#3B82F6]/10 to-[#8B5CF6]/10">
                  <FiMapPin className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                Pending Ride Locations
              </h2>
              <div className="rounded-xl overflow-hidden h-[400px] border border-gray-100 shadow-sm">
                <RidesMap
                  rides={rides.filter((ride: RideWithUser) => {
                    const isPending = ride.status === 'pending';
                    const hasCoordinates = ride.pickupCoordinates?.lat && ride.pickupCoordinates?.lng;
                    return isPending && hasCoordinates;
                  })}
                  selectedRide={selectedRide as Ride}
                  onRideSelect={(ride) => setSelectedRide(ride as RideWithUser)}
                  setMapBounds={() => {}}
                />
              </div>
            </div>

            {/* Filters with updated styling */}
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#3B82F6]/10 to-[#8B5CF6]/10">
                      <FiFilter className="text-[#8B5CF6] h-5 w-5" />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Rides Modal with updated styling */}
            {showGroupModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingGroup !== null ? 'Edit Group' : 'Suggested Groups'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowGroupModal(false);
                        setEditingGroup(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Debug info with updated styling */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600">Debug Info:</p>
                    <p className="text-xs text-gray-500">Groups: {groupedRides.length}</p>
                    <p className="text-xs text-gray-500">
                      Total Rides: {groupedRides.reduce((acc, group) => acc + group.length, 0)}
                    </p>
                  </div>

                  {groupedRides.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No rides available for grouping</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedRides.map((group, groupIndex) => (
                        <div
                          key={groupIndex}
                          className={`p-4 border rounded-xl transition-all duration-200 ${
                            editingGroup === groupIndex
                              ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-lg shadow-[#8B5CF6]/10'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-gray-900 font-medium">
                              Group {groupIndex + 1} ({group.length} rides)
                            </h3>
                            <button
                              onClick={() => setEditingGroup(groupIndex)}
                              className="px-3 py-1 text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors"
                            >
                              Edit Group
                            </button>
                          </div>

                          <div className="space-y-2">
                            {group.map((ride) => (
                              <div key={ride._id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FiMapPin className="w-4 h-4 text-[#8B5CF6]" />
                                  <span className="text-gray-900">{ride.pickupLocation}</span>
                                  <span className="text-gray-400">•</span>
                                  <FiClock className="w-4 h-4 text-[#8B5CF6]" />
                                  <span className="text-gray-900">{convertTo12Hour(ride.time)}</span>
                                </div>
                                {editingGroup === groupIndex && (
                                  <button
                                    onClick={() => handleRemoveFromGroup(ride._id, groupIndex)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from group"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {editingGroup === groupIndex && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Available Rides</h4>
                              <div className="space-y-2">
                                {rides
                                  .filter((ride: RideWithUser) => {
                                    const isPending = ride.status === 'pending';
                                    const notInGroup = !group.some(groupRide => groupRide._id === ride._id);
                                    return isPending && notInGroup;
                                  })
                                  .map((ride: RideWithUser) => (
                                    <button
                                      key={ride._id}
                                      onClick={() => handleAddToGroup(ride._id, groupIndex)}
                                      className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                      disabled={group.length >= 4}
                                    >
                                      <div className="flex items-center gap-2">
                                        <FiMapPin className="w-4 h-4 text-[#8B5CF6]" />
                                        <span className="text-gray-900">{ride.pickupLocation}</span>
                                        <span className="text-gray-400">•</span>
                                        <FiClock className="w-4 h-4 text-[#8B5CF6]" />
                                        <span className="text-gray-900">{convertTo12Hour(ride.time)}</span>
                                      </div>
                                      <FiPlus className="w-4 h-4 text-[#8B5CF6]" />
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setShowGroupModal(false);
                        setEditingGroup(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmGroups}
                      className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                    >
                      Confirm Groups
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rides Grid with updated styling */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <ErrorMessage message={error} />
                </div>
              ) : filteredRides.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <EmptyState
                    icon={<FiMapPin className="w-8 h-8 text-[#8B5CF6]" />}
                    message="No rides found"
                    description="No rides match your search criteria"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRides.map((ride: RideWithUser) => {
                    const rideGroup = rideGroups.find(g => g.rides.includes(ride._id));
                    
                    return (
                      <div 
                        key={ride._id}
                        className={`group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden ${
                          rideGroup ? rideGroup.color : ''
                        }`}
                      >
                        {/* Gradient Background on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/[0.03] to-[#8B5CF6]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Top Corner Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/[0.07] to-[#8B5CF6]/[0.07] rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-300 group-hover:scale-110"></div>

                        {/* Bottom Corner Decoration */}
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#D946EF]/[0.05] to-[#8B5CF6]/[0.05] rounded-tr-[80px] -ml-8 -mb-8 transition-transform duration-300 group-hover:scale-110"></div>

                        {/* Card Header - Customer Info & Status */}
                        <div className="relative p-6 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                                  <FiUser className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div>
                                <h3 className="text-gray-900 font-medium">{ride.name}</h3>
                                <div className="flex items-center gap-2 text-sm">
                                  <p className="text-gray-500">{ride.phone}</p>
                                  {ride.userEmail && (
                                    <p className="text-gray-500 truncate max-w-[150px]">{ride.userEmail}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Status Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setStatusDropdownOpen(statusDropdownOpen === ride._id ? null : ride._id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                  statusConfigs[ride.status as keyof StatusConfigs].color
                                }`}
                              >
                                {updatingStatus === ride._id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiCheck className="w-4 h-4" />
                                )}
                                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                                <FiChevronDown className={`w-4 h-4 transition-transform ${
                                  statusDropdownOpen === ride._id ? 'rotate-180' : ''
                                }`} />
                              </button>

                              {statusDropdownOpen === ride._id && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-lg z-10">
                                  {Object.entries(statusConfigs).map(([status, { label }]) => (
                                    status !== ride.status && (
                                      <button
                                        key={status}
                                        onClick={() => handleStatusChange(ride._id, status)}
                                        className="w-full px-4 py-2 text-left flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                        disabled={updatingStatus === ride._id}
                                      >
                                        <FiCheck className="w-4 h-4 opacity-0" />
                                        {label}
                                      </button>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Body - Ride Details */}
                        <div className="relative p-6 space-y-4">
                          {/* Schedule */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                              <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] flex items-center justify-center">
                                <FiCalendar className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">{formatDate(getNextDayDate(ride.date))}</p>
                              <p className="text-sm text-gray-500">{convertTo12Hour(ride.time)}</p>
                            </div>
                          </div>

                          {/* Locations */}
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] flex items-center justify-center">
                                  <FiMapPin className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-500">Pickup</p>
                                <p className="text-gray-900 font-medium text-sm line-clamp-1">{ride.pickupLocation}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] flex items-center justify-center">
                                  <FiMapPin className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-500">Drop-off</p>
                                <p className="text-gray-900 font-medium text-sm line-clamp-1">{ride.dropLocation}</p>
                              </div>
                            </div>
                          </div>

                          {/* Route Metrics */}
                          {ride.metrics && (
                            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-2">
                                <FiMap className="w-4 h-4 text-[#8B5CF6]" />
                                <span className="text-sm text-gray-900">{ride.metrics.distance.text}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiClock className="w-4 h-4 text-[#8B5CF6]" />
                                <span className="text-sm text-gray-900">{ride.metrics.duration.text}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Notes Section */}
                        {ride.notes && (
                          <div className="px-6 py-4 border-t border-gray-100">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
                                  <TfiNotepad className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Notes</p>
                                <p className="text-sm text-gray-900">{ride.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Card Footer - Driver & Actions */}
                        <div className="relative p-6 border-t border-gray-100 flex items-center justify-between">
                          {/* Driver Selection/Display */}
                          {ride.driver ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] flex items-center justify-center">
                                  <FiTruck className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium text-sm">{ride.driver.name}</p>
                                <p className="text-sm text-gray-500">{ride.driver.phone}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative flex-1 max-w-[200px]">
                              <select
                                onChange={(e) => handleAssignDriver(ride._id, e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] pr-10 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                                defaultValue=""
                              >
                                <option value="" disabled>Assign Driver</option>
                                {drivers
                                  .filter((driver: Driver) => driver.isAvailable)
                                  .map((driver: Driver) => (
                                    <option key={driver._id} value={driver._id}>
                                      {driver.name} {driver.vehicle ? `(${driver.vehicle.make})` : ''}
                                    </option>
                                  ))}
                              </select>
                              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {ride.driver && (
                              <button
                                onClick={() => handleRemoveDriver(ride._id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                title="Remove Driver"
                              >
                                <FiUserX className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRide(ride._id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Ride"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Decoration Line */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
