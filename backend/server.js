import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import tripRoutes from './routes/trips.js';
import authRoutes from './routes/auth.js';

// Process safety hooks
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Health check (placed before rate limiter for external cron pingers)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply rate limits
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ID format: ${err.value}` });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large (max 50kb)' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 SplitYaar API running on http://localhost:${PORT}`);
  });
};

start();

export default app;
