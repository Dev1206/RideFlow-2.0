import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import LocationAutocomplete from './LocationAutocomplete';
import GoogleMapsWrapper from './GoogleMapsWrapper';

interface BookRideProps {
  onClose: () => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface FormData {
  name: string;
  phone: string;
  pickupLocation: string;
  dropLocation: string;
  date: string;
  time: string;
  isPrivate: boolean;
  notes: string;
  returnRide: boolean;
  returnDate: string;
  returnTime: string;
  pickupCoordinates?: Coordinates;
  dropCoordinates?: Coordinates;
}

export default function BookRide({ onClose }: BookRideProps) {
  const { user } = useAuth();
  const [showReturnFields, setShowReturnFields] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: user?.displayName || '',
    phone: '',
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    isPrivate: false,
    notes: '',
    returnRide: false,
    returnDate: '',
    returnTime: '',
    pickupCoordinates: undefined,
    dropCoordinates: undefined,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (name === 'returnRide') {
      setShowReturnFields((e.target as HTMLInputElement).checked);
    }
  };

  const handleLocationChange = (field: 'pickupLocation' | 'dropLocation', value: string, coordinates?: Coordinates) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      [`${field.replace('Location', 'Coordinates')}`]: coordinates
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createRide(formData);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <GoogleMapsWrapper>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Book a Ride</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Pickup Location */}
              <LocationAutocomplete
                label="Pickup Location"
                value={formData.pickupLocation}
                onChange={(value, coordinates) => handleLocationChange('pickupLocation', value, coordinates)}
                required
                placeholder="Enter pickup location"
              />

              {/* Drop Location */}
              <LocationAutocomplete
                label="Drop-off Location"
                value={formData.dropLocation}
                onChange={(value, coordinates) => handleLocationChange('dropLocation', value, coordinates)}
                required
                placeholder="Enter drop-off location"
              />

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Private Ride
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="returnRide"
                    checked={formData.returnRide}
                    onChange={handleChange}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Book Return
                </label>
              </div>

              {/* Return Ride Fields */}
              {showReturnFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleChange}
                      required
                      min={formData.date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Time
                    </label>
                    <input
                      type="time"
                      name="returnTime"
                      value={formData.returnTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Notes Toggle */}
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showNotes ? 'Hide Notes' : 'Add Notes'}
              </button>

              {/* Notes Field */}
              {showNotes && (
                <div>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any special instructions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Book Ride'}
              </button>
            </div>
          </form>
        </div>
      </GoogleMapsWrapper>
    </div>
  );
} 