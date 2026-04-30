import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useLanguageStore } from '../../store/languageStore'
import { authService } from '../../services/auth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-brand-600 font-medium transition-colors'
    : 'text-gray-600 hover:text-gray-900 transition-colors'

export function Navbar() {
  const { t } = useTranslation()
  const { user, session, clear } = useAuth()
  const { language, setLanguage } = useLanguageStore()
  const navigate = useNavigate()

  const handleSignOut = async (): Promise<void> => {
    await authService.signOut()
    clear()
    navigate('/login')
  }

  const role = user?.role ?? null

  return (
    <nav className="border-b border-brand-100 bg-white px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/">
        <img
          src="/Nuzul_logo_v1_transparent.svg"
          alt="Nuzul Logo"
          className="h-10 w-auto"
        />
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {/* ── Listings (always visible) ── */}
        <NavLink to="/listings" className={navLinkClass}>
          {t('nav.listings')}
        </NavLink>

        {session ? (
          <>
            {/* ── Role-specific links ── */}
            {(role === 'STUDENT' || role === 'LANDLORD') && (
              <NavLink to="/dashboard" className={navLinkClass}>
                {t('nav.dashboard')}
              </NavLink>
            )}

            {role === 'LANDLORD' && (
              <NavLink to="/landlord/add-property" className={navLinkClass}>
                {t('nav.addProperty')}
              </NavLink>
            )}

            {role === 'ADMIN' && (
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  {t('nav.adminDashboard')}
                </NavLink>
                <NavLink to="/admin/properties" className={navLinkClass}>
                  {t('nav.adminProperties')}
                </NavLink>
                <NavLink to="/admin/inquiries" className={navLinkClass}>
                  {t('nav.inquiries')}
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  {t('nav.adminUsers')}
                </NavLink>
              </>
            )}

            {/* ── User identity + sign out ── */}
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 max-w-[140px] truncate">
              {user?.full_name ?? user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              {t('nav.signOut')}
            </button>
          </>
        ) : (
          <>
            {/* ── Guest links ── */}
            <NavLink to="/login" className={navLinkClass}>
              {t('nav.signIn')}
            </NavLink>
            <Link
              to="/register"
              className="bg-accent-500 text-white px-4 py-1.5 rounded-lg hover:bg-accent-600 transition-colors font-semibold"
            >
              {t('nav.getStarted')}
            </Link>
          </>
        )}

        {/* ── Language toggle ── */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="border border-gray-200 rounded-lg px-3 py-1 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors text-xs font-medium"
        >
          {language === 'ar' ? 'English' : 'عربي'}
        </button>
      </div>
    </nav>
  )
}