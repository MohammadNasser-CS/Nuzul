import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth'

export function Navbar() {
  const { user, session } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authService.signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-brand-900 tracking-tight">
        Nuzul
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link to="/listings" className="text-gray-600 hover:text-gray-900 transition-colors">
          Listings
        </Link>

        {session ? (
          <>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{user?.full_name ?? user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
