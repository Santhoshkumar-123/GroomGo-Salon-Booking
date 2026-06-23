const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

// ── HTML email templates ─────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#f9fafb; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#c026d3,#7c3aed); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }
    .body { padding:36px 40px; }
    .body h2 { margin:0 0 8px; font-size:20px; color:#111827; }
    .body p  { margin:0 0 16px; font-size:15px; color:#6b7280; line-height:1.6; }
    .detail-box { background:#f3f4f6; border-radius:12px; padding:20px 24px; margin:20px 0; }
    .detail-box table { width:100%; border-collapse:collapse; }
    .detail-box td { padding:6px 0; font-size:14px; color:#374151; }
    .detail-box td:first-child { font-weight:600; width:40%; color:#111827; }
    .badge { display:inline-block; padding:4px 14px; border-radius:99px; font-size:13px; font-weight:600; }
    .badge-accepted { background:#d1fae5; color:#065f46; }
    .badge-rejected { background:#fee2e2; color:#991b1b; }
    .badge-pending  { background:#fef3c7; color:#92400e; }
    .btn { display:inline-block; margin-top:8px; padding:12px 28px; background:linear-gradient(135deg,#c026d3,#7c3aed); color:#fff; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px; }
    .footer { background:#f9fafb; padding:20px 40px; text-align:center; border-top:1px solid #f3f4f6; }
    .footer p { margin:0; font-size:12px; color:#9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✂️ GroomGo</h1>
      <p>Professional Styling, On Your Schedule</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GroomGo · This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

// ── Send booking confirmation to user ────────────────────
const sendBookingConfirmation = async ({ to, userName, service, date, time, stylistName }) => {
  const html = baseTemplate(`
    <h2>Booking Received! 🎉</h2>
    <p>Hi <strong>${userName}</strong>, your booking request has been submitted successfully. We'll notify you once a stylist confirms your appointment.</p>
    <div class="detail-box">
      <table>
        <tr><td>Service</td><td>${service}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Time</td><td>${time}</td></tr>
        <tr><td>Stylist</td><td>${stylistName || 'To be assigned'}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-pending">Pending</span></td></tr>
      </table>
    </div>
    <p>We'll send you an email as soon as your booking is confirmed.</p>
  `)

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `✅ Booking Received — ${service} on ${date}`,
    html
  })
}

// ── Send status update (accepted / rejected) to user ─────
const sendBookingStatusUpdate = async ({ to, userName, service, date, time, stylistName, status }) => {
  const isAccepted = status === 'accepted'

  const html = baseTemplate(`
    <h2>${isAccepted ? '🎊 Booking Confirmed!' : '❌ Booking Rejected'}</h2>
    <p>Hi <strong>${userName}</strong>, your booking for <strong>${service}</strong> has been 
      <span class="badge ${isAccepted ? 'badge-accepted' : 'badge-rejected'}">${status}</span>
      by your stylist.
    </p>
    <div class="detail-box">
      <table>
        <tr><td>Service</td><td>${service}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Time</td><td>${time}</td></tr>
        <tr><td>Stylist</td><td>${stylistName || 'N/A'}</td></tr>
        <tr><td>Status</td><td><span class="badge ${isAccepted ? 'badge-accepted' : 'badge-rejected'}">${status}</span></td></tr>
      </table>
    </div>
    ${isAccepted
      ? `<p>Please arrive 5 minutes early. We look forward to seeing you! 💇</p>`
      : `<p>We're sorry it didn't work out this time. You can book again with another stylist or a different time slot.</p>`
    }
  `)

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `${isAccepted ? '✅ Booking Confirmed' : '❌ Booking Rejected'} — ${service} on ${date}`,
    html
  })
}

// ── Send cancellation confirmation to user ───────────────
const sendBookingCancellation = async ({ to, userName, service, date, time }) => {
  const html = baseTemplate(`
    <h2>Booking Cancelled</h2>
    <p>Hi <strong>${userName}</strong>, your booking has been cancelled as requested.</p>
    <div class="detail-box">
      <table>
        <tr><td>Service</td><td>${service}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Time</td><td>${time}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-rejected">Cancelled</span></td></tr>
      </table>
    </div>
    <p>Feel free to book a new appointment anytime.</p>
  `)

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Booking Cancelled — ${service} on ${date}`,
    html
  })
}

module.exports = { sendBookingConfirmation, sendBookingStatusUpdate, sendBookingCancellation }
