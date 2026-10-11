import mongoose from 'mongoose';

const ExpenseShareSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true,
    index: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true,
  },
  sharePaise: {
    type: Number,
    required: true,
    min: 0,
  },
});

ExpenseShareSchema.index({ expenseId: 1, memberId: 1 }, { unique: true });

export const ExpenseShare = mongoose.model('ExpenseShare', ExpenseShareSchema);
