import { useState, useEffect } from 'react'
import { FiScissors, FiCalendar, FiClock, FiPlus, FiLogOut, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const SERVICES = ['Haircut', 'Hair Color', 'Beard Trim', 'Hair Wash & Blow Dry', 'Facial', 'Hair Treatment', 'Shave', 'Eyebrow Threading']

const StatusBadge = ({ status }) => {
  const map = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings]   = useState([])
  const [stylists, setStylists]   = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({ stylist_id: '', service: '', date: '', time: '', notes: '' })

  const fetchData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([api.get('/bookings/my'), api.get('/admin/stylists')])
      setBookings(bRes.data.bookings)
      setStylists(sRes.data.stylists.filter(s => s.is_active))
    } catch { /* silent */ }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/bookings', form)
      toast.success('Booking request sent!')
      setShowForm(false)
      setForm({ stylist_id: '', service: '', date: '', time: '', notes: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiScissors className="text-primary-600 text-xl" />
            <span className="text-xl font-extrabold text-primary-700">GroomGo</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiUser size={16} />
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome + Book button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your appointments</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <FiPlus size={18} /> New Booking
          </button>
        </div>

        {/* Booking Form */}
        {showForm && (
          <div className="card mb-8 border-primary-100">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FiCalendar className="text-primary-600" /> Book an Appointment
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service *</label>
                <select required value={form.service} onChange={e => setForm({...form, service: e.target.value})} className="input-field">
                  <option value="">Select a service</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stylist (optional)</label>
                <select value={form.stylist_id} onChange={e => setForm({...form, stylist_id: e.target.value})} className="input-field">
                  <option value="">Any available stylist</option>
                  {stylists.map(s => <option key={s.id} value={s.id}>{s.name} — {s.speciality || 'General'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" required min={today} value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time *</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="time" required value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})} className="input-field pl-10" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any special requests or notes..."
                  className="input-field resize-none" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Bookings list */}
        {bookings.length === 0 ? (
          <div className="card text-center py-16">
            <FiCalendar className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 font-medium">No bookings yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Booking" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{b.service}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {b.stylist_name ? `Stylist: ${b.stylist_name}` : 'Stylist: To be assigned'}
                      {b.speciality && ` · ${b.speciality}`}
                    </p>
                    {b.notes && <p className="text-gray-400 text-sm mt-1">"{b.notes}"</p>}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <FiCalendar size={13} /> {b.date}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      <FiClock size={13} /> {b.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
