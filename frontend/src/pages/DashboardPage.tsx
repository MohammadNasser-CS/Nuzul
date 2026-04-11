// TODO (frontend dev): Expand this into a full dashboard.
// useAuth() gives you the logged-in user. Add booking history, listings management, etc.

import { useTranslation } from 'react-i18next'
import { useAuth } from "../hooks/useAuth"

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const roleLabel = user?.role ? t(`enums.role.${user.role}`) : '—'

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {user?.full_name ? t('dashboard.welcomeNamed', { name: user.full_name }) : t('dashboard.welcome')}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {t('dashboard.role')}: <span className="font-medium text-gray-700">{roleLabel}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.myBookings')}</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.connectBookings')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.savedListings')}</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.comingSoon')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.messages')}</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.comingSoon')}</p>
        </div>
      </div>
    </div>
  )
}
