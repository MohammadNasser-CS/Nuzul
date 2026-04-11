import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { t } = useTranslation()
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-400 text-sm">{t('common.loading')}</span>
      </div>
    )
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />
}
