const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ── USER REGISTER ────────────────────────────────────────
// POST /api/auth/user/register
router.post('/user/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, and password are required.' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ message: 'Email already registered.' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)').run(name, email, hashed, phone || null);

  const token = generateToken({ id: result.lastInsertRowid, role: 'user', email });
  res.status(201).json({ message: 'Registration successful.', token, user: { id: result.lastInsertRowid, name, email, role: 'user' } });
});

// ── USER LOGIN ───────────────────────────────────────────
// POST /api/auth/user/login
router.post('/user/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: 'Invalid email or password.' });

  const token = generateToken({ id: user.id, role: 'user', email: user.email });
  res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: 'user' } });
});

// ── STYLIST LOGIN ────────────────────────────────────────
// POST /api/auth/stylist/login
router.post('/stylist/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const stylist = db.prepare('SELECT * FROM stylists WHERE email = ?').get(email);
  if (!stylist || !bcrypt.compareSync(password, stylist.password))
    return res.status(401).json({ message: 'Invalid email or password.' });

  if (!stylist.is_active)
    return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });

  const token = generateToken({ id: stylist.id, role: 'stylist', email: stylist.email });
  res.json({ message: 'Login successful.', token, user: { id: stylist.id, name: stylist.name, email: stylist.email, role: 'stylist' } });
});

// ── ADMIN LOGIN ──────────────────────────────────────────
// POST /api/auth/admin/login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ message: 'Invalid email or password.' });

  const token = generateToken({ id: admin.id, role: 'admin', email: admin.email });
  res.json({ message: 'Login successful.', token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
});

module.exports = router;
