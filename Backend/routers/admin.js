const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

// All routes here are admin-only
router.use(authenticate, authorize('admin'));

// ── Get all users ────────────────────────────────────────
// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// ── Get all stylists ─────────────────────────────────────
// GET /api/admin/stylists
router.get('/stylists', (req, res) => {
  const stylists = db.prepare('SELECT id, name, email, phone, speciality, bio, is_active, created_at FROM stylists ORDER BY created_at DESC').all();
  res.json({ stylists });
});

// ── Add a new stylist ────────────────────────────────────
// POST /api/admin/stylists
router.post('/stylists', (req, res) => {
  const { name, email, password, phone, speciality, bio } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, and password are required.' });

  const exists = db.prepare('SELECT id FROM stylists WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ message: 'Email already registered.' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO stylists (name, email, password, phone, speciality, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, hashed, phone || null, speciality || null, bio || null);

  res.status(201).json({ message: 'Stylist added successfully.', stylistId: result.lastInsertRowid });
});

// ── Toggle stylist active/inactive ──────────────────────
// PATCH /api/admin/stylists/:id/toggle
router.patch('/stylists/:id/toggle', (req, res) => {
  const stylist = db.prepare('SELECT id, is_active FROM stylists WHERE id = ?').get(req.params.id);
  if (!stylist) return res.status(404).json({ message: 'Stylist not found.' });

  const newStatus = stylist.is_active ? 0 : 1;
  db.prepare('UPDATE stylists SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);
  res.json({ message: `Stylist ${newStatus ? 'activated' : 'deactivated'} successfully.` });
});

// ── Delete a stylist ─────────────────────────────────────
// DELETE /api/admin/stylists/:id
router.delete('/stylists/:id', (req, res) => {
  const stylist = db.prepare('SELECT id FROM stylists WHERE id = ?').get(req.params.id);
  if (!stylist) return res.status(404).json({ message: 'Stylist not found.' });

  db.prepare('DELETE FROM stylists WHERE id = ?').run(req.params.id);
  res.json({ message: 'Stylist deleted successfully.' });
});

// ── Dashboard stats ──────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const totalUsers    = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const totalStylists = db.prepare('SELECT COUNT(*) AS count FROM stylists WHERE is_active = 1').get().count;
  const totalBookings = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
  const pending       = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'").get().count;
  const accepted      = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'accepted'").get().count;
  const rejected      = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'rejected'").get().count;

  res.json({ stats: { totalUsers, totalStylists, totalBookings, pending, accepted, rejected } });
});

module.exports = router;
