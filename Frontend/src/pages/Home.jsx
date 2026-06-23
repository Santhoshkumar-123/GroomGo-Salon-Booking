import { Link } from 'react-router-dom'
import { FiScissors, FiUser, FiShield } from 'react-icons/fi'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <FiScissors className="text-primary-600 text-2xl" />
          <span className="text-2xl font-extrabold text-primary-700">GroomGo</span>
        </div>
        <Link to="/login/admin" className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1">
          <FiShield size={14} /> Admin
        </Link>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <FiScissors size={14} /> Professional Styling, On Your Schedule
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Look your best,<br />
          <span className="text-primary-600">every time.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto">
          Book appointments with top stylists in your area. Fast, easy, and professional.
        </p>

        {/* Login cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* User card */}
          <div className="card hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <FiUser className="text-primary-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">I'm a Customer</h2>
            <p className="text-gray-500 text-sm mb-5">Book appointments with your favourite stylists</p>
            <div className="flex flex-col gap-2">
              <Link to="/login/user" className="btn-primary text-center text-sm">Sign In</Link>
              <Link to="/register"   className="btn-secondary text-center text-sm">Create Account</Link>
            </div>
          </div>

          {/* Stylist card */}
          <div className="card hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <FiScissors className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">I'm a Stylist</h2>
            <p className="text-gray-500 text-sm mb-5">Manage your bookings and grow your clientele</p>
            <div className="flex flex-col gap-2">
              <Link to="/login/stylist" className="btn-primary text-center text-sm">Stylist Sign In</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
