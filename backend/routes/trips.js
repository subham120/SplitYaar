import { Router } from 'express';
import crypto from 'crypto';
import { Trip } from '../models/Trip.js';
import { Member } from '../models/Member.js';
import { Expense } from '../models/Expense.js';
import { ExpenseShare } from '../models/ExpenseShare.js';
import { Settlement } from '../models/Settlement.js';
import { computeNetBalances, simplifyDebts } from '../lib/settlement.js';
import { calculateEqualSplit } from '../lib/split.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Generate a unique 6-character group code.
 */
function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ─── CREATE GROUP ────────────────────────────────────────────────────────────

/**
 * POST /api/trips
 * Body: { name, creatorName, creatorUpiId?, groupType? }
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, creatorName, creatorUpiId, groupType } = req.body;

    if (!name || !creatorName) {
      return res.status(400).json({ error: 'Group name and creator name are required' });
    }

    // Generate unique code and create trip with collision retry
    let trip;
    let code;
    let attempts = 0;

    while (!trip && attempts < 10) {
      attempts++;
      code = generateCode();
      try {
        trip = await Trip.create({
          code,
          name: name.trim(),
          groupType: groupType || 'trip',
          createdByMemberId: 'pending',
        });
      } catch (err) {
        if (err.code === 11000) {
          // duplicate code collision, retry with new code
          continue;
        }
        throw err;
      }
    }

    if (!trip) {
      return res.status(500).json({ error: 'Failed to generate unique group code' });
    }

    let creator;
    try {
      // Create the first member (creator)
      creator = await Member.create({
        tripId: trip._id,
        name: creatorName.trim(),
        upiId: creatorUpiId || null,
      });

      // Update trip with creator's member ID
      trip.createdByMemberId = creator._id.toString();
      await trip.save();
    } catch (err) {
      // Clean up orphaned trip if member creation fails
      await Trip.findByIdAndDelete(trip._id);
      throw err;
    }

    res.status(201).json({
      trip,
      member: creator,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// ─── GET FULL GROUP DATA ─────────────────────────────────────────────────────

/**
 * GET /api/trips/:code
 * Returns: trip, members, expenses (with shares), settlements, balances, simplifiedDebts
 */
router.get('/:code', optionalAuth, async (req, res) => {
  try {
    const cleanCode = String(req.params.code).toUpperCase().trim();
    const trip = await Trip.findOne({ code: cleanCode }).lean();
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    // Fetch members, expenses, and settlements concurrently
    const [members, expenses, settlements] = await Promise.all([
      Member.find({ tripId: trip._id }).sort({ joinedAt: 1 }).lean(),
      Expense.find({ tripId: trip._id }).sort({ date: -1, createdAt: -1 }).lean(),
      Settlement.find({ tripId: trip._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const expenseIds = expenses.map((e) => e._id);
    const shares = await ExpenseShare.find({ expenseId: { $in: expenseIds } }).lean();

    // Group shares by expenseId in O(S) using a Map
    const sharesByExpense = new Map();
    for (const s of shares) {
      const expId = s.expenseId.toString();
      if (!sharesByExpense.has(expId)) {
        sharesByExpense.set(expId, []);
      }
      sharesByExpense.get(expId).push(s);
    }

    // Attach shares to each expense
    const expensesWithShares = expenses.map((exp) => ({
      ...exp,
      shares: sharesByExpense.get(exp._id.toString()) || [],
    }));

    // Compute balances
    const balances = computeNetBalances(members, expenses, shares, settlements);
    const simplifiedDebts = simplifyDebts(balances);

    res.json({
      trip,
      members,
      expenses: expensesWithShares,
      settlements,
      balances,
      simplifiedDebts,
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to fetch group data' });
  }
});

// ─── ADD MEMBER ──────────────────────────────────────────────────────────────

/**
 * POST /api/trips/:code/members
 * Body: { name, upiId? }
 */
router.post('/:code/members', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const { name, upiId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Member name is required' });

    const cleanName = name.trim();
    const existing = await Member.findOne({ tripId: trip._id, name: cleanName });
    if (existing) {
      return res.status(409).json({ error: 'A member with this name already exists in this group' });
    }

    const member = await Member.create({
      tripId: trip._id,
      name: cleanName,
      upiId: upiId ? upiId.trim() : null,
    });

    res.status(201).json({ member });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ─── UPDATE MEMBER ───────────────────────────────────────────────────────────

/**
 * PUT /api/trips/:code/members/:id
 * Body: { name?, upiId? }
 */
router.put('/:code/members/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const updates = {};
    if (req.body.name !== undefined) {
      const cleanName = req.body.name.trim();
      if (!cleanName) return res.status(400).json({ error: 'Member name cannot be empty' });
      const duplicate = await Member.findOne({
        tripId: trip._id,
        name: cleanName,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(409).json({ error: 'A member with this name already exists in this group' });
      }
      updates.name = cleanName;
    }
    if (req.body.upiId !== undefined) updates.upiId = req.body.upiId ? req.body.upiId.trim() : null;

    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, tripId: trip._id },
      updates,
      { new: true },
    );

    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json({ member });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// ─── CREATE EXPENSE ──────────────────────────────────────────────────────────

/**
 * POST /api/trips/:code/expenses
 * Body: { description, amountPaise, paidByMemberId, category?, splitType?, date, shares? }
 * If splitType is 'equal_all', shares are auto-computed.
 * If splitType is 'equal_selected' or 'custom', shares must be provided.
 */
router.post('/:code/expenses', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const {
      description, amountPaise, paidByMemberId,
      category, splitType, date, shares: customShares,
    } = req.body;

    if (!description || !amountPaise || !paidByMemberId || !date) {
      return res.status(400).json({ error: 'description, amountPaise, paidByMemberId, and date are required' });
    }

    if (!Number.isInteger(amountPaise) || amountPaise < 1) {
      return res.status(400).json({ error: 'Amount must be an integer of at least 1 paisa' });
    }

    const members = await Member.find({ tripId: trip._id });
    const payer = members.find((m) => m._id.toString() === paidByMemberId.toString());
    if (!payer) return res.status(400).json({ error: 'Payer is not a member of this group' });

    // Compute & validate shares BEFORE creating expense
    let computedShares = [];
    const resolvedSplitType = splitType || 'equal_all';

    if (resolvedSplitType === 'equal_all') {
      const memberIds = members.map((m) => m._id.toString());
      computedShares = calculateEqualSplit(amountPaise, memberIds, paidByMemberId.toString());
    } else if (resolvedSplitType === 'equal_selected') {
      if (!customShares || !customShares.length) {
        return res.status(400).json({ error: 'shares[] required for equal_selected split' });
      }
      const memberIdSet = new Set(members.map((m) => m._id.toString()));
      const selectedIds = customShares.map((s) => s.memberId?.toString());
      if (!selectedIds.every((id) => memberIdSet.has(id))) {
        return res.status(400).json({ error: 'All selected split members must belong to this group' });
      }
      computedShares = calculateEqualSplit(amountPaise, selectedIds, paidByMemberId.toString());
    } else if (resolvedSplitType === 'custom') {
      if (!customShares || !customShares.length) {
        return res.status(400).json({ error: 'shares[] required for custom split' });
      }
      const memberIdSet = new Set(members.map((m) => m._id.toString()));
      if (!customShares.every((s) => memberIdSet.has(s.memberId?.toString()))) {
        return res.status(400).json({ error: 'All custom split members must belong to this group' });
      }
      if (customShares.some((s) => !Number.isInteger(s.sharePaise) || s.sharePaise < 0)) {
        return res.status(400).json({ error: 'All custom share amounts must be non-negative integers' });
      }
      const totalShares = customShares.reduce((sum, s) => sum + s.sharePaise, 0);
      if (totalShares !== amountPaise) {
        return res.status(400).json({ error: `Share total (${totalShares}) doesn't match expense amount (${amountPaise})` });
      }
      computedShares = customShares.map((s) => ({
        memberId: s.memberId.toString(),
        sharePaise: s.sharePaise,
      }));
    } else {
      return res.status(400).json({ error: `Invalid splitType: ${resolvedSplitType}` });
    }

    // Now safely create expense
    const expense = await Expense.create({
      tripId: trip._id,
      description: description.trim(),
      amountPaise,
      paidByMemberId: payer._id,
      category: category || 'food',
      splitType: resolvedSplitType,
      date,
    });

    let createdShares;
    try {
      const shareDocs = computedShares.map((s) => ({
        expenseId: expense._id,
        memberId: s.memberId,
        sharePaise: s.sharePaise,
      }));
      createdShares = await ExpenseShare.insertMany(shareDocs);
    } catch (shareErr) {
      // Rollback expense so no orphaned expense exists
      await Expense.findByIdAndDelete(expense._id);
      throw shareErr;
    }

    res.status(201).json({
      expense,
      shares: createdShares,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// ─── GET SINGLE EXPENSE ──────────────────────────────────────────────────────

/**
 * GET /api/trips/:code/expenses/:id
 */
router.get('/:code/expenses/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const expense = await Expense.findOne({ _id: req.params.id, tripId: trip._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const shares = await ExpenseShare.find({ expenseId: expense._id });

    res.json({ expense, shares });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// ─── UPDATE EXPENSE ──────────────────────────────────────────────────────────

/**
 * PUT /api/trips/:code/expenses/:id
 * Body: same as POST
 */
router.put('/:code/expenses/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const expense = await Expense.findOne({ _id: req.params.id, tripId: trip._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const {
      description, amountPaise, paidByMemberId,
      category, splitType, date, shares: customShares,
    } = req.body;

    const members = await Member.find({ tripId: trip._id });
    const memberIdSet = new Set(members.map((m) => m._id.toString()));

    if (amountPaise !== undefined) {
      if (!Number.isInteger(amountPaise) || amountPaise < 1) {
        return res.status(400).json({ error: 'Amount must be an integer of at least 1 paisa' });
      }
    }

    if (paidByMemberId !== undefined) {
      if (!memberIdSet.has(paidByMemberId.toString())) {
        return res.status(400).json({ error: 'Payer is not a member of this group' });
      }
    }

    const targetAmount = amountPaise !== undefined ? amountPaise : expense.amountPaise;
    const targetSplitType = splitType !== undefined ? splitType : expense.splitType;
    const targetPayerId = (paidByMemberId !== undefined ? paidByMemberId : expense.paidByMemberId).toString();

    // Recompute shares if amount, splitType, or customShares changed
    const needsShareUpdate = amountPaise !== undefined || splitType !== undefined || customShares !== undefined;
    let newShareDocs = null;

    if (needsShareUpdate) {
      if (targetSplitType === 'equal_all') {
        const memberIds = members.map((m) => m._id.toString());
        const computed = calculateEqualSplit(targetAmount, memberIds, targetPayerId);
        newShareDocs = computed.map((s) => ({
          expenseId: expense._id,
          memberId: s.memberId,
          sharePaise: s.sharePaise,
        }));
      } else if (targetSplitType === 'equal_selected') {
        if (!customShares || !customShares.length) {
          return res.status(400).json({ error: 'shares[] required for equal_selected split' });
        }
        const selectedIds = customShares.map((s) => s.memberId?.toString());
        if (!selectedIds.every((id) => memberIdSet.has(id))) {
          return res.status(400).json({ error: 'All selected split members must belong to this group' });
        }
        const computed = calculateEqualSplit(targetAmount, selectedIds, targetPayerId);
        newShareDocs = computed.map((s) => ({
          expenseId: expense._id,
          memberId: s.memberId,
          sharePaise: s.sharePaise,
        }));
      } else if (targetSplitType === 'custom') {
        if (!customShares || !customShares.length) {
          return res.status(400).json({ error: 'shares[] required for custom split' });
        }
        if (!customShares.every((s) => memberIdSet.has(s.memberId?.toString()))) {
          return res.status(400).json({ error: 'All custom split members must belong to this group' });
        }
        if (customShares.some((s) => !Number.isInteger(s.sharePaise) || s.sharePaise < 0)) {
          return res.status(400).json({ error: 'All custom share amounts must be non-negative integers' });
        }
        const totalShares = customShares.reduce((sum, s) => sum + s.sharePaise, 0);
        if (totalShares !== targetAmount) {
          return res.status(400).json({ error: `Share total (${totalShares}) doesn't match expense amount (${targetAmount})` });
        }
        newShareDocs = customShares.map((s) => ({
          expenseId: expense._id,
          memberId: s.memberId.toString(),
          sharePaise: s.sharePaise,
        }));
      }
    }

    // Apply updates
    if (description !== undefined) expense.description = description.trim();
    if (amountPaise !== undefined) expense.amountPaise = amountPaise;
    if (paidByMemberId !== undefined) expense.paidByMemberId = paidByMemberId;
    if (category !== undefined) expense.category = category;
    if (splitType !== undefined) expense.splitType = splitType;
    if (date !== undefined) expense.date = date;
    expense.updatedAt = new Date();

    await expense.save();

    if (newShareDocs) {
      await ExpenseShare.deleteMany({ expenseId: expense._id });
      await ExpenseShare.insertMany(newShareDocs);
    }

    const shares = await ExpenseShare.find({ expenseId: expense._id });

    res.json({ expense, shares });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// ─── DELETE EXPENSE ──────────────────────────────────────────────────────────

/**
 * DELETE /api/trips/:code/expenses/:id
 */
router.delete('/:code/expenses/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const expense = await Expense.findOneAndDelete({ _id: req.params.id, tripId: trip._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await ExpenseShare.deleteMany({ expenseId: expense._id });

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ─── RECORD SETTLEMENT ──────────────────────────────────────────────────────

/**
 * POST /api/trips/:code/settlements
 * Body: { fromMemberId, toMemberId, amountPaise, date }
 */
router.post('/:code/settlements', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const { fromMemberId, toMemberId, amountPaise, date } = req.body;

    if (!fromMemberId || !toMemberId || !amountPaise || !date) {
      return res.status(400).json({ error: 'fromMemberId, toMemberId, amountPaise, and date are required' });
    }

    if (!Number.isInteger(amountPaise) || amountPaise < 1) {
      return res.status(400).json({ error: 'amountPaise must be a positive integer in paise' });
    }

    if (fromMemberId.toString() === toMemberId.toString()) {
      return res.status(400).json({ error: 'Cannot settle with yourself' });
    }

    // Verify both members belong to this trip
    const [fromMember, toMember] = await Promise.all([
      Member.findOne({ _id: fromMemberId, tripId: trip._id }),
      Member.findOne({ _id: toMemberId, tripId: trip._id }),
    ]);

    if (!fromMember || !toMember) {
      return res.status(400).json({ error: 'Both members must belong to this group' });
    }

    const settlement = await Settlement.create({
      tripId: trip._id,
      fromMemberId: fromMember._id,
      toMemberId: toMember._id,
      amountPaise,
      date,
    });

    res.status(201).json({ settlement });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Create settlement error:', error);
    res.status(500).json({ error: 'Failed to record settlement' });
  }
});

// ─── REVERT / DELETE SETTLEMENT ─────────────────────────────────────────────

/**
 * DELETE /api/trips/:code/settlements/:id
 */
router.delete('/:code/settlements/:id', optionalAuth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: String(req.params.code).toUpperCase().trim() });
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const settlement = await Settlement.findOneAndDelete({ _id: req.params.id, tripId: trip._id });
    if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

    res.json({ message: 'Settlement reverted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    console.error('Delete settlement error:', error);
    res.status(500).json({ error: 'Failed to revert settlement' });
  }
});

export default router;
