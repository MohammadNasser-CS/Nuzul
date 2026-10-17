import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuBedDouble, LuGraduationCap, LuHouse, LuImages, LuLock, LuMapPin, LuShieldCheck } from 'react-icons/lu'
import { useAuthStore } from '@/store/authStore'
import { coverImageOf, formatPrice, getPriceRange } from '@/lib/format'
import { Skeleton } from '@/components/ui/Feedback'
import type { Property } from '@/types'

interface Props {
  property: Property
}

export function GenderPill({ value, className = '' }: { value: Property['gender_preference']; className?: string }) {
  const { t } = useTranslation()
  const styles = {
    MALE: 'bg-sky-50 text-sky-700',
    FEMALE: 'bg-pink-50 text-pink-700',
    ANY: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${styles[value]} ${className}`}>
      {t(`enums.genderPref.${value}`)}
    </span>
  )
}

export function PropertyCard({ property }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const coverImage = coverImageOf(property)
  const priceRange = getPriceRange(property.rooms)
  const imageCount = property.images?.length ?? 0
  const roomCount = property.rooms?.length ?? 0

  return (
    <Link
      to={`/listings/${property.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={property.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-300">
            <LuHouse className="size-12" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

        <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
          <LuShieldCheck className="size-3.5" />
          {t('property.verified')}
        </span>
        <GenderPill value={property.gender_preference} className="absolute top-3 end-3 shadow-sm" />

        {imageCount > 1 && (
          <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            <LuImages className="size-3.5" />
            {imageCount}
          </span>
        )}
        <span className="absolute bottom-3 start-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-700 backdrop-blur">
          {t(`enums.propertyType.${property.property_type}`)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {property.group_name && (
          <p className="mb-1 truncate text-xs font-bold text-accent-600">{property.group_name}</p>
        )}
        <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-brand-600">{property.title}</h3>

        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p className="flex items-center gap-1.5">
            <LuMapPin className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">{property.city}</span>
          </p>
          {property.nearby_university && (
            <p className="flex items-center gap-1.5">
              <LuGraduationCap className="size-4 shrink-0 text-slate-400" />
              <span className="truncate">
                {t(`enums.university.${property.nearby_university}`, { defaultValue: property.nearby_university })}
              </span>
            </p>
          )}
        </div>

        <div className="flex-1" />
        <div className="mt-4 flex items-end justify-between gap-2 border-t border-line pt-3">
          {priceRange ? (
            user ? (
              <p className="leading-tight">
                <span className="text-xs text-slate-400">{t('property.from')} </span>
                <span className="text-lg font-extrabold text-slate-900">{formatPrice(priceRange.min)}</span>
                <span className="block text-xs text-slate-400">{t('property.perBed')}</span>
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                <LuLock className="size-3.5" />
                {t('property.signInToSeePrices')}
              </p>
            )
          ) : (
            <span />
          )}
          {roomCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500">
              <LuBedDouble className="size-4" />
              {roomCount} {roomCount === 1 ? t('property.room') : t('property.rooms')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="border-t border-line pt-3">
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  )
}
