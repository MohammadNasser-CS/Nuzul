import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { propertiesService } from '@/services/properties'
import { landlordService } from '@/services/landlord'
import { MapPicker } from '@/components/map/MapPicker'
import { ImageUpload } from '@/components/property/ImageUpload'
import type { MapLocation } from '@/components/map/MapPicker'
import { UNIVERSITY_NAMES } from '@/types'
import type { Property, PropertyCreate, PropertyImage, Room, UniversityName } from '@/types'

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < current
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : i === current
                  ? 'bg-white border-brand-600 text-brand-600'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs mt-1 hidden sm:block ${
                i === current ? 'text-brand-600 font-medium' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < current ? 'bg-brand-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Property Info ─────────────────────────────────────────────────────
interface InfoData {
  title:              string
  property_type:      Property['property_type'] | ''
  description:        string
  group_name:         string
  nearby_university:  UniversityName | ''
  gender_preference:  Property['gender_preference']
}

function StepInfo({
  data,
  onChange,
  onNext,
}: {
  data: InfoData
  onChange: (d: InfoData) => void
  onNext: () => void
}) {
  const { t, i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  const set = (field: keyof InfoData, value: string) => onChange({ ...data, [field]: value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext() }} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('addProperty.info.propertyTitle')} <span className="text-red-400">*</span>
        </label>
        <input
          required
          type="text"
          value={data.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('addProperty.info.titlePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addProperty.info.type')} <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={data.property_type}
            onChange={(e) => set('property_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="" disabled>{t('addProperty.info.selectType')}</option>
            <option value="APARTMENT">{t('enums.propertyType.APARTMENT')}</option>
            <option value="HOUSE">{t('enums.propertyType.HOUSE')}</option>
            <option value="STUDIO">{t('enums.propertyType.STUDIO')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addProperty.info.genderPref')}
          </label>
          <select
            value={data.gender_preference}
            onChange={(e) => set('gender_preference', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="ANY">{t('enums.genderPref.ANY')}</option>
            <option value="MALE">{t('enums.genderPref.MALE')}</option>
            <option value="FEMALE">{t('enums.genderPref.FEMALE')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('addProperty.info.description')}
        </label>
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('addProperty.info.descriptionPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('addProperty.info.groupName')}
        </label>
        <input
          type="text"
          value={data.group_name}
          onChange={(e) => set('group_name', e.target.value)}
          placeholder={t('addProperty.info.groupNamePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-400 mt-1">{t('addProperty.info.groupNameHint')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('addProperty.info.nearbyUniversity')}
        </label>
        <select
          value={data.nearby_university}
          onChange={(e) => set('nearby_university', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">{t('listings.filters.allUniversities')}</option>
          {UNIVERSITY_NAMES.map((u) => (
            <option key={u} value={u}>{t(`enums.university.${u}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.next')} {fwd}
        </button>
      </div>
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
  const { t, i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  const bk  = i18n.dir() === 'rtl' ? '→' : '←'
  const [location, setLocation]       = useState<MapLocation | null>(null)
  const [city, setCity]               = useState('')
  const [buildingName, setBuildingName]     = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [floorNumber, setFloorNumber]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  function handleLocationChange(loc: MapLocation) {
    setLocation(loc)
    if (loc.city) setCity(loc.city)
  }

  async function handleCreate() {
    if (!location) { setError(t('addProperty.location.selectLocation')); return }
    if (!city.trim()) { setError(t('addProperty.location.enterCity')); return }
    setError(null)
    setLoading(true)

    const payload: PropertyCreate = {
      title:            infoData.title,
      property_type:    infoData.property_type as Property['property_type'],
      gender_preference: infoData.gender_preference,
      description:      infoData.description || undefined,
      group_name:       infoData.group_name || undefined,
      building_name:    buildingName || undefined,
      building_number:  buildingNumber || undefined,
      floor_number:     floorNumber
        ? (isNaN(parseInt(floorNumber, 10)) ? undefined : parseInt(floorNumber, 10))
        : undefined,
      city:                city.trim(),
      latitude:            location.lat,
      longitude:           location.lng,
      google_place_id:     location.placeId,
      formatted_address:   location.address,
      nearby_university:   infoData.nearby_university || undefined,
      // Amenities are set in the next step
      has_gas:         false,
      has_electricity: false,
      has_water:       false,
      has_internet:    false,
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
    <div className="space-y-5">
      {/* Map is the single source of truth for location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('addProperty.location.map')} <span className="text-red-400">*</span>
        </label>
        <MapPicker value={location} onChange={handleLocationChange} />
      </div>

      {/* City + building details — appear only after a pin is set */}
      {location && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addProperty.location.city')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('addProperty.location.cityPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">{t('addProperty.location.cityDetected')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addProperty.info.buildingName')}
              </label>
              <input
                type="text"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder={t('addProperty.location.buildingNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addProperty.info.buildingNumber')}
              </label>
              <input
                type="text"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addProperty.info.floorNumber')}
              </label>
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          {bk} {t('addProperty.back')}
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? t('addProperty.location.creating') : `${t('addProperty.location.create')} ${fwd}`}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Amenities ─────────────────────────────────────────────────────────
interface AmenitiesData {
  has_gas:         boolean
  has_electricity: boolean
  has_water:       boolean
  has_internet:    boolean
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
  const { t, i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (field: keyof AmenitiesData, val: boolean) =>
    onChange({ ...data, [field]: val })

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

  const AMENITY_KEYS: { field: keyof AmenitiesData; label: string; icon: string }[] = [
    { field: 'has_gas',         label: 'gas',         icon: '🔥' },
    { field: 'has_electricity', label: 'electricity',  icon: '⚡' },
    { field: 'has_water',       label: 'water',        icon: '💧' },
    { field: 'has_internet',    label: 'internet',     icon: '🌐' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{t('addProperty.amenities.subtitle')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AMENITY_KEYS.map(({ field, label, icon }) => (
          <label
            key={field}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 cursor-pointer transition-colors ${
              data[field]
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={data[field]}
              onChange={(e) => set(field, e.target.checked)}
              className="sr-only"
            />
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">
              {t(`property.amenities.${label}`)}
            </span>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? t('addProperty.amenities.saving') : `${t('addProperty.next')} ${fwd}`}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Images ────────────────────────────────────────────────────────────
function StepImages({ property, onNext }: { property: Property; onNext: () => void }) {
  const { t, i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  const [images, setImages] = useState<PropertyImage[]>([])

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('addProperty.images.subtitle')}</p>

      <ImageUpload
        entityId={property.id}
        entityType="PROPERTY"
        images={images}
        onUploaded={(img) => setImages((prev) => [...prev, img])}
        onDeleted={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.images.continue')} {fwd}
        </button>
      </div>
    </div>
  )
}

// ─── Step 5: Rooms ─────────────────────────────────────────────────────────────
interface RoomFormData {
  room_type:            Room['room_type'] | ''
  price_per_bed:        string
  number_of_beds:       string
  available_beds:       string
  available_from:       string
  description:          string
  has_internal_bathroom: boolean
  has_internal_balcony:  boolean
  has_ac:               boolean
  has_office:           boolean
}

const emptyRoomForm: RoomFormData = {
  room_type:            '',
  price_per_bed:        '',
  number_of_beds:       '1',
  available_beds:       '1',
  available_from:       '',
  description:          '',
  has_internal_bathroom: false,
  has_internal_balcony:  false,
  has_ac:               false,
  has_office:           false,
}

function roomToFormData(room: Room): RoomFormData {
  return {
    room_type:            room.room_type,
    price_per_bed:        String(Math.round(parseFloat(room.price_per_bed))),
    number_of_beds:       String(room.number_of_beds),
    available_beds:       String(room.available_beds),
    available_from:       room.available_from?.slice(0, 10) ?? '',
    description:          room.description ?? '',
    has_internal_bathroom: room.has_internal_bathroom,
    has_internal_balcony:  room.has_internal_balcony,
    has_ac:               room.has_ac,
    has_office:           room.has_office,
  }
}

function RoomFormInline({
  propertyId,
  initial,
  initialImages = [],
  onSaved,
  onCancel,
}: {
  propertyId: string
  initial?: Room
  initialImages?: PropertyImage[]
  onSaved: (room: Room, images: PropertyImage[]) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [phase, setPhase]     = useState<'details' | 'images'>('details')
  const [savedRoom, setSavedRoom] = useState<Room | null>(null)
  const [images, setImages]   = useState<PropertyImage[]>(initialImages)
  const [form, setForm]       = useState<RoomFormData>(initial ? roomToFormData(initial) : emptyRoomForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (field: keyof RoomFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const beds  = parseInt(form.number_of_beds, 10)
    const avail = parseInt(form.available_beds, 10)
    if (!form.price_per_bed || isNaN(parseFloat(form.price_per_bed)) || parseFloat(form.price_per_bed) <= 0) {
      setError(t('addProperty.rooms.form.invalidPrice')); return
    }
    if (isNaN(beds) || beds < 1) {
      setError(t('addProperty.rooms.form.invalidBeds')); return
    }
    if (isNaN(avail) || avail < 0 || avail > beds) {
      setError(t('addProperty.rooms.form.bedsError')); return
    }
    setLoading(true)

    const roomFields = {
      room_type:            form.room_type as Room['room_type'],
      price_per_bed:        parseFloat(form.price_per_bed),
      number_of_beds:       beds,
      available_beds:       avail,
      available_from:       form.available_from || undefined,
      description:          form.description || undefined,
      has_internal_bathroom: form.has_internal_bathroom,
      has_internal_balcony:  form.has_internal_balcony,
      has_ac:               form.has_ac,
      has_office:           form.has_office,
    }

    try {
      let res
      if (initial) {
        res = await landlordService.updateRoom(initial.id, roomFields)
      } else {
        res = await landlordService.createRoom({ property_id: propertyId, ...roomFields })
      }
      setSavedRoom(res.data)
      setPhase('images')
    } catch {
      setError(t('addProperty.rooms.form.error'))
    } finally {
      setLoading(false)
    }
  }

  // ── Phase 2: image upload ──────────────────────────────────────────────────
  if (phase === 'images' && savedRoom) {
    return (
      <div className="border border-brand-200 rounded-xl p-4 bg-brand-50 space-y-4">
        {/* Success banner */}
        <div className="flex items-center gap-2 pb-3 border-b border-brand-100">
          <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">✓</span>
          <p className="text-sm font-semibold text-gray-800">
            {initial ? t('addProperty.rooms.form.roomUpdated') : t('addProperty.rooms.form.roomCreated')}
          </p>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-0.5">
            {t('addProperty.rooms.form.addPhotos')}
            <span className="text-gray-400 font-normal ms-1">— {t('addProperty.rooms.form.photosOptional')}</span>
          </p>
          <p className="text-xs text-gray-400 mb-3">{t('addProperty.rooms.form.photosHint')}</p>
          <ImageUpload
            entityId={savedRoom.id}
            entityType="ROOM"
            images={images}
            maxImages={5}
            onUploaded={(img) => setImages((p) => [...p, img])}
            onDeleted={(id) => setImages((p) => p.filter((i) => i.id !== id))}
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onSaved(savedRoom, images)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {images.length > 0
              ? `${t('addProperty.rooms.form.done')} (${images.length} ${t('addProperty.rooms.form.photos')})`
              : t('addProperty.rooms.form.skipPhotos')}
          </button>
        </div>
      </div>
    )
  }

  // ── Phase 1: details form ──────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="border border-brand-200 rounded-xl p-4 bg-brand-50 space-y-4">
      <h4 className="text-sm font-semibold text-gray-800">
        {initial ? t('addProperty.rooms.form.editTitle') : t('addProperty.rooms.form.title')}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('addProperty.rooms.form.type')} <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={form.room_type}
            onChange={(e) => set('room_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="" disabled>{t('addProperty.rooms.form.selectType')}</option>
            <option value="SINGLE">{t('enums.roomType.SINGLE')}</option>
            <option value="SHARED">{t('enums.roomType.SHARED')}</option>
            <option value="STUDIO">{t('enums.roomType.STUDIO')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('addProperty.rooms.form.price')} <span className="text-red-400">*</span>
          </label>
          <input
            required
            type="number"
            min={1}
            value={form.price_per_bed}
            onChange={(e) => set('price_per_bed', e.target.value)}
            placeholder={t('addProperty.rooms.form.pricePlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('addProperty.rooms.form.beds')}
          </label>
          <input
            type="number"
            min={1}
            value={form.number_of_beds}
            onChange={(e) => set('number_of_beds', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('addProperty.rooms.form.availableBeds')}
          </label>
          <input
            type="number"
            min={0}
            max={parseInt(form.number_of_beds) || 1}
            value={form.available_beds}
            onChange={(e) => set('available_beds', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('addProperty.rooms.form.availableFrom')}
          </label>
          <input
            type="date"
            value={form.available_from}
            onChange={(e) => set('available_from', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {t('addProperty.rooms.form.description')}
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('addProperty.rooms.form.descriptionPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {t('addProperty.rooms.form.amenities')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['has_internal_bathroom', 'has_internal_balcony', 'has_ac', 'has_office'] as const).map(
            (key) => {
              const labelKey = key.replace('has_internal_', '').replace('has_', '')
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition-colors text-xs ${
                    form[key]
                      ? 'border-brand-500 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-700">
                    {t(`property.amenities.${labelKey}`)}
                  </span>
                </label>
              )
            }
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 transition-colors"
        >
          {t('addProperty.rooms.form.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? t('addProperty.rooms.form.saving') : t('addProperty.rooms.form.save')}
        </button>
      </div>
    </form>
  )
}

// activeForm: null = nothing open, '__new__' = add-new form, room.id = edit that room
type RoomFormMode = null | '__new__' | string

function StepRooms({
  property,
  onRoomsChange,
  onFinish,
}: {
  property: Property
  onRoomsChange: (rooms: Room[]) => void
  onFinish: () => void
}) {
  const { t, i18n } = useTranslation()
  const fwd = i18n.dir() === 'rtl' ? '←' : '→'
  const [rooms, setRooms]           = useState<Room[]>([])
  const [roomImages, setRoomImages] = useState<Record<string, PropertyImage[]>>({})
  const [activeForm, setActiveForm] = useState<RoomFormMode>(null)

  function updateList(next: Room[]) {
    setRooms(next)
    onRoomsChange(next)
  }

  function handleSaved(room: Room, images: PropertyImage[]) {
    setRoomImages((prev) => ({ ...prev, [room.id]: images }))
    if (activeForm === '__new__') {
      updateList([...rooms, room])
    } else {
      updateList(rooms.map((r) => (r.id === room.id ? room : r)))
    }
    setActiveForm(null)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('addProperty.rooms.subtitle')}</p>

      {rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) =>
            activeForm === room.id ? (
              <RoomFormInline
                key={room.id}
                propertyId={property.id}
                initial={room}
                initialImages={roomImages[room.id] || []}
                onSaved={handleSaved}
                onCancel={() => setActiveForm(null)}
              />
            ) : (
              <div key={room.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t(`enums.roomType.${room.room_type}`)}
                    </span>
                    <span className="text-sm font-semibold text-brand-600">
                      ₪{Math.round(parseFloat(room.price_per_bed)).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">{t('property.perBed')}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">
                      {room.number_of_beds} {t('property.beds')}
                    </span>
                    {(roomImages[room.id]?.length ?? 0) > 0 ? (
                      <span className="text-xs text-gray-400">
                        📷 {roomImages[room.id].length}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500">{t('addProperty.rooms.noPhotos')}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveForm(room.id)}
                      disabled={activeForm !== null}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-40 transition-colors"
                    >
                      ✏️ {t('addProperty.rooms.editRoom')}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {activeForm === '__new__' ? (
        <RoomFormInline
          propertyId={property.id}
          onSaved={handleSaved}
          onCancel={() => setActiveForm(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setActiveForm('__new__')}
          disabled={activeForm !== null}
          className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 text-gray-500 hover:text-brand-600 disabled:opacity-40 rounded-xl py-4 text-sm font-medium transition-colors"
        >
          + {t('addProperty.rooms.addRoom')}
        </button>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onFinish}
          disabled={activeForm !== null}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.next')} {fwd}
        </button>
      </div>
    </div>
  )
}

// ─── Step 6: Review ────────────────────────────────────────────────────────────
function StepReview({
  property,
  amenities,
  rooms,
  onFinish,
}: {
  property: Property
  amenities: AmenitiesData
  rooms: Room[]
  onFinish: () => void
}) {
  const { t } = useTranslation()

  const activeAmenities = (
    ['has_gas', 'has_electricity', 'has_water', 'has_internet'] as const
  ).filter((k) => amenities[k])

  const labelMap: Record<keyof AmenitiesData, string> = {
    has_gas:         'gas',
    has_electricity: 'electricity',
    has_water:       'water',
    has_internet:    'internet',
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('addProperty.review.subtitle')}</p>

      {/* Property summary */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">{property.title}</p>
            <p className="text-xs text-gray-500">
              {t(`enums.propertyType.${property.property_type}`)} · {property.city}
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 shrink-0">
            {t('enums.propertyStatus.PENDING')}
          </span>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">{t('addProperty.review.amenitiesIncluded')}</p>
          {activeAmenities.length === 0 ? (
            <p className="text-xs text-gray-400">{t('addProperty.review.none')}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {activeAmenities.map((k) => (
                <span key={k} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  {t(`property.amenities.${labelMap[k]}`)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rooms */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">{t('addProperty.review.roomsAdded')}</p>
          {rooms.length === 0 ? (
            <p className="text-xs text-gray-400">{t('addProperty.review.noRooms')}</p>
          ) : (
            <div className="space-y-1">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <span>🛏</span>
                  <span>{t(`enums.roomType.${room.room_type}`)}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-medium text-brand-600">
                    ₪{Math.round(parseFloat(room.price_per_bed)).toLocaleString()}
                  </span>
                  <span className="text-gray-400">{t('property.perBed')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        ℹ️ {t('addProperty.review.pendingNote')}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onFinish}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.review.finish')} ✓
        </button>
      </div>
    </div>
  )
}

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ property }: { property: Property }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-bold text-gray-900">{t('addProperty.success.title')}</h2>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">{t('addProperty.success.subtitle')}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Link
          to={`/listings/${property.id}`}
          className="border border-brand-600 text-brand-600 hover:bg-brand-50 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {t('addProperty.success.viewProperty')}
        </Link>
        <button
          onClick={() => navigate('/landlord/add-property')}
          className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {t('addProperty.success.addAnother')}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {t('addProperty.success.goToDashboard')}
        </button>
      </div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
// Steps: 0 Info · 1 Location · 2 Amenities · 3 Images · 4 Rooms · 5 Review · 6 Success
const TOTAL_STEPS = 6

const defaultInfo: InfoData = {
  title:             '',
  property_type:     '',
  description:       '',
  group_name:        '',
  nearby_university: '',
  gender_preference: 'ANY',
}

const defaultAmenities: AmenitiesData = {
  has_gas:         false,
  has_electricity: false,
  has_water:       false,
  has_internet:    false,
}

export default function AddPropertyPage() {
  const { t, i18n } = useTranslation()
  const bk = i18n.dir() === 'rtl' ? '→' : '←'
  const [step, setStep]                   = useState(0)
  const [infoData, setInfoData]           = useState<InfoData>(defaultInfo)
  const [amenitiesData, setAmenitiesData] = useState<AmenitiesData>(defaultAmenities)
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null)
  const [addedRooms, setAddedRooms]       = useState<Room[]>([])

  const stepLabels = [
    t('addProperty.steps.info'),
    t('addProperty.steps.location'),
    t('addProperty.steps.amenities'),
    t('addProperty.steps.images'),
    t('addProperty.steps.rooms'),
    t('addProperty.steps.review'),
  ]

  const stepSubtitleKeys = [
    'info', 'location', 'amenities', 'images', 'rooms', 'review',
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          {bk} {t('nav.dashboard')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addProperty.title')}</h1>
      </div>

      {step < TOTAL_STEPS && (
        <StepBar current={step} total={TOTAL_STEPS} labels={stepLabels} />
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {step < TOTAL_STEPS && (
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-800">{stepLabels[step]}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t(`addProperty.${stepSubtitleKeys[step]}.subtitle`)}
            </p>
          </div>
        )}

        {step === 0 && (
          <StepInfo data={infoData} onChange={setInfoData} onNext={() => setStep(1)} />
        )}

        {step === 1 && (
          <StepLocation
            infoData={infoData}
            onBack={() => setStep(0)}
            onCreated={(p) => { setCreatedProperty(p); setStep(2) }}
          />
        )}

        {step === 2 && createdProperty && (
          <StepAmenities
            property={createdProperty}
            data={amenitiesData}
            onChange={setAmenitiesData}
            onNext={(updated) => { setCreatedProperty(updated); setStep(3) }}
          />
        )}

        {step === 3 && createdProperty && (
          <StepImages property={createdProperty} onNext={() => setStep(4)} />
        )}

        {step === 4 && createdProperty && (
          <StepRooms
            property={createdProperty}
            onRoomsChange={setAddedRooms}
            onFinish={() => setStep(5)}
          />
        )}

        {step === 5 && createdProperty && (
          <StepReview
            property={createdProperty}
            amenities={amenitiesData}
            rooms={addedRooms}
            onFinish={() => setStep(6)}
          />
        )}

        {step === 6 && createdProperty && (
          <SuccessScreen property={createdProperty} />
        )}
      </div>
    </div>
  )
}
