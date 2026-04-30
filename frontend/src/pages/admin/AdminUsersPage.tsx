import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminService } from '@/services/admin'
import type { AdminUser } from '@/types'

type RoleTab = 'ALL' | 'STUDENT' | 'LANDLORD' | 'ADMIN'

// ── User card ──────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: AdminUser
  onToggle: (u: AdminUser) => void
  toggling: boolean
}

function UserCard({ user: u, onToggle, toggling }: UserCardProps) {
  const { t } = useTranslation()

  const initial = (u.full_name ?? u.email ?? '?')[0].toUpperCase()
  const isAdmin = u.role === 'ADMIN'

  const roleBadgeColors: Record<string, string> = {
    STUDENT:  'bg-blue-100  text-blue-700',
    LANDLORD: 'bg-purple-100 text-purple-700',
    ADMIN:    'bg-gray-100   text-gray-600',
  }

  return (
    <div className={`bg-white border rounded-xl p-4 flex gap-4 items-start shadow-sm ${u.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50/30'}`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex-shrink-0 flex items-center justify-center font-bold text-sm">
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm">{u.full_name ?? u.email}</p>
          {u.full_name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColors[u.role]}`}>
            {t(`enums.role.${u.role}`)}
          </span>
          {/* Status badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {u.is_active ? t('admin.users.active') : t('admin.users.inactive')}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          {u.phone_number && <span className="me-3">{u.phone_number}</span>}
          {t('admin.users.joined')} {new Date(u.created_at).toLocaleDateString()}
        </p>

        {/* Counts */}
        <p className="text-xs text-gray-500">
          {u.role === 'LANDLORD' && (
            <span>{u.property_count} {t('admin.users.properties')}</span>
          )}
          {u.role === 'STUDENT' && (
            <span>{u.inquiry_count} {t('admin.users.inquiries')}</span>
          )}
        </p>
      </div>

      {/* Toggle button */}
      <div className="flex-shrink-0">
        {isAdmin ? (
          <span
            className="text-xs text-gray-400 cursor-not-allowed"
            title={t('admin.users.cannotDeactivateAdmin')}
          >
            —
          </span>
        ) : (
          <button
            onClick={() => onToggle(u)}
            disabled={toggling}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
              u.is_active
                ? 'border-red-300 text-red-600 hover:bg-red-50'
                : 'border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {toggling ? '…' : u.is_active ? t('admin.users.deactivate') : t('admin.users.reactivate')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminService
      .listUsers()
      .then(res => setUsers(res.data))
      .catch(() => setError(t('admin.users.error')))
      .finally(() => setLoading(false))
  }, [t])

  // Derived counts
  const counts: Record<RoleTab, number> = {
    ALL:      users.length,
    STUDENT:  users.filter(u => u.role === 'STUDENT').length,
    LANDLORD: users.filter(u => u.role === 'LANDLORD').length,
    ADMIN:    users.filter(u => u.role === 'ADMIN').length,
  }

  const visible = activeTab === 'ALL'
    ? users
    : users.filter(u => u.role === activeTab)

  async function handleToggle(u: AdminUser) {
    setTogglingId(u.id)
    setToggleError(null)
    try {
      const res = await adminService.toggleUserActivation(u.id)
      setUsers(prev =>
        prev.map(x => x.id === u.id ? { ...x, is_active: res.data.is_active } : x)
      )
    } catch {
      setToggleError(t('admin.users.toggleError'))
    } finally {
      setTogglingId(null)
    }
  }

  const tabs: RoleTab[] = ['ALL', 'STUDENT', 'LANDLORD', 'ADMIN']
  const tabLabels: Record<RoleTab, string> = {
    ALL:      t('admin.users.all'),
    STUDENT:  t('admin.users.students'),
    LANDLORD: t('admin.users.landlords'),
    ADMIN:    t('admin.users.admins'),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tabLabels[tab]}
            {counts[tab] > 0 && (
              <span className={`ms-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {(error || toggleError) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          {error ?? toggleError}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-gray-500 py-10">{t('admin.users.noUsers')}</p>
      ) : (
        <div className="space-y-3">
          {visible.map(u => (
            <UserCard
              key={u.id}
              user={u}
              onToggle={handleToggle}
              toggling={togglingId === u.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
