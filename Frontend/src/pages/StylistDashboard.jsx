import { useState, useEffect } from 'react'
import { FiScissors, FiCalendar, FiClock, FiCheck, FiX, FiLogOut, FiUser, FiPhone, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const StatusBadge = ({ status }) => {
  const map = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

export default function StylistDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(false)

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/stylist')
      setBookings(data.bookings)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchBookings() }, [])

  const updateStatus = async (id, status) => {
    setLoading(true)
    try {
      await api.patch(`/bookings/${id}/status`, { status })
      toast.success(`Booking ${status}!`)
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const counts = {
    all: bookings.length,
    pending:  bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiScissors className="text-purple-600 text-xl" />
            <span className="text-xl font-extrabold text-purple-700">GroomGo</span>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Stylist</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiUser size={16} /><span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Accept or reject booking requests from customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: counts.all, color: 'bg-gray-100 text-gray-700' },
            { label: 'Pending', value: counts.pending, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Accepted', value: counts.accepted, color: 'bg-green-100 text-green-700' },
            { label: 'Rejected', value: counts.rejected, color: 'bg-red-100 text-red-700' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <div className={`text-2xl font-bold mb-1 ${s.color.split(' ')[1]}`}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
                ${filter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}>
              {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
            </button>
          ))}
        </div>

        {/* Bookings */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <FiCalendar className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 font-medium">No {filter !== 'all' ? filter : ''} bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => (
              <div key={b.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{b.service}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5"><FiUser size={13} /> {b.user_name}</span>
                      {b.user_phone && <span className="flex items-center gap-1.5"><FiPhone size={13} /> {b.user_phone}</span>}
                      <span className="flex items-center gap-1.5"><FiMail size={13} /> {b.user_email}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><FiCalendar size={13} /> {b.date}</span>
                      <span className="flex items-center gap-1.5"><FiClock size={13} /> {b.time}</span>
                    </div>
                    {b.notes && <p className="text-gray-400 text-sm mt-1.5 italic">"{b.notes}"</p>}
                  </div>

                  {/* Action buttons — only for pending */}
                  {b.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button disabled={loading} onClick={() => updateStatus(b.id, 'accepted')}
                        className="btn-success flex items-center gap-1.5 text-sm">
                        <FiCheck size={15} /> Accept
                      </button>
                      <button disabled={loading} onClick={() => updateStatus(b.id, 'rejected')}
                        className="btn-danger flex items-center gap-1.5 text-sm">
                        <FiX size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
