import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { useAsyncData } from '../hooks/useAsyncData';
import * as api from '../services/api';
import { FiSearch, FiEdit2, FiTrash2, FiPhone, FiMail, FiTruck, FiCheck } from 'react-icons/fi';

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  isAvailable: boolean;
}

interface EditingDriver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  isAvailable: boolean;
}

export default function ManageDriversPage() {
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDriver, setEditingDriver] = useState<EditingDriver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
  const { 
    data: drivers = [], 
    loading, 
    error, 
    refetch: refetchDrivers
  } = useAsyncData(() => api.getDrivers(), []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this driver?')) {
        return;
      }

      setIsDeleting(true);
      setDeleteError(null);
      
      await api.deleteDriver(driverId);
      await refetchDrivers();
      
      setDeleteConfirmation('Driver deleted successfully');
      setTimeout(() => setDeleteConfirmation(null), 3000);
      
    } catch (err: any) {
      let errorMessage = 'Error deleting driver';
      
      if (err.message.includes('not found')) {
        errorMessage = 'Driver not found or already deleted. The list will be refreshed.';
        await refetchDrivers();
      } else if (err.message.includes('permission')) {
        errorMessage = 'You do not have permission to delete this driver';
      } else {
        errorMessage = err.message || 'Error deleting driver';
      }
      
      setDeleteError(errorMessage);
      console.error('Error deleting driver:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleAvailability = async (driver: any) => {
    try {
      const updatedDriver = {
        ...driver,
        isAvailable: !driver.isAvailable
      };
      await api.updateDriver(driver._id, updatedDriver);
      await refetchDrivers();
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  };

  const handleEditClick = (driver: Driver) => {
    setEditingDriver({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicle: driver.vehicle,
      isAvailable: driver.isAvailable
    });
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
  };

  const handleSaveEdit = async () => {
    if (!editingDriver) return;
    
    try {
      await api.updateDriver(editingDriver._id, editingDriver);
      setEditingDriver(null);
      refetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  };

  const handleDriverFieldChange = (field: keyof Omit<EditingDriver, 'vehicle' | '_id' | 'isAvailable'>, value: string) => {
    if (!editingDriver) return;
    
    setEditingDriver({
      ...editingDriver,
      [field]: value
    });
  };

  const handleVehicleFieldChange = (field: keyof EditingDriver['vehicle'], value: string) => {
    if (!editingDriver) return;
    
    setEditingDriver({
      ...editingDriver,
      vehicle: {
        ...editingDriver.vehicle,
        [field]: value
      }
    });
  };

  const filteredDrivers = drivers.filter((driver: Driver) =>
    driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 fixed inset-0">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3B82F6]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {deleteError && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                <FiTrash2 className="w-5 h-5" />
                {deleteError}
              </div>
            )}
            
            {deleteConfirmation && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-xl border border-green-200 flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                {deleteConfirmation}
              </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-12 md:mt-0">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
                  Manage Drivers
                </h1>
                <p className="text-gray-600 mt-2">View and manage your driver fleet</p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
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
            ) : filteredDrivers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <EmptyState
                  message="No drivers found"
                  description="No drivers match your search criteria"
                  icon={<FiTruck className="w-12 h-12 text-gray-400 mx-auto" />}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDrivers.map((driver: Driver) => (
                  <div 
                    key={driver._id} 
                    className="group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/[0.03] to-[#8B5CF6]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Top Corner Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/[0.07] to-[#8B5CF6]/[0.07] rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-300 group-hover:scale-110"></div>

                    {/* Bottom Corner Decoration */}
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#D946EF]/[0.05] to-[#8B5CF6]/[0.05] rounded-tr-[80px] -ml-8 -mb-8 transition-transform duration-300 group-hover:scale-110"></div>

                    {editingDriver?._id === driver._id ? (
                      // Edit Mode
                      <div className="relative p-6 space-y-4">
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editingDriver?.name || ''}
                            onChange={(e) => handleDriverFieldChange('name', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                            placeholder="Name"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="email"
                                value={editingDriver?.email || ''}
                                onChange={(e) => handleDriverFieldChange('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Email"
                              />
                            </div>
                            <div className="relative">
                              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="tel"
                                value={editingDriver?.phone || ''}
                                onChange={(e) => handleDriverFieldChange('phone', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Phone"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900">Vehicle Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={editingDriver?.vehicle.make || ''}
                                onChange={(e) => handleVehicleFieldChange('make', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Make"
                              />
                              <input
                                type="text"
                                value={editingDriver?.vehicle.model || ''}
                                onChange={(e) => handleVehicleFieldChange('model', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Model"
                              />
                              <input
                                type="text"
                                value={editingDriver?.vehicle.color || ''}
                                onChange={(e) => handleVehicleFieldChange('color', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Color"
                              />
                              <input
                                type="text"
                                value={editingDriver?.vehicle.plateNumber || ''}
                                onChange={(e) => handleVehicleFieldChange('plateNumber', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                                placeholder="Plate Number"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="relative p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25">
                              {driver.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{driver.name}</h3>
                              <p className="text-sm text-gray-500 truncate">{driver.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(driver)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDriver(driver._id)}
                              disabled={isDeleting}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] p-[1px] relative group-hover:scale-105 transition-transform duration-300">
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                              <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#059669] to-[#34D399] flex items-center justify-center">
                                <FiPhone className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <span className="text-gray-900">{driver.phone}</span>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-900">Vehicle Details</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <div>
                                <p className="text-sm text-gray-500">Make</p>
                                <p className="text-gray-900">{driver.vehicle.make}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Model</p>
                                <p className="text-gray-900">{driver.vehicle.model}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Color</p>
                                <p className="text-gray-900">{driver.vehicle.color}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Plate Number</p>
                                <p className="text-gray-900">{driver.vehicle.plateNumber}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Availability Status</span>
                            <button
                              onClick={() => handleToggleAvailability(driver)}
                              className={`
                                relative w-14 h-7 transition-colors duration-200 ease-in-out rounded-full
                                ${driver.isAvailable ? 'bg-green-500' : 'bg-gray-200'}
                              `}
                            >
                              <span
                                className={`
                                  absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out
                                  ${driver.isAvailable ? 'translate-x-7' : 'translate-x-0'}
                                `}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Decoration Line */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </div>
                    )}
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