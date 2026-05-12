import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import type { Property } from '@/types'

interface Props {
  property: Property
}

function getPriceRange(property: Property): { min: number; max: number } | null {
  const prices = (property.rooms ?? []).map((r) => parseFloat(r.price_per_bed))
  if (!prices.length) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function formatPrice(n: number) {
  return `₪${Math.round(n).toLocaleString()}`
}

export function PropertyCard({ property }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const coverImage = property.cover_image ?? property.images?.[0]?.image_url
  const priceRange = getPriceRange(property)

  return (
    <Link
      to={`/listings/${property.id}`}
      className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🏠
          </div>
        )}
        {/* Gender badge */}
        {property.gender_preference !== 'ANY' && (
          <span
            className={`absolute top-3 inset-s-3 text-xs font-medium px-2 py-0.5 rounded-full ${property.gender_preference === 'MALE'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-pink-100 text-pink-700'
              }`}
          >
            {t(`enums.genderPref.${property.gender_preference}`)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-1">
        {/* Badges row: type + group name */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
            {t(`enums.propertyType.${property.property_type}`)}
          </span>
          {property.group_name && (
            <span className="inline-block text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[140px]">
              🏢 {property.group_name}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mt-1">
          {property.title}
        </h3>

        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>📍</span>
          {property.city}
        </p>

        {property.nearby_university && (
          <p className="text-xs text-indigo-600 flex items-center gap-1">
            <span>🎓</span>
            <span className="truncate">{t(`enums.university.${property.nearby_university}`, { defaultValue: property.nearby_university })}</span>
          </p>
        )}

        {priceRange && (
          user ? (
            <p className="text-brand-600 font-bold text-sm pt-1">
              {priceRange.min === priceRange.max
                ? formatPrice(priceRange.min)
                : `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`}
              <span className="text-gray-400 font-normal text-xs ms-1">
                {t('property.perBed')}
              </span>
            </p>
          ) : (
            <p className="text-sm pt-1 flex items-center gap-1 text-gray-400">
              <span>🔒</span>
              <span className="text-xs">{t('property.signInToSeePrices')}</span>
            </p>
          )
        )}

        {property.rooms && (
          <p className="text-xs text-gray-400">
            {property.rooms.length}{' '}
            {property.rooms.length === 1 ? t('property.room') : t('property.rooms')}
          </p>
        )}
      </div>
    </Link>
  )
}
