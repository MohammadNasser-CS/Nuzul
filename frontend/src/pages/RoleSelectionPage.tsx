import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuArrowRight, LuBuilding2, LuGraduationCap, LuPhone, LuUser } from 'react-icons/lu'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { AuthHeading, AuthLayout, StepProgress } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { ChoiceCard, Field, Input } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'

type Role = 'STUDENT' | 'LANDLORD'

export default function RoleSelectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return setError(t('onboarding.role.selectRoleError'))
    setError(null)
    setLoading(true)

    try {
      const res = await authService.completeProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        role: selectedRole,
      })
      setUser(res.data)
      navigate(selectedRole === 'STUDENT' ? '/student-info' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? t('onboarding.role.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout wide>
      <AuthHeading
        eyebrow={<StepProgress step={1} total={2} label={t('onboarding.step1of2')} />}
        title={t('onboarding.role.title')}
        subtitle={t('onboarding.role.subtitle')}
      />

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">
            {t('onboarding.role.iAmA')} <span className="text-accent-600">*</span>
          </p>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={selectedRole === 'STUDENT'}
              onSelect={() => setSelectedRole('STUDENT')}
              icon={<LuGraduationCap />}
              title={t('onboarding.role.student')}
              description={t('onboarding.role.studentDesc')}
            />
            <ChoiceCard
              selected={selectedRole === 'LANDLORD'}
              onSelect={() => setSelectedRole('LANDLORD')}
              icon={<LuBuilding2 />}
              title={t('onboarding.role.landlord')}
              description={t('onboarding.role.landlordDesc')}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{t('onboarding.role.roleLocked')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('onboarding.role.fullName')} required htmlFor="ob-name">
            <Input
              id="ob-name"
              required
              autoComplete="name"
              icon={<LuUser />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('onboarding.role.fullNamePlaceholder')}
            />
          </Field>
          <Field label={t('onboarding.role.phoneNumber')} required htmlFor="ob-phone" hint={t('onboarding.role.phoneHint')}>
            <Input
              id="ob-phone"
              type="tel"
              dir="ltr"
              required
              autoComplete="tel"
              icon={<LuPhone />}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('onboarding.role.phonePlaceholder')}
              className="text-start"
            />
          </Field>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          loading={loading}
          disabled={!selectedRole}
          rightIcon={<LuArrowRight className="size-5 rtl:rotate-180" />}
        >
          {loading
            ? t('onboarding.role.saving')
            : selectedRole === 'STUDENT'
              ? t('onboarding.role.continueStudent')
              : t('onboarding.role.completeSetup')}
        </Button>
      </form>
    </AuthLayout>
  )
}
