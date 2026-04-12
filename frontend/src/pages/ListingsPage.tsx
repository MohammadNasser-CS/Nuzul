import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listingsService } from '@/services/properties'
import { PropertyCard } from '@/components/property/PropertyCard'
import type { Property, ListingFilters } from '@/types'

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'STUDIO'] as const
const GENDER_PREFS = ['MALE', 'FEMALE', 'ANY'] as const
const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO'] as const

export default function ListingsPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<ListingFilters>({})
  const [draft, setDraft] = useState<ListingFilters>({})

  function setDraftField<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) {
    setDraft((d) => ({ ...d, [key]: value || undefined }))
  }

  function applyFilters() {
    setFilters(draft)
    setShowFilters(false)
  }

  function resetFilters() {
    setDraft({})
    setFilters({})
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    listingsService
      .list(filters)
      .then((res) => {
        // Rule: don't show properties without an image
        const withImages = res.data.filter(
          (p) => p.cover_image || (p.images && p.images.length > 0)
        )
        setProperties(withImages)
      })
      .catch(() => setError(t('listings.error')))
      .finally(() => setLoading(false))
  }, [filters, t])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('listings.title')}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {properties.length} {t('listings.results')}
            </p>
          )}
        </div>
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
      </div>

      {/* Filter panel */}
      {showFilters && (
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

            {/* Gender */}
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : properties.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}
