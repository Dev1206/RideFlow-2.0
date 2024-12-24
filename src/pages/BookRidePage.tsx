import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import * as api from '../services/api';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiPhone, FiFileText, FiLock, FiArrowLeft } from 'react-icons/fi';
import LocationAutocomplete from '../components/LocationAutocomplete';
import GoogleMapsWrapper from '../components/GoogleMapsWrapper';

interface Coordinates {
  lat: number;
  lng: number;
}

export default function BookRidePage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [returnRide, setReturnRide] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    notes: '',
    returnDate: '',
    returnTime: '',
    pickupCoordinates: undefined,
    dropCoordinates: undefined,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createRide({
        ...formData,
        isPrivate,
        returnRide,
        returnDate: returnRide ? formData.returnDate : undefined,
        returnTime: returnRide ? formData.returnTime : undefined
      });

      navigate('/dashboard', { 
        state: { message: 'Ride booked successfully!' }
      });
    } catch (error: any) {
      setError(error.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (field: 'pickupLocation' | 'dropLocation', value: string, coordinates?: Coordinates) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      [`${field.replace('Location', 'Coordinates')}`]: coordinates
    }));
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans selection:bg-[#8B5CF6]/20 selection:text-[#8B5CF6]">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 group"
              >
                <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF]">
                Book a New Ride
              </h1>
              <p className="text-gray-600 mt-2">Fill in the details to book your ride</p>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)]">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ride Details Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)]">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF5E8C] to-[#FF8C5E] flex items-center justify-center">
                    <FiMapPin className="w-4 h-4 text-white" />
                  </div>
                  Ride Details
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <GoogleMapsWrapper>
                        <LocationAutocomplete
                          label="Pickup Location"
                          value={formData.pickupLocation}
                          onChange={(value, coordinates) => handleLocationChange('pickupLocation', value, coordinates)}
                          required
                          placeholder="Enter pickup location"
                        />
                      </GoogleMapsWrapper>
                    </div>

                    <div>
                      <GoogleMapsWrapper>
                        <LocationAutocomplete
                          label="Drop-off Location"
                          value={formData.dropLocation}
                          onChange={(value, coordinates) => handleLocationChange('dropLocation', value, coordinates)}
                          required
                          placeholder="Enter drop-off location"
                        />
                      </GoogleMapsWrapper>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <div className="relative">
                        <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="time"
                          required
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Journey Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] flex items-center justify-center">
                      <FiCalendar className="w-4 h-4 text-white" />
                    </div>
                    Return Journey
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnRide}
                      onChange={(e) => setReturnRide(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B5CF6]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                  </label>
                </div>

                {returnRide && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={formData.returnDate}
                          onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                          min={formData.date || new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                      <div className="relative">
                        <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="time"
                          required
                          value={formData.returnTime}
                          onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)]">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#059669] to-[#34D399] flex items-center justify-center">
                        <FiFileText className="w-4 h-4 text-white" />
                      </div>
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="Any special requirements or notes."
                      rows={3}
                    />
                    <p className='text-xs text-gray-500 pt-2'> 1) Write "Packages only" for only package delivery. </p>
                    <p className='text-xs text-gray-500 pt-2'> 2) If you dont have fixed time mention "Any pickup Time" in notes.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2DD4BF] flex items-center justify-center">
                      <FiLock className="w-4 h-4 text-white" />
                    </div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="rounded border-gray-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/20 transition-all duration-200"
                      />
                      Make this a private ride
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] text-white rounded-xl hover:shadow-lg hover:shadow-[#8B5CF6]/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <span className="relative">{loading ? 'Booking...' : 'Book Ride'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 