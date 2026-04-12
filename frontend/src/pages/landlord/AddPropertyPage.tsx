import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { propertiesService } from '@/services/properties'
import { roomsService } from '@/services/rooms'
import { MapPicker } from '@/components/map/MapPicker'
import { ImageUpload } from '@/components/property/ImageUpload'
import type { MapLocation } from '@/components/map/MapPicker'
import type { Property, PropertyCreate, PropertyImage, Room, RoomCreate } from '@/types'

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i < current
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : i === current
                    ? 'bg-white border-brand-600 text-brand-600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === current ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>
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

// ─── Step 1: Property Info ────────────────────────────────────────────────────
interface InfoData {
  title: string
  property_type: Property['property_type'] | ''
  description: string
  building_name: string
  building_number: string
  floor_number: string
  gender_preference: Property['gender_preference']
  has_gas: boolean
  has_electricity: boolean
  has_water: boolean
  has_internet: boolean
}

function StepInfo({ data, onChange, onNext }: {
  data: InfoData
  onChange: (d: InfoData) => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  const set = (field: keyof InfoData, value: string | boolean) =>
    onChange({ ...data, [field]: value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addProperty.info.buildingName')}
          </label>
          <input
            type="text"
            value={data.building_name}
            onChange={(e) => set('building_name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addProperty.info.buildingNumber')}
          </label>
          <input
            type="text"
            value={data.building_number}
            onChange={(e) => set('building_number', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addProperty.info.floorNumber')}
          </label>
          <input
            type="number"
            value={data.floor_number}
            onChange={(e) => set('floor_number', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('addProperty.info.amenities')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['gas', 'electricity', 'water', 'internet'] as const).map((key) => {
            const field = `has_${key}` as keyof InfoData
            return (
              <label
                key={key}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 cursor-pointer transition-colors ${data[field]
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={!!data[field]}
                  onChange={(e) => set(field, e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t(`property.amenities.${key}`)}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.next')} →
        </button>
      </div>
    </form>
  )
}

// ─── Step 2: Location ─────────────────────────────────────────────────────────
function StepLocation({ infoData, onBack, onCreated }: {
  infoData: InfoData
  onBack: () => void
  onCreated: (property: Property) => void
}) {
  const { t } = useTranslation()
  const [location, setLocation] = useState<MapLocation | null>(null)
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sync city from map geocoding
  function handleLocationChange(loc: MapLocation) {
    setLocation(loc)
    if (loc.city) setCity(loc.city)
  }

  async function handleCreate() {
    if (!location) {
      setError(t('addProperty.location.selectLocation'))
      return
    }
    if (!city.trim()) {
      setError(t('addProperty.location.enterCity'))
      return
    }
    setError(null)
    setLoading(true)

    const payload: PropertyCreate = {
      title: infoData.title,
      property_type: infoData.property_type as Property['property_type'],
      gender_preference: infoData.gender_preference,
      description: infoData.description || undefined,
      building_name: infoData.building_name || undefined,
      building_number: infoData.building_number || undefined,
      floor_number: infoData.floor_number ? (isNaN(parseInt(infoData.floor_number, 10)) ? undefined : parseInt(infoData.floor_number, 10)) : undefined,
      city: city.trim(),
      latitude: location.lat,
      longitude: location.lng,
      google_place_id: location.placeId,
      formatted_address: location.address,
      has_gas: infoData.has_gas,
      has_electricity: infoData.has_electricity,
      has_water: infoData.has_water,
      has_internet: infoData.has_internet,
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('addProperty.location.map')}
        </label>
        <MapPicker value={location} onChange={handleLocationChange} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          ← {t('addProperty.back')}
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? t('addProperty.location.creating') : `${t('addProperty.location.create')} →`}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Images ───────────────────────────────────────────────────────────
function StepImages({ property, onNext }: { property: Property; onNext: () => void }) {
  const { t } = useTranslation()
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
          {t('addProperty.images.continue')} →
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Rooms ────────────────────────────────────────────────────────────
interface RoomFormData {
  room_type: Room['room_type'] | ''
  price_per_bed: string
  number_of_beds: string
  available_beds: string
  available_from: string
  description: string
  has_internal_bathroom: boolean
  has_internal_balcony: boolean
  has_ac: boolean
  has_office: boolean
}

const emptyRoomForm: RoomFormData = {
  room_type: '',
  price_per_bed: '',
  number_of_beds: '1',
  available_beds: '1',
  available_from: '',
  description: '',
  has_internal_bathroom: false,
  has_internal_balcony: false,
  has_ac: false,
  has_office: false,
}

function RoomFormInline({ propertyId, onSaved, onCancel }: {
  propertyId: string
  onSaved: (room: Room) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<RoomFormData>(emptyRoomForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof RoomFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const beds = parseInt(form.number_of_beds, 10)
    const available = parseInt(form.available_beds, 10)
    if (!form.price_per_bed || isNaN(parseFloat(form.price_per_bed)) || parseFloat(form.price_per_bed) <= 0) {
      setError(t('addProperty.rooms.form.invalidPrice'))
      return
    }
    if (isNaN(beds) || beds < 1) {
      setError(t('addProperty.rooms.form.invalidBeds'))
      return
    }
    if (isNaN(available) || available < 0 || available > beds) {
      setError(t('addProperty.rooms.form.bedsError'))
      return
    }
    setLoading(true)
    const payload: RoomCreate = {
      property_id: propertyId,
      room_type: form.room_type as Room['room_type'],
      price_per_bed: parseFloat(form.price_per_bed),
      number_of_beds: beds,
      available_beds: available,
      available_from: form.available_from || undefined,
      description: form.description || undefined,
      has_internal_bathroom: form.has_internal_bathroom,
      has_internal_balcony: form.has_internal_balcony,
      has_ac: form.has_ac,
      has_office: form.has_office,
    }
    try {
      const res = await roomsService.create(payload)
      onSaved(res.data)
    } catch {
      setError(t('addProperty.rooms.form.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="border border-brand-200 rounded-xl p-4 bg-brand-50 space-y-4">
      <h4 className="text-sm font-semibold text-gray-800">{t('addProperty.rooms.form.title')}</h4>

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

      {/* Room amenities */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {t('addProperty.rooms.form.amenities')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['has_internal_bathroom', 'has_internal_balcony', 'has_ac', 'has_office'] as const).map((key) => {
            const labelKey = key.replace('has_internal_', '').replace('has_', '')
            return (
              <label
                key={key}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition-colors text-xs ${form[key] ? 'border-brand-500 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
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
          })}
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

function RoomImageSection({ room }: { room: Room }) {
  const { t } = useTranslation()
  const [images, setImages] = useState<PropertyImage[]>([])
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-brand-600 hover:underline"
      >
        {open ? '▲' : '▼'} {t('addProperty.rooms.addImages')} ({images.length})
      </button>
      {open && (
        <div className="mt-2">
          <ImageUpload
            entityId={room.id}
            entityType="ROOM"
            images={images}
            maxImages={5}
            onUploaded={(img) => setImages((p) => [...p, img])}
            onDeleted={(id) => setImages((p) => p.filter((i) => i.id !== id))}
          />
        </div>
      )}
    </div>
  )
}

function StepRooms({ property, onFinish }: { property: Property; onFinish: () => void }) {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState<Room[]>([])
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('addProperty.rooms.subtitle')}</p>

      {rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {t(`enums.roomType.${room.room_type}`)}
                  </span>
                  <span className="text-sm font-semibold text-brand-600 ms-3">
                    ₪{Math.round(parseFloat(room.price_per_bed)).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 ms-1">{t('property.perBed')}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {room.number_of_beds} {t('property.beds')}
                </span>
              </div>
              <RoomImageSection room={room} />
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <RoomFormInline
          propertyId={property.id}
          onSaved={(room) => {
            setRooms((r) => [...r, room])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 text-gray-500 hover:text-brand-600 rounded-xl py-4 text-sm font-medium transition-colors"
        >
          + {t('addProperty.rooms.addRoom')}
        </button>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onFinish}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {t('addProperty.rooms.finish')} →
        </button>
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────
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
const defaultInfo: InfoData = {
  title: '',
  property_type: '',
  description: '',
  building_name: '',
  building_number: '',
  floor_number: '',
  gender_preference: 'ANY',
  has_gas: false,
  has_electricity: false,
  has_water: false,
  has_internet: false,
}

export default function AddPropertyPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [infoData, setInfoData] = useState<InfoData>(defaultInfo)
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null)

  const stepLabels = [
    t('addProperty.steps.info'),
    t('addProperty.steps.location'),
    t('addProperty.steps.images'),
    t('addProperty.steps.rooms'),
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          ← {t('nav.dashboard')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addProperty.title')}</h1>
      </div>

      {step < 4 && <StepBar current={step} total={4} labels={stepLabels} />}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {step < 4 && (
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-800">{stepLabels[step]}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t(`addProperty.${['info', 'location', 'images', 'rooms'][step]}.subtitle`)}
            </p>
          </div>
        )}

        {step === 0 && (
          <StepInfo
            data={infoData}
            onChange={setInfoData}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepLocation
            infoData={infoData}
            onBack={() => setStep(0)}
            onCreated={(p) => { setCreatedProperty(p); setStep(2) }}
          />
        )}

        {step === 2 && createdProperty && (
          <StepImages property={createdProperty} onNext={() => setStep(3)} />
        )}

        {step === 3 && createdProperty && (
          <StepRooms property={createdProperty} onFinish={() => setStep(4)} />
        )}

        {step === 4 && createdProperty && (
          <SuccessScreen property={createdProperty} />
        )}
      </div>
    </div>
  )
}
