import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { landlordService } from '@/services/landlord'
import { ImageUpload } from '@/components/property/ImageUpload'
import type { Property, PropertyImage, Room, RoomCreate, RoomUpdate } from '@/types'

// ─── Room form data ────────────────────────────────────────────────────────────
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

const emptyForm: RoomFormData = {
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

function roomToForm(room: Room): RoomFormData {
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

function validateForm(form: RoomFormData, t: (k: string) => string): string | null {
  if (!form.room_type) return t('landlord.rooms.form.selectType')
  const price = parseFloat(form.price_per_bed)
  if (!form.price_per_bed || isNaN(price) || price <= 0)
    return t('addProperty.rooms.form.invalidPrice')
  const beds = parseInt(form.number_of_beds, 10)
  if (isNaN(beds) || beds < 1)
    return t('addProperty.rooms.form.invalidBeds')
  const avail = parseInt(form.available_beds, 10)
  if (isNaN(avail) || avail < 0 || avail > beds)
    return t('addProperty.rooms.form.bedsError')
  return null
}

// ─── Inline room form ──────────────────────────────────────────────────────────
function RoomForm({
  initial,
  propertyId,
  onSaved,
  onCancel,
}: {
  initial?: Room
  propertyId: string
  onSaved: (room: Room) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<RoomFormData>(initial ? roomToForm(initial) : emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (field: keyof RoomFormData, val: string | boolean) =>
    setForm((f) => ({ ...f, [field]: val }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const err = validateForm(form, t)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      if (initial) {
        const payload: RoomUpdate = {
          room_type:            form.room_type as Room['room_type'],
          price_per_bed:        parseFloat(form.price_per_bed),
          number_of_beds:       parseInt(form.number_of_beds, 10),
          available_beds:       parseInt(form.available_beds, 10),
          available_from:       form.available_from || undefined,
          description:          form.description || undefined,
          has_internal_bathroom: form.has_internal_bathroom,
          has_internal_balcony:  form.has_internal_balcony,
          has_ac:               form.has_ac,
          has_office:           form.has_office,
        }
        const res = await landlordService.updateRoom(initial.id, payload)
        onSaved(res.data)
      } else {
        const payload: RoomCreate = {
          property_id:          propertyId,
          room_type:            form.room_type as Room['room_type'],
          price_per_bed:        parseFloat(form.price_per_bed),
          number_of_beds:       parseInt(form.number_of_beds, 10),
          available_beds:       parseInt(form.available_beds, 10),
          available_from:       form.available_from || undefined,
          description:          form.description || undefined,
          has_internal_bathroom: form.has_internal_bathroom,
          has_internal_balcony:  form.has_internal_balcony,
          has_ac:               form.has_ac,
          has_office:           form.has_office,
        }
        const res = await landlordService.createRoom(payload)
        onSaved(res.data)
      }
    } catch {
      setError(t('landlord.rooms.saveError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="border border-brand-200 rounded-xl p-4 bg-brand-50 space-y-4"
    >
      <h4 className="text-sm font-semibold text-gray-800">
        {initial ? t('landlord.rooms.editRoom') : t('landlord.rooms.addRoom')}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Room type */}
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

        {/* Price */}
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

        {/* Total beds */}
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

        {/* Available beds */}
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

        {/* Available from */}
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

      {/* Description */}
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
          {(
            ['has_internal_bathroom', 'has_internal_balcony', 'has_ac', 'has_office'] as const
          ).map((key) => {
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

// ─── Room image section ────────────────────────────────────────────────────────
function RoomImageSection({ room }: { room: Room }) {
  const { t } = useTranslation()
  const [images, setImages] = useState<PropertyImage[]>(room.images ?? [])
  const [open, setOpen]     = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-brand-600 hover:underline"
      >
        {open ? '▲' : '▼'} {t('landlord.rooms.images')} ({images.length})
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

// ─── Room card ─────────────────────────────────────────────────────────────────
function RoomCard({
  room,
  propertyId,
  onUpdated,
  onDeleted,
}: {
  room: Room
  propertyId: string
  onUpdated: (room: Room) => void
  onDeleted: (id: string) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(t('landlord.rooms.confirmDeleteRoom'))) return
    setDeleting(true)
    try {
      await landlordService.deleteRoom(room.id)
      onDeleted(room.id)
    } catch {
      alert(t('landlord.rooms.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <RoomForm
        initial={room}
        propertyId={propertyId}
        onSaved={(updated) => { onUpdated(updated); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {t(`enums.roomType.${room.room_type}`)}
          </span>
          <span className="text-sm font-semibold text-brand-600">
            ₪{Math.round(parseFloat(room.price_per_bed)).toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">{t('property.perBed')}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              room.is_available
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            {room.is_available ? t('property.available') : t('property.unavailable')}
          </span>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {t('landlord.rooms.editRoom')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? '…' : t('landlord.rooms.deleteRoom')}
          </button>
        </div>
      </div>

      {/* Bed counts */}
      <p className="text-xs text-gray-500">
        {room.available_beds}/{room.number_of_beds} {t('property.bedsAvailable')}
        {room.available_from && (
          <span className="ms-2 text-gray-400">
            · {t('property.availableFrom')} {new Date(room.available_from).toLocaleDateString()}
          </span>
        )}
      </p>

      {/* Description */}
      {room.description && (
        <p className="text-xs text-gray-400 italic">{room.description}</p>
      )}

      {/* Amenities pills */}
      <div className="flex flex-wrap gap-1 pt-1">
        {room.has_internal_bathroom && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            🚿 {t('property.amenities.bathroom')}
          </span>
        )}
        {room.has_internal_balcony && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            🏞 {t('property.amenities.balcony')}
          </span>
        )}
        {room.has_ac && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            ❄️ {t('property.amenities.ac')}
          </span>
        )}
        {room.has_office && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            📚 {t('property.amenities.office')}
          </span>
        )}
      </div>

      {/* Images toggle */}
      <RoomImageSection room={room} />
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ManageRoomsPage() {
  const { id: propertyId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const bk = i18n.dir() === 'rtl' ? '→' : '←'
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms]       = useState<Room[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    Promise.all([
      landlordService.myProperties(),
      landlordService.getRooms(propertyId),
    ])
      .then(([propRes, roomsRes]) => {
        const found = propRes.data.find((p) => p.id === propertyId) ?? null
        setProperty(found)
        setRooms(roomsRes.data)
      })
      .catch(() => setError(t('landlord.rooms.loadError')))
      .finally(() => setLoading(false))
  }, [propertyId, t])

  if (!propertyId) return null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <Link
        to="/dashboard"
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
      >
        {bk} {t('landlord.rooms.backToProperties')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('landlord.rooms.title')}</h1>
          {property && (
            <p className="text-sm text-gray-500 mt-0.5">
              {property.title}
              <span className="text-gray-300 mx-1">·</span>
              {property.city}
            </p>
          )}
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            + {t('landlord.rooms.addRoom')}
          </button>
        )}
      </div>

      {/* APPROVED→PENDING notice */}
      {property?.verification_status === 'APPROVED' && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          ⚠️ {t('landlord.rooms.approvedNotice')}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <div className="space-y-4">
          {/* Add-room form */}
          {showAdd && (
            <RoomForm
              propertyId={propertyId}
              onSaved={(room) => {
                setRooms((r) => [room, ...r])
                setShowAdd(false)
              }}
              onCancel={() => setShowAdd(false)}
            />
          )}

          {/* Room list */}
          {rooms.length === 0 && !showAdd ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-4xl mb-3">🛏</p>
              <p className="text-gray-500 text-sm mb-3">{t('landlord.rooms.noRooms')}</p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-brand-600 hover:underline text-sm font-medium"
              >
                + {t('landlord.rooms.addRoom')}
              </button>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                propertyId={propertyId}
                onUpdated={(updated) =>
                  setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                }
                onDeleted={(id) =>
                  setRooms((prev) => prev.filter((r) => r.id !== id))
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
