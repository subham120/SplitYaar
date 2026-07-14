export interface Trip {
  id: string;
  code: string;
  name: string;
  createdAt: string; // ISO datetime in IST
  createdByMemberId: string;
  status: 'active' | 'closed';
}

export interface Member {
  id: string;
  tripId: string;
  name: string;
  upiId: string | null;
  joinedAt: string; // ISO datetime
}

export type ExpenseCategory =
  | 'food'
  | 'travel'
  | 'stay'
  | 'sightseeing'
  | 'shopping'
  | 'alcohol'
  | 'misc';

export type SplitType = 'equal_all' | 'equal_selected' | 'custom';

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amountPaise: number; // Stored as integer paise
  paidByMemberId: string;
  category: ExpenseCategory;
  splitType: SplitType;
  date: string; // ISO date (YYYY-MM-DD)
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  sharePaise: number; // Portion of the expense in paise
}

// Derived/Calculated structures, not saved directly to database
export interface MemberBalance {
  memberId: string;
  totalPaidPaise: number;
  totalOwedPaise: number; // Sum of shares
  netBalancePaise: number; // totalPaidPaise - totalOwedPaise
}

export interface SettlementTransaction {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}
