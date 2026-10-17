import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCalendarDays, LuCheck, LuCircleCheck, LuMinus, LuPlus } from 'react-icons/lu'
import { landlordService } from '@/services/landlord'
import { ImageUpload } from '@/components/property/ImageUpload'
import { Button } from '@/components/ui/Button'
import { ChoiceCard, Field, Input, Textarea } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'
import { ROOM_AMENITIES, ROOM_TYPE_ICONS } from '@/lib/amenities'
import { cn } from '@/lib/format'
import type { PropertyImage, Room } from '@/types'

// ─── Form model ────────────────────────────────────────────────────────────────
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

function roomToFormData(room: Room): RoomFormData {
  return {
    room_type: room.room_type,
    price_per_bed: String(Math.round(parseFloat(room.price_per_bed))),
    number_of_beds: String(room.number_of_beds),
    available_beds: String(room.available_beds),
    available_from: room.available_from?.slice(0, 10) ?? '',
    description: room.description ?? '',
    has_internal_bathroom: room.has_internal_bathroom,
    has_internal_balcony: room.has_internal_balcony,
    has_ac: room.has_ac,
    has_office: room.has_office,
  }
}

function validate(form: RoomFormData, t: (k: string) => string): string | null {
  if (!form.room_type) return t('addProperty.rooms.form.typeRequired')
  const price = parseFloat(form.price_per_bed)
  if (!form.price_per_bed || isNaN(price) || price <= 0) return t('addProperty.rooms.form.invalidPrice')
  const beds = parseInt(form.number_of_beds, 10)
  if (isNaN(beds) || beds < 1) return t('addProperty.rooms.form.invalidBeds')
  const avail = parseInt(form.available_beds, 10)
  if (isNaN(avail) || avail < 0 || avail > beds) return t('addProperty.rooms.form.bedsError')
  return null
}

// ─── Number stepper ────────────────────────────────────────────────────────────
function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const btn =
    'flex size-11 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40'
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="-">
        <LuMinus className="size-4" />
      </button>
      <span className="w-10 text-center text-lg font-extrabold tabular-nums text-slate-900">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">
        <LuPlus className="size-4" />
      </button>
    </div>
  )
}

// ─── Editor ────────────────────────────────────────────────────────────────────
interface RoomEditorProps {
  propertyId: string
  initial?: Room
  initialImages?: PropertyImage[]
  /** Called once the landlord finishes (after the optional photos phase). */
  onSaved: (room: Room, images: PropertyImage[]) => void
  /** Called as soon as the room details are persisted (before photos). */
  onDetailsSaved?: (room: Room) => void
  onCancel: () => void
}

/**
 * Two-phase room editor: 1) details → saved to the API, 2) photos (optional).
 * Used by both the Add-Property wizard and the Manage-Rooms page.
 */
export function RoomEditor({ propertyId, initial, initialImages = [], onSaved, onDetailsSaved, onCancel }: RoomEditorProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'details' | 'images'>('details')
  const [savedRoom, setSavedRoom] = useState<Room | null>(null)
  const [images, setImages] = useState<PropertyImage[]>(initialImages)
  const [form, setForm] = useState<RoomFormData>(initial ? roomToFormData(initial) : emptyRoomForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof RoomFormData>(field: K, value: RoomFormData[K]) => setForm((f) => ({ ...f, [field]: value }))

  const beds = parseInt(form.number_of_beds, 10) || 1
  const avail = Math.min(parseInt(form.available_beds, 10) || 0, beds)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const err = validate(form, t)
    if (err) return setError(err)
    setError(null)
    setLoading(true)

    const fields = {
      room_type: form.room_type as Room['room_type'],
      price_per_bed: parseFloat(form.price_per_bed),
      number_of_beds: parseInt(form.number_of_beds, 10),
      available_beds: parseInt(form.available_beds, 10),
      available_from: form.available_from || undefined,
      description: form.description || undefined,
      has_internal_bathroom: form.has_internal_bathroom,
      has_internal_balcony: form.has_internal_balcony,
      has_ac: form.has_ac,
      has_office: form.has_office,
    }

    try {
      const res = initial
        ? await landlordService.updateRoom(initial.id, fields)
        : await landlordService.createRoom({ property_id: propertyId, ...fields })
      setSavedRoom(res.data)
      onDetailsSaved?.(res.data)
      setPhase('images')
    } catch {
      setError(t('addProperty.rooms.form.error'))
    } finally {
      setLoading(false)
    }
  }

  // ── Phase 2: photos ─────────────────────────────────────────────────────────
  if (phase === 'images' && savedRoom) {
    return (
      <div className="space-y-5 rounded-3xl border-2 border-emerald-200 bg-white p-5 shadow-soft animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <LuCircleCheck className="size-5.5" />
          </span>
          <div>
            <p className="font-bold text-slate-900">
              {initial ? t('addProperty.rooms.form.roomUpdated') : t('addProperty.rooms.form.roomCreated')}
            </p>
            <p className="text-sm text-slate-500">{t('addProperty.rooms.form.photosHint')}</p>
          </div>
        </div>

        <ImageUpload
          entityId={savedRoom.id}
          entityType="ROOM"
          images={images}
          maxImages={5}
          onUploaded={(img) => setImages((p) => [...p, img])}
          onDeleted={(id) => setImages((p) => p.filter((i) => i.id !== id))}
        />

        <div className="flex justify-end">
          <Button
            variant={images.length > 0 ? 'primary' : 'outline'}
            onClick={() => onSaved(savedRoom, images)}
            leftIcon={images.length > 0 ? <LuCheck className="size-4" /> : undefined}
          >
            {images.length > 0
              ? t('addProperty.rooms.form.doneWithPhotos', { count: images.length })
              : t('addProperty.rooms.form.skipPhotos')}
          </Button>
        </div>
      </div>
    )
  }

  // ── Phase 1: details ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="space-y-6 rounded-3xl border-2 border-brand-200 bg-white p-5 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-extrabold text-slate-900">
          {initial ? t('addProperty.rooms.form.editTitle') : t('addProperty.rooms.form.title')}
        </h4>
        <span className="text-xs font-semibold text-slate-400">{t('addProperty.rooms.form.stepDetails')}</span>
      </div>

      {/* Type */}
      <Field label={t('addProperty.rooms.form.type')} required>
        <div className="grid grid-cols-3 gap-2">
          {(['SINGLE', 'SHARED', 'STUDIO'] as const).map((v) => {
            const Icon = ROOM_TYPE_ICONS[v]
            return (
              <ChoiceCard
                key={v}
                compact
                selected={form.room_type === v}
                onSelect={() => set('room_type', v)}
                icon={<Icon />}
                title={t(`enums.roomType.${v}`)}
              />
            )
          })}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('addProperty.rooms.form.price')} required>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            icon={<span className="text-sm font-bold">₪</span>}
            value={form.price_per_bed}
            onChange={(e) => set('price_per_bed', e.target.value)}
            placeholder={t('addProperty.rooms.form.pricePlaceholder')}
          />
        </Field>
        <Field label={t('addProperty.rooms.form.availableFrom')} optional>
          <Input
            type="date"
            icon={<LuCalendarDays />}
            value={form.available_from}
            onChange={(e) => set('available_from', e.target.value)}
          />
        </Field>
        <Field label={t('addProperty.rooms.form.beds')}>
          <Stepper
            value={beds}
            min={1}
            max={12}
            onChange={(v) => setForm((f) => ({ ...f, number_of_beds: String(v), available_beds: String(Math.min(parseInt(f.available_beds, 10) || 0, v)) }))}
          />
        </Field>
        <Field label={t('addProperty.rooms.form.availableBeds')} hint={t('addProperty.rooms.form.availableBedsHint', { total: beds })}>
          <Stepper value={avail} min={0} max={beds} onChange={(v) => set('available_beds', String(v))} />
        </Field>
      </div>

      {/* Room amenities */}
      <Field label={t('addProperty.rooms.form.amenities')}>
        <div className="flex flex-wrap gap-2">
          {ROOM_AMENITIES.map(({ field, key, icon: Icon }) => {
            const on = form[field]
            return (
              <button
                key={field}
                type="button"
                aria-pressed={on}
                onClick={() => set(field, !on)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-semibold transition-all',
                  on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <Icon className="size-4" />
                {t(`property.amenities.${key}`)}
                {on && <LuCheck className="size-3.5" />}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label={t('addProperty.rooms.form.description')} optional>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('addProperty.rooms.form.descriptionPlaceholder')}
        />
      </Field>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel}>
          {t('addProperty.rooms.form.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {loading ? t('addProperty.rooms.form.saving') : t('addProperty.rooms.form.save')}
        </Button>
      </div>
    </form>
  )
}
