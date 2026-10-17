import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuArrowRight, LuBookOpen, LuCalendarDays, LuGraduationCap, LuSchool } from 'react-icons/lu'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { AuthHeading, AuthLayout, StepProgress } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { ChoiceCard, Chip, Field, Input, Select } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'
import { ROOM_TYPE_ICONS } from '@/lib/amenities'
import type { CompleteStudentProfilePayload } from '../types'

const DEGREES = ['Diploma', 'Bachelor', 'Master', 'Doctorate'] as const
const GENDERS = ['MALE', 'FEMALE'] as const
const ROOM_TYPE_VALUES = ['SINGLE', 'SHARED', 'STUDIO', 'NO_PREFERENCE'] as const

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-sm font-extrabold text-slate-900">{children}</h2>
}

export default function StudentInfoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [form, setForm] = useState<Partial<CompleteStudentProfilePayload>>({
    university_name: 'An-Najah National University',
    preferred_room_type: 'NO_PREFERENCE',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof CompleteStudentProfilePayload>(field: K, value: CompleteStudentProfilePayload[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.gender) return setError(t('onboarding.student.genderRequired'))
    if (form.budget_min !== undefined && form.budget_max !== undefined && form.budget_min > form.budget_max) {
      return setError(t('onboarding.student.budgetError'))
    }

    setLoading(true)
    try {
      await authService.completeStudentProfile(form as CompleteStudentProfilePayload)
      // Fetch the full updated user (includes student_profile) instead of using the partial response
      const userRes = await authService.getMe()
      setUser(userRes.data)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? t('onboarding.student.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout wide>
      <AuthHeading
        eyebrow={<StepProgress step={2} total={2} label={t('onboarding.step2of2')} />}
        title={t('onboarding.student.title')}
        subtitle={t('onboarding.student.subtitle')}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* About you */}
        <section>
          <SectionTitle>{t('onboarding.student.aboutYou')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('onboarding.student.dateOfBirth')} required>
              <Input
                type="date"
                required
                icon={<LuCalendarDays />}
                max={new Date().toISOString().split('T')[0]}
                value={form.date_of_birth ?? ''}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            </Field>
            <Field label={t('onboarding.student.gender')} required>
              <div className="flex gap-2">
                {GENDERS.map((g) => (
                  <Chip key={g} active={form.gender === g} onClick={() => set('gender', g)} className="h-11 flex-1 justify-center rounded-xl">
                    {t(`enums.gender.${g}`)}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {/* Studies */}
        <section>
          <SectionTitle>{t('onboarding.student.studies')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('onboarding.student.university')} className="sm:col-span-2">
              <Input readOnly icon={<LuSchool />} value={t('enums.university.An-Najah National University')} />
            </Field>
            <Field label={t('onboarding.student.college')} required>
              <Input
                required
                icon={<LuGraduationCap />}
                value={form.college ?? ''}
                onChange={(e) => set('college', e.target.value)}
                placeholder={t('onboarding.student.collegePlaceholder')}
              />
            </Field>
            <Field label={t('onboarding.student.degree')} required>
              <Select
                required
                value={form.degree ?? ''}
                onChange={(e) => set('degree', e.target.value as CompleteStudentProfilePayload['degree'])}
              >
                <option value="" disabled>
                  {t('onboarding.student.selectDegree')}
                </option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {t(`enums.degree.${d}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('onboarding.student.specialization')} required className="sm:col-span-2">
              <Input
                required
                icon={<LuBookOpen />}
                value={form.specialization ?? ''}
                onChange={(e) => set('specialization', e.target.value)}
                placeholder={t('onboarding.student.specializationPlaceholder')}
              />
            </Field>
          </div>
        </section>

        {/* Housing preferences */}
        <section>
          <SectionTitle>{t('onboarding.student.preferences')}</SectionTitle>
          <Field label={t('onboarding.student.budget')} required>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                required
                min={0}
                inputMode="numeric"
                icon={<span className="text-sm font-bold">₪</span>}
                value={form.budget_min ?? ''}
                onChange={(e) => set('budget_min', Number(e.target.value))}
                placeholder={t('onboarding.student.budgetMin')}
              />
              <span className="shrink-0 text-sm text-slate-400">{t('onboarding.student.to')}</span>
              <Input
                type="number"
                required
                min={0}
                inputMode="numeric"
                icon={<span className="text-sm font-bold">₪</span>}
                value={form.budget_max ?? ''}
                onChange={(e) => set('budget_max', Number(e.target.value))}
                placeholder={t('onboarding.student.budgetMax')}
              />
            </div>
          </Field>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700">{t('onboarding.student.preferredRoomType')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ROOM_TYPE_VALUES.map((value) => {
                const Icon = ROOM_TYPE_ICONS[value]
                return (
                  <ChoiceCard
                    key={value}
                    selected={form.preferred_room_type === value}
                    onSelect={() => set('preferred_room_type', value)}
                    icon={<Icon />}
                    title={t(`enums.preferredRoomType.${value}`)}
                  />
                )
              })}
            </div>
          </div>
        </section>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          block
          loading={loading}
          rightIcon={<LuArrowRight className="size-5 rtl:rotate-180" />}
        >
          {loading ? t('onboarding.student.saving') : t('onboarding.student.completeSetup')}
        </Button>
      </form>
    </AuthLayout>
  )
}
