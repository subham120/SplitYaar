import { Router } from 'express';
import { User } from '../models/User.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

import bcrypt from 'bcryptjs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = '$2a$12$e8741Xq89t581bE3gqF8QO/5n5rG5W8qWJ5hZfVfJqK6/9s4X1q2i';

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, upiId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const cleanName = String(name).trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName,
      upiId: upiId ? String(upiId).trim() : null,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Run dummy compare to prevent timing enumeration
      await bcrypt.compare(cleanPassword, DUMMY_HASH);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(cleanPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * PUT /api/auth/me
 * Update current user profile (name, upiId)
 */
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, upiId } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (upiId !== undefined) updates.upiId = upiId;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
