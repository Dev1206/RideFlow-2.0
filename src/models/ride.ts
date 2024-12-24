import { Schema, Document, model } from 'mongoose';
import type { Types } from 'mongoose';

export interface IRide extends Document {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;
  name: string;
  phone: string;
  pickupLocation: string;
  dropLocation: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isPrivate: boolean;
  returnRide?: boolean;
  returnDate?: Date;
  returnTime?: string;
  groupId?: Types.ObjectId;
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
  dropCoordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const rideSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  isPrivate: { type: Boolean, default: false },
  returnRide: { type: Boolean, default: false },
  returnDate: Date,
  returnTime: String,
  groupId: { type: Schema.Types.ObjectId, ref: 'RideGroup' },
  pickupCoordinates: {
    lat: Number,
    lng: Number
  },
  dropCoordinates: {
    lat: Number,
    lng: Number
  }
}, {
  timestamps: true
});

export const Ride = model<IRide>('Ride', rideSchema); 