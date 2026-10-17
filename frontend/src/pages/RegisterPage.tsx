import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuCheck, LuLock, LuMail, LuMailCheck } from 'react-icons/lu'
import { authService } from '../services/auth'
import { AuthHeading, AuthLayout, GoogleButton, OrDivider } from '@/components/auth/AuthLayout'
import { Button, LinkButton } from '@/components/ui/Button'
import { Field, Input, PasswordInput } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'
import { cn } from '@/lib/format'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleRegister = async (e: FormEvent) => {
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

  const longEnough = password.length >= 8

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 animate-scale-in">
            <LuMailCheck className="size-10" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-slate-900">{t('auth.register.checkEmail')}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-500">
            {t('auth.register.checkEmailLead')}{' '}
            <span dir="ltr" className="font-bold text-slate-900">
              {email}
            </span>
          </p>
          <Alert tone="info" className="mt-6 text-start">
            {t('auth.register.spamHint')}
          </Alert>
          <LinkButton to="/login" variant="primary" size="lg" block className="mt-6">
            {t('auth.register.backToSignIn')}
          </LinkButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeading title={t('auth.register.title')} subtitle={t('auth.register.subtitle')} />

      {error && <Alert tone="danger" className="mb-5">{error}</Alert>}

      <GoogleButton label={t('auth.register.google')} onClick={handleGoogle} />
      <OrDivider />

      <form onSubmit={handleRegister} className="space-y-4">
        <Field label={t('auth.register.email')} htmlFor="reg-email">
          <Input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            icon={<LuMail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.register.emailPlaceholder')}
          />
        </Field>
        <Field label={t('auth.register.password')} htmlFor="reg-password">
          <PasswordInput
            id="reg-password"
            required
            minLength={8}
            autoComplete="new-password"
            icon={<LuLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.register.passwordPlaceholder')}
          />
          <p
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              longEnough ? 'text-emerald-600' : 'text-slate-400',
            )}
          >
            <LuCheck className="size-3.5" />
            {t('auth.register.passwordRule')}
          </p>
        </Field>
        <Button type="submit" variant="accent" size="lg" block loading={loading} className="mt-6">
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
        <p className="text-center text-xs leading-relaxed text-slate-400">{t('auth.register.freeNote')}</p>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </AuthLayout>
  )
}
