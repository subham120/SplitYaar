import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
  upiId: {
    type: String,
    trim: true,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

MemberSchema.index({ tripId: 1, name: 1 });

export const Member = mongoose.model('Member', MemberSchema);
