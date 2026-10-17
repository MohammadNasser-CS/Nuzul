import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuLock, LuMail } from 'react-icons/lu'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { getPostLoginRoute } from '../hooks/useAuth'
import { AuthHeading, AuthLayout, GoogleButton, OrDivider } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, Input, PasswordInput } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
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
    <AuthLayout>
      <AuthHeading title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} />

      {error && <Alert tone="danger" className="mb-5">{error}</Alert>}

      <GoogleButton label={t('auth.login.google')} onClick={handleGoogle} />
      <OrDivider />

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Field label={t('auth.login.email')} htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            icon={<LuMail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.login.emailPlaceholder')}
          />
        </Field>
        <Field label={t('auth.login.password')} htmlFor="login-password">
          <PasswordInput
            id="login-password"
            required
            autoComplete="current-password"
            icon={<LuLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.login.passwordPlaceholder')}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" block loading={loading} className="mt-6">
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="font-bold text-accent-600 hover:text-accent-700 hover:underline">
          {t('auth.login.signUp')}
        </Link>
      </p>
    </AuthLayout>
  )
}
