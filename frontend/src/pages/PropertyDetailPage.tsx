import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listingsService } from '@/services/properties'
import { ImageGallery } from '@/components/property/ImageGallery'
import { RoomCard } from '@/components/property/RoomCard'
import { StaticMapView } from '@/components/map/MapPicker'
import type { Property } from '@/types'

function AmenityBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border ${active
          ? 'bg-brand-50 border-brand-200 text-brand-700'
          : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
        }`}
    >
      {label}
    </span>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    listingsService
      .getById(id)
      .then((res) => setProperty(res.data))
      .catch(() => setError(t('property.notFound')))
      .finally(() => setLoading(false))
  }, [id, t])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-4">
        <div className="h-72 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-5xl mb-4">🏚</p>
        <p className="text-gray-500">{error ?? t('property.notFound')}</p>
        <Link to="/listings" className="mt-4 inline-block text-brand-600 hover:underline text-sm">
          ← {t('listings.title')}
        </Link>
      </div>
    )
  }

  const images = property.images?.map((i) => i.image_url) ?? []
  if (property.cover_image && !images.includes(property.cover_image)) {
    images.unshift(property.cover_image)
  }

  const availableRooms = (property.rooms ?? []).filter((r) => r.is_available && r.is_active)
  const allRooms = property.rooms ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Link to="/listings" className="hover:text-brand-600">{t('listings.title')}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{property.title}</span>
      </nav>

      {/* Image gallery inline */}
      {images.length > 0 ? (
        <div
          className="cursor-pointer rounded-2xl overflow-hidden mb-6"
          onClick={() => setShowGallery(true)}
        >
          <div className="relative">
            <img
              src={images[0]}
              alt={property.title}
              className="w-full h-72 sm:h-96 object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 inset-e-3 flex gap-1.5">
                {images.slice(1, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="w-16 h-12 object-cover rounded-lg border-2 border-white" />
                ))}
                {images.length > 4 && (
                  <div className="w-16 h-12 rounded-lg border-2 border-white bg-black/60 flex items-center justify-center text-white text-xs font-medium">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-300 text-5xl">
          🏠
        </div>
      )}

      {showGallery && images.length > 0 && (
        <ImageGallery
          images={images}
          onClose={() => setShowGallery(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                {t(`enums.propertyType.${property.property_type}`)}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${property.gender_preference === 'ANY'
                    ? 'bg-gray-100 text-gray-600'
                    : property.gender_preference === 'MALE'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-pink-50 text-pink-700'
                  }`}
              >
                {t(`enums.genderPref.${property.gender_preference}`)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <span>📍</span>
              {property.formatted_address ?? `${property.city}, ${property.country}`}
            </p>
          </div>

          {/* Description */}
          {property.description && (
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">{t('property.about')}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </section>
          )}

          {/* Amenities */}
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">{t('property.amenitiesTitle')}</h2>
            <div className="flex flex-wrap gap-2">
              <AmenityBadge active={property.has_gas} label={t('property.amenities.gas')} />
              <AmenityBadge active={property.has_electricity} label={t('property.amenities.electricity')} />
              <AmenityBadge active={property.has_water} label={t('property.amenities.water')} />
              <AmenityBadge active={property.has_internet} label={t('property.amenities.internet')} />
            </div>
          </section>

          {/* Rooms */}
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              {t('property.roomsTitle')}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {availableRooms.length} {t('property.availableRoomsCount')} · {allRooms.length} {t('property.totalRoomsCount')}
            </p>

            {allRooms.length === 0 ? (
              <p className="text-sm text-gray-400">{t('property.noRooms')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-5">
          {/* Price summary card */}
          {availableRooms.length > 0 && (
            <div className="border border-gray-200 rounded-2xl p-5 bg-white sticky top-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                {t('property.priceFrom')}
              </p>
              <p className="text-2xl font-bold text-brand-600">
                ₪{Math.round(Math.min(...availableRooms.map((r) => parseFloat(r.price_per_bed)))).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{t('property.perBed')}</p>
              <p className="text-sm text-gray-500 mt-3">
                {availableRooms.length} {t('property.availableRoomsCount')}
              </p>
            </div>
          )}

          {/* Map */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('property.location')}</h3>
            <StaticMapView lat={property.latitude} lng={property.longitude} title={property.title} />
          </div>

          {/* Building details */}
          {(property.building_name || property.building_number || property.floor_number) && (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm space-y-1">
              {property.building_name && (
                <p className="text-gray-600"><span className="font-medium">{t('property.buildingName')}:</span> {property.building_name}</p>
              )}
              {property.building_number && (
                <p className="text-gray-600"><span className="font-medium">{t('property.buildingNumber')}:</span> {property.building_number}</p>
              )}
              {property.floor_number !== null && (
                <p className="text-gray-600"><span className="font-medium">{t('property.floor')}:</span> {property.floor_number}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
