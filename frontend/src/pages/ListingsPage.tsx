import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listingsService, PAGE_SIZE, propertiesService } from '@/services/properties'
import { PropertyCard } from '@/components/property/PropertyCard'
import { PublicBanner } from '@/components/ui/HeroBanner'
import { useAuthStore } from '@/store/authStore'
import { UNIVERSITY_NAMES } from '@/types'
import type { Property, ListingFilters } from '@/types'

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'STUDIO'] as const
const GENDER_PREFS = ['MALE', 'FEMALE', 'ANY'] as const
const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO'] as const

// ─── Pagination bar ───────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('pagination.prev')}
      >
        {isRTL ? '›' : '‹'}
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
              p === page
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('pagination.next')}
      >
        {isRTL ? '‹' : '›'}
      </button>
    </div>
  )
}

// ─── Landlord "My Listings" card ──────────────────────────────────────────────
function MyListingCard({ property }: { property: Property }) {
  const { t } = useTranslation()
  const coverImg = property.cover_image ?? property.images?.[0]?.image_url
  const statusStyles = {
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className="group rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {coverImg ? (
          <img
            src={coverImg}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
        )}
        {/* Status badge overlay */}
        <span className={`absolute top-2 inset-e-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[property.verification_status]}`}>
          {t(`enums.propertyStatus.${property.verification_status}`)}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{property.title}</h3>
        <p className="text-xs text-gray-500">📍 {property.city}</p>
        <p className="text-xs text-gray-400">
          {property.rooms?.length ?? 0} {t('property.rooms')} · {t(`enums.propertyType.${property.property_type}`)}
        </p>
        {property.rejection_reason && (
          <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1 line-clamp-2">
            {t('dashboard.rejectionReason')}: {property.rejection_reason}
          </p>
        )}
        {property.revision_note && property.verification_status === 'PENDING' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 line-clamp-2">
            📝 {property.revision_note}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Link
            to={`/landlord/properties/${property.id}/rooms`}
            className="flex-1 text-center text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {t('dashboard.manage')}
          </Link>
          {property.verification_status === 'APPROVED' && (
            <Link
              to={`/listings/${property.id}`}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              {t('dashboard.view')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const isLandlord = user?.role === 'LANDLORD'

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

  // Filters
  const [filters, setFilters] = useState<ListingFilters>({})
  const [draft, setDraft] = useState<ListingFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  // ── helpers ─────────────────────────────────────────────────────────────────
  function setDraftField<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) {
    setDraft((d) => ({ ...d, [key]: value || undefined }))
  }

  function applyFilters() {
    setFilters(draft)
    setPage(1)
    setShowFilters(false)
  }

  function resetFilters() {
    setDraft({})
    setFilters({})
    setPage(1)
  }

  function handlePageChange(p: number) {
    setPage(p)
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
        const withImages = data.items.filter(
          (p) => p.cover_image || (p.images && p.images.length > 0)
        )
        setItems(withImages)
        setTotal(data.total)
        setTotalPages(data.pages)
      })
      .catch(() => setError(t('listings.error')))
      .finally(() => setLoading(false))
  }, [filters, page, t, myListingsMode])

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

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Public banner — only for unauthenticated visitors */}
      {!user && <PublicBanner />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {myListingsMode ? t('listings.myListings') : t('listings.title')}
          </h1>
          {!loading && !myListingsMode && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total} {t('listings.results')}
              {totalPages > 1 && (
                <span className="ms-2 text-gray-400">
                  · {t('pagination.pageOf', { page, total: totalPages })}
                </span>
              )}
            </p>
          )}
          {myListingsMode && !myLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {myProperties.length} {t('listings.results')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Landlord mode toggle */}
          {isLandlord && (
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMyListingsMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !myListingsMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('listings.allListings')}
              </button>
              <button
                onClick={() => setMyListingsMode(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  myListingsMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('listings.myListings')}
              </button>
            </div>
          )}

          {/* Filters button — only in public mode */}
          {!myListingsMode && (
            <button
              onClick={() => {
                setDraft(filters)
                setShowFilters((s) => !s)
              }}
              className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
            >
              <span>⚙</span>
              {t('listings.filters.title')}
              {activeFilterCount > 0 && (
                <span className="bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && !myListingsMode && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.city')}
              </label>
              <input
                type="text"
                value={draft.city ?? ''}
                onChange={(e) => setDraftField('city', e.target.value)}
                placeholder={t('listings.filters.cityPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            {/* Property type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.type')}
              </label>
              <select
                value={draft.property_type ?? ''}
                onChange={(e) => setDraftField('property_type', e.target.value as typeof draft.property_type)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">{t('listings.filters.allTypes')}</option>
                {PROPERTY_TYPES.map((v) => (
                  <option key={v} value={v}>{t(`enums.propertyType.${v}`)}</option>
                ))}
              </select>
            </div>

            {/* Gender preference */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.gender')}
              </label>
              <select
                value={draft.gender_preference ?? ''}
                onChange={(e) => setDraftField('gender_preference', e.target.value as typeof draft.gender_preference)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">{t('listings.filters.allGenders')}</option>
                {GENDER_PREFS.map((v) => (
                  <option key={v} value={v}>{t(`enums.genderPref.${v}`)}</option>
                ))}
              </select>
            </div>

            {/* Room type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.roomType')}
              </label>
              <select
                value={draft.room_type ?? ''}
                onChange={(e) => setDraftField('room_type', e.target.value as typeof draft.room_type)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">{t('listings.filters.allRoomTypes')}</option>
                {ROOM_TYPES.map((v) => (
                  <option key={v} value={v}>{t(`enums.roomType.${v}`)}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.minPrice')} (₪)
              </label>
              <input
                type="number"
                min={0}
                value={draft.min_price ?? ''}
                onChange={(e) => setDraftField('min_price', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.maxPrice')} (₪)
              </label>
              <input
                type="number"
                min={0}
                value={draft.max_price ?? ''}
                onChange={(e) => setDraftField('max_price', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="∞"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            {/* University */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.university')}
              </label>
              <select
                value={draft.nearby_university ?? ''}
                onChange={(e) => setDraftField('nearby_university', e.target.value as typeof draft.nearby_university)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">{t('listings.filters.allUniversities')}</option>
                {UNIVERSITY_NAMES.map((u) => (
                  <option key={u} value={u}>{t(`enums.university.${u}`)}</option>
                ))}
              </select>
            </div>

            {/* Housing brand */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('listings.filters.groupName')}
              </label>
              <input
                type="text"
                value={draft.group_name ?? ''}
                onChange={(e) => setDraftField('group_name', e.target.value)}
                placeholder={t('listings.filters.groupNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {t('listings.filters.reset')}
            </button>
            <button
              onClick={applyFilters}
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              {t('listings.filters.apply')}
            </button>
          </div>
        </div>
      )}

      {/* ── MY LISTINGS MODE ─────────────────────────────────────────────────── */}
      {myListingsMode ? (
        myLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : myProperties.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🏠</p>
            <p className="text-lg font-medium text-gray-500">{t('listings.myListingsEmpty')}</p>
            <Link
              to="/landlord/add-property"
              className="mt-3 inline-block text-sm text-brand-600 hover:underline font-medium"
            >
              {t('dashboard.addFirstProperty')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myProperties.map((p) => (
              <MyListingCard key={p.id} property={p} />
            ))}
          </div>
        )
      ) : (
        /* ── PUBLIC LISTINGS MODE ──────────────────────────────────────────── */
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-4xl mb-3">⚠</p>
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🏠</p>
            <p className="text-lg font-medium text-gray-500">{t('listings.noListings')}</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="mt-3 text-sm text-brand-600 hover:underline">
                {t('listings.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} />
          </>
        )
      )}
    </div>
  )
}
