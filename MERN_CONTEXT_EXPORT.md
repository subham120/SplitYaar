# SplitYaar — Complete MERN Stack Specification & Context Export

This document contains the complete architectural blueprint, data schemas, mathematical split/settlement algorithms, REST API specifications, and React/Tailwind design tokens required to implement **SplitYaar** natively on the **MERN stack** (MongoDB, Express, React, Node.js).

---

## 1. System Architecture Overview

```
                      +----------------------------------------+
                      |          React 18/19 Client            |
                      |   (Vite / Next.js + Tailwind CSS)      |
                      +-------------------+--------------------+
                                          |
                                HTTP / REST APIs
                                          |
                      +-------------------v--------------------+
                      |          Express.js Server             |
                      |     (Node.js + TypeScript / ES6)       |
                      +-------------------+--------------------+
                                          |
                                    Mongoose ORM
                                          |
                      +-------------------v--------------------+
                      |            MongoDB Database            |
                      | (Collections: trips, members, expenses,|
                      |       expense_shares, settlements)     |
                      +----------------------------------------+
```

### Core Tenets
1. **Integer Arithmetic (Paise Precision)**: All monetary values are strictly stored as integer paise (`₹1 = 100 paise`) across database and business logic to prevent floating-point rounding errors.
2. **Client-Side Identity (Zero Mandatory Logins)**: Member identity is stored in `localStorage` per group (`split_yaar_member_${code}`). Joining a group via link/QR routes to a simple 1-click identity selection screen.
3. **Apple Minimalist Design**: Rich HSL/hex color palettes, frosted glass headers (`backdrop-blur-md`), pill buttons, and borderless rows (`divide-y divide-zinc-100`).
4. **UPI Deep-Linking**: Standard NPCI UPI URI links (`upi://pay?pa=...&am=...&cu=INR`) and generated base64 QR codes allow 1-tap debt settlement via GPay, PhonePe, and Paytm.

---

## 2. MongoDB Schemas (Mongoose Models)

### `models/Trip.js` (or `Group.js`)
```javascript
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
```

### `models/Member.js`
```javascript
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

export const Member = mongoose.model('Member', MemberSchema);
```

### `models/Expense.js`
```javascript
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
    min: 1, // Minimum 1 paisa
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
      'groceries', 'rent', 'utilities', 'maintenance', 'chai_snacks', 'subscriptions'
    ],
    default: 'misc',
  },
  splitType: {
    type: String,
    enum: ['equal_all', 'equal_selected', 'custom'],
    default: 'equal_all',
  },
  date: {
    type: String, // Stored as ISO YYYY-MM-DD
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

export const Expense = mongoose.model('Expense', ExpenseSchema);
```

### `models/ExpenseShare.js`
```javascript
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

export const ExpenseShare = mongoose.model('ExpenseShare', ExpenseShareSchema);
```

### `models/Settlement.js`
```javascript
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
    type: String, // YYYY-MM-DD
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Settlement = mongoose.model('Settlement', SettlementSchema);
```

---

## 3. Core Business Logic & Mathematical Algorithms

### A. Net Balance Computation (`lib/settlement.js`)
```javascript
/**
 * Calculates net balances for all members, factoring in expenses and debt settlements.
 */
export function computeNetBalances(members, expenses, shares, settlements = []) {
  const balances = {};

  members.forEach((m) => {
    balances[m._id.toString()] = { totalPaidPaise: 0, totalOwedPaise: 0, netAdjustmentPaise: 0 };
  });

  expenses.forEach((exp) => {
    const pId = exp.paidByMemberId.toString();
    if (balances[pId]) balances[pId].totalPaidPaise += exp.amountPaise;
  });

  shares.forEach((s) => {
    const mId = s.memberId.toString();
    if (balances[mId]) balances[mId].totalOwedPaise += s.sharePaise;
  });

  // Factor in settlements (debt repayments)
  settlements.forEach((s) => {
    const fromId = s.fromMemberId.toString();
    const toId = s.toMemberId.toString();
    if (balances[fromId]) balances[fromId].netAdjustmentPaise += s.amountPaise;
    if (balances[toId]) balances[toId].netAdjustmentPaise -= s.amountPaise;
  });

  return members.map((m) => {
    const id = m._id.toString();
    const { totalPaidPaise, totalOwedPaise, netAdjustmentPaise } = balances[id];
    return {
      memberId: id,
      totalPaidPaise,
      totalOwedPaise,
      netBalancePaise: (totalPaidPaise - totalOwedPaise) + netAdjustmentPaise,
    };
  });
}
```

### B. Min-Cash-Flow Debt Simplification Algorithm (`lib/settlement.js`)
```javascript
/**
 * Greedy algorithm that minimizes the number of P2P payments needed to settle all debts.
 */
export function simplifyDebts(balances) {
  const debtors = balances
    .filter((b) => b.netBalancePaise < 0)
    .map((b) => ({ memberId: b.memberId, amount: -b.netBalancePaise }));

  const creditors = balances
    .filter((b) => b.netBalancePaise > 0)
    .map((b) => ({ memberId: b.memberId, amount: b.netBalancePaise }));

  const transactions = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountPaise: settleAmount,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
    }

    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }

  return transactions;
}
```

### C. Remainder-Safe Split Calculation (`lib/split.js`)
```javascript
export function calculateEqualSplit(amountPaise, memberIds, payerId) {
  if (!memberIds.length) throw new Error('Cannot split among 0 members');

  const baseShare = Math.floor(amountPaise / memberIds.length);
  const remainder = amountPaise - (baseShare * memberIds.length);

  const shares = memberIds.map((memberId) => ({
    memberId,
    sharePaise: baseShare,
  }));

  // Assign remainder paise to payer if included, else first member
  if (remainder > 0) {
    const payerIdx = memberIds.indexOf(payerId);
    if (payerIdx !== -1) {
      shares[payerIdx].sharePaise += remainder;
    } else {
      shares[0].sharePaise += remainder;
    }
  }

  return shares;
}
```

### D. NPCI UPI Link & QR Code Generation (`lib/upi.js`)
```javascript
import QRCode from 'qrcode';

export function buildUpiLink(payeeVpa, payeeName, amountPaise, note) {
  const pa = encodeURIComponent(payeeVpa.trim());
  const pn = encodeURIComponent(payeeName.trim());
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(note.trim());
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export async function generateQrCodeDataUrl(text) {
  return await QRCode.toDataURL(text, {
    margin: 2,
    width: 320,
    color: { dark: '#1d1d1f', light: '#ffffff' },
  });
}
```

---

## 4. REST API Endpoints Specification

| Method | Endpoint | Description | Payload / Params |
|---|---|---|---|
| `POST` | `/api/trips` | Create new Group/Trip | `{ name, creatorName, creatorUpiId?, groupType? }` |
| `GET` | `/api/trips/:code` | Get Full Group Data (Trip, Members, Expenses, Shares, Settlements, Balances) | URL Param `:code` |
| `POST` | `/api/trips/:code/members` | Add Member to Group | `{ name, upiId? }` |
| `PUT` | `/api/trips/:code/members/:id` | Update Member Name or UPI ID | `{ name?, upiId? }` |
| `POST` | `/api/trips/:code/expenses` | Create Expense with Splits | `{ description, amountPaise, paidByMemberId, category, splitType, date, shares: [{ memberId, sharePaise }] }` |
| `GET` | `/api/trips/:code/expenses/:id` | Get Single Expense & Splits | URL Params `:code`, `:id` |
| `PUT` | `/api/trips/:code/expenses/:id` | Update Expense & Splits | Same as `POST` payload |
| `DELETE` | `/api/trips/:code/expenses/:id` | Delete Expense & its Shares | URL Params `:code`, `:id` |
| `POST` | `/api/trips/:code/settlements` | Record P2P Debt Settlement | `{ fromMemberId, toMemberId, amountPaise, date }` |

---

## 5. UI & Design System (Tailwind CSS Tokens)

Add to `tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        'primary-focus': '#0071e3',
        'primary-on-dark': '#2997ff',
        ink: '#1d1d1f',
        body: '#1d1d1f',
        'ink-muted-80': '#333333',
        'ink-muted-48': '#7a7a7a',
        hairline: '#e0e0e0',
        'divider-soft': '#f0f0f0',
        canvas: '#ffffff',
        'canvas-parchment': '#f5f5f7',
        'surface-pearl': '#fafafc',
      },
      borderRadius: {
        xs: '5px',
        sm: '8px',
        md: '11px',
        lg: '18px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

## 6. React Component Hierarchy & Route Structure

```
src/
├── components/
│   ├── Navbar.jsx                 # Top bar with Logo, Home link & "My Groups" dropdown
│   ├── SubNav.jsx                 # Sticky frosted header (Group Name, Code copy pill, Tab navigation)
│   ├── PersonalBalanceCard.jsx    # "Hey [Name]" green/red banner (settled / owes / owed)
│   ├── InviteToolbar.jsx          # 3-button grid: [Copy Link] | [Scan QR] | [WhatsApp]
│   ├── MemberLedgerList.jsx       # Borderless list rows with divide-y divide-zinc-100 and "You" badge
│   ├── RecentExpensesList.jsx     # Borderless rows with category pill, payer, and amount
│   ├── FloatingExpenseFab.jsx     # Centered floating mobile button "+ Add Expense"
│   ├── QrCodeModal.jsx            # Reusable popup for Invite QR & UPI Payment QR
│   └── MonthlySummaryModal.jsx    # Formatted WhatsApp summary report generator
├── pages/
│   ├── Home.jsx                   # Landing hero + recent groups + "Create Group" CTA
│   ├── CreateGroup.jsx            # Name, Group Type Chips (Flat, Daily, Trip), Creator Name/UPI
│   ├── GroupDashboard.jsx         # Main dashboard view (/trip/:code)
│   ├── JoinGroup.jsx              # "Who are you?" 1-tap member selector or "+ Join as new member"
│   ├── ExpenseHistory.jsx         # Month selector pills, Category/Payer filters, collapsible details
│   ├── AddEditExpense.jsx         # Dynamic split calculator (Equal / Custom) with live validation
│   ├── MembersList.jsx            # Add member, edit UPI ID, copy member-specific invite links
│   └── SettleUp.jsx               # Simplified settlement plan, UPI Pay deep link, Settlement logger
```

---

## 7. Step-by-Step Setup Guide to Run with MERN

1. **Backend**:
   ```bash
   mkdir backend && cd backend
   npm init -y
   npm install express mongoose cors dotenv qrcode
   ```
2. **Frontend**:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install lucide-react tailwindcss @tailwindcss/vite
   ```
3. **Connect**: Set `VITE_API_URL=http://localhost:5000` in frontend `.env` and `MONGO_URI=mongodb://localhost:27017/splityaar` in backend `.env`.
