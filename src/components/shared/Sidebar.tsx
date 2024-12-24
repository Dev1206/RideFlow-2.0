import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiClock,
  FiCalendar,
  FiUsers,
  FiTruck,
  FiList,
  FiLogOut,
  FiHelpCircle,
  FiMail,
} from 'react-icons/fi';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const location = useLocation();
  const { userRoles, isDeveloper } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      color: 'from-[#3B82F6] to-[#60A5FA]',
      roles: ['customer', 'driver', 'admin', 'developer']
    },
    {
      path: '/book-ride',
      label: 'Book Ride',
      icon: <FiCalendar className="w-5 h-5" />,
      color: 'from-[#059669] to-[#34D399]',
      roles: ['customer']
    },
    {
      path: '/my-rides',
      label: 'My Rides',
      icon: <FiCalendar className="w-5 h-5" />,
      color: 'from-[#8B5CF6] to-[#A78BFA]',
      roles: ['driver', 'admin', 'developer']
    },
    {
      path: '/ride-history',
      label: 'Ride History',
      icon: <FiClock className="w-5 h-5" />,
      color: 'from-[#F59E0B] to-[#FCD34D]',
      roles: ['customer']
    },
    {
      path: '/manage-users',
      label: 'Manage Users',
      icon: <FiUsers className="w-5 h-5" />,
      color: 'from-[#EC4899] to-[#F472B6]',
      roles: ['admin', 'developer']
    },
    {
      path: '/manage-drivers',
      label: 'Manage Drivers',
      icon: <FiTruck className="w-5 h-5" />,
      color: 'from-[#06B6D4] to-[#67E8F9]',
      roles: ['admin', 'developer']
    },
    {
      path: '/manage-rides',
      label: 'Manage Rides',
      icon: <FiList className="w-5 h-5" />,
      color: 'from-[#EAB308] to-[#FDE047]',
      roles: ['admin', 'developer']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role) || isDeveloper())
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {isOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div 
        className={`
          fixed md:static inset-0 z-40
          ${isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-0 md:w-[280px] md:translate-x-0'}
          transition-all duration-300 ease-in-out
          bg-white
          border-r border-gray-100
          text-gray-900 flex flex-col
          overflow-hidden
          shadow-lg md:shadow-none
          min-h-screen h-full
          pt-14 md:pt-0
        `}
      >
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[150px] md:w-[500px] h-[150px] md:h-[500px] bg-gradient-to-b from-[#3B82F6]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[150px] md:w-[500px] h-[150px] md:h-[500px] bg-gradient-to-t from-[#8B5CF6]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo Section */}
        <div className="relative p-4 md:p-6 border-b border-gray-100">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
              RideFlow
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Ride Booking System</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="relative flex-1 overflow-y-auto py-4 md:py-6">
          <div className="px-3 md:px-4 space-y-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                  transition-all duration-200 group
                  ${isActive(item.path)
                    ? 'bg-gray-50 shadow-sm'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg bg-gradient-to-br ${item.color}
                  transition-all duration-200 group-hover:shadow-lg group-hover:shadow-${item.color.split('-')[2]}/25
                `}>
                  <div className="text-white">
                    {item.icon}
                  </div>
                </div>
                <span className={`
                  font-medium text-sm
                  ${isActive(item.path) 
                    ? 'text-gray-900' 
                    : 'text-gray-600 group-hover:text-gray-900'
                  }
                `}>
                  {item.label}
                </span>
                {isActive(item.path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Support Button */}
          <div className="px-3 md:px-4 mt-4">
            <button
              onClick={() => {
                setShowSupportModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600
                transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/25">
                <FiHelpCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-gray-600 group-hover:text-gray-900">Support</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg
                hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600
                transition-all duration-200 group-hover:shadow-lg group-hover:shadow-rose-500/25">
                <FiLogOut className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-gray-600 group-hover:text-gray-900">Logout</span>
            </button>
          </div>
        </nav>

        {/* User Status Indicator */}
        <div className="relative p-4 md:p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/50">
          <div className="w-full max-w-[95%] md:max-w-md bg-white rounded-xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-3 md:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-xl font-semibold text-gray-900">Need Help?</h3>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 md:p-6 space-y-3 md:space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
                <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-gray-50">
                  <FiMail className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 break-all">rideflowdeveloper@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3">
                  <span className="text-sm ">Mail us your query and we will get back to you within 1 hour.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white p-3 md:p-6 border-t border-gray-100">
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}; 
