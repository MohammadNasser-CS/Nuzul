import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { LuCheck, LuChevronDown, LuEye, LuEyeOff } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/format'

const CONTROL =
  'w-full rounded-xl border border-line bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors ' +
  'hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 read-only:bg-slate-50 read-only:text-slate-500'

// ── Field wrapper: label + control + hint/error ───────────────────────────────
interface FieldProps {
  label?: ReactNode
  required?: boolean
  optional?: boolean
  hint?: ReactNode
  error?: string | null
  className?: string
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, required, optional, hint, error, className, children, htmlFor }: FieldProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-accent-600">*</span>}
          {optional && <span className="text-xs font-normal text-slate-400">({t('common.optional')})</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

// ── Input (optionally with a leading icon / trailing node) ────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-slate-400 [&>svg]:size-4.5">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(CONTROL, 'h-11 px-3.5', icon ? 'ps-10' : undefined, trailing ? 'pe-11' : undefined, className)}
        {...rest}
      />
      {trailing && <span className="absolute inset-y-0 end-1.5 flex items-center">{trailing}</span>}
    </div>
  )
})

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
        </button>
      }
      {...props}
    />
  )
})

// ── Select ─────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { icon, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-slate-400 [&>svg]:size-4.5">
          {icon}
        </span>
      )}
      <select
        ref={ref}
        className={cn(CONTROL, 'h-11 appearance-none ps-3.5 pe-10', icon ? 'ps-10' : undefined, className)}
        {...rest}
      >
        {children}
      </select>
      <LuChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
})

// ── Textarea ───────────────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, 'resize-none px-3.5 py-2.5', className)} {...rest} />
  },
)

// ── Selectable card (radio / checkbox look-alike) ─────────────────────────────
interface ChoiceCardProps {
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  className?: string
  compact?: boolean
  multi?: boolean
}

export function ChoiceCard({ selected, onSelect, icon, title, description, className, compact, multi }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full rounded-2xl border-2 text-start transition-all duration-150',
        compact ? 'items-center gap-2.5 px-3.5 py-3' : 'flex-col gap-3 p-4',
        selected
          ? 'border-brand-600 bg-brand-50/60 shadow-sm'
          : 'border-line bg-white hover:border-slate-300 hover:shadow-soft',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl transition-colors',
            compact ? 'size-9 [&>svg]:size-4.5' : 'size-11 [&>svg]:size-5.5',
            selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>}
      </span>
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center border-2 transition-all',
          multi ? 'rounded-md' : 'rounded-full',
          compact ? '' : 'absolute top-3.5 end-3.5',
          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-transparent',
        )}
      >
        <LuCheck className="size-3" strokeWidth={3} />
      </span>
    </button>
  )
}

// ── Pill chip (filters, quick selectors) ──────────────────────────────────────
export function Chip({
  active,
  onClick,
  children,
  icon,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all [&>svg]:size-4',
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
          : 'border-line bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
