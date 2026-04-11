import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useLanguageStore } from '../../store/languageStore'
import { authService } from '../../services/auth'

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

  return (
    <nav className="border-b border-brand-100 bg-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="">
        <img
          src="/Nuzul_logo_v1_transparent.svg"
          alt="Nuzul Logo"
          className="h-10 w-auto"
        />
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link to="/listings" className="text-gray-600 hover:text-gray-900 transition-colors">
          {t('nav.listings')}
        </Link>

        {session ? (
          <>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.dashboard')}
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{user?.full_name ?? user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              {t('nav.signOut')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.signIn')}
            </Link>
            <Link
              to="/register"
              className="bg-accent-500 text-white px-4 py-1.5 rounded-lg hover:bg-accent-600 transition-colors font-semibold"
            >
              {t('nav.getStarted')}
            </Link>
          </>
        )}

        {/* Language toggle */}
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