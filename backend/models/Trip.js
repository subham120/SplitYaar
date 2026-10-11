import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 10,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  groupType: {
    type: String,
    enum: ['flatmates', 'daily', 'trip', 'couple', 'other'],
    default: 'trip',
  },
  createdByMemberId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Trip = mongoose.model('Trip', TripSchema);
