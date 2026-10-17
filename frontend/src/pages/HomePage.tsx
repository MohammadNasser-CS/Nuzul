import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBuilding2,
  LuCircleCheck,
  LuClipboardCheck,
  LuGraduationCap,
  LuHouse,
  LuMessageCircle,
  LuMousePointerClick,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuWallet,
  LuKey,
  LuUsers,
} from 'react-icons/lu'
import { listingsService } from '@/services/properties'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { LinkButton } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { useAuthStore } from '@/store/authStore'
import { ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn, coverImageOf, formatPrice, getPriceRange } from '@/lib/format'
import type { Property } from '@/types'

const ROOM_OPTIONS = ['', 'SINGLE', 'SHARED', 'STUDIO'] as const
type GenderOption = '' | 'MALE' | 'FEMALE'

// ─── Hero search panel ─────────────────────────────────────────────────────────
function HeroSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [roomType, setRoomType] = useState<(typeof ROOM_OPTIONS)[number]>('')
  const [gender, setGender] = useState<GenderOption>('')
  const [budget, setBudget] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (roomType) params.set('room_type', roomType)
    if (gender) params.set('gender_preference', gender)
    if (budget) params.set('max_price', budget)
    navigate(`/listings${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-3 shadow-pop sm:p-4">
      {/* Room type */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 scrollbar-none">
        {ROOM_OPTIONS.map((v) => {
          const Icon = v ? ROOM_TYPE_ICONS[v] : LuSparkles
          return (
            <button
              type="button"
              key={v || 'any'}
              onClick={() => setRoomType(v)}
              className={cn(
                'flex h-10 flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition-all',
                roomType === v ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <Icon className="size-4" />
              {v ? t(`enums.roomType.${v}`) : t('home.search.anyRoom')}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col rounded-2xl border border-line px-4 py-2 transition-colors focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-bold text-slate-500">{t('home.search.who')}</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
            className="appearance-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
          >
            <option value="">{t('home.search.anyone')}</option>
            <option value="MALE">{t('enums.genderPref.MALE')}</option>
            <option value="FEMALE">{t('enums.genderPref.FEMALE')}</option>
          </select>
        </label>
        <label className="flex flex-col rounded-2xl border border-line px-4 py-2 transition-colors focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-bold text-slate-500">{t('home.search.budget')}</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-400">₪</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t('home.search.budgetPlaceholder')}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </label>
        <button
          type="submit"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent-600 px-7 text-base font-bold text-white shadow-lg shadow-accent-700/25 transition-colors hover:bg-accent-700"
        >
          <LuSearch className="size-5" />
          {t('home.search.submit')}
        </button>
      </div>
    </form>
  )
}

// ─── Floating preview collage (desktop hero) ───────────────────────────────────
function HeroVisual({ featured }: { featured: Property[] }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const main = featured[0]
  const second = featured[1]
  const mainImg = main ? coverImageOf(main) : undefined
  const secondImg = second ? coverImageOf(second) : undefined
  const price = main ? getPriceRange(main.rooms) : null

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* back card */}
      <div className="absolute end-0 top-6 h-[62%] w-[62%] rotate-6 overflow-hidden rounded-3xl bg-brand-500/40 shadow-pop ring-4 ring-white/10">
        {secondImg ? (
          <img src={secondImg} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent-400 to-accent-600 text-white/80">
            <LuBuilding2 className="size-16" />
          </div>
        )}
      </div>
      {/* front card */}
      <div className="absolute start-0 bottom-4 w-[78%] -rotate-3 overflow-hidden rounded-3xl bg-white shadow-pop">
        <div className="aspect-[4/3] bg-slate-100">
          {mainImg ? (
            <img src={mainImg} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-100 to-warm-200 text-brand-400">
              <LuHouse className="size-16" />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="truncate text-sm font-bold text-slate-900">{main?.title ?? t('home.hero.sampleTitle')}</p>
          <p className="mt-0.5 text-xs text-slate-500">{main?.city ?? t('home.hero.sampleCity')}</p>
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute -start-4 top-10 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lift animate-fade-up">
        <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <LuShieldCheck className="size-4.5" />
        </span>
        <span className="text-xs font-bold text-slate-800">{t('home.hero.chipVerified')}</span>
      </div>
      {user && price && (
        <div
          className="absolute -end-2 bottom-24 rounded-2xl bg-white px-4 py-2.5 shadow-lift animate-fade-up"
          style={{ animationDelay: '150ms' }}
        >
          <p className="text-[11px] font-semibold text-slate-400">{t('property.priceFrom')}</p>
          <p className="text-lg font-extrabold text-accent-600">{formatPrice(price.min)}</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [featured, setFeatured] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [audience, setAudience] = useState<'students' | 'landlords'>('students')

  useEffect(() => {
    listingsService
      .list({}, 1, 6)
      .then((res) => {
        const withImages = res.data.items.filter((p) => p.cover_image || (p.images && p.images.length > 0))
        setFeatured(withImages.slice(0, 3))
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false))
  }, [])

  const features = [
    { icon: LuShieldCheck, title: t('home.features.verified.title'), text: t('home.features.verified.text'), tone: 'bg-emerald-50 text-emerald-600' },
    { icon: LuGraduationCap, title: t('home.features.campus.title'), text: t('home.features.campus.text'), tone: 'bg-brand-50 text-brand-600' },
    { icon: LuWallet, title: t('home.features.prices.title'), text: t('home.features.prices.text'), tone: 'bg-accent-50 text-accent-600' },
    { icon: LuMessageCircle, title: t('home.features.contact.title'), text: t('home.features.contact.text'), tone: 'bg-sky-50 text-sky-600' },
  ]

  const steps =
    audience === 'students'
      ? [
          { icon: LuMousePointerClick, title: t('home.how.students.s1.title'), text: t('home.how.students.s1.text') },
          { icon: LuMessageCircle, title: t('home.how.students.s2.title'), text: t('home.how.students.s2.text') },
          { icon: LuKey, title: t('home.how.students.s3.title'), text: t('home.how.students.s3.text') },
        ]
      : [
          { icon: LuBuilding2, title: t('home.how.landlords.s1.title'), text: t('home.how.landlords.s1.text') },
          { icon: LuClipboardCheck, title: t('home.how.landlords.s2.title'), text: t('home.how.landlords.s2.text') },
          { icon: LuUsers, title: t('home.how.landlords.s3.title'), text: t('home.how.landlords.s3.text') },
        ]

  const landlordCta = user?.role === 'LANDLORD' ? '/landlord/add-property' : '/register'

  return (
    <div className="animate-fade-in">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-700">
        {/* decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -end-32 size-[520px] rounded-full bg-accent-500/15 blur-3xl" />
          <div className="absolute -bottom-48 -start-40 size-[520px] rounded-full bg-brand-400/30 blur-3xl" />
          <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden="true">
            <defs>
              <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0v32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:pt-20 lg:pb-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur sm:text-sm">
              <LuBadgeCheck className="size-4 text-accent-300" />
              {t('home.hero.eyebrow')}
            </span>
            <h1 className="mt-5 text-4xl leading-[1.15] font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t('home.hero.titleStart')} <span className="text-accent-400">{t('home.hero.titleHighlight')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">{t('home.hero.subtitle')}</p>

            <div className="mt-8 max-w-2xl">
              <HeroSearch />
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
              {[t('home.hero.trust1'), t('home.hero.trust2'), t('home.hero.trust3')].map((txt) => (
                <li key={txt} className="inline-flex items-center gap-1.5">
                  <LuCircleCheck className="size-4 text-accent-300" />
                  {txt}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <HeroVisual featured={featured} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-line bg-white p-4 shadow-lift sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className="flex gap-4 rounded-2xl p-2 sm:flex-col sm:gap-3">
              <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', tone)}>
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED LISTINGS ────────────────────────────────────────────── */}
      {(loading || featured.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-accent-600">{t('home.featured.eyebrow')}</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('home.featured.title')}</h2>
            </div>
            <Link
              to="/listings"
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              {t('home.featured.viewAll')}
              <LuArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)
              : featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold text-accent-600">{t('home.how.eyebrow')}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('home.how.title')}</h2>
          <div className="mt-6 flex justify-center">
            <Tabs
              value={audience}
              onChange={setAudience}
              items={[
                { value: 'students', label: t('home.how.forStudents'), icon: <LuGraduationCap /> },
                { value: 'landlords', label: t('home.how.forLandlords'), icon: <LuBuilding2 /> },
              ]}
            />
          </div>
        </div>

        <div key={audience} className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className="relative rounded-3xl border border-line bg-white p-6 shadow-soft animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="absolute top-5 end-6 text-5xl font-extrabold text-slate-100">{i + 1}</span>
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
                <Icon className="size-6" />
              </span>
              <h3 className="relative mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          {audience === 'students' ? (
            <LinkButton to="/listings" variant="primary" size="lg" rightIcon={<LuArrowRight className="size-5 rtl:rotate-180" />}>
              {t('home.how.studentsCta')}
            </LinkButton>
          ) : (
            <LinkButton to={landlordCta} variant="accent" size="lg" rightIcon={<LuArrowRight className="size-5 rtl:rotate-180" />}>
              {t('home.how.landlordsCta')}
            </LinkButton>
          )}
        </div>
      </section>

      {/* ── LANDLORD CTA BAND ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent-500 to-accent-700 px-6 py-12 text-white sm:px-12 lg:py-16">
          <div className="pointer-events-none absolute -end-20 -top-20 size-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 end-40 size-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t('home.landlordBand.title')}</h2>
              <p className="mt-3 text-base leading-relaxed text-white/90">{t('home.landlordBand.text')}</p>
            </div>
            <Link
              to={landlordCta}
              className="inline-flex h-13 shrink-0 items-center gap-2 rounded-xl bg-white px-7 text-base font-bold text-accent-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <LuBuilding2 className="size-5" />
              {t('home.landlordBand.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
