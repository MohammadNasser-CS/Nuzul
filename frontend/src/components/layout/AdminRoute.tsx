import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from './PageLoader'
import { AdminLayout } from './AdminLayout'

export function AdminRoute() {
  const { session, user, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (!session) return <Navigate to="/login" replace />
  if (!user?.role) return <Navigate to="/role-selection" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <AdminLayout />
}
