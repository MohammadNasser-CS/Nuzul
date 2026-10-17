import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowLeft,
  LuArrowRight,
  LuBedDouble,
  LuCheck,
  LuDoorOpen,
  LuEye,
  LuImages,
  LuLayoutDashboard,
  LuPencil,
  LuPlus,
  LuSend,
  LuSparkles,
  LuUsers,
} from 'react-icons/lu'
import { propertiesService } from '@/services/properties'
import { landlordService } from '@/services/landlord'
import { MapPicker } from '@/components/map/MapPicker'
import { ImageUpload } from '@/components/property/ImageUpload'
import { RoomEditor } from '@/components/property/RoomEditor'
import { Button, LinkButton } from '@/components/ui/Button'
import { ChoiceCard, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Alert, Badge } from '@/components/ui/Feedback'
import { PROPERTY_AMENITIES, PROPERTY_TYPE_ICONS, ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn, formatPrice } from '@/lib/format'
import type { MapLocation } from '@/components/map/MapPicker'
import { UNIVERSITY_NAMES } from '@/types'
import type { Property, PropertyCreate, PropertyImage, Room, UniversityName } from '@/types'

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current, labels }: { current: number; labels: string[] }) {
  const { t } = useTranslation()
  const pct = ((current + 1) / labels.length) * 100
  return (
    <div className="mb-6">
      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">{labels[current]}</span>
          <span className="font-semibold text-slate-400">
            {t('addProperty.stepOf', { step: current + 1, total: labels.length })}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Desktop: labelled steps */}
      <ol className="hidden items-center sm:flex">
        {labels.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                  i < current && 'bg-brand-600 text-white',
                  i === current && 'bg-accent-500 text-white ring-4 ring-accent-100',
                  i > current && 'bg-white text-slate-400 ring-1 ring-line',
                )}
              >
                {i < current ? <LuCheck className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-semibold whitespace-nowrap md:block',
                  i === current ? 'text-slate-900' : i < current ? 'text-slate-600' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <span className={cn('mx-3 h-0.5 flex-1 rounded-full', i < current ? 'bg-brand-600' : 'bg-slate-200')} />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function StepActions({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">{children}</div>
}

const Fwd = () => <LuArrowRight className="size-4 rtl:rotate-180" />
const Back = () => <LuArrowLeft className="size-4 rtl:rotate-180" />

// ─── Step 1: Property Info ─────────────────────────────────────────────────────
interface InfoData {
  title: string
  property_type: Property['property_type'] | ''
  description: string
  group_name: string
  nearby_university: UniversityName | ''
  gender_preference: Property['gender_preference']
}

function StepInfo({ data, onChange, onNext }: { data: InfoData; onChange: (d: InfoData) => void; onNext: () => void }) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof InfoData>(field: K, value: InfoData[K]) => onChange({ ...data, [field]: value })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!data.property_type) return setError(t('addProperty.info.typeRequired'))
    setError(null)
    onNext()
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Field label={t('addProperty.info.propertyTitle')} required hint={t('addProperty.info.titleHint')}>
        <Input
          required
          maxLength={120}
          value={data.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('addProperty.info.titlePlaceholder')}
        />
      </Field>

      <Field label={t('addProperty.info.type')} required>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(['APARTMENT', 'HOUSE', 'STUDIO'] as const).map((v) => {
            const Icon = PROPERTY_TYPE_ICONS[v]
            return (
              <ChoiceCard
                key={v}
                selected={data.property_type === v}
                onSelect={() => set('property_type', v)}
                icon={<Icon />}
                title={t(`enums.propertyType.${v}`)}
              />
            )
          })}
        </div>
      </Field>

      <Field label={t('addProperty.info.genderPref')}>
        <div className="grid grid-cols-3 gap-2">
          {(['ANY', 'MALE', 'FEMALE'] as const).map((v) => (
            <ChoiceCard
              key={v}
              compact
              selected={data.gender_preference === v}
              onSelect={() => set('gender_preference', v)}
              icon={<LuUsers />}
              title={t(`enums.genderPref.${v}`)}
            />
          ))}
        </div>
      </Field>

      <Field
        label={t('addProperty.info.description')}
        optional
        hint={`${data.description.length}/1000 · ${t('addProperty.info.descriptionHint')}`}
      >
        <Textarea
          rows={4}
          maxLength={1000}
          value={data.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('addProperty.info.descriptionPlaceholder')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('addProperty.info.groupName')} hint={t('addProperty.info.groupNameHint')}>
          <Input
            value={data.group_name}
            onChange={(e) => set('group_name', e.target.value)}
            placeholder={t('addProperty.info.groupNamePlaceholder')}
          />
        </Field>
        <Field label={t('addProperty.info.nearbyUniversity')}>
          <Select value={data.nearby_university} onChange={(e) => set('nearby_university', e.target.value as UniversityName | '')}>
            <option value="">{t('addProperty.info.noUniversity')}</option>
            {UNIVERSITY_NAMES.map((u) => (
              <option key={u} value={u}>
                {t(`enums.university.${u}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <StepActions>
        <span />
        <Button type="submit" variant="primary" rightIcon={<Fwd />}>
          {t('addProperty.next')}
        </Button>
      </StepActions>
    </form>
  )
}

// ─── Step 2: Location ──────────────────────────────────────────────────────────
function StepLocation({
  infoData,
  onBack,
  onCreated,
}: {
  infoData: InfoData
  onBack: () => void
  onCreated: (property: Property) => void
}) {
  const { t } = useTranslation()
  const [location, setLocation] = useState<MapLocation | null>(null)
  const [city, setCity] = useState('')
  const [buildingName, setBuildingName] = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [floorNumber, setFloorNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleLocationChange(loc: MapLocation) {
    setLocation(loc)
    if (loc.city) setCity(loc.city)
  }

  async function handleCreate() {
    if (!location) return setError(t('addProperty.location.selectLocation'))
    if (!city.trim()) return setError(t('addProperty.location.enterCity'))
    setError(null)
    setLoading(true)

    const payload: PropertyCreate = {
      title: infoData.title,
      property_type: infoData.property_type as Property['property_type'],
      gender_preference: infoData.gender_preference,
      description: infoData.description || undefined,
      group_name: infoData.group_name || undefined,
      building_name: buildingName || undefined,
      building_number: buildingNumber || undefined,
      floor_number: floorNumber ? (isNaN(parseInt(floorNumber, 10)) ? undefined : parseInt(floorNumber, 10)) : undefined,
      city: city.trim(),
      latitude: location.lat,
      longitude: location.lng,
      google_place_id: location.placeId,
      formatted_address: location.address,
      nearby_university: infoData.nearby_university || undefined,
      // Amenities are set in the next step
      has_gas: false,
      has_electricity: false,
      has_water: false,
      has_internet: false,
    }

    try {
      const res = await propertiesService.create(payload)
      onCreated(res.data)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail ?? t('addProperty.location.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Field label={t('addProperty.location.map')} required>
        <MapPicker value={location} onChange={handleLocationChange} />
      </Field>

      {location && (
        <div className="space-y-5 animate-fade-up">
          <Field label={t('addProperty.location.city')} required hint={t('addProperty.location.cityDetected')}>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('addProperty.location.cityPlaceholder')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('addProperty.info.buildingName')}>
              <Input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder={t('addProperty.location.buildingNamePlaceholder')}
              />
            </Field>
            <Field label={t('addProperty.info.buildingNumber')}>
              <Input value={buildingNumber} onChange={(e) => setBuildingNumber(e.target.value)} />
            </Field>
            <Field label={t('addProperty.info.floorNumber')}>
              <Input type="number" inputMode="numeric" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      <Alert tone="info">{t('addProperty.location.createNote')}</Alert>

      <StepActions>
        <Button variant="ghost" onClick={onBack} leftIcon={<Back />}>
          {t('addProperty.back')}
        </Button>
        <Button variant="primary" onClick={handleCreate} loading={loading} rightIcon={<Fwd />}>
          {loading ? t('addProperty.location.creating') : t('addProperty.location.create')}
        </Button>
      </StepActions>
    </div>
  )
}

// ─── Step 3: Amenities ─────────────────────────────────────────────────────────
interface AmenitiesData {
  has_gas: boolean
  has_electricity: boolean
  has_water: boolean
  has_internet: boolean
}

function StepAmenities({
  property,
  data,
  onChange,
  onNext,
}: {
  property: Property
  data: AmenitiesData
  onChange: (d: AmenitiesData) => void
  onNext: (updated: Property) => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setLoading(true)
    try {
      const res = await landlordService.updateProperty(property.id, data)
      onNext(res.data)
    } catch {
      setError(t('addProperty.amenities.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {PROPERTY_AMENITIES.map(({ field, key, icon: Icon }) => (
          <ChoiceCard
            key={field}
            multi
            selected={data[field]}
            onSelect={() => onChange({ ...data, [field]: !data[field] })}
            icon={<Icon />}
            title={t(`property.amenities.${key}`)}
            description={t(`addProperty.amenities.desc.${key}`)}
          />
        ))}
      </div>

      {error && <Alert tone="danger" className="mt-5">{error}</Alert>}

      <StepActions>
        <span />
        <Button variant="primary" onClick={handleSave} loading={loading} rightIcon={<Fwd />}>
          {loading ? t('addProperty.amenities.saving') : t('addProperty.next')}
        </Button>
      </StepActions>
    </div>
  )
}

// ─── Step 4: Images ────────────────────────────────────────────────────────────
function StepImages({
  property,
  images,
  onImagesChange,
  onNext,
}: {
  property: Property
  images: PropertyImage[]
  onImagesChange: (update: (prev: PropertyImage[]) => PropertyImage[]) => void
  onNext: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <ImageUpload
        entityId={property.id}
        entityType="PROPERTY"
        images={images}
        onUploaded={(img) => onImagesChange((prev) => [...prev, img])}
        onDeleted={(id) => onImagesChange((prev) => prev.filter((i) => i.id !== id))}
      />

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <LuSparkles className="size-4 text-accent-500" />
          {t('addProperty.images.tipsTitle')}
        </p>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>• {t('addProperty.images.tip1')}</li>
          <li>• {t('addProperty.images.tip2')}</li>
          <li>• {t('addProperty.images.tip3')}</li>
        </ul>
      </div>

      {images.length === 0 && <Alert tone="warning">{t('addProperty.images.requiredForApproval')}</Alert>}

      <StepActions>
        <span />
        <Button variant="primary" onClick={onNext} rightIcon={<Fwd />}>
          {t('addProperty.images.continue')}
        </Button>
      </StepActions>
    </div>
  )
}

// ─── Step 5: Rooms ─────────────────────────────────────────────────────────────
// activeForm: null = nothing open, '__new__' = add-new form, room.id = edit that room
type RoomFormMode = null | '__new__' | string

function StepRooms({
  property,
  rooms,
  onRoomsChange,
  onFinish,
}: {
  property: Property
  rooms: Room[]
  onRoomsChange: (rooms: Room[]) => void
  onFinish: () => void
}) {
  const { t } = useTranslation()
  const [roomImages, setRoomImages] = useState<Record<string, PropertyImage[]>>({})
  const [activeForm, setActiveForm] = useState<RoomFormMode>(rooms.length === 0 ? '__new__' : null)

  function handleSaved(room: Room, images: PropertyImage[]) {
    setRoomImages((prev) => ({ ...prev, [room.id]: images }))
    onRoomsChange(activeForm === '__new__' ? [...rooms, room] : rooms.map((r) => (r.id === room.id ? room : r)))
    setActiveForm(null)
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => {
        if (activeForm === room.id) {
          return (
            <RoomEditor
              key={room.id}
              propertyId={property.id}
              initial={room}
              initialImages={roomImages[room.id] || []}
              onSaved={handleSaved}
              onCancel={() => setActiveForm(null)}
            />
          )
        }
        const Icon = ROOM_TYPE_ICONS[room.room_type]
        const imgs = roomImages[room.id] ?? []
        return (
          <div key={room.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3 shadow-soft">
            {imgs[0] ? (
              <img src={imgs[0].image_url} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Icon className="size-6" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">
                {t('property.roomOfType', { type: t(`enums.roomType.${room.room_type}`) })}
              </p>
              <p className="text-sm text-slate-500">
                <span className="font-bold text-slate-800">{formatPrice(room.price_per_bed)}</span> {t('property.perBed')}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <LuBedDouble className="size-3.5" />
                  {room.number_of_beds} {t('property.beds')}
                </span>
                {imgs.length > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <LuImages className="size-3.5" />
                    {imgs.length}
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600">{t('addProperty.rooms.noPhotos')}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveForm(room.id)}
              disabled={activeForm !== null}
              leftIcon={<LuPencil className="size-3.5" />}
            >
              {t('addProperty.rooms.editRoom')}
            </Button>
          </div>
        )
      })}

      {activeForm === '__new__' ? (
        <RoomEditor
          propertyId={property.id}
          onSaved={handleSaved}
          onCancel={() => setActiveForm(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setActiveForm('__new__')}
          disabled={activeForm !== null}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 disabled:opacity-40"
        >
          <LuPlus className="size-5" />
          {rooms.length === 0 ? t('addProperty.rooms.addFirstRoom') : t('addProperty.rooms.addRoom')}
        </button>
      )}

      {rooms.length === 0 && activeForm === null && (
        <Alert tone="warning">{t('addProperty.rooms.requiredForApproval')}</Alert>
      )}

      <StepActions>
        <span className="text-sm font-semibold text-slate-500">
          {t('addProperty.rooms.countAdded', { count: rooms.length })}
        </span>
        <Button variant="primary" onClick={onFinish} disabled={activeForm !== null} rightIcon={<Fwd />}>
          {t('addProperty.next')}
        </Button>
      </StepActions>
    </div>
  )
}

// ─── Step 6: Review ────────────────────────────────────────────────────────────
function StepReview({
  property,
  amenities,
  images,
  rooms,
  onFinish,
}: {
  property: Property
  amenities: AmenitiesData
  images: PropertyImage[]
  rooms: Room[]
  onFinish: () => void
}) {
  const { t } = useTranslation()
  const cover = images.find((i) => i.is_primary)?.image_url ?? images[0]?.image_url
  const activeAmenities = PROPERTY_AMENITIES.filter((a) => amenities[a.field])

  const checklist = [
    { ok: true, label: t('addProperty.review.check.details') },
    { ok: images.length > 0, label: t('addProperty.review.check.photos', { count: images.length }) },
    { ok: rooms.length > 0, label: t('addProperty.review.check.rooms', { count: rooms.length }) },
  ]

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-line">
        <div className="relative aspect-[21/9] bg-slate-100">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-300">
              <LuImages className="size-10" />
            </div>
          )}
          <Badge tone="warning" dot className="absolute top-3 start-3 shadow-sm">
            {t('enums.propertyStatus.PENDING')}
          </Badge>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{property.title}</h3>
            <p className="text-sm text-slate-500">
              {t(`enums.propertyType.${property.property_type}`)} · {property.city} ·{' '}
              {t(`enums.genderPref.${property.gender_preference}`)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">{t('addProperty.review.amenitiesIncluded')}</p>
            {activeAmenities.length === 0 ? (
              <p className="text-sm text-slate-400">{t('addProperty.review.none')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeAmenities.map(({ key, icon: Icon }) => (
                  <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    <Icon className="size-3.5" />
                    {t(`property.amenities.${key}`)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">{t('addProperty.review.roomsAdded')}</p>
            {rooms.length === 0 ? (
              <p className="text-sm text-slate-400">{t('addProperty.review.noRooms')}</p>
            ) : (
              <div className="divide-y divide-line rounded-2xl border border-line">
                {rooms.map((room) => {
                  const Icon = ROOM_TYPE_ICONS[room.room_type]
                  return (
                    <div key={room.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <Icon className="size-4 text-slate-400" />
                      <span className="flex-1 font-semibold text-slate-700">{t(`enums.roomType.${room.room_type}`)}</span>
                      <span className="text-slate-500">
                        {room.available_beds}/{room.number_of_beds} <LuBedDouble className="inline size-3.5" />
                      </span>
                      <span className="font-bold text-slate-900">{formatPrice(room.price_per_bed)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {checklist.map((c) => (
          <li key={c.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-full',
                c.ok ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600',
              )}
            >
              {c.ok ? <LuCheck className="size-3" strokeWidth={3} /> : '!'}
            </span>
            <span className={c.ok ? 'text-slate-700' : 'font-semibold text-amber-700'}>{c.label}</span>
          </li>
        ))}
      </ul>

      <Alert tone="info">{t('addProperty.review.pendingNote')}</Alert>

      <StepActions>
        <span />
        <Button variant="accent" size="lg" onClick={onFinish} leftIcon={<LuSend className="size-4 rtl:-scale-x-100" />}>
          {t('addProperty.review.finish')}
        </Button>
      </StepActions>
    </div>
  )
}

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ property, onAddAnother }: { property: Property; onAddAnother: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="py-8 text-center">
      <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-scale-in">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-40" />
        <LuCheck className="relative size-10" strokeWidth={3} />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-slate-900">{t('addProperty.success.title')}</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-500">{t('addProperty.success.subtitle')}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <LinkButton to="/dashboard" variant="primary" leftIcon={<LuLayoutDashboard className="size-4" />}>
          {t('addProperty.success.goToDashboard')}
        </LinkButton>
        <LinkButton to={`/landlord/properties/${property.id}/rooms`} variant="outline" leftIcon={<LuDoorOpen className="size-4" />}>
          {t('addProperty.success.manageRooms')}
        </LinkButton>
        <Button variant="ghost" onClick={onAddAnother} leftIcon={<LuPlus className="size-4" />}>
          {t('addProperty.success.addAnother')}
        </Button>
      </div>
      <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400">
        <LuEye className="size-3.5" />
        {t('addProperty.success.visibilityNote')}
      </p>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
// Steps: 0 Info · 1 Location · 2 Amenities · 3 Images · 4 Rooms · 5 Review · 6 Success
const TOTAL_STEPS = 6

const defaultInfo: InfoData = {
  title: '',
  property_type: '',
  description: '',
  group_name: '',
  nearby_university: '',
  gender_preference: 'ANY',
}

const defaultAmenities: AmenitiesData = {
  has_gas: false,
  has_electricity: false,
  has_water: false,
  has_internet: false,
}

export default function AddPropertyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [infoData, setInfoData] = useState<InfoData>(defaultInfo)
  const [amenitiesData, setAmenitiesData] = useState<AmenitiesData>(defaultAmenities)
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null)
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([])
  const [addedRooms, setAddedRooms] = useState<Room[]>([])

  const stepKeys = ['info', 'location', 'amenities', 'images', 'rooms', 'review'] as const
  const stepLabels = stepKeys.map((k) => t(`addProperty.steps.${k}`))

  const goTo = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    setStep(0)
    setInfoData(defaultInfo)
    setAmenitiesData(defaultAmenities)
    setCreatedProperty(null)
    setPropertyImages([])
    setAddedRooms([])
    navigate('/landlord/add-property', { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in sm:px-6 lg:py-12">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
      >
        <LuArrowLeft className="size-4 rtl:rotate-180" />
        {t('nav.dashboard')}
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('addProperty.title')}</h1>

      {step < TOTAL_STEPS && <StepBar current={step} labels={stepLabels} />}

      <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-8">
        {step < TOTAL_STEPS && (
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">{stepLabels[step]}</h2>
            <p className="mt-1 text-sm text-slate-500">{t(`addProperty.${stepKeys[step]}.subtitle`)}</p>
          </div>
        )}

        {step === 0 && <StepInfo data={infoData} onChange={setInfoData} onNext={() => goTo(1)} />}

        {step === 1 && (
          <StepLocation
            infoData={infoData}
            onBack={() => goTo(0)}
            onCreated={(p) => {
              setCreatedProperty(p)
              goTo(2)
            }}
          />
        )}

        {step === 2 && createdProperty && (
          <StepAmenities
            property={createdProperty}
            data={amenitiesData}
            onChange={setAmenitiesData}
            onNext={(updated) => {
              setCreatedProperty(updated)
              goTo(3)
            }}
          />
        )}

        {step === 3 && createdProperty && (
          <StepImages
            property={createdProperty}
            images={propertyImages}
            onImagesChange={setPropertyImages}
            onNext={() => goTo(4)}
          />
        )}

        {step === 4 && createdProperty && (
          <StepRooms property={createdProperty} rooms={addedRooms} onRoomsChange={setAddedRooms} onFinish={() => goTo(5)} />
        )}

        {step === 5 && createdProperty && (
          <StepReview
            property={createdProperty}
            amenities={amenitiesData}
            images={propertyImages}
            rooms={addedRooms}
            onFinish={() => goTo(6)}
          />
        )}

        {step === 6 && createdProperty && <SuccessScreen property={createdProperty} onAddAnother={reset} />}
      </div>
    </div>
  )
}
