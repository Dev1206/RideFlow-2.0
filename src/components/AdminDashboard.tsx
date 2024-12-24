import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  FiUsers, FiTruck, FiCalendar, FiCheckCircle, FiUserPlus, 
  FiDownload, FiClock
} from 'react-icons/fi';
import { RiCarLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { Ride } from '../types/ride';

// Define vibrant color palette
const COLORS = {
  primary: '#6366F1',   // Indigo
  secondary: '#8B5CF6', // Purple
  success: '#10B981',   // Emerald
  warning: '#F59E0B',   // Amber
  danger: '#EF4444',    // Red
  info: '#3B82F6',      // Blue
  pink: '#EC4899',      // Pink
  orange: '#F97316',    // Orange
  teal: '#14B8A6',      // Teal
  cyan: '#06B6D4'       // Cyan
};

// Chart colors
const CHART_COLORS = {
  pending: '#FFB020',    // Bright Yellow
  confirmed: '#3B82F6',  // Bright Blue
  completed: '#10B981',  // Bright Green
  cancelled: '#F43F5E',  // Bright Red
  available: '#22D3EE',  // Bright Cyan
  onRide: '#8B5CF6',    // Bright Purple
  completedToday: '#F59E0B' // Bright Orange
};

// Add these interfaces at the top
interface DashboardMetrics {
  totalRides: number;
  activeUsers: number;
  dailyBookings: number;
  completedRides: number;
  totalUsers: number;
  totalDrivers: number;
  activeRides: number;
  newUsers: {
    daily: number;
    weekly: number;
  };
  rideStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  driverStatus: {
    available: number;
    unavailable: number;
  };
}

interface DashboardProps {
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
  rides: Ride[];
}

export default function AdminDashboard({ metrics, loading, error, rides }: DashboardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading dashboard data: {error}
      </div>
    );
  }

  const recentRides = rides
    .filter((ride: Ride) => ride.status !== 'pending')
    .sort((a: Ride, b: Ride) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Update the data preparation for line chart
  const getLast7DaysData = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    return last7Days.map((date, index) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayRides = rides.filter(ride => ride.date.split('T')[0] === dateStr);

      return {
        day: index === 6 ? 'Today' : 
             index === 5 ? 'Yesterday' : 
             date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayRides.filter(ride => ride.status === 'completed').length,
        cancelled: dayRides.filter(ride => ride.status === 'cancelled').length,
        new: dayRides.length
      };
    });
  };

  // Replace the hardcoded data with actual data
  const last7DaysData = getLast7DaysData();

  // Prepare data for bar chart - Driver Performance with actual metrics
  const driverPerformanceData = [
    { 
      name: 'Available', 
      count: metrics.driverStatus.available, 
      color: CHART_COLORS.available 
    },
    { 
      name: 'On Ride', 
      count: metrics.rideStatus.inProgress, 
      color: CHART_COLORS.onRide 
    },
    { 
      name: 'Completed Today', 
      count: metrics.completedRides, 
      color: CHART_COLORS.completedToday 
    }
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Key Metrics Grid - Adjusted for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rides Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl p-4 lg:p-6 text-white">
          <div className="flex flex-col h-full">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
              <FiClock className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-white/80">Total Rides</p>
            <p className="text-lg lg:text-2xl font-bold mt-1">{metrics.totalRides}</p>
            <p className="text-xs lg:text-sm text-white/80 mt-1">
              {metrics.dailyBookings} today
            </p>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 lg:p-6 text-white">
          <div className="flex flex-col h-full">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
              <FiUsers className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-white/80">Active Users</p>
            <p className="text-lg lg:text-2xl font-bold mt-1">{metrics.activeUsers}</p>
            <p className="text-xs lg:text-sm text-white/80 mt-1">
              of {metrics.totalUsers} total
            </p>
          </div>
        </div>

        {/* Daily Bookings Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 lg:p-6 text-white">
          <div className="flex flex-col h-full">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
              <FiCalendar className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-white/80">Daily Bookings</p>
            <p className="text-lg lg:text-2xl font-bold mt-1">{metrics.dailyBookings}</p>
          </div>
        </div>

        {/* Completed Rides Card */}
        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-4 lg:p-6 text-white">
          <div className="flex flex-col h-full">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 lg:mb-3">
              <FiCheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-white/80">Completed Rides</p>
            <p className="text-lg lg:text-2xl font-bold mt-1">{metrics.completedRides}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Adjusted for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => navigate('/manage-users')}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FiUserPlus className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-700">Manage Users</span>
        </button>

        <button
          onClick={() => navigate('/manage-drivers')}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FiTruck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-700">Manage Drivers</span>
        </button>

        <button
          onClick={() => navigate('/manage-rides')}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <RiCarLine className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-700">Manage Rides</span>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <FiDownload className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-700">Reports</span>
        </button>
      </div>

      {/* Charts Section - Adjusted for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Ride Status Chart */}
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Ride Status Overview</h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="New Bookings"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Completed"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cancelled" 
                  stroke={COLORS.danger} 
                  strokeWidth={2}
                  name="Cancelled"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Performance Chart */}
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Driver Performance</h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                >
                  {driverPerformanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend - Adjusted for mobile */}
          <div className="mt-4 md:mt-6 flex flex-wrap gap-3 md:gap-4 justify-center">
            {driverPerformanceData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs md:text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section - Adjusted for mobile */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 md:space-y-4">
            {recentRides.map((ride) => (
              <div key={ride._id} className="flex items-center gap-3 md:gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  ride.status === 'completed' ? 'bg-green-100 text-green-600' :
                  ride.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                  ride.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <FiCalendar className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                    {ride.driver?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Booked a ride • {new Date(ride.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-medium rounded-full ${
                  ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                  ride.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {ride.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 