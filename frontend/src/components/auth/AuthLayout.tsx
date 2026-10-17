import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FcGoogle } from 'react-icons/fc'
import { LuCircleCheck, LuGraduationCap, LuMessageCircle, LuShieldCheck } from 'react-icons/lu'

/**
 * Split-screen layout for auth & onboarding: form on one side, brand panel on the other.
 * The brand panel is hidden on small screens so the form gets the full width.
 */
export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useTranslation()

  const points = [
    { icon: LuShieldCheck, text: t('authPanel.p1') },
    { icon: LuGraduationCap, text: t('authPanel.p2') },
    { icon: LuMessageCircle, text: t('authPanel.p3') },
  ]

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full animate-fade-up ${wide ? 'max-w-xl' : 'max-w-md'}`}>{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="pointer-events-none absolute -top-32 -end-24 size-96 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-24 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <p className="text-sm font-bold text-accent-300">{t('authPanel.eyebrow')}</p>
          <h2 className="mt-3 text-3xl leading-snug font-extrabold text-white xl:text-4xl">{t('authPanel.title')}</h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 text-brand-50">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5 text-accent-300" />
                </span>
                <span className="text-base">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 max-w-sm rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <LuCircleCheck className="size-5 text-emerald-300" />
              {t('authPanel.cardTitle')}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-100">{t('authPanel.cardText')}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

/** Title block used at the top of each auth form. */
export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-slate-500">{subtitle}</p>}
    </div>
  )
}

/** Step progress used by onboarding pages. */
export function StepProgress({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i < step ? 'w-8 bg-accent-500' : 'w-4 bg-slate-200'}`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-accent-600">{label}</span>
    </div>
  )
}

export function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white text-sm font-bold text-slate-700 shadow-soft transition-all hover:border-slate-300 hover:shadow-lift"
    >
      <FcGoogle className="size-5" />
      {label}
    </button>
  )
}

export function OrDivider() {
  const { t } = useTranslation()
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-semibold text-slate-400">{t('auth.orEmail')}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
