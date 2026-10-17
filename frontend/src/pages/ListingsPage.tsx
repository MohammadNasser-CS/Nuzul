import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuChevronLeft,
  LuChevronRight,
  LuHouse,
  LuLock,
  LuPlus,
  LuSearchX,
  LuSlidersHorizontal,
  LuTriangleAlert,
  LuX,
} from 'react-icons/lu'
import { listingsService, PAGE_SIZE, propertiesService } from '@/services/properties'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { LandlordPropertyCard } from '@/components/property/LandlordPropertyCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { Chip, Field, Input, Select } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { useAuthStore } from '@/store/authStore'
import { ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn } from '@/lib/format'
import { UNIVERSITY_NAMES } from '@/types'
import type { Property, ListingFilters } from '@/types'

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'STUDIO'] as const
const GENDER_PREFS = ['MALE', 'FEMALE', 'ANY'] as const
const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO'] as const

const FILTER_KEYS = [
  'city',
  'property_type',
  'gender_preference',
  'room_type',
  'min_price',
  'max_price',
  'nearby_university',
  'group_name',
] as const
type FilterKey = (typeof FILTER_KEYS)[number]

// ─── URL <-> filters ───────────────────────────────────────────────────────────
function parseFilters(sp: URLSearchParams): ListingFilters {
  const f: Record<string, string | number> = {}
  for (const key of FILTER_KEYS) {
    const v = sp.get(key)
    if (!v) continue
    f[key] = key === 'min_price' || key === 'max_price' ? Number(v) : v
  }
  return f as ListingFilters
}

function toSearchParams(filters: ListingFilters, page: number): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of FILTER_KEYS) {
    const v = filters[key]
    if (v !== undefined && v !== null && v !== '') out[key] = String(v)
  }
  if (page > 1) out.page = String(page)
  return out
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== 'ellipsis') pages.push('ellipsis')
  }

  const navBtn =
    'flex size-10 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="pagination">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className={navBtn} aria-label={t('pagination.prev')}>
        <LuChevronLeft className="size-4 rtl:rotate-180" />
      </button>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="flex size-10 items-center justify-center text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'size-10 rounded-full text-sm font-bold transition-colors',
              p === page ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={navBtn}
        aria-label={t('pagination.next')}
      >
        <LuChevronRight className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  )
}

// ─── Filters sheet ─────────────────────────────────────────────────────────────
// Mounted only while open, so the draft always starts from the applied filters
function FiltersSheet({
  initial,
  onClose,
  onApply,
}: {
  initial: ListingFilters
  onClose: () => void
  onApply: (f: ListingFilters) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<ListingFilters>(initial)

  function set<K extends keyof ListingFilters>(key: K, value: ListingFilters[K] | '') {
    setDraft((d) => ({ ...d, [key]: value === '' || value === undefined ? undefined : value }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('listings.filters.title')}
      icon={<LuSlidersHorizontal />}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft({})}>
            {t('listings.filters.reset')}
          </Button>
          <Button variant="primary" className="ms-auto" onClick={() => onApply(draft)}>
            {t('listings.filters.apply')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Room type */}
        <div>
          <p className="mb-2.5 text-sm font-bold text-slate-800">{t('listings.filters.roomType')}</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!draft.room_type} onClick={() => set('room_type', undefined)}>
              {t('listings.filters.allRoomTypes')}
            </Chip>
            {ROOM_TYPES.map((v) => {
              const Icon = ROOM_TYPE_ICONS[v]
              return (
                <Chip key={v} active={draft.room_type === v} onClick={() => set('room_type', v)} icon={<Icon />}>
                  {t(`enums.roomType.${v}`)}
                </Chip>
              )
            })}
          </div>
        </div>

        {/* Gender */}
        <div>
          <p className="mb-2.5 text-sm font-bold text-slate-800">{t('listings.filters.gender')}</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!draft.gender_preference} onClick={() => set('gender_preference', undefined)}>
              {t('listings.filters.allGenders')}
            </Chip>
            {GENDER_PREFS.map((v) => (
              <Chip key={v} active={draft.gender_preference === v} onClick={() => set('gender_preference', v)}>
                {t(`enums.genderPref.${v}`)}
              </Chip>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="mb-2.5 text-sm font-bold text-slate-800">{t('listings.filters.priceRange')}</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              icon={<span className="text-sm font-bold">₪</span>}
              value={draft.min_price ?? ''}
              onChange={(e) => set('min_price', e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('listings.filters.minPrice')}
            />
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              icon={<span className="text-sm font-bold">₪</span>}
              value={draft.max_price ?? ''}
              onChange={(e) => set('max_price', e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('listings.filters.maxPrice')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('listings.filters.type')}>
            <Select
              value={draft.property_type ?? ''}
              onChange={(e) => set('property_type', e.target.value as ListingFilters['property_type'])}
            >
              <option value="">{t('listings.filters.allTypes')}</option>
              {PROPERTY_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`enums.propertyType.${v}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('listings.filters.university')}>
            <Select
              value={draft.nearby_university ?? ''}
              onChange={(e) => set('nearby_university', e.target.value as ListingFilters['nearby_university'])}
            >
              <option value="">{t('listings.filters.allUniversities')}</option>
              {UNIVERSITY_NAMES.map((u) => (
                <option key={u} value={u}>
                  {t(`enums.university.${u}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('listings.filters.city')}>
            <Input
              value={draft.city ?? ''}
              onChange={(e) => set('city', e.target.value)}
              placeholder={t('listings.filters.cityPlaceholder')}
            />
          </Field>

          <Field label={t('listings.filters.groupName')}>
            <Input
              value={draft.group_name ?? ''}
              onChange={(e) => set('group_name', e.target.value)}
              placeholder={t('listings.filters.groupNamePlaceholder')}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const isLandlord = user?.role === 'LANDLORD'
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters & page live in the URL → shareable links and working back button
  const paramsKey = searchParams.toString()
  const filters = useMemo(() => parseFilters(new URLSearchParams(paramsKey)), [paramsKey])
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  // "My Listings" mode (landlord only)
  const [myListingsMode, setMyListingsMode] = useState(false)
  const [myProperties, setMyProperties] = useState<Property[]>([])
  const [myLoading, setMyLoading] = useState(false)

  // Server-side data
  const [items, setItems] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  function applyFilters(next: ListingFilters, nextPage = 1) {
    setSearchParams(toSearchParams(next, nextPage))
  }

  function patchFilter(key: FilterKey, value: ListingFilters[FilterKey] | undefined) {
    applyFilters({ ...filters, [key]: value })
  }

  function resetFilters() {
    setSearchParams({})
  }

  function handlePageChange(p: number) {
    applyFilters(filters, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── fetch public listings ────────────────────────────────────────────────────
  useEffect(() => {
    if (myListingsMode) return
    setLoading(true)
    setError(null)
    listingsService
      .list(filters, page, PAGE_SIZE)
      .then((res) => {
        const data = res.data
        const withImages = data.items.filter((p) => p.cover_image || (p.images && p.images.length > 0))
        setItems(withImages)
        setTotal(data.total)
        setTotalPages(data.pages)
      })
      .catch(() => setError(t('listings.error')))
      .finally(() => setLoading(false))
  }, [filters, page, t, myListingsMode, reloadKey])

  // ── fetch landlord's own properties ─────────────────────────────────────────
  useEffect(() => {
    if (!myListingsMode) return
    setMyLoading(true)
    propertiesService
      .myProperties()
      .then((res) => setMyProperties(res.data))
      .catch(() => {})
      .finally(() => setMyLoading(false))
  }, [myListingsMode])

  // ── active filter pills ─────────────────────────────────────────────────────
  const activeFilters: { key: FilterKey; label: string }[] = []
  if (filters.city) activeFilters.push({ key: 'city', label: filters.city })
  if (filters.property_type) activeFilters.push({ key: 'property_type', label: t(`enums.propertyType.${filters.property_type}`) })
  if (filters.gender_preference) activeFilters.push({ key: 'gender_preference', label: t(`enums.genderPref.${filters.gender_preference}`) })
  if (filters.room_type) activeFilters.push({ key: 'room_type', label: t(`enums.roomType.${filters.room_type}`) })
  if (filters.min_price) activeFilters.push({ key: 'min_price', label: `${t('listings.filters.minPrice')}: ₪${filters.min_price}` })
  if (filters.max_price) activeFilters.push({ key: 'max_price', label: `${t('listings.filters.maxPrice')}: ₪${filters.max_price}` })
  if (filters.nearby_university) activeFilters.push({ key: 'nearby_university', label: t(`enums.university.${filters.nearby_university}`) })
  if (filters.group_name) activeFilters.push({ key: 'group_name', label: filters.group_name })

  const advancedCount = activeFilters.filter((f) => f.key !== 'room_type').length

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Header band */}
      <section className="border-b border-line bg-gradient-to-b from-white to-canvas">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8 lg:pt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
                {myListingsMode ? t('listings.myListings') : t('listings.title')}
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {myListingsMode
                  ? myLoading
                    ? t('common.loading')
                    : t('listings.count', { count: myProperties.length })
                  : loading
                    ? t('listings.searching')
                    : error
                      ? ' '
                      : t('listings.count', { count: total })}
              </p>
            </div>

            {isLandlord && (
              <Tabs
                value={myListingsMode ? 'mine' : 'all'}
                onChange={(v) => setMyListingsMode(v === 'mine')}
                items={[
                  { value: 'all', label: t('listings.allListings') },
                  { value: 'mine', label: t('listings.myListings') },
                ]}
              />
            )}
          </div>

          {/* Quick filters */}
          {!myListingsMode && (
            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setShowFilters(true)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors',
                  advancedCount > 0
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                )}
              >
                <LuSlidersHorizontal className="size-4" />
                {t('listings.filters.title')}
                {advancedCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                    {advancedCount}
                  </span>
                )}
              </button>
              <span className="h-6 w-px shrink-0 bg-line" />
              <Chip active={!filters.room_type} onClick={() => patchFilter('room_type', undefined)}>
                {t('listings.filters.allRoomTypes')}
              </Chip>
              {ROOM_TYPES.map((v) => {
                const Icon = ROOM_TYPE_ICONS[v]
                return (
                  <Chip
                    key={v}
                    active={filters.room_type === v}
                    onClick={() => patchFilter('room_type', filters.room_type === v ? undefined : v)}
                    icon={<Icon />}
                  >
                    {t(`enums.roomType.${v}`)}
                  </Chip>
                )
              })}
            </div>
          )}

          {/* Active filter pills */}
          {!myListingsMode && activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-600/10 py-1 ps-3 pe-1 text-xs font-bold text-brand-700"
                >
                  {f.label}
                  <button
                    onClick={() => patchFilter(f.key, undefined)}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-brand-600/15"
                    aria-label={t('listings.filters.remove')}
                  >
                    <LuX className="size-3" />
                  </button>
                </span>
              ))}
              <button onClick={resetFilters} className="text-xs font-bold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline">
                {t('listings.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Guest nudge */}
        {!user && !myListingsMode && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-accent-100 bg-accent-50/70 p-4 sm:flex-row sm:items-center">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-soft">
              <LuLock className="size-5" />
            </span>
            <p className="flex-1 text-sm text-slate-700">
              <span className="font-bold text-slate-900">{t('listings.guestTitle')}</span> {t('listings.guestText')}
            </p>
            <LinkButton to="/register" variant="accent" size="sm">
              {t('nav.getStarted')}
            </LinkButton>
          </div>
        )}

        {myListingsMode ? (
          myLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : myProperties.length === 0 ? (
            <EmptyState
              icon={<LuHouse />}
              title={t('listings.myListingsEmpty')}
              description={t('dashboard.noPropertiesHint')}
              action={
                <LinkButton to="/landlord/add-property" variant="accent" leftIcon={<LuPlus className="size-4" />}>
                  {t('dashboard.addFirstProperty')}
                </LinkButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myProperties.map((p) => (
                <LandlordPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )
        ) : loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<LuTriangleAlert />}
            title={error}
            action={
              <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<LuSearchX />}
            title={t('listings.noListings')}
            description={t('listings.noListingsHint')}
            action={
              activeFilters.length > 0 && (
                <Button variant="outline" onClick={resetFilters}>
                  {t('listings.clearFilters')}
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} />
          </>
        )}
      </div>

      {showFilters && (
        <FiltersSheet
          initial={filters}
          onClose={() => setShowFilters(false)}
          onApply={(f) => {
            applyFilters(f)
            setShowFilters(false)
          }}
        />
      )}
    </div>
  )
}
