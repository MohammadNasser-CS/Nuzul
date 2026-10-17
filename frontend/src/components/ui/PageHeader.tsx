import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowLeft } from 'react-icons/lu'
import { cn } from '@/lib/format'

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  eyebrow,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: ReactNode }
  eyebrow?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-8', className)}>
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
        >
          <LuArrowLeft className="size-4 rtl:rotate-180" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-sm font-bold text-accent-600">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Compact stat tile used in dashboards. */
export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  to,
}: {
  label: ReactNode
  value: ReactNode
  icon: ReactNode
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  hint?: ReactNode
  to?: string
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-500',
    info: 'bg-sky-50 text-sky-600',
    neutral: 'bg-slate-100 text-slate-500',
  }
  const body = (
    <>
      <div className={cn('flex size-10 items-center justify-center rounded-xl [&>svg]:size-5', tones[tone])}>{icon}</div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    </>
  )
  const cls = 'block rounded-2xl border border-line bg-white p-5 shadow-soft'
  return to ? (
    <Link to={to} className={cn(cls, 'transition-all hover:-translate-y-0.5 hover:shadow-lift')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
