import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

export interface MapLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  placeId?: string
}

interface Props {
  value?: MapLocation | null
  onChange: (location: MapLocation) => void
  readonly?: boolean
}

// Default center: Nablus, Palestine (where An-Najah is located)
const DEFAULT_CENTER = { lat: 32.2211, lng: 35.2544 }
const DEFAULT_ZOOM = 14

function extractCity(components: { types: string[]; long_name: string }[]): string {
  for (const c of components) {
    if (c.types.includes('locality')) return c.long_name
    if (c.types.includes('administrative_area_level_1')) return c.long_name
  }
  return ''
}

export function MapPicker({ value, onChange, readonly = false }: Props) {
  const { t } = useTranslation()
  const { isLoaded, error, hasApiKey } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const google = window.google
    const center = value ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: value ? 16 : DEFAULT_ZOOM,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapInstanceRef.current = map

    // Place initial marker if value exists
    if (value) {
      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: !readonly,
      })
      markerRef.current = marker

      if (!readonly) {
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) reverseGeocode(pos.lat(), pos.lng())
        })
      }
    }

    if (!readonly) {
      // Click on map → set pin
      map.addListener('click', (e: { latLng: { lat(): number; lng(): number } }) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()

        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng)
        } else {
          const marker = new google.maps.Marker({
            position: e.latLng,
            map,
            draggable: true,
          })
          markerRef.current = marker
          marker.addListener('dragend', () => {
            const pos = marker.getPosition()
            if (pos) reverseGeocode(pos.lat(), pos.lng())
          })
        }
        reverseGeocode(lat, lng)
      })

      // Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'ps' },
          fields: ['geometry', 'formatted_address', 'address_components', 'place_id'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry?.location) return

          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          map.setCenter({ lat, lng })
          map.setZoom(16)

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
          } else {
            const marker = new google.maps.Marker({ position: { lat, lng }, map, draggable: true })
            markerRef.current = marker
            marker.addListener('dragend', () => {
              const pos = marker.getPosition()
              if (pos) reverseGeocode(pos.lat(), pos.lng())
            })
          }

          const city = extractCity(place.address_components ?? [])
          onChange({
            lat,
            lng,
            address: place.formatted_address,
            city,
            placeId: place.place_id,
          })
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, readonly])

  function reverseGeocode(lat: number, lng: number) {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results: { formatted_address?: string; address_components?: { types: string[]; long_name: string }[]; place_id?: string }[] | null, status: string) => {
      const result = status === 'OK' ? results?.[0] : null
      const city = result ? extractCity(result.address_components ?? []) : ''
      onChange({ lat, lng, address: result?.formatted_address, city, placeId: result?.place_id })
    })
  }

  if (!hasApiKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        {t('map.noApiKey')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {t('map.apiError')}: {error}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-80 animate-pulse items-center justify-center rounded-2xl border border-line bg-slate-100">
        <span className="text-sm text-slate-400">{t('map.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!readonly && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder={t('map.searchPlaceholder')}
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      )}
      <div ref={mapRef} className="h-80 overflow-hidden rounded-2xl border border-line" />
      {!readonly && !value && (
        <p className="text-xs text-slate-500">{t('map.clickHint')}</p>
      )}
      {value?.address && (
        <p className="truncate rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">📍 {value.address}</p>
      )}
    </div>
  )
}

// View-only map using OpenStreetMap embed (no API key needed)
export function StaticMapView({ lat, lng, title }: { lat: number; lng: number; title?: string }) {
  const { t } = useTranslation()
  const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="space-y-3">
      <iframe
        title={title ?? 'map'}
        src={src}
        frameBorder={0}
        className="h-72 w-full rounded-3xl border border-line"
        loading="lazy"
      />
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
      >
        📍 {t('map.viewOnGoogleMaps')}
      </a>
    </div>
  )
}
