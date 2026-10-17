import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ListingsPage from './pages/ListingsPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import StudentInfoPage from './pages/StudentInfoPage'
import DashboardPage from './pages/DashboardPage'
import AddPropertyPage from './pages/landlord/AddPropertyPage'
import ManageRoomsPage from './pages/landlord/ManageRoomsPage'
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { useAuthBootstrap } from './hooks/useAuth'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LandlordRoute } from './components/layout/LandlordRoute'
import { AdminRoute } from './components/layout/AdminRoute'

// Pages with their own full-height layout — no marketing footer below them
const NO_FOOTER = ['/login', '/register', '/auth/callback', '/role-selection', '/student-info', '/admin']

function AppRoutes() {
  useAuthBootstrap()
  const { pathname } = useLocation()

  // Start every new page at the top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  const showFooter = !NO_FOOTER.some((p) => pathname.startsWith(p))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<PropertyDetailPage />} />

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/role-selection" element={<RoleSelectionPage />} />
            <Route path="/student-info" element={<StudentInfoPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Landlord only */}
          <Route element={<LandlordRoute />}>
            <Route path="/landlord/add-property" element={<AddPropertyPage />} />
            <Route path="/landlord/properties/:id/rooms" element={<ManageRoomsPage />} />
          </Route>

          {/* Admin only — AdminRoute renders the admin sidebar layout */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/properties" element={<AdminPropertiesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {/* Detail pages have a fixed mobile booking bar — leave room for it */}
      {showFooter && <Footer withBottomBar={/^\/listings\/[^/]+/.test(pathname)} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
