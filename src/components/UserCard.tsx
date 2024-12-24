import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

interface UserCardProps {
  user: {
    _id: string;
    firebaseUID: string;
    name: string;
    email: string;
    roles: string[];
    profilePicture?: string;
    activeBookings: number;
    totalBookings: number;
  };
  onRolesUpdate: () => void;
}

export default function UserCard({ user, onRolesUpdate }: UserCardProps) {
  const { userRoles, isDeveloper } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available roles based on current user's role
  const availableRoles = isDeveloper() 
    ? ['customer', 'driver', 'admin']
    : userRoles.includes('admin') 
      ? ['customer', 'driver']
      : [];

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Don't remove if it's the last role
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.updateUserRoles(user.firebaseUID, selectedRoles);
      onRolesUpdate(); // Refresh the users list
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update roles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <img 
            src={user.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)} 
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            
            <div className="mt-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {availableRoles.map(role => (
                      <label 
                        key={role}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                          disabled={loading}
                        />
                        <span className="text-sm font-medium capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                  
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedRoles(user.roles);
                        setError(null);
                      }}
                      disabled={loading}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map(role => (
                      <span 
                        key={role}
                        className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${role === 'developer' ? 'bg-purple-100 text-purple-800' :
                            role === 'admin' ? 'bg-red-100 text-red-800' :
                            role === 'driver' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                  </div>
                  
                  {availableRoles.length > 0 && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Edit Roles
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Bookings</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{user.activeBookings}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{user.totalBookings}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 