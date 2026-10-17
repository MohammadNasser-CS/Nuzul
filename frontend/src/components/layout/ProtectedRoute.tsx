import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageLoader } from './PageLoader'

export function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  return session ? <Outlet /> : <Navigate to="/login" replace />
}
