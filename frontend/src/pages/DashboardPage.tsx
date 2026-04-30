import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useProfileGuard } from '@/hooks/useAuth'
import { landlordService, type LandlordDashboardStats } from '@/services/landlord'
import type { Property } from '@/types'

function StatusBadge({ status }: { status: Property['verification_status'] }) {
  const { t } = useTranslation()
  const styles = {
    PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {t(`enums.propertyStatus.${status}`)}
    </span>
  )
}

function LandlordDashboard() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats]           = useState<LandlordDashboardStats | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      landlordService.myProperties(),
      landlordService.dashboard(),
    ])
      .then(([propRes, statsRes]) => {
        setProperties(propRes.data)
        setStats(statsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* My Properties header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.myProperties')}</h2>
          <Link
            to="/landlord/add-property"
            className="bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + {t('dashboard.addProperty')}
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-2">🏠</p>
            <p className="text-gray-500 text-sm">{t('dashboard.noProperties')}</p>
            <Link
              to="/landlord/add-property"
              className="mt-3 inline-block text-brand-600 hover:underline text-sm font-medium"
            >
              {t('dashboard.addFirstProperty')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => {
              const coverImg = p.cover_image ?? p.images?.[0]?.image_url
              const roomCount = p.rooms?.length ?? 0
              return (
                <div
                  key={p.id}
                  className="flex gap-4 items-start border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {coverImg ? (
                      <img src={coverImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                        🏠
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                      <StatusBadge status={p.verification_status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {p.city}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {roomCount} {roomCount === 1 ? t('property.room') : t('property.rooms')}
                      {' · '}
                      {t(`enums.propertyType.${p.property_type}`)}
                    </p>
                    {p.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1 truncate">
                        {t('dashboard.rejectionReason')}: {p.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-1.5 items-end">
                    <Link
                      to={`/landlord/properties/${p.id}/rooms`}
                      className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium px-3 py-1 rounded-lg transition-colors"
                    >
                      {t('dashboard.manage')}
                    </Link>
                    {p.verification_status === 'APPROVED' && (
                      <Link
                        to={`/listings/${p.id}`}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {t('dashboard.view')}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : (stats?.total_properties ?? properties.length)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.totalProperties')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-green-600">
            {loading ? '—' : properties.filter((p) => p.verification_status === 'APPROVED').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.approvedProperties')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-amber-600">
            {loading ? '—' : properties.filter((p) => p.verification_status === 'PENDING').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.pendingProperties')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-blue-600">
            {loading ? '—' : (stats?.total_rooms ?? '—')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.totalRooms')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-purple-600">
            {loading ? '—' : (stats?.total_inquiries ?? '—')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.totalInquiries')}</p>
        </div>
      </div>
    </div>
  )
}

function StudentDashboard() {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link
        to="/listings"
        className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm transition-shadow flex flex-col gap-2"
      >
        <span className="text-2xl">🔍</span>
        <p className="font-semibold text-gray-900 text-sm">{t('dashboard.browseListings')}</p>
        <p className="text-xs text-gray-400">{t('dashboard.browseListingsDesc')}</p>
      </Link>
      <div className="border border-gray-200 rounded-xl p-6 bg-white">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.myBookings')}</p>
        <p className="text-3xl font-bold text-gray-900">—</p>
        <p className="text-xs text-gray-400 mt-1">{t('dashboard.comingSoon')}</p>
      </div>
      <div className="border border-gray-200 rounded-xl p-6 bg-white">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('dashboard.savedListings')}</p>
        <p className="text-3xl font-bold text-gray-900">—</p>
        <p className="text-xs text-gray-400 mt-1">{t('dashboard.comingSoon')}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  useProfileGuard()

  const roleLabel = user?.role ? t(`enums.role.${user.role}`) : '—'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.full_name
            ? t('dashboard.welcomeNamed', { name: user.full_name })
            : t('dashboard.welcome')}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t('dashboard.role')}: <span className="font-medium text-gray-700">{roleLabel}</span>
        </p>
      </div>

      {user?.role === 'LANDLORD' && <LandlordDashboard />}
      {user?.role === 'STUDENT'  && <StudentDashboard />}
    </div>
  )
}
