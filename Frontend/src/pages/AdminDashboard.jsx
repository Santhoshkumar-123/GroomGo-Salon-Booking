import { useState, useEffect } from 'react'
import { FiScissors, FiUsers, FiCalendar, FiLogOut, FiShield, FiPlus, FiToggleLeft, FiToggleRight, FiTrash2, FiUserCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const StatusBadge = ({ status }) => {
  const map = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

const TABS = ['Dashboard', 'Bookings', 'Stylists', 'Users']

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]         = useState('Dashboard')
  const [stats, setStats]     = useState(null)
  const [bookings, setBookings] = useState([])
  const [stylists, setStylists] = useState([])
  const [users, setUsers]       = useState([])
  const [showAddStylist, setShowAddStylist] = useState(false)
  const [stylistForm, setStylistForm] = useState({ name: '', email: '', password: '', phone: '', speciality: '', bio: '' })
  const [assignMap, setAssignMap] = useState({})

  const fetchAll = async () => {
    try {
      const [sRes, bRes, uRes, stRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/bookings/all'),
        api.get('/admin/users'),
        api.get('/admin/stylists'),
      ])
      setStats(sRes.data.stats)
      setBookings(bRes.data.bookings)
      setUsers(uRes.data.users)
      setStylists(stRes.data.stylists)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchAll() }, [])

  const addStylist = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/stylists', stylistForm)
      toast.success('Stylist added!')
      setShowAddStylist(false)
      setStylistForm({ name: '', email: '', password: '', phone: '', speciality: '', bio: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const toggleStylist = async (id) => {
    try {
      await api.patch(`/admin/stylists/${id}/toggle`)
      toast.success('Status updated!')
      fetchAll()
    } catch { toast.error('Failed.') }
  }

  const deleteStylist = async (id) => {
    if (!window.confirm('Delete this stylist?')) return
    try {
      await api.delete(`/admin/stylists/${id}`)
      toast.success('Stylist removed.')
      fetchAll()
    } catch { toast.error('Failed.') }
  }

  const assignStylist = async (bookingId) => {
    const stylistId = assignMap[bookingId]
    if (!stylistId) return toast.error('Select a stylist first.')
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { stylist_id: stylistId })
      toast.success('Stylist assigned!')
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShield className="text-white text-xl" />
            <span className="text-xl font-extrabold text-white">GroomGo</span>
            <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'border-primary-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ── DASHBOARD TAB ── */}
        {tab === 'Dashboard' && stats && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Users',    value: stats.totalUsers,    icon: <FiUsers />,    color: 'text-blue-600',   bg: 'bg-blue-50' },
                { label: 'Active Stylists',value: stats.totalStylists, icon: <FiScissors />, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Bookings', value: stats.totalBookings, icon: <FiCalendar />, color: 'text-primary-600',bg: 'bg-primary-50' },
                { label: 'Pending',        value: stats.pending,       icon: '⏳',           color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Accepted',       value: stats.accepted,      icon: '✅',           color: 'text-green-600',  bg: 'bg-green-50' },
                { label: 'Rejected',       value: stats.rejected,      icon: '❌',           color: 'text-red-600',    bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className="card">
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3 text-lg ${s.color}`}>{s.icon}</div>
                  <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === 'Bookings' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h1>
            {bookings.length === 0 ? (
              <div className="card text-center py-16"><p className="text-gray-400">No bookings yet.</p></div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">{b.service}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>👤 {b.user_name} ({b.user_email})</span>
                          <span>✂️ {b.stylist_name || 'Unassigned'}</span>
                          <span>📅 {b.date} · {b.time}</span>
                        </div>
                      </div>
                      {/* Assign stylist */}
                      {!b.stylist_id && (
                        <div className="flex items-center gap-2 shrink-0">
                          <select className="input-field text-sm py-1.5 w-44"
                            value={assignMap[b.id] || ''}
                            onChange={e => setAssignMap({...assignMap, [b.id]: e.target.value})}>
                            <option value="">Assign stylist</option>
                            {stylists.filter(s => s.is_active).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <button onClick={() => assignStylist(b.id)}
                            className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                            <FiUserCheck size={14} /> Assign
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STYLISTS TAB ── */}
        {tab === 'Stylists' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Stylists</h1>
              <button onClick={() => setShowAddStylist(!showAddStylist)} className="btn-primary flex items-center gap-2">
                <FiPlus size={18} /> Add Stylist
              </button>
            </div>

            {/* Add Stylist Form */}
            {showAddStylist && (
              <div className="card mb-6 border-primary-100">
                <h3 className="font-bold text-gray-900 mb-4">Add New Stylist</h3>
                <form onSubmit={addStylist} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'name', label: 'Full Name *', type: 'text', required: true },
                    { name: 'email', label: 'Email *', type: 'email', required: true },
                    { name: 'password', label: 'Password *', type: 'password', required: true },
                    { name: 'phone', label: 'Phone', type: 'tel', required: false },
                    { name: 'speciality', label: 'Speciality', type: 'text', required: false },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input type={f.type} required={f.required}
                        value={stylistForm[f.name]}
                        onChange={e => setStylistForm({...stylistForm, [f.name]: e.target.value})}
                        className="input-field" />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                    <textarea rows={2} value={stylistForm.bio}
                      onChange={e => setStylistForm({...stylistForm, bio: e.target.value})}
                      className="input-field resize-none" />
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="btn-primary">Add Stylist</button>
                    <button type="button" onClick={() => setShowAddStylist(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {stylists.length === 0 ? (
              <div className="card text-center py-16"><p className="text-gray-400">No stylists yet. Add one above.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stylists.map(s => (
                  <div key={s.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                        <p className="text-sm text-gray-500">{s.email}</p>
                        {s.speciality && <p className="text-sm text-primary-600 mt-0.5">{s.speciality}</p>}
                        {s.bio && <p className="text-xs text-gray-400 mt-1">{s.bio}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => toggleStylist(s.id)} title="Toggle status"
                          className="text-gray-400 hover:text-primary-600 transition-colors">
                          {s.is_active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                        </button>
                        <button onClick={() => deleteStylist(s.id)} title="Delete"
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'Users' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Registered Users</h1>
            {users.length === 0 ? (
              <div className="card text-center py-16"><p className="text-gray-400">No users yet.</p></div>
            ) : (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Email', 'Phone', 'Joined'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{u.created_at?.split('T')[0] || u.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
