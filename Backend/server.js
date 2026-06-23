require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://groom-go-salon-booking.vercel.app'
    ]
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, true) // allow all for now
  },
  credentials: true
}))
app.options('*', cors()) // handle preflight requests;
app.use(express.json());

// ── Database (auto-creates & seeds on first run) ─────────
require('./db/database');

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',     require('./routers/auth'));
app.use('/api/bookings', require('./routers/bookings'));
app.use('/api/admin',    require('./routers/admin'));

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GroomGo API is running 🚀' });
});

// ── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ GroomGo server running on http://localhost:${PORT}`);
});
