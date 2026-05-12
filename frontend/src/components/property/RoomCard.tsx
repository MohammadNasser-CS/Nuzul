import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import type { Room } from '@/types'
import { ImageGallery } from './ImageGallery'

interface Props {
  room: Room
  onSelect?: (room: Room) => void
  /** Called when the student clicks "Contact about this room" */
  onContact?: (room: Room) => void
  /** When true, renders a highlight ring (used when deep-linked from admin) */
  highlighted?: boolean
}

export function RoomCard({ room, onSelect, onContact, highlighted = false }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [showGallery, setShowGallery] = useState(false)
  const price = Math.round(parseFloat(room.price_per_bed))
  const images = room.images ?? []

  const amenities: { key: string; active: boolean }[] = [
    { key: 'bathroom', active: room.has_internal_bathroom },
    { key: 'balcony', active: room.has_internal_balcony },
    { key: 'ac', active: room.has_ac },
    { key: 'office', active: room.has_office },
  ]

  return (
    <div
      className={`rounded-xl overflow-hidden bg-white border transition-all duration-500 ${
        highlighted
          ? 'border-brand-400 ring-2 ring-brand-300 ring-offset-2 shadow-lg shadow-brand-100'
          : 'border-gray-200'
      }`}
    >
      {/* Room image strip */}
      {images.length > 0 && (
        <div
          className="h-36 overflow-hidden cursor-pointer relative"
          onClick={() => setShowGallery(true)}
        >
          <img
            src={images[0].image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <span className="absolute bottom-2 inset-e-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              +{images.length - 1}
            </span>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Type + availability */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {t(`enums.roomType.${room.room_type}`)}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${room.is_available
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-500'
              }`}
          >
            {room.is_available ? t('property.available') : t('property.unavailable')}
          </span>
        </div>

        {/* Price & beds */}
        <div className="flex items-end justify-between">
          <div>
            {user ? (
              <>
                <span className="text-xl font-bold text-brand-600">₪{price.toLocaleString()}</span>
                <span className="text-gray-400 text-xs ms-1">{t('property.perBed')}</span>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span>🔒</span>
                <span className="text-xs underline underline-offset-2">{t('property.signInToSeePrices')}</span>
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {room.available_beds}/{room.number_of_beds}{' '}
            {t('property.bedsAvailable')}
          </p>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5">
          {amenities
            .filter((a) => a.active)
            .map((a) => (
              <span
                key={a.key}
                className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
              >
                {t(`property.amenities.${a.key}`)}
              </span>
            ))}
        </div>

        {/* Available from */}
        {room.available_from && (
          <p className="text-xs text-gray-400">
            {t('property.availableFrom')}: {room.available_from}
          </p>
        )}

        {/* Description */}
        {room.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{room.description}</p>
        )}

        {onSelect && room.is_available && (
          <button
            onClick={() => onSelect(room)}
            className="w-full mt-1 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {t('property.selectRoom')}
          </button>
        )}

        {onContact && room.is_available && (
          <button
            onClick={() => onContact(room)}
            className="w-full mt-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>💬</span>
            {t('inquiry.contactButton')}
          </button>
        )}
      </div>

      {showGallery && images.length > 0 && (
        <ImageGallery
          images={images.map((i) => i.image_url)}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  )
}
