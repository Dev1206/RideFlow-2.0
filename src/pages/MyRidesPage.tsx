import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { useAsyncData } from '../hooks/useAsyncData';
import * as api from '../services/api';
import { Ride } from '../types/ride';

export default function MyRidesPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: rides = [], loading, error, refetch } = useAsyncData(() => api.getDriverRides(), []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleStatusChange = async (rideId: string) => {
    try {
      await api.updateRideStatus(rideId, 'completed');
      refetch();
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const upcomingRides = rides.filter((ride: Ride) => 
    ride.status === 'pending' || ride.status === 'confirmed'
  );

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans selection:bg-[#8B5CF6]/20 selection:text-[#8B5CF6]">
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,#F0F7FF_0%,#ffffff_30%,#FDF4FF_70%)]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.15),transparent_25%)]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-12 md:mt-0">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF]">
                  My Rides
                </h1>
                <p className="text-gray-600 mt-2">Manage and track your assigned rides</p>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rides..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-44 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 appearance-none cursor-pointer transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </header>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4">
                <ErrorMessage message={error} />
              </div>
            ) : rides.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <EmptyState
                  message="No rides found"
                  description="You don't have any assigned rides yet"
                  icon="🚗"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingRides.map((ride: Ride) => (
                  <div 
                    key={ride._id} 
                    className="group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/[0.03] to-[#8B5CF6]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Top Corner Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/[0.07] to-[#8B5CF6]/[0.07] rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-300 group-hover:scale-110"></div>

                    {/* Bottom Corner Decoration */}
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#D946EF]/[0.05] to-[#8B5CF6]/[0.05] rounded-tr-[80px] -ml-8 -mb-8 transition-transform duration-300 group-hover:scale-110"></div>

                    <div className="relative p-6">
                      {/* Ride Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 relative">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                              <FiCalendar className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(ride.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`
                          relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                          ${ride.status === 'confirmed' ? 'bg-green-100 text-green-700 group-hover:bg-green-200' : 
                            ride.status === 'completed' ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' : 
                            'bg-amber-100 text-amber-700 group-hover:bg-amber-200'}
                        `}>
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </span>
                      </div>

                      {/* Ride Details */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] flex items-center justify-center">
                              <FiMapPin className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="relative">
                            <p className="text-sm text-gray-500">Pickup Location</p>
                            <p className="text-gray-900">{ride.pickupLocation}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] flex items-center justify-center">
                              <FiMapPin className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="relative">
                            <p className="text-sm text-gray-500">Drop Location</p>
                            <p className="text-gray-900">{ride.dropLocation}</p>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="relative">
                            <p className="text-sm text-gray-500">Passenger</p>
                            <p className="text-gray-900">{ride.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{ride.phone}</p>
                          </div>
                        </div>
                      </div>

                      {ride.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(ride._id)}
                          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] text-white rounded-xl hover:shadow-lg hover:shadow-[#8B5CF6]/25 hover:-translate-y-0.5 transition-all duration-200 relative group/btn overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover/btn:opacity-100 blur-xl transition-opacity duration-500"></div>
                          <span className="relative">Mark as Completed</span>
                        </button>
                      )}

                      {/* Bottom Decoration Line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 