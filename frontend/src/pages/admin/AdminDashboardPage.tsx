import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBedDouble,
  LuBuilding2,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuGraduationCap,
  LuMessageSquare,
  LuPhoneCall,
  LuTriangleAlert,
  LuUserCheck,
  LuUsers,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { adminService } from '@/services/admin'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { PageHeader, StatCard } from '@/components/ui/PageHeader'
import { cn } from '@/lib/format'
import type { AdminDashboardStats } from '@/types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-slate-500">{title}</h2>
      {children}
    </section>
  )
}

/** Large "needs attention" card that links to the relevant queue. */
function ActionCard({
  to,
  icon: Icon,
  count,
  label,
  cta,
}: {
  to: string
  icon: IconType
  count: number
  label: string
  cta: string
}) {
  const urgent = count > 0
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-4 rounded-3xl border p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift',
        urgent ? 'border-accent-200 bg-accent-50/60' : 'border-line bg-white',
      )}
    >
      <span
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-2xl',
          urgent ? 'bg-accent-600 text-white shadow-lg shadow-accent-700/20' : 'bg-slate-100 text-slate-500',
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-bold tabular-nums text-slate-900">{count.toLocaleString()}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <span className="hidden items-center gap-1 text-sm font-bold text-brand-600 sm:inline-flex">
        {cta}
        <LuArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </span>
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
      .then((res) => setStats(res.data))
      .catch(() => setError(t('admin.dashboard.error')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return <EmptyState icon={<LuTriangleAlert />} title={error ?? t('admin.dashboard.error')} />
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')} className="mb-0" />

      {/* Needs attention */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/admin/properties?status=PENDING"
          icon={LuBuilding2}
          count={stats.pending_properties}
          label={t('admin.dashboard.reviewPending')}
          cta={t('admin.dashboard.review')}
        />
        <ActionCard
          to="/admin/inquiries"
          icon={LuMessageSquare}
          count={stats.pending_inquiries}
          label={t('admin.dashboard.newInquiries')}
          cta={t('admin.dashboard.handle')}
        />
      </div>

      <Section title={t('admin.dashboard.users')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          <StatCard to="/admin/users" icon={<LuUsers />} tone="brand" label={t('admin.dashboard.totalUsers')} value={stats.total_users.toLocaleString()} />
          <StatCard icon={<LuUserCheck />} tone="success" label={t('admin.dashboard.activeUsers')} value={stats.active_users.toLocaleString()} />
          <StatCard icon={<LuGraduationCap />} tone="info" label={t('admin.dashboard.students')} value={stats.total_students.toLocaleString()} />
          <StatCard icon={<LuBuilding2 />} tone="accent" label={t('admin.dashboard.landlords')} value={stats.total_landlords.toLocaleString()} />
        </div>
      </Section>

      <Section title={t('admin.dashboard.properties')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 sm:gap-4">
          <StatCard to="/admin/properties?status=ALL" icon={<LuBuilding2 />} tone="brand" label={t('admin.dashboard.totalProperties')} value={stats.total_properties.toLocaleString()} />
          <StatCard to="/admin/properties?status=PENDING" icon={<LuClock />} tone="warning" label={t('admin.dashboard.pendingProperties')} value={stats.pending_properties.toLocaleString()} />
          <StatCard to="/admin/properties?status=APPROVED" icon={<LuBadgeCheck />} tone="success" label={t('admin.dashboard.approvedProperties')} value={stats.approved_properties.toLocaleString()} />
          <StatCard to="/admin/properties?status=REJECTED" icon={<LuCircleX />} tone="danger" label={t('admin.dashboard.rejectedProperties')} value={stats.rejected_properties.toLocaleString()} />
          <StatCard icon={<LuBedDouble />} tone="info" label={t('admin.dashboard.totalRooms')} value={stats.total_rooms.toLocaleString()} />
        </div>
      </Section>

      <Section title={t('admin.dashboard.inquiries')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 sm:gap-4">
          <StatCard to="/admin/inquiries" icon={<LuMessageSquare />} tone="brand" label={t('admin.dashboard.totalInquiries')} value={stats.total_inquiries.toLocaleString()} />
          <StatCard icon={<LuClock />} tone="warning" label={t('admin.dashboard.pendingInquiries')} value={stats.pending_inquiries.toLocaleString()} />
          <StatCard icon={<LuPhoneCall />} tone="info" label={t('admin.dashboard.contactedInquiries')} value={stats.contacted_inquiries.toLocaleString()} />
          <StatCard icon={<LuCircleCheck />} tone="success" label={t('admin.dashboard.bookedInquiries')} value={stats.booked_inquiries.toLocaleString()} />
          <StatCard icon={<LuCircleX />} tone="neutral" label={t('admin.dashboard.cancelledInquiries')} value={stats.cancelled_inquiries.toLocaleString()} />
        </div>
      </Section>
    </div>
  )
}
