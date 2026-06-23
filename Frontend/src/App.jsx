import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Home          from './pages/Home'
import UserLogin     from './pages/UserLogin'
import UserRegister  from './pages/UserRegister'
import StylistLogin  from './pages/StylistLogin'
import AdminLogin    from './pages/AdminLogin'
import UserDashboard    from './pages/UserDashboard'
import StylistDashboard from './pages/StylistDashboard'
import AdminDashboard   from './pages/AdminDashboard'

// Protected route wrapper
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
  if (!user) return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<Home />} />
      <Route path="/login/user"     element={!user ? <UserLogin />    : <Navigate to="/dashboard/user" />} />
      <Route path="/login/stylist"  element={!user ? <StylistLogin /> : <Navigate to="/dashboard/stylist" />} />
      <Route path="/login/admin"    element={!user ? <AdminLogin />   : <Navigate to="/dashboard/admin" />} />
      <Route path="/register"       element={!user ? <UserRegister /> : <Navigate to="/dashboard/user" />} />

      {/* Protected dashboards */}
      <Route path="/dashboard/user"    element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/stylist" element={<ProtectedRoute role="stylist"><StylistDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin"   element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
