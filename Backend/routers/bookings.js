const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

// ── USER: Create a booking ───────────────────────────────
// POST /api/bookings
router.post('/', authenticate, authorize('user'), (req, res) => {
  const { stylist_id, service, date, time, notes } = req.body;
  if (!service || !date || !time)
    return res.status(400).json({ message: 'Service, date, and time are required.' });

  // Validate stylist if provided
  if (stylist_id) {
    const stylist = db.prepare('SELECT id FROM stylists WHERE id = ? AND is_active = 1').get(stylist_id);
    if (!stylist) return res.status(404).json({ message: 'Stylist not found or inactive.' });
  }

  const result = db.prepare(
    'INSERT INTO bookings (user_id, stylist_id, service, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, stylist_id || null, service, date, time, notes || null);

  res.status(201).json({ message: 'Booking created successfully.', bookingId: result.lastInsertRowid });
});

// ── USER: Get my bookings ────────────────────────────────
// GET /api/bookings/my
router.get('/my', authenticate, authorize('user'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, s.name AS stylist_name, s.speciality
    FROM bookings b
    LEFT JOIN stylists s ON b.stylist_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);

  res.json({ bookings });
});

// ── STYLIST: Get assigned bookings ──────────────────────
// GET /api/bookings/stylist
router.get('/stylist', authenticate, authorize('stylist'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.stylist_id = ?
    ORDER BY b.date ASC, b.time ASC
  `).all(req.user.id);

  res.json({ bookings });
});

// ── STYLIST: Accept or Reject a booking ─────────────────
// PATCH /api/bookings/:id/status
router.patch('/:id/status', authenticate, authorize('stylist'), (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['accepted', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be accepted or rejected.' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND stylist_id = ?').get(id, req.user.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found or not assigned to you.' });

  db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  res.json({ message: `Booking ${status} successfully.` });
});

// ── ADMIN: Get all bookings ──────────────────────────────
// GET /api/bookings/all
router.get('/all', authenticate, authorize('admin'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name AS user_name, u.email AS user_email,
           s.name AS stylist_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    LEFT JOIN stylists s ON b.stylist_id = s.id
    ORDER BY b.created_at DESC
  `).all();

  res.json({ bookings });
});

// ── ADMIN: Assign stylist to a booking ──────────────────
// PATCH /api/bookings/:id/assign
router.patch('/:id/assign', authenticate, authorize('admin'), (req, res) => {
  const { stylist_id } = req.body;
  const { id } = req.params;

  const stylist = db.prepare('SELECT id FROM stylists WHERE id = ? AND is_active = 1').get(stylist_id);
  if (!stylist) return res.status(404).json({ message: 'Stylist not found or inactive.' });

  db.prepare("UPDATE bookings SET stylist_id = ?, status = 'pending', updated_at = datetime('now') WHERE id = ?").run(stylist_id, id);
  res.json({ message: 'Stylist assigned successfully.' });
});

module.exports = router;
