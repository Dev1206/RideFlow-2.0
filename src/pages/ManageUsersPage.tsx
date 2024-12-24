import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { useAsyncData } from '../hooks/useAsyncData';
import * as api from '../services/api';
import { FiEdit2, FiX, FiSearch, FiCheck } from 'react-icons/fi';

interface User {
  _id: string;
  firebaseUID: string;
  name: string;
  email: string;
  roles: string[];
  profilePicture?: string;
}

interface EditingUser {
  _id: string;
  firebaseUID: string;
  name: string;
  email: string;
  roles: string[];
}

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const { signOut, isDeveloper } = useAuth();
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    data: users = [],  
    refetch: refetchUsers,
    setData: setUsers 
  } = useAsyncData(() => api.getAllUsers(), []);

  const availableRoles = ['customer', 'driver', 'admin', 'developer'];

  useEffect(() => {
    const handleUserRolesUpdated = (event: CustomEvent<{ id: string; roles: string[] }>) => {
      setUsers((prevUsers: User[]) => {
        return prevUsers.map((user: User) => 
          user._id === event.detail.id 
            ? { ...user, roles: event.detail.roles }
            : user
        );
      });
    };

    window.addEventListener('userRolesUpdated', handleUserRolesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('userRolesUpdated', handleUserRolesUpdated as EventListener);
    };
  }, [setUsers]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      if (!Array.isArray(editingUser.roles) || editingUser.roles.length === 0) {
        throw new Error('User must have at least one role');
      }

      const originalUser = users.find((u: User) => u._id === editingUser._id);
      if (!originalUser) {
        throw new Error('Original user not found');
      }

      // Check if trying to remove admin role from self
      const currentUser = await api.getUserProfile();
      if (
        currentUser._id === editingUser._id &&
        originalUser.roles.includes('admin') &&
        !editingUser.roles.includes('admin')
      ) {
        throw new Error('Cannot remove admin role from yourself');
      }

      // Check if removing developer role (only developers can do this)
      if (
        originalUser.roles.includes('developer') &&
        !editingUser.roles.includes('developer') &&
        !isDeveloper()
      ) {
        throw new Error('Only developers can remove the developer role');
      }

      const result = await api.updateUserRoles(editingUser.firebaseUID, editingUser.roles);
      
      if (result.success) {
        setEditingUser(null);
        await refetchUsers();
        
        // If updating current user's roles, trigger a role refresh
        if (currentUser._id === editingUser._id) {
          window.dispatchEvent(new CustomEvent('userRolesUpdated', {
            detail: {
              id: editingUser._id,
              roles: editingUser.roles
            }
          }));
        }
      } else {
        throw new Error(result.message || 'Failed to update user roles');
      }
    } catch (error: any) {
      console.error('Error updating user roles:', error);
      alert(error.message || 'Failed to update user roles');
      await refetchUsers();
    }
  };

  const handleRoleToggle = (role: string) => {
    if (!editingUser) return;
    
    setEditingUser(prev => ({
      ...prev!,
      roles: prev!.roles.includes(role)
        ? prev!.roles.filter(r => r !== role)
        : [...prev!.roles, role]
    }));
  };

  const handleEditClick = (user: User) => {
    setEditingUser({
      _id: user._id,
      firebaseUID: user.firebaseUID,
      name: user.name,
      email: user.email,
      roles: [...user.roles]
    });
  };

  const filteredUsers = users.filter((u: User) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          hoverBg: 'group-hover:bg-red-200',
          gradient: 'from-red-500 to-rose-500'
        };
      case 'driver':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          hoverBg: 'group-hover:bg-green-200',
          gradient: 'from-emerald-500 to-green-500'
        };
      case 'developer':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          hoverBg: 'group-hover:bg-purple-200',
          gradient: 'from-purple-500 to-violet-500'
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          hoverBg: 'group-hover:bg-blue-200',
          gradient: 'from-blue-500 to-indigo-500'
        };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 fixed inset-0">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3B82F6]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-12 md:mt-0">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
                  Manage Users
                </h1>
                <p className="text-gray-600 mt-2">View and manage user roles and permissions</p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
                </div>
              </div>
            </header>

            {/* Users Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user: User) => (
                <div 
                  key={user._id} 
                  className="group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/[0.03] to-[#8B5CF6]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Top Corner Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/[0.07] to-[#8B5CF6]/[0.07] rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-300 group-hover:scale-110"></div>

                  {/* Bottom Corner Decoration */}
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#D946EF]/[0.05] to-[#8B5CF6]/[0.05] rounded-tr-[80px] -ml-8 -mb-8 transition-transform duration-300 group-hover:scale-110"></div>

                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div>
                        {editingUser?._id === user._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 text-emerald-600 hover:text-emerald-500 rounded-lg transition-colors"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-2 text-gray-400 hover:text-gray-500 rounded-lg transition-colors"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      {editingUser?._id === user._id ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => {
                              const colors = getRoleColor(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => handleRoleToggle(role)}
                                  className={`
                                    px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${editingUser.roles.includes(role)
                                      ? `${colors.bg} ${colors.text} ${colors.hoverBg}`
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                  `}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map(role => {
                            const colors = getRoleColor(role);
                            return (
                              <span
                                key={role}
                                className={`px-4 py-1.5 rounded-xl text-sm font-medium ${colors.bg} ${colors.text} ${colors.hoverBg} transition-colors duration-200`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Decoration Line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 