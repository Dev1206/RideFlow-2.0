interface Vehicle {
  make: string;
  model: string;
  color: string;
  plateNumber: string;
}

interface Driver {
  _id: string;
  name: string;
  phone: string;
  email: string;
  vehicle?: Vehicle;
  isAvailable: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface RideMetrics {
  distance: {
    text: string;    // e.g., "5.2 km"
    value: number;   // distance in meters
  };
  duration: {
    text: string;    // e.g., "15 mins"
    value: number;   // duration in seconds
  };
}

interface Coordinates {
  lat: number;
  lng: number;
}

export interface Ride {
  _id: string;
  userId: string;
  driverId?: string;
  name: string;
  email?: string;
  phone: string;
  pickupLocation: string;
  dropLocation: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  isPrivate?: boolean;
  returnRide?: boolean;
  returnDate?: string;
  returnTime?: string;
  driver?: Driver;
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
  dropCoordinates?: {
    lat: number;
    lng: number;
  };
  groupId?: string;
  createdAt?: string;
  updatedAt?: string;
  metrics?: RideMetrics;
}

export interface CreateRideRequest {
  name: string;
  phone: string;
  pickupLocation: string;
  dropLocation: string;
  pickupCoordinates?: Coordinates;
  dropCoordinates?: Coordinates;
  date: string;
  time: string;
  isPrivate: boolean;
  notes?: string;
  returnRide?: boolean;
  returnDate?: string;
  returnTime?: string;
}

export interface UpdateRideStatusRequest {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface AssignDriverRequest {
  driverId: string;
}

export interface GroupRideRequest {
  rideIds: string[];
}

export interface RideGroup {
  _id: string;
  rides: string[];
  createdBy: string;
  createdAt: string;
  color?: string;
}

export type { Vehicle, Driver, User, RideMetrics, Coordinates }; 