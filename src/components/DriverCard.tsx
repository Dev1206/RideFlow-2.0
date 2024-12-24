import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { FiEdit2, FiTrash2, FiPhone, FiTruck } from 'react-icons/fi';

interface DriverCardProps {
  driver: {
    _id: string;
    firebaseUID: string;
    name: string;
    email: string;
    phone?: string;
    vehicle?: {
      color: string;
      make: string;
      model: string;
      plateNumber: string;
    };
    isAvailable?: boolean;
    totalRides?: number;
  };
  onUpdate: () => void;
}

export default function DriverCard({ driver, onUpdate }: DriverCardProps) {
  const { isDeveloper } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: driver.name,
    phone: driver.phone || '',
    vehicle: driver.vehicle || {
      color: '',
      make: '',
      model: '',
      plateNumber: ''
    },
    isAvailable: driver.isAvailable || false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        phone: phoneValue
      }));
      return;
    }

    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? e.target.checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.updateDriver(driver._id, formData);
      onUpdate();
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      setLoading(true);
      setError(null);
      await api.deleteDriver(driver._id);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to delete driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header with Status Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🚗</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
              <p className="text-sm text-gray-500">{driver.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            driver.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {driver.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter 10-digit phone number"
              />
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="vehicle.plateNumber"
                  value={formData.vehicle.plateNumber}
                  onChange={handleChange}
                  placeholder="Plate Number"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  name="vehicle.color"
                  value={formData.vehicle.color}
                  onChange={handleChange}
                  placeholder="Color"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  name="vehicle.make"
                  value={formData.vehicle.make}
                  onChange={handleChange}
                  placeholder="Make"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  name="vehicle.model"
                  value={formData.vehicle.model}
                  onChange={handleChange}
                  placeholder="Model"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Availability Toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="rounded text-indigo-600"
              />
              Available for rides
            </label>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Contact Info */}
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <FiPhone className="w-4 h-4" />
              <span className="text-sm">{driver.phone || 'No phone number'}</span>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTruck className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Vehicle Details</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Plate Number:</span>
                  <span className="ml-2 text-gray-900">{driver.vehicle?.plateNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Color:</span>
                  <span className="ml-2 text-gray-900">{driver.vehicle?.color || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Make:</span>
                  <span className="ml-2 text-gray-900">{driver.vehicle?.make || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-2 text-gray-900">{driver.vehicle?.model || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Total Rides */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-500">Total Rides:</span>
              <span className="ml-2 text-lg font-semibold text-indigo-600">{driver.totalRides || 0}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              {isDeveloper() && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 