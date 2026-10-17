import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from './PageLoader'

export function LandlordRoute() {
  const { session, user, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (!session) return <Navigate to="/login" replace />
  if (!user?.role) return <Navigate to="/role-selection" replace />
  if (user.role !== 'LANDLORD') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
