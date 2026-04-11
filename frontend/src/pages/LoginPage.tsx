import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { getPostLoginRoute } from '../hooks/useAuth'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: supabaseError } = await authService.signInWithEmail(email, password)
    if (supabaseError) {
      setLoading(false)
      return setError(supabaseError.message)
    }

    try {
      const res = await authService.getMe()
      setUser(res.data)
      navigate(getPostLoginRoute(res.data), { replace: true })
    } catch {
      setError(t('auth.login.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    const { error } = await authService.signInWithGoogle()
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.login.title')}</h1>
        <p className="text-gray-500 text-sm mb-8">{t('auth.login.subtitle')}</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.login.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('auth.login.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.login.password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('auth.login.passwordPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">{t('auth.or')}</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          <FcGoogle className="w-5 h-5" />
          {t('auth.login.google')}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            {t('auth.login.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
