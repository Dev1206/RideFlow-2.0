import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { useAsyncData } from '../hooks/useAsyncData';
import * as api from '../services/api';
import { FiClock, FiMapPin, FiCalendar, FiTruck, FiPhone, FiFilter, FiSearch } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { convertTo12Hour, getNextDayDate } from '../utils/dateUtils';
import { Ride } from '../types/ride';

export default function RideHistoryPage() {
  const { signOut } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rides = [], loading, error } = useAsyncData(() => api.getCompletedRides(), []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const filteredRides = rides.filter((ride: Ride) => {
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      ride.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.dropLocation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50 fixed inset-0">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3B82F6]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="p-8 relative">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-12 md:mt-0">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
                  Ride History
                </h1>
                <p className="text-gray-600 mt-2">View all your past rides and their details</p>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
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
                    <option value="all">All Rides</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </header>

            {/* Rides List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4">
                <ErrorMessage message={error} />
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiClock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No rides found</h3>
                <p className="text-gray-500">You haven't taken any rides yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRides.map((ride: Ride) => (
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

                    {/* Status Header */}
                    <div className="relative p-6 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className={`
                          px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                          ${ride.status === 'completed' ? 'bg-green-100 text-green-700 group-hover:bg-green-200' : 'bg-red-100 text-red-700 group-hover:bg-red-200'}
                        `}>
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                              <FiCalendar className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {format(parseISO(getNextDayDate(ride.date)), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-6 space-y-6">
                      {/* Locations */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                            <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] flex items-center justify-center">
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
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                          <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <span className="text-gray-900 font-medium">{convertTo12Hour(ride.time)}</span>
                      </div>

                      {/* Driver Details */}
                      {ride.driver && (
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                              <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] flex items-center justify-center">
                                <FiTruck className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">{ride.driver.name}</p>
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                <FiPhone className="w-3 h-3" />
                                {ride.driver.phone}
                              </p>
                              {ride.driver.vehicle && (
                                <p className="text-gray-500 text-sm mt-1">
                                  {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}
                                  <br />
                                  <span className="text-gray-400">Plate: {ride.driver.vehicle.plateNumber}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
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
