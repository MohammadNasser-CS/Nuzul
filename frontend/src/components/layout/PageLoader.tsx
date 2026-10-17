import { useTranslation } from 'react-i18next'
import { Spinner } from '../ui/Feedback'

/** Full-height centred loader used by route guards and callback pages. */
export function PageLoader({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="size-8" />
      <span className="text-sm font-medium text-slate-500">{label ?? t('common.loading')}</span>
    </div>
  )
}
