import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute() {
  const { t } = useTranslation()
  const { session, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-400 text-sm">{t('common.loading')}</span>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!user?.role) return <Navigate to="/role-selection" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
