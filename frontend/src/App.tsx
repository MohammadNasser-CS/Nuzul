import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ListingsPage from './pages/ListingsPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import StudentInfoPage from './pages/StudentInfoPage'
import DashboardPage from './pages/DashboardPage'
import { Navbar } from './components/layout/Navbar'
import { useAuthBootstrap } from './hooks/useAuth'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

function AppRoutes() {
  useAuthBootstrap() // bootstraps Supabase session into Zustand once at root

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/listings" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/listings" element={<ListingsPage />} />

        {/* Profile setup — requires a Supabase session but no completed profile */}
        <Route element={<ProtectedRoute />}>
          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/student-info" element={<StudentInfoPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/listings" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}