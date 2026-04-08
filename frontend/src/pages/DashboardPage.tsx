// TODO (frontend dev): Expand this into a full dashboard.
// useAuth() gives you the logged-in user. Add booking history, listings management, etc.

import { useAuth } from "../hooks/useAuth"


export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Role: <span className="capitalize font-medium text-gray-700">{user?.role}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">My Bookings</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Connect bookingsService here</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saved Listings</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Messages</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
