import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminService } from '@/services/admin'
import type { AdminDashboardStats } from '@/types'

interface StatCardProps {
  label: string
  value: number
  sub?: string
  accent?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

function StatCard({ label, value, sub, accent, color = 'gray' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50    border-red-200    text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    gray:   'bg-white     border-gray-200   text-gray-800',
  }
  const base = accent
    ? 'bg-brand-50 border-brand-300 text-brand-800'
    : colorMap[color]

  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-1 ${base}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  )
}

interface QuickLinkProps {
  to: string
  label: string
  desc: string
  emoji: string
}

function QuickLink({ to, label, desc, emoji }: QuickLinkProps) {
  const { i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors"
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <span className="ms-auto text-gray-400 text-sm">{fwd}</span>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .dashboard()
      .then(res => setStats(res.data))
      .catch(() => setError(t('admin.dashboard.error')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-red-600">
        {error ?? t('admin.dashboard.error')}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>

      {/* ── Users ──────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('admin.dashboard.users')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('admin.dashboard.totalUsers')}   value={stats.total_users}   color="blue" />
          <StatCard label={t('admin.dashboard.activeUsers')}  value={stats.active_users}  color="green" />
          <StatCard label={t('admin.dashboard.students')}     value={stats.total_students} color="gray" />
          <StatCard label={t('admin.dashboard.landlords')}    value={stats.total_landlords} color="gray" />
        </div>
      </section>

      {/* ── Properties ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('admin.dashboard.properties')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('admin.dashboard.totalProperties')}    value={stats.total_properties}    color="gray" />
          <StatCard label={t('admin.dashboard.pendingProperties')}  value={stats.pending_properties}  accent />
          <StatCard label={t('admin.dashboard.approvedProperties')} value={stats.approved_properties} color="green" />
          <StatCard label={t('admin.dashboard.rejectedProperties')} value={stats.rejected_properties} color="red" />
        </div>
      </section>

      {/* ── Rooms ──────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('admin.dashboard.rooms')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('admin.dashboard.totalRooms')} value={stats.total_rooms} color="blue" />
        </div>
      </section>

      {/* ── Inquiries ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('admin.dashboard.inquiries')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label={t('admin.dashboard.totalInquiries')}     value={stats.total_inquiries}     color="gray" />
          <StatCard label={t('admin.dashboard.pendingInquiries')}   value={stats.pending_inquiries}   color="yellow" />
          <StatCard label={t('admin.dashboard.contactedInquiries')} value={stats.contacted_inquiries} color="blue" />
          <StatCard label={t('admin.dashboard.bookedInquiries')}    value={stats.booked_inquiries}    color="green" />
          <StatCard label={t('admin.dashboard.cancelledInquiries')} value={stats.cancelled_inquiries} color="gray" />
        </div>
      </section>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('admin.dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            to="/admin/properties?status=PENDING"
            emoji="🏠"
            label={t('admin.dashboard.reviewPending')}
            desc={`${stats.pending_properties} ${t('admin.dashboard.pendingProperties').toLowerCase()}`}
          />
          <QuickLink
            to="/admin/inquiries"
            emoji="💬"
            label={t('admin.dashboard.manageInquiries')}
            desc={`${stats.pending_inquiries} ${t('admin.dashboard.pendingInquiries').toLowerCase()}`}
          />
          <QuickLink
            to="/admin/users"
            emoji="👥"
            label={t('admin.dashboard.manageUsers')}
            desc={`${stats.total_users} ${t('admin.dashboard.totalUsers').toLowerCase()}`}
          />
        </div>
      </section>
    </div>
  )
}
