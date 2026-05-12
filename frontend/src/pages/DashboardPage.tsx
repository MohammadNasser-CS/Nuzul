import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useProfileGuard } from '@/hooks/useAuth'
import { landlordService, type LandlordDashboardStats } from '@/services/landlord'
import { inquiriesService } from '@/services/inquiries'
import { LandlordBanner, StudentBanner } from '@/components/ui/HeroBanner'
import type { Inquiry, Property } from '@/types'

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

function LandlordDashboard({ name }: { name?: string | null }) {
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
      <LandlordBanner name={name} />
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

const INQUIRY_STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONTACTED: 'bg-blue-50   text-blue-700   border-blue-200',
  BOOKED:    'bg-green-50  text-green-700  border-green-200',
  CANCELLED: 'bg-red-50    text-red-500    border-red-200',
}

function StudentDashboard({ name }: { name?: string | null }) {
  const { t } = useTranslation()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    inquiriesService.myInquiries()
      .then(res => setInquiries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = inquiries.filter(i => i.status === 'PENDING' || i.status === 'CONTACTED').length
  const booked = inquiries.filter(i => i.status === 'BOOKED').length

  return (
    <div className="space-y-6">
      <StudentBanner name={name} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/listings"
          className="border border-brand-200 rounded-xl p-4 bg-brand-50 hover:bg-brand-100 transition-colors flex flex-col gap-1 col-span-2 sm:col-span-1"
        >
          <span className="text-xl">🔍</span>
          <p className="font-semibold text-brand-800 text-sm">{t('dashboard.browseListings')}</p>
          <p className="text-xs text-brand-600">{t('dashboard.browseListingsDesc')}</p>
        </Link>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-gray-900">{loading ? '—' : inquiries.length}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.totalInquiries')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-blue-600">{loading ? '—' : active}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.activeInquiries')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : booked}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.bookedInquiries')}</p>
        </div>
      </div>

      {/* Inquiries list */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">{t('dashboard.myInquiries')}</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 text-sm">{t('dashboard.noInquiries')}</p>
            <Link
              to="/listings"
              className="mt-3 inline-block text-brand-600 hover:underline text-sm font-medium"
            >
              {t('dashboard.browseListings')} →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map(inq => {
              const date = new Date(inq.created_at).toLocaleDateString(undefined, {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              return (
                <Link
                  key={inq.id}
                  to={`/listings/${inq.property_id}${inq.room_id ? `?room=${inq.room_id}` : ''}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-lg shrink-0">
                    🏠
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {inq.property?.title ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {inq.property?.city}
                      {inq.room ? ` · ${t(`enums.roomType.${inq.room.room_type}`)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${INQUIRY_STATUS_STYLES[inq.status]}`}>
                      {t(`enums.inquiryStatus.${inq.status}`)}
                    </span>
                    <span className="text-xs text-gray-400">{date}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  useProfileGuard()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {user?.role === 'ADMIN'    && <Navigate to="/admin/dashboard" replace />}
      {user?.role === 'LANDLORD' && <LandlordDashboard name={user.full_name} />}
      {user?.role === 'STUDENT'  && <StudentDashboard  name={user.full_name} />}
    </div>
  )
}
