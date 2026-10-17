import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuX } from 'react-icons/lu'
import { cn } from '@/lib/format'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Hide the × button (e.g. when a flow must be completed) */
  hideClose?: boolean
}

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }

/**
 * Accessible modal. Renders as a bottom sheet on mobile and a centred dialog
 * on larger screens. Locks body scroll and closes on Escape / backdrop click.
 */
export function Modal({ open, onClose, title, description, icon, children, footer, size = 'md', hideClose }: ModalProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  // Keep the latest onClose without re-running the effect (which would steal focus)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-brand-900/50 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop outline-none animate-slide-up sm:rounded-3xl sm:animate-scale-in',
          SIZES[size],
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 px-6 pt-6 pb-2">
            {icon && (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 [&>svg]:size-5.5">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{description}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="-me-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="size-5" />
              </button>
            )}
          </div>
        )}
        {children ? <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div> : <div className="h-3" />}
        {footer && <div className="flex gap-2 border-t border-line bg-slate-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Promise-free confirm dialog for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  icon,
}: {
  open: boolean
  title: ReactNode
  description?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  icon?: ReactNode
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      icon={icon}
      size="sm"
      footer={
        <>
          <Button variant="outline" block onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" block loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
