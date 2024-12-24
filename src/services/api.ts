import { AppError, ErrorType, ErrorCode } from '../utils/errorHandling';
import { Ride, CreateRideRequest } from '../types/ride';


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

let authToken: string | null = null;

export const setAuthToken = (token: string): void => {
  authToken = token;
  localStorage.setItem('token', token);
};

export const getStoredToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('token');
  }
  return authToken;
};

export const clearAuthToken = (): void => {
  authToken = null;
  localStorage.removeItem('token');
};

const getHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new AppError(
      'Failed to parse response data',
      ErrorType.API,
      ErrorCode.SERVER_ERROR,
      { originalError: e }
    );
  }

  if (!response.ok) {
    throw new AppError(
      data.message || 'An error occurred',
      ErrorType.API,
      response.status === 401 ? ErrorCode.UNAUTHORIZED : ErrorCode.SERVER_ERROR,
      data
    );
  }

  // Ensure consistent response format
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (!('success' in data)) {
      data = {
        success: true,
        data: data
      };
    }
  } else {
    data = {
      success: true,
      data: data
    };
  }

  return data as T;
};

interface UserData {
  email: string;
  name: string;
  firebaseUID: string;
  photoURL?: string;
  roles?: string[];
}

export const createUser = async (userData: UserData): Promise<ApiResponse<{ token: string; user: any }>> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new AppError(
        'No Firebase token available',
        ErrorType.AUTH,
        ErrorCode.INVALID_TOKEN,
        { context: 'User creation' }
      );
    }

    console.log('Creating user with Firebase token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AppError(
        errorData.message || 'Failed to create user',
        ErrorType.API,
        response.status === 401 ? ErrorCode.UNAUTHORIZED : ErrorCode.SERVER_ERROR,
        errorData
      );
    }

    const data = await handleResponse<ApiResponse<{ token: string; user: any }>>(response);
    
    if (!data.data?.token) {
      throw new AppError(
        'No token received from server',
        ErrorType.API,
        ErrorCode.SERVER_ERROR,
        { context: 'User creation response' }
      );
    }

    setAuthToken(data.data.token);
    console.log('Backend token saved:', data.data.token.substring(0, 20) + '...');
    
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to create user',
      ErrorType.API,
      ErrorCode.SERVER_ERROR,
      { originalError: error }
    );
  }
};

export const getUserProfile = async (): Promise<any> => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new AppError(
        'No auth token found',
        ErrorType.AUTH,
        ErrorCode.INVALID_TOKEN
      );
    }

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        ...getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (response.status === 404) {
      throw new AppError(
        'User not found',
        ErrorType.API,
        ErrorCode.NOT_FOUND
      );
    }

    return handleResponse(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to fetch profile',
      ErrorType.API,
      ErrorCode.SERVER_ERROR,
      { originalError: error }
    );
  }
};

export const createRide = async (data: CreateRideRequest): Promise<Ride> => {
  try {
    const response = await fetch(`${API_URL}/rides`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<Ride>(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to create ride',
      ErrorType.API,
      ErrorCode.SERVER_ERROR,
      { originalError: error }
    );
  }
};

export const getUserRides = async (): Promise<ApiResponse<Ride[]>> => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new AppError(
        'Authentication required',
        ErrorType.AUTH,
        ErrorCode.INVALID_TOKEN
      );
    }

    const response = await fetch(`${API_URL}/rides/my-rides`, {
      headers: getHeaders()
    });

    return handleResponse<ApiResponse<Ride[]>>(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      'Failed to fetch rides',
      ErrorType.API,
      ErrorCode.SERVER_ERROR,
      { originalError: error }
    );
  }
};

export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users/all`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserRoles = async (firebaseUID: string, roles: string[]) => {
  try {
    console.log('Updating roles for user:', firebaseUID, 'New roles:', roles);

    const response = await fetch(`${API_URL}/users/${firebaseUID}/roles`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ roles }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Server error response:', data);
      throw new Error(data.message || 'Failed to update roles');
    }

    if (data.user && data.user.roles) {
      const event = new CustomEvent('userRolesUpdated', { 
        detail: {
          id: data.user._id,
          roles: data.user.roles,
          driverInfo: data.user.driverInfo
        }
      });
      window.dispatchEvent(event);
    }

    return data;
  } catch (error: any) {
    console.error('Error updating user roles:', error);
    throw new Error(error.message || 'Failed to update roles');
  }
};

export const getAllRides = async () => {
  try {
    const response = await fetch(`${API_URL}/rides/all`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rides');
    }

    const data = await response.json();
    console.log('API response data:', data[0]?.metrics);
    return data;
  } catch (error) {
    console.error('Error in getAllRides:', error);
    throw error;
  }
};

export const getDrivers = async () => {
  try {
    const response = await fetch(`${API_URL}/users/drivers`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch drivers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

export const assignDriver = async (rideId: string, driverId: string) => {
  try {
    const response = await fetch(`${API_URL}/rides/${rideId}/assign-driver`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ driverId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign driver');
    }

    return await response.json();
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw error;
  }
};

export const updateRideStatus = async (rideId: string, status: string) => {
  const response = await fetch(`${API_URL}/rides/${rideId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update ride status');
  }

  return response.json();
};

export const deleteRide = async (rideId: string) => {
  try {
    const response = await fetch(`${API_URL}/rides/${rideId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete ride');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting ride:', error);
    throw error;
  }
};

export const updateDriver = async (driverId: string, driverData: any) => {
  try {
    const response = await fetch(`${API_URL}/users/drivers/${driverId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(driverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update driver');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
};

export const deleteDriver = async (driverId: string): Promise<void> => {
  try {
    console.log(`Attempting to delete driver with ID: ${driverId}`);
    
    const response = await fetch(`${API_URL}/users/drivers/${driverId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    console.log('Delete response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Driver not found');
      }
      const error = await response.json();
      throw new Error(error.message || 'Error deleting driver');
    }

    const data = await response.json();
    
    if (data.updatedUser) {
      const event = new CustomEvent('userRolesUpdated', { 
        detail: data.updatedUser 
      });
      window.dispatchEvent(event);
    }

    return;
  } catch (error: any) {
    console.error('Delete driver error details:', {
      error,
      status: error.status,
      message: error.message,
      driverId,
      stack: error.stack
    });
    
    if (error.message === 'Driver not found') {
      throw new Error('Driver not found or already deleted');
    }
    throw new Error(error.message || 'Failed to delete driver');
  }
};

export const getDriverRides = async () => {
  try {
    console.log('Fetching driver rides...');
    const response = await fetch(`${API_URL}/rides/driver-rides`, {
      headers: getHeaders(),
    });

    console.log('Driver rides response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No driver rides found');
        return []; // Return empty array for no rides
      }
      const error = await response.json();
      console.error('Error response:', error);
      throw new Error(error.message || 'Failed to fetch driver rides');
    }

    const rides = await response.json();
    console.log('Fetched driver rides:', rides.length);
    return rides;
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    return []; // Return empty array on error
  }
};

export const getDashboardMetrics = async () => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_URL}/rides/metrics`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dashboard metrics');
    }

    const data = await response.json();
    return {
      totalRides: data.totalRides || 0,
      activeUsers: data.activeUsers || 0,
      dailyBookings: data.dailyBookings || 0,
      completedRides: data.completedRides || 0,
      totalUsers: data.totalUsers || 0,
      totalDrivers: data.totalDrivers || 0,
      activeRides: data.activeRides || 0,
      newUsers: {
        daily: data.newUsers?.daily || 0,
        weekly: data.newUsers?.weekly || 0
      },
      rideStatus: {
        pending: data.rideStatus?.pending || 0,
        inProgress: data.rideStatus?.inProgress || 0,
        completed: data.rideStatus?.completed || 0,
        cancelled: data.rideStatus?.cancelled || 0
      },
      driverStatus: {
        available: data.driverStatus?.available || 0,
        unavailable: data.driverStatus?.unavailable || 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

export const getAdminContact = async () => {
  try {
    let token = getStoredToken();
    if (!token) {
      console.log('No token found, waiting briefly...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      token = getStoredToken();
      if (!token) {
        throw new Error('No token available after retry');
      }
    }

    const response = await fetch(`${API_URL}/users/admin-contact`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch admin contact');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching admin contact:', error);
    throw error;
  }
};

interface DriverInfo {
  phone: string;
  vehicle: {
    color: string;
    make: string;
    model: string;
    plateNumber: string;
  };
}

export const getDriverInfo = async () => {
  try {
    const response = await fetch(`${API_URL}/users/driver-info`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Return null for not found
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch driver info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching driver info:', error);
    return null; // Return null on error
  }
};

export const updateDriverInfo = async (data: DriverInfo) => {
  try {
    const response = await fetch(`${API_URL}/users/driver-info`, {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update driver info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating driver info:', error);
    throw error;
  }
};

export const getCompletedRides = async () => {
  try {
    const response = await fetch(`${API_URL}/rides/completed`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch completed rides');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching completed rides:', error);
    throw error;
  }
};

export const getRecentActivities = async () => {
  try {
    const response = await fetch(`${API_URL}/activities/recent`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch recent activities');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

interface DriverData {
  userId: string;
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

export const createDriver = async (driverData: DriverData) => {
  try {
    const response = await fetch(`${API_URL}/users/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(driverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create driver');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
};

export const removeDriver = async (rideId: string) => {
  try {
    const response = await fetch(`${API_URL}/rides/${rideId}/remove-driver`, {
      method: 'PUT',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove driver');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing driver:', error);
    throw error;
  }
};

export const groupRides = async (rideIds: string[]) => {
  try {
    console.log('Sending group rides request:', { rideIds });
    
    // Get fresh token
    const token = getStoredToken();
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_URL}/rides/group`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rideIds }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Group rides error response:', data);
      throw new Error(data.error || data.message || 'Failed to group rides');
    }

    console.log('Group rides success response:', data);
    return data.groupId;
  } catch (error) {
    console.error('Error grouping rides:', error);
    throw error;
  }
};

export const updateRideGroup = async (groupId: string, rideIds: string[]) => {
  const response = await fetch(`${API_URL}/rides/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rideIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update ride group');
  }

  return response.json();
};

export const removeRideFromGroup = async (rideId: string, groupId: string) => {
  const response = await fetch(`${API_URL}/rides/groups/${groupId}/rides/${rideId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove ride from group');
  }

  return response.json();
};

export const getRideGroups = async () => {
  try {
    console.log('Fetching ride groups...');
    const response = await fetch(`${API_URL}/rides/groups`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch ride groups');
    }

    const groups = await response.json();
    console.log('Fetched ride groups:', groups);
    return groups;
  } catch (error) {
    console.error('Error fetching ride groups:', error);
    throw error;
  }
};
