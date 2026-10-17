import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LuLoaderCircle } from 'react-icons/lu'
import { cn } from '@/lib/format'

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-soft' | 'success'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-900/10',
  accent:
    'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-sm shadow-accent-700/20',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  outline:
    'bg-white text-slate-700 border border-line hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  'danger-soft': 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-xl',
}

const BASE =
  'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none'

interface CommonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  children?: ReactNode
}

function buttonClasses({
  variant = 'primary',
  size = 'md',
  block,
  className,
}: Pick<CommonProps, 'variant' | 'size' | 'block' | 'className'>) {
  return cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)
}

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, block, leftIcon, rightIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {loading ? <LuLoaderCircle className="size-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

interface LinkButtonProps extends CommonProps {
  to: string
  target?: string
  rel?: string
  onClick?: () => void
}

export function LinkButton({
  to,
  variant,
  size,
  block,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, block, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}

/** Square icon-only button (close, menu, arrows…) */
export function IconButton({
  label,
  className,
  children,
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
