import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'
import { authService } from '../services/auth'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authService.signUpWithEmail(email, password)
    setLoading(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  const handleGoogle = async () => {
    setError(null)
    const { error } = await authService.signInWithGoogle()
    if (error) setError(error.message)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.register.checkEmail')}</h2>
          <p className="text-gray-500 text-sm">
            {t('auth.register.checkEmailDesc', { email })}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 text-brand-600 hover:underline text-sm font-medium"
          >
            {t('auth.register.backToSignIn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.register.title')}</h1>
        <p className="text-gray-500 text-sm mb-8">{t('auth.register.subtitle')}</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('auth.register.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.password')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('auth.register.passwordPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
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
          {t('auth.register.google')}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
