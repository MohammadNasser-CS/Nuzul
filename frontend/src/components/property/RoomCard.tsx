import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuCalendarDays, LuImages, LuLock, LuSend } from 'react-icons/lu'
import { useAuthStore } from '@/store/authStore'
import { ROOM_AMENITIES, ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn, formatDate, formatPrice } from '@/lib/format'
import { Badge } from '@/components/ui/Feedback'
import type { Room } from '@/types'
import { ImageGallery } from './ImageGallery'

interface Props {
  room: Room
  onSelect?: (room: Room) => void
  /** Called when the student clicks "Request this room" */
  onContact?: (room: Room) => void
  /** When true, renders a highlight ring (used when deep-linked from admin / dashboard) */
  highlighted?: boolean
}

/** Visual bed availability: filled = free, faded = taken. */
function BedDots({ available, total }: { available: number; total: number }) {
  const shown = Math.min(total, 8)
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} className={cn('h-2 w-4 rounded-full', i < available ? 'bg-emerald-500' : 'bg-slate-200')} />
      ))}
    </div>
  )
}

export function RoomCard({ room, onSelect, onContact, highlighted = false }: Props) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [showGallery, setShowGallery] = useState(false)
  const images = room.images ?? []
  const TypeIcon = ROOM_TYPE_ICONS[room.room_type]
  const activeAmenities = ROOM_AMENITIES.filter((a) => room[a.field])

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-3xl border bg-white transition-all duration-500',
        highlighted ? 'border-accent-400 shadow-lift ring-4 ring-accent-100' : 'border-line shadow-soft',
        !room.is_available && 'opacity-75',
      )}
    >
      {/* Image */}
      {images.length > 0 ? (
        <button
          type="button"
          className="group relative aspect-[16/10] overflow-hidden bg-slate-100"
          onClick={() => setShowGallery(true)}
        >
          <img
            src={images[0].image_url}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {images.length > 1 && (
            <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <LuImages className="size-3.5" />
              {images.length}
            </span>
          )}
        </button>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
          <TypeIcon className="size-10" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Type + availability */}
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <TypeIcon className="size-4" />
            </span>
            {t('property.roomOfType', { type: t(`enums.roomType.${room.room_type}`) })}
          </p>
          <Badge tone={room.is_available ? 'success' : 'neutral'} dot>
            {room.is_available ? t('property.available') : t('property.fullyBooked')}
          </Badge>
        </div>

        {/* Price */}
        <div>
          {user ? (
            <p>
              <span className="text-2xl font-extrabold text-slate-900">{formatPrice(room.price_per_bed)}</span>
              <span className="ms-1 text-sm text-slate-400">{t('property.perBed')}</span>
            </p>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
            >
              <LuLock className="size-4" />
              {t('property.signInToSeePrices')}
            </Link>
          )}
        </div>

        {/* Beds */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {t('property.bedsFree', { available: room.available_beds, total: room.number_of_beds })}
            </p>
            {room.available_from && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                <LuCalendarDays className="size-3.5" />
                {t('property.availableFrom')} {formatDate(room.available_from, i18n.language)}
              </p>
            )}
          </div>
          <BedDots available={room.available_beds} total={room.number_of_beds} />
        </div>

        {/* Amenities */}
        {activeAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeAmenities.map(({ key, icon: Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                <Icon className="size-3.5 text-slate-400" />
                {t(`property.amenities.${key}`)}
              </span>
            ))}
          </div>
        )}

        {room.description && <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{room.description}</p>}

        <div className="mt-auto space-y-2">
          {onSelect && room.is_available && (
            <button
              onClick={() => onSelect(room)}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-accent-600 text-sm font-bold text-white transition-colors hover:bg-accent-700"
            >
              {t('property.selectRoom')}
            </button>
          )}

          {onContact && room.is_available && (
            <button
              onClick={() => onContact(room)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 text-sm font-bold text-white shadow-sm shadow-accent-700/20 transition-colors hover:bg-accent-700"
            >
              <LuSend className="size-4 rtl:-scale-x-100" />
              {t('inquiry.contactButton')}
            </button>
          )}

          {!user && room.is_available && (
            <Link
              to="/login"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t('property.signInToRequest')}
            </Link>
          )}
        </div>
      </div>

      {showGallery && images.length > 0 && (
        <ImageGallery images={images.map((i) => i.image_url)} onClose={() => setShowGallery(false)} />
      )}
    </div>
  )
}
