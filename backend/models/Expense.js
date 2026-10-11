import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  amountPaise: {
    type: Number,
    required: true,
    min: 1,
  },
  paidByMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  category: {
    type: String,
    enum: [
      'food', 'travel', 'stay', 'sightseeing', 'shopping', 'alcohol', 'misc',
      'groceries', 'rent', 'utilities', 'maintenance', 'chai_snacks', 'subscriptions',
    ],
    default: 'food',
  },
  splitType: {
    type: String,
    enum: ['equal_all', 'equal_selected', 'custom'],
    default: 'equal_all',
  },
  date: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ExpenseSchema.index({ tripId: 1, date: -1, createdAt: -1 });

export const Expense = mongoose.model('Expense', ExpenseSchema);
