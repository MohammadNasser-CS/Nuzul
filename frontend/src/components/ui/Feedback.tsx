import type { ReactNode } from 'react'
import { LuCircleAlert, LuCircleCheck, LuInfo, LuLoaderCircle, LuTriangleAlert } from 'react-icons/lu'
import { cn } from '@/lib/format'

// ── Badge ──────────────────────────────────────────────────────────────────────
export type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'pink'

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  accent: 'bg-accent-50 text-accent-700 ring-accent-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  danger: 'bg-red-50 text-red-600 ring-red-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  pink: 'bg-pink-50 text-pink-700 ring-pink-100',
}

const DOTS: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  accent: 'bg-accent-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  pink: 'bg-pink-500',
}

export function Badge({
  tone = 'neutral',
  dot,
  icon,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset [&>svg]:size-3.5',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', DOTS[tone])} />}
      {icon}
      {children}
    </span>
  )
}

// ── Alert ──────────────────────────────────────────────────────────────────────
const ALERT_STYLES = {
  info: { box: 'bg-sky-50 border-sky-200 text-sky-800', icon: LuInfo },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: LuCircleCheck },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', icon: LuTriangleAlert },
  danger: { box: 'bg-red-50 border-red-200 text-red-700', icon: LuCircleAlert },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof ALERT_STYLES
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const { box, icon: Icon } = ALERT_STYLES[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 size-4.5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <LuLoaderCircle className={cn('size-5 animate-spin text-brand-500', className)} />
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 [&>svg]:size-7">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-line bg-white shadow-soft', className)}>{children}</div>
}
