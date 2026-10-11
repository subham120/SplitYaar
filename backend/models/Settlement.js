import mongoose from 'mongoose';

const SettlementSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  fromMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  toMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  amountPaise: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

SettlementSchema.index({ tripId: 1, createdAt: -1 });

export const Settlement = mongoose.model('Settlement', SettlementSchema);
