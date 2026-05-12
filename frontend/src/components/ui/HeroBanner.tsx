import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// ── 1. PUBLIC BANNER (ListingsPage, unauthenticated) ──────────────────────────
// Landlord-focused: "List your property, reach students"
export function PublicBanner() {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white mb-8 px-6 py-8 sm:px-10 sm:py-10">
      {/* Decorative circle */}
      <div className="absolute -top-10 -end-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-200 mb-2">
          {t('banner.public.eyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
          {t('banner.public.title')}
        </h2>
        <p className="text-brand-100 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
          {t('banner.public.subtitle')}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="bg-white text-brand-700 hover:bg-brand-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {t('banner.public.ctaLandlord')}
          </Link>
          <Link
            to="/login"
            className="border border-white/40 hover:border-white/70 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            {t('banner.public.ctaStudent')}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── 2. LANDLORD BANNER (DashboardPage, LANDLORD role) ────────────────────────
export function LandlordBanner({ name }: { name?: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white mb-6 px-6 py-6 sm:px-8">
      <div className="absolute -top-8 -end-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-1">
            {t('banner.landlord.eyebrow')}
          </p>
          <h2 className="text-xl font-bold mb-1">
            {name
              ? t('banner.landlord.titleNamed', { name })
              : t('banner.landlord.title')}
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed max-w-lg">
            {t('banner.landlord.subtitle')}
          </p>
        </div>
        <div className="shrink-0">
          <Link
            to="/listings"
            className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            {t('banner.landlord.viewListings')}
          </Link>
        </div>
      </div>
      <p className="relative mt-3 text-xs text-emerald-200">
        💡 {t('banner.landlord.tip')}
      </p>
    </div>
  )
}

// ── 3. STUDENT BANNER (DashboardPage, STUDENT role) ──────────────────────────
export function StudentBanner({ name }: { name?: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white mb-6 px-6 py-6 sm:px-8">
      <div className="absolute -top-8 -end-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">
            {t('banner.student.eyebrow')}
          </p>
          <h2 className="text-xl font-bold mb-1">
            {name
              ? t('banner.student.titleNamed', { name })
              : t('banner.student.title')}
          </h2>
          <p className="text-violet-100 text-sm leading-relaxed max-w-lg">
            {t('banner.student.subtitle')}
          </p>
        </div>
        <div className="shrink-0">
          <Link
            to="/listings"
            className="inline-block bg-white text-violet-700 hover:bg-violet-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            {t('banner.student.browseCta')}
          </Link>
        </div>
      </div>
      <p className="relative mt-3 text-xs text-violet-200">
        🎓 {t('banner.student.hint')}
      </p>
    </div>
  )
}
