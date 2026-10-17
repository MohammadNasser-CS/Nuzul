import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowLeft,
  LuBedDouble,
  LuBuilding2,
  LuCheck,
  LuDoorOpen,
  LuGraduationCap,
  LuGrid2X2,
  LuHouse,
  LuLayers,
  LuLock,
  LuMapPin,
  LuShieldCheck,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import { listingsService } from '@/services/properties'
import { ImageGallery } from '@/components/property/ImageGallery'
import { RoomCard } from '@/components/property/RoomCard'
import { StaticMapView } from '@/components/map/MapPicker'
import { InquiryModal } from '@/components/inquiry/InquiryModal'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { useAuth } from '@/hooks/useAuth'
import { PROPERTY_AMENITIES, PROPERTY_TYPE_ICONS } from '@/lib/amenities'
import { cn, formatPrice } from '@/lib/format'
import type { Property, Room } from '@/types'

// ─── Photo mosaic ──────────────────────────────────────────────────────────────
function PhotoMosaic({ images, title, onOpen }: { images: string[]; title: string; onOpen: (i: number) => void }) {
  const { t } = useTranslation()

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/7] items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-warm-100 text-slate-300">
        <LuHouse className="size-16" />
      </div>
    )
  }

  const tile = 'relative overflow-hidden bg-slate-100 group cursor-pointer'
  const img = 'size-full object-cover transition-transform duration-500 group-hover:scale-105'
  const showAllBtn = images.length > 1 && (
    <button
      onClick={() => onOpen(0)}
      className="absolute bottom-4 end-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lift backdrop-blur transition-colors hover:bg-white"
    >
      <LuGrid2X2 className="size-4" />
      {t('property.showAllPhotos', { count: images.length })}
    </button>
  )

  // Mobile: single swipe-less hero with counter
  const mobile = (
    <div className={cn(tile, 'aspect-[4/3] rounded-3xl sm:hidden')} onClick={() => onOpen(0)}>
      <img src={images[0]} alt={title} className={img} />
      {images.length > 1 && (
        <span className="absolute bottom-3 end-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
          1 / {images.length}
        </span>
      )}
    </div>
  )

  let desktop
  if (images.length === 1) {
    desktop = (
      <div className={cn(tile, 'h-[440px] rounded-3xl')} onClick={() => onOpen(0)}>
        <img src={images[0]} alt={title} className={img} />
      </div>
    )
  } else if (images.length === 2) {
    desktop = (
      <div className="relative grid h-[440px] grid-cols-2 gap-2 overflow-hidden rounded-3xl">
        {images.slice(0, 2).map((src, i) => (
          <div key={i} className={tile} onClick={() => onOpen(i)}>
            <img src={src} alt={i === 0 ? title : ''} className={img} />
          </div>
        ))}
        {showAllBtn}
      </div>
    )
  } else {
    const rest = images.length >= 5 ? images.slice(1, 5) : images.slice(1, 3)
    desktop = (
      <div className="relative grid h-[440px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
        <div className={cn(tile, 'col-span-2 row-span-2')} onClick={() => onOpen(0)}>
          <img src={images[0]} alt={title} className={img} />
        </div>
        {rest.map((src, i) => (
          <div key={i} className={cn(tile, rest.length === 2 && 'col-span-2')} onClick={() => onOpen(i + 1)}>
            <img src={src} alt="" className={img} />
          </div>
        ))}
        {showAllBtn}
      </div>
    )
  }

  return (
    <>
      {mobile}
      <div className="hidden sm:block">{desktop}</div>
    </>
  )
}

function Fact({ icon: Icon, label, value }: { icon: typeof LuHouse; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const highlightRoomId = searchParams.get('room') ?? null
  const { t } = useTranslation()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const [contactRoom, setContactRoom] = useState<Room | null>(null)
  const [expanded, setExpanded] = useState(false)
  const highlightRef = useRef<HTMLDivElement>(null)
  const roomsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    listingsService
      .getById(id)
      .then((res) => setProperty(res.data))
      .catch(() => setError(t('property.notFound')))
      .finally(() => setLoading(false))
  }, [id, t])

  // Scroll to highlighted room once the property (and thus rooms) have loaded
  useEffect(() => {
    if (!highlightRoomId || !property || !highlightRef.current) return
    const el = highlightRef.current
    const timer = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
    return () => clearTimeout(timer)
  }, [highlightRoomId, property])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="aspect-[4/3] w-full rounded-3xl sm:aspect-auto sm:h-[440px]" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<LuHouse />}
          title={error ?? t('property.notFound')}
          description={t('property.notFoundHint')}
          action={
            <LinkButton to="/listings" variant="primary" leftIcon={<LuArrowLeft className="size-4 rtl:rotate-180" />}>
              {t('property.backToListings')}
            </LinkButton>
          }
        />
      </div>
    )
  }

  const images = property.images?.map((i) => i.image_url) ?? []
  if (property.cover_image && !images.includes(property.cover_image)) images.unshift(property.cover_image)

  const allRooms = property.rooms ?? []
  const availableRooms = allRooms.filter((r) => r.is_available && r.is_active)
  const freeBeds = availableRooms.reduce((sum, r) => sum + r.available_beds, 0)
  const minPrice = availableRooms.length
    ? Math.min(...availableRooms.map((r) => parseFloat(r.price_per_bed)))
    : null
  const isStudent = user?.role === 'STUDENT'
  const TypeIcon = PROPERTY_TYPE_ICONS[property.property_type]
  const longDescription = (property.description?.length ?? 0) > 320

  const scrollToRooms = () => roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const priceBlock = user ? (
    minPrice !== null ? (
      <p>
        <span className="text-xs font-semibold text-slate-500">{t('property.priceFrom')}</span>
        <span className="block text-3xl font-extrabold text-slate-900">{formatPrice(minPrice)}</span>
        <span className="text-sm text-slate-500">{t('property.perBed')}</span>
      </p>
    ) : (
      <p className="text-sm font-semibold text-slate-500">{t('property.noAvailability')}</p>
    )
  ) : (
    <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
      <LuLock className="size-4" />
      {t('property.signInToSeePrices')}
    </p>
  )

  const cta = !user ? (
    <LinkButton to="/login" variant="accent" block size="lg">
      {t('property.signInToRequest')}
    </LinkButton>
  ) : isStudent && availableRooms.length > 0 ? (
    <button
      onClick={scrollToRooms}
      className="flex h-13 w-full items-center justify-center rounded-xl bg-accent-600 text-base font-bold text-white shadow-lg shadow-accent-700/20 transition-colors hover:bg-accent-700"
    >
      {t('property.chooseRoom')}
    </button>
  ) : null

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 animate-fade-in sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        to="/listings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
      >
        <LuArrowLeft className="size-4 rtl:rotate-180" />
        {t('property.backToListings')}
      </Link>

      {/* Title */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <LuShieldCheck className="size-3.5" />
            {t('property.verified')}
          </span>
          {property.group_name && (
            <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">{property.group_name}</span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">{property.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <LuMapPin className="size-4" />
            {property.formatted_address ?? `${property.city}, ${property.country}`}
          </span>
          {property.nearby_university && (
            <span className="inline-flex items-center gap-1.5">
              <LuGraduationCap className="size-4" />
              {t(`enums.university.${property.nearby_university}`, { defaultValue: property.nearby_university })}
            </span>
          )}
        </div>
      </div>

      <PhotoMosaic images={images} title={property.title} onOpen={setGalleryIndex} />

      {galleryIndex !== null && images.length > 0 && (
        <ImageGallery images={images} startIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div className="space-y-10 lg:col-span-2">
          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Fact icon={TypeIcon} label={t('property.facts.type')} value={t(`enums.propertyType.${property.property_type}`)} />
            <Fact icon={LuUsers} label={t('property.facts.for')} value={t(`enums.genderPref.${property.gender_preference}`)} />
            <Fact icon={LuDoorOpen} label={t('property.facts.rooms')} value={String(allRooms.length)} />
            <Fact icon={LuBedDouble} label={t('property.facts.freeBeds')} value={String(freeBeds)} />
          </div>

          {/* Description */}
          {property.description && (
            <section>
              <h2 className="mb-3 text-xl font-extrabold text-slate-900">{t('property.about')}</h2>
              <p
                className={cn(
                  'whitespace-pre-wrap text-[15px] leading-loose text-slate-600',
                  longDescription && !expanded && 'line-clamp-5',
                )}
              >
                {property.description}
              </p>
              {longDescription && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-2 text-sm font-bold text-brand-600 underline underline-offset-4 hover:text-brand-700"
                >
                  {expanded ? t('common.showLess') : t('common.showMore')}
                </button>
              )}
            </section>
          )}

          {/* Amenities */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold text-slate-900">{t('property.amenitiesTitle')}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROPERTY_AMENITIES.map(({ field, key, icon: Icon }) => {
                const on = property[field]
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3.5',
                      on ? 'border-line bg-white' : 'border-dashed border-line bg-transparent',
                    )}
                  >
                    <Icon className={cn('size-5', on ? 'text-brand-600' : 'text-slate-300')} />
                    <span className={cn('flex-1 text-sm font-semibold', on ? 'text-slate-800' : 'text-slate-400 line-through')}>
                      {t(`property.amenities.${key}`)}
                    </span>
                    {on ? <LuCheck className="size-4 text-emerald-500" /> : <LuX className="size-4 text-slate-300" />}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Rooms */}
          <section ref={roomsRef} className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{t('property.roomsTitle')}</h2>
              <p className="text-sm text-slate-500">
                {t('property.roomsSummary', { available: availableRooms.length, total: allRooms.length })}
              </p>
            </div>

            {allRooms.length === 0 ? (
              <EmptyState icon={<LuBedDouble />} title={t('property.noRooms')} />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {allRooms.map((room) => {
                  const isHighlighted = room.id === highlightRoomId
                  return (
                    <div key={room.id} ref={isHighlighted ? highlightRef : null}>
                      <RoomCard room={room} highlighted={isHighlighted} onContact={isStudent ? setContactRoom : undefined} />
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Location */}
          <section>
            <h2 className="mb-4 text-xl font-extrabold text-slate-900">{t('property.location')}</h2>
            <StaticMapView lat={property.latitude} lng={property.longitude} title={property.title} />
            {(property.building_name || property.building_number || property.floor_number !== null) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {property.building_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-slate-600">
                    <LuBuilding2 className="size-4 text-slate-400" />
                    {t('property.buildingName')}: <b className="text-slate-800">{property.building_name}</b>
                  </span>
                )}
                {property.building_number && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-slate-600">
                    #{' '}
                    {t('property.buildingNumber')}: <b className="text-slate-800">{property.building_number}</b>
                  </span>
                )}
                {property.floor_number !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-slate-600">
                    <LuLayers className="size-4 text-slate-400" />
                    {t('property.floor')}: <b className="text-slate-800">{property.floor_number}</b>
                  </span>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-lift">
              {priceBlock}
              <div className="my-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <LuBedDouble className="size-4.5" />
                {t('property.bedsLeft', { count: freeBeds })}
              </div>
              {cta}
              <ol className="mt-6 space-y-3 border-t border-line pt-5">
                {[t('property.how.s1'), t('property.how.s2'), t('property.how.s3')].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-slate-600">
              <LuShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              {t('property.trustNote')}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile booking bar ────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            {user && minPrice !== null ? (
              <p className="leading-tight">
                <span className="text-lg font-extrabold text-slate-900">{formatPrice(minPrice)}</span>
                <span className="ms-1 text-xs text-slate-500">{t('property.perBed')}</span>
              </p>
            ) : !user ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <LuLock className="size-4" />
                {t('property.signInToSeePricesShort')}
              </p>
            ) : null}
            <p className="text-xs text-emerald-600">{t('property.bedsLeft', { count: freeBeds })}</p>
          </div>
          {!user ? (
            <LinkButton to="/login" variant="accent" className="shrink-0">
              {t('nav.signIn')}
            </LinkButton>
          ) : isStudent && availableRooms.length > 0 ? (
            <button
              onClick={scrollToRooms}
              className="h-11 shrink-0 rounded-xl bg-accent-600 px-5 text-sm font-bold text-white hover:bg-accent-700"
            >
              {t('property.chooseRoom')}
            </button>
          ) : null}
        </div>
      </div>

      {/* Inquiry modal — only rendered when a student clicks Request */}
      {contactRoom && (
        <InquiryModal room={contactRoom} propertyTitle={property.title} onClose={() => setContactRoom(null)} />
      )}
    </div>
  )
}
