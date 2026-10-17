import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBedDouble,
  LuBuilding2,
  LuCircleCheck,
  LuClock,
  LuHouse,
  LuInbox,
  LuLightbulb,
  LuMessageSquare,
  LuPlus,
  LuSearch,
  LuSparkles,
  LuWallet,
} from 'react-icons/lu'
import { useAuth, useProfileGuard } from '@/hooks/useAuth'
import { landlordService, type LandlordDashboardStats } from '@/services/landlord'
import { inquiriesService } from '@/services/inquiries'
import { LandlordPropertyCard } from '@/components/property/LandlordPropertyCard'
import { PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { StatCard } from '@/components/ui/PageHeader'
import { InquiryStatusBadge } from '@/lib/status'
import { ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn, formatDate, formatPrice } from '@/lib/format'
import type { Inquiry, InquiryStatus, Property, StudentProfile } from '@/types'

function Greeting({ name, subtitle, action }: { name?: string | null; subtitle: string; action: ReactNode }) {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold text-accent-600">{t(`dashboard.greeting.${part}`)}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {name ? t('dashboard.welcomeNamed', { name: name.split(' ')[0] }) : t('dashboard.welcome')}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Landlord
// ═══════════════════════════════════════════════════════════════════════════════
function LandlordDashboard({ name }: { name?: string | null }) {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<LandlordDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([landlordService.myProperties(), landlordService.dashboard()])
      .then(([propRes, statsRes]) => {
        setProperties(propRes.data)
        setStats(statsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const approved = properties.filter((p) => p.verification_status === 'APPROVED').length
  const pending = properties.filter((p) => p.verification_status === 'PENDING').length
  const dash = (v: number | string | undefined) => (loading ? '—' : (v ?? '—'))

  return (
    <>
      <Greeting
        name={name}
        subtitle={t('banner.landlord.subtitle')}
        action={
          <LinkButton to="/landlord/add-property" variant="accent" leftIcon={<LuPlus className="size-4" />}>
            {t('dashboard.addProperty')}
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 sm:gap-4">
        <StatCard icon={<LuBuilding2 />} tone="brand" label={t('dashboard.totalProperties')} value={dash(stats?.total_properties ?? properties.length)} />
        <StatCard icon={<LuBadgeCheck />} tone="success" label={t('dashboard.approvedProperties')} value={dash(approved)} />
        <StatCard icon={<LuClock />} tone="warning" label={t('dashboard.pendingProperties')} value={dash(pending)} />
        <StatCard icon={<LuBedDouble />} tone="info" label={t('dashboard.totalRooms')} value={dash(stats?.total_rooms)} />
        <StatCard icon={<LuMessageSquare />} tone="accent" label={t('dashboard.totalInquiries')} value={dash(stats?.total_inquiries)} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-800">
        <LuLightbulb className="mt-0.5 size-4.5 shrink-0" />
        {t('banner.landlord.tip')}
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">{t('dashboard.myProperties')}</h2>
          {properties.length > 0 && (
            <Link to="/listings" className="text-sm font-bold text-brand-600 hover:text-brand-700">
              {t('banner.landlord.viewListings')}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<LuHouse />}
            title={t('dashboard.noProperties')}
            description={t('dashboard.noPropertiesHint')}
            action={
              <LinkButton to="/landlord/add-property" variant="accent" leftIcon={<LuPlus className="size-4" />}>
                {t('dashboard.addFirstProperty')}
              </LinkButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <LandlordPropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Student
// ═══════════════════════════════════════════════════════════════════════════════
const PROGRESS: InquiryStatus[] = ['PENDING', 'CONTACTED', 'BOOKED']

function InquiryProgress({ status }: { status: InquiryStatus }) {
  const { t } = useTranslation()
  if (status === 'CANCELLED') return null
  const reached = PROGRESS.indexOf(status)
  return (
    <div className="flex items-center gap-1.5">
      {PROGRESS.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col gap-1">
          <span className={cn('h-1.5 rounded-full', i <= reached ? (status === 'BOOKED' ? 'bg-emerald-500' : 'bg-brand-500') : 'bg-slate-200')} />
          <span className={cn('text-[11px] font-semibold', i <= reached ? 'text-slate-700' : 'text-slate-400')}>
            {t(`enums.inquiryStatus.${s}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

function PreferencesCard({ profile }: { profile: StudentProfile }) {
  const { t } = useTranslation()
  const params = new URLSearchParams()
  if (profile.budget_max) params.set('max_price', String(profile.budget_max))
  if (profile.preferred_room_type !== 'NO_PREFERENCE') params.set('room_type', profile.preferred_room_type)
  const RoomIcon = ROOM_TYPE_ICONS[profile.preferred_room_type]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lift">
      <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent-500/25 blur-2xl" />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-300">
          <LuSparkles className="size-4" />
          {t('dashboard.prefs.title')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15">
            <LuWallet className="size-4 text-brand-100" />
            {formatPrice(profile.budget_min)} – {formatPrice(profile.budget_max)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15">
            <RoomIcon className="size-4 text-brand-100" />
            {t(`enums.preferredRoomType.${profile.preferred_room_type}`)}
          </span>
        </div>
        <Link
          to={`/listings${params.toString() ? `?${params}` : ''}`}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-700 transition-transform hover:-translate-y-0.5"
        >
          {t('dashboard.prefs.cta')}
          <LuArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  )
}

function StudentDashboard({ name, profile }: { name?: string | null; profile?: StudentProfile | null }) {
  const { t, i18n } = useTranslation()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    inquiriesService
      .myInquiries()
      .then((res) => setInquiries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = inquiries.filter((i) => i.status === 'PENDING' || i.status === 'CONTACTED').length
  const booked = inquiries.filter((i) => i.status === 'BOOKED').length

  return (
    <>
      <Greeting
        name={name}
        subtitle={t('banner.student.subtitle')}
        action={
          <LinkButton to="/listings" variant="primary" leftIcon={<LuSearch className="size-4" />}>
            {t('banner.student.browseCta')}
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {profile ? (
          <PreferencesCard profile={profile} />
        ) : (
          <Link
            to="/listings"
            className="flex flex-col justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lift"
          >
            <LuSearch className="size-7 text-accent-300" />
            <p className="mt-3 text-lg font-bold">{t('dashboard.browseListings')}</p>
            <p className="text-sm text-brand-100">{t('dashboard.browseListingsDesc')}</p>
          </Link>
        )}
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-3">
          <StatCard icon={<LuMessageSquare />} tone="brand" label={t('dashboard.totalInquiries')} value={loading ? '—' : inquiries.length} />
          <StatCard icon={<LuClock />} tone="info" label={t('dashboard.activeInquiries')} value={loading ? '—' : active} />
          <StatCard icon={<LuCircleCheck />} tone="success" label={t('dashboard.bookedInquiries')} value={loading ? '—' : booked} />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-5 text-xl font-extrabold text-slate-900">{t('dashboard.myInquiries')}</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <EmptyState
            icon={<LuInbox />}
            title={t('dashboard.noInquiries')}
            description={t('dashboard.noInquiriesHint')}
            action={
              <LinkButton to="/listings" variant="primary" leftIcon={<LuSearch className="size-4" />}>
                {t('dashboard.browseListings')}
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => {
              const RoomIcon = inq.room ? ROOM_TYPE_ICONS[inq.room.room_type as keyof typeof ROOM_TYPE_ICONS] ?? LuHouse : LuHouse
              return (
                <Link
                  key={inq.id}
                  to={`/listings/${inq.property_id}${inq.room_id ? `?room=${inq.room_id}` : ''}`}
                  className="group block rounded-2xl border border-line bg-white p-4 shadow-soft transition-all hover:border-brand-200 hover:shadow-lift sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <RoomIcon className="size-5.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 group-hover:text-brand-600">{inq.property?.title ?? '—'}</p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {inq.property?.city}
                            {inq.room ? ` · ${t(`enums.roomType.${inq.room.room_type}`)}` : ''}
                            {inq.room ? ` · ${formatPrice(inq.room.price_per_bed)}` : ''}
                          </p>
                        </div>
                        <InquiryStatusBadge status={inq.status} />
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="sm:w-72">
                          <InquiryProgress status={inq.status} />
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(inq.created_at, i18n.language)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  useProfileGuard()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-fade-in sm:px-6 lg:px-8 lg:py-12">
      {user?.role === 'ADMIN' && <Navigate to="/admin/dashboard" replace />}
      {user?.role === 'LANDLORD' && <LandlordDashboard name={user.full_name} />}
      {user?.role === 'STUDENT' && <StudentDashboard name={user.full_name} profile={user.student_profile} />}
    </div>
  )
}
