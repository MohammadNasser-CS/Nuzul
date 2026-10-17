import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuBuilding2, LuMessageSquare, LuPhone, LuSearch, LuUserCheck, LuUserX, LuUsers } from 'react-icons/lu'
import { adminService } from '@/services/admin'
import { Button } from '@/components/ui/Button'
import { Alert, Badge, EmptyState, Skeleton } from '@/components/ui/Feedback'
import type { Tone } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Form'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { cn, formatDate, initialOf } from '@/lib/format'
import type { AdminUser } from '@/types'

type RoleTab = 'ALL' | 'STUDENT' | 'LANDLORD' | 'ADMIN'

const ROLE_TONE: Record<AdminUser['role'], Tone> = {
  STUDENT: 'info',
  LANDLORD: 'accent',
  ADMIN: 'brand',
}

function UserRow({ user: u, onToggle, toggling }: { user: AdminUser; onToggle: (u: AdminUser) => void; toggling: boolean }) {
  const { t, i18n } = useTranslation()
  const isAdmin = u.role === 'ADMIN'

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-soft sm:flex-row sm:items-center',
        u.is_active ? 'border-line' : 'border-red-200 bg-red-50/40',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold',
            u.is_active ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' : 'bg-slate-200 text-slate-500',
          )}
        >
          {initialOf(u.full_name ?? u.email)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-900">{u.full_name ?? u.email}</p>
            <Badge tone={ROLE_TONE[u.role]}>{t(`enums.role.${u.role}`)}</Badge>
            {!u.is_active && (
              <Badge tone="danger" dot>
                {t('admin.users.inactive')}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500">
            {u.full_name && <span className="truncate">{u.email}</span>}
            {u.phone_number && (
              <span dir="ltr" className="inline-flex items-center gap-1">
                <LuPhone className="size-3.5" />
                {u.phone_number}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-xs text-slate-500">
          {u.role === 'LANDLORD' && (
            <p className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <LuBuilding2 className="size-3.5" />
              {u.property_count} {t('admin.users.properties')}
            </p>
          )}
          {u.role === 'STUDENT' && (
            <p className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <LuMessageSquare className="size-3.5" />
              {u.inquiry_count} {t('admin.users.inquiries')}
            </p>
          )}
          <p>
            {t('admin.users.joined')} {formatDate(u.created_at, i18n.language)}
          </p>
        </div>

        <div className="ms-auto shrink-0">
          {isAdmin ? (
            <span className="text-xs text-slate-400" title={t('admin.users.cannotDeactivateAdmin')}>
              —
            </span>
          ) : (
            <Button
              size="sm"
              variant={u.is_active ? 'danger-soft' : 'secondary'}
              onClick={() => onToggle(u)}
              loading={toggling}
              leftIcon={u.is_active ? <LuUserX className="size-4" /> : <LuUserCheck className="size-4" />}
            >
              {u.is_active ? t('admin.users.deactivate') : t('admin.users.reactivate')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    adminService
      .listUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError(t('admin.users.error')))
      .finally(() => setLoading(false))
  }, [t])

  const counts: Record<RoleTab, number> = {
    ALL: users.length,
    STUDENT: users.filter((u) => u.role === 'STUDENT').length,
    LANDLORD: users.filter((u) => u.role === 'LANDLORD').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  }

  const q = query.trim().toLowerCase()
  const visible = users
    .filter((u) => activeTab === 'ALL' || u.role === activeTab)
    .filter(
      (u) =>
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone_number?.includes(q),
    )

  async function handleToggle(u: AdminUser) {
    setTogglingId(u.id)
    setToggleError(null)
    try {
      const res = await adminService.toggleUserActivation(u.id)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: res.data.is_active } : x)))
    } catch {
      setToggleError(t('admin.users.toggleError'))
    } finally {
      setTogglingId(null)
    }
  }

  const tabs: RoleTab[] = ['ALL', 'STUDENT', 'LANDLORD', 'ADMIN']
  const tabLabels: Record<RoleTab, string> = {
    ALL: t('admin.users.all'),
    STUDENT: t('admin.users.students'),
    LANDLORD: t('admin.users.landlords'),
    ADMIN: t('admin.users.admins'),
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('admin.users.title')} subtitle={t('admin.users.subtitle')} className="mb-6" />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          items={tabs.map((tab) => ({ value: tab, label: tabLabels[tab], count: loading ? undefined : counts[tab] }))}
        />
        <div className="lg:w-72">
          <Input
            icon={<LuSearch />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
          />
        </div>
      </div>

      {(error || toggleError) && <Alert tone="danger" className="mb-4">{error ?? toggleError}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<LuUsers />} title={t('admin.users.noUsers')} />
      ) : (
        <div className="space-y-3">
          {visible.map((u) => (
            <UserRow key={u.id} user={u} onToggle={handleToggle} toggling={togglingId === u.id} />
          ))}
        </div>
      )}
    </div>
  )
}
