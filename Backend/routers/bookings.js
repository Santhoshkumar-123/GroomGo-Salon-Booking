const express = require('express')
const router  = express.Router()
const db      = require('../db/database')
const { authenticate, authorize } = require('../middleware/auth')
const { sendBookingConfirmation, sendBookingStatusUpdate, sendBookingCancellation } = require('../utils/mailer')

// ── USER: Create a booking ───────────────────────────────
// POST /api/bookings
router.post('/', authenticate, authorize('user'), async (req, res) => {
  const { stylist_id, service, date, time, notes } = req.body
  if (!service || !date || !time)
    return res.status(400).json({ message: 'Service, date, and time are required.' })

  if (stylist_id) {
    const stylist = db.prepare('SELECT id FROM stylists WHERE id = ? AND is_active = 1').get(stylist_id)
    if (!stylist) return res.status(404).json({ message: 'Stylist not found or inactive.' })
  }

  const result = db.prepare(
    'INSERT INTO bookings (user_id, stylist_id, service, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, stylist_id || null, service, date, time, notes || null)

  // Send confirmation email (non-blocking)
  try {
    const user    = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id)
    const stylist = stylist_id ? db.prepare('SELECT name FROM stylists WHERE id = ?').get(stylist_id) : null
    await sendBookingConfirmation({
      to: user.email,
      userName: user.name,
      service, date, time,
      stylistName: stylist?.name || null
    })
  } catch (err) {
    console.error('⚠️ Confirmation email failed:', err.message)
  }

  res.status(201).json({ message: 'Booking created successfully.', bookingId: result.lastInsertRowid })
})

// ── USER: Get my bookings ────────────────────────────────
// GET /api/bookings/my
router.get('/my', authenticate, authorize('user'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, s.name AS stylist_name, s.speciality
    FROM bookings b
    LEFT JOIN stylists s ON b.stylist_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id)

  res.json({ bookings })
})

// ── USER: Cancel a booking ───────────────────────────────
// DELETE /api/bookings/:id
router.delete('/:id', authenticate, authorize('user'), async (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, u.email AS user_email, u.name AS user_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.id = ? AND b.user_id = ?
  `).get(req.params.id, req.user.id)

  if (!booking) return res.status(404).json({ message: 'Booking not found.' })
  if (booking.status !== 'pending')
    return res.status(400).json({ message: 'Only pending bookings can be cancelled.' })

  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id)

  // Send cancellation email (non-blocking)
  try {
    await sendBookingCancellation({
      to: booking.user_email,
      userName: booking.user_name,
      service: booking.service,
      date: booking.date,
      time: booking.time
    })
  } catch (err) {
    console.error('⚠️ Cancellation email failed:', err.message)
  }

  res.json({ message: 'Booking cancelled successfully.' })
})

// ── STYLIST: Get assigned bookings ──────────────────────
// GET /api/bookings/stylist
router.get('/stylist', authenticate, authorize('stylist'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.stylist_id = ?
    ORDER BY b.date ASC, b.time ASC
  `).all(req.user.id)

  res.json({ bookings })
})

// ── STYLIST: Accept or Reject a booking ─────────────────
// PATCH /api/bookings/:id/status
router.patch('/:id/status', authenticate, authorize('stylist'), async (req, res) => {
  const { status } = req.body
  const { id }     = req.params

  if (!['accepted', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be accepted or rejected.' })

  const booking = db.prepare(`
    SELECT b.*, u.email AS user_email, u.name AS user_name,
           s.name AS stylist_name
    FROM bookings b
    JOIN users u    ON b.user_id    = u.id
    JOIN stylists s ON b.stylist_id = s.id
    WHERE b.id = ? AND b.stylist_id = ?
  `).get(id, req.user.id)

  if (!booking) return res.status(404).json({ message: 'Booking not found or not assigned to you.' })

  db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)

  // Send status update email (non-blocking)
  try {
    await sendBookingStatusUpdate({
      to: booking.user_email,
      userName: booking.user_name,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      stylistName: booking.stylist_name,
      status
    })
  } catch (err) {
    console.error('⚠️ Status email failed:', err.message)
  }

  res.json({ message: `Booking ${status} successfully.` })
})

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
  `).all()

  res.json({ bookings })
})

// ── ADMIN: Assign stylist to a booking ──────────────────
// PATCH /api/bookings/:id/assign
router.patch('/:id/assign', authenticate, authorize('admin'), (req, res) => {
  const { stylist_id } = req.body
  const { id }         = req.params

  const stylist = db.prepare('SELECT id FROM stylists WHERE id = ? AND is_active = 1').get(stylist_id)
  if (!stylist) return res.status(404).json({ message: 'Stylist not found or inactive.' })

  db.prepare("UPDATE bookings SET stylist_id = ?, status = 'pending', updated_at = datetime('now') WHERE id = ?").run(stylist_id, id)
  res.json({ message: 'Stylist assigned successfully.' })
})

module.exports = router
