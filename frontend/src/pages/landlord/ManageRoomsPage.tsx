import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuArrowUpRight, LuBedDouble, LuCalendarDays, LuImages, LuPencil, LuPlus, LuTrash2, LuTriangleAlert } from 'react-icons/lu'
import { landlordService } from '@/services/landlord'
import { propertiesService } from '@/services/properties'
import { ImageUpload } from '@/components/property/ImageUpload'
import { RoomEditor } from '@/components/property/RoomEditor'
import { Button, LinkButton } from '@/components/ui/Button'
import { Alert, Badge, EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Field, Textarea } from '@/components/ui/Form'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { PropertyStatusBadge } from '@/lib/status'
import { ROOM_AMENITIES, ROOM_TYPE_ICONS } from '@/lib/amenities'
import { formatDate, formatPrice } from '@/lib/format'
import type { Property, PropertyImage, Room } from '@/types'

// ─── Room card ─────────────────────────────────────────────────────────────────
function RoomRow({
  room,
  onEdit,
  onDelete,
  onPhotos,
  disabled,
}: {
  room: Room
  onEdit: () => void
  onDelete: () => void
  onPhotos: () => void
  disabled: boolean
}) {
  const { t, i18n } = useTranslation()
  const Icon = ROOM_TYPE_ICONS[room.room_type]
  const images = room.images ?? []
  const amenities = ROOM_AMENITIES.filter((a) => room[a.field])

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft sm:flex-row">
      {/* Photo */}
      <button
        type="button"
        onClick={onPhotos}
        className="group relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:aspect-square sm:w-36"
      >
        {images[0] ? (
          <img src={images[0].image_url} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1 text-slate-400">
            <Icon className="size-7" />
            <span className="text-xs font-semibold text-amber-600">{t('addProperty.rooms.noPhotos')}</span>
          </span>
        )}
        <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
          <LuImages className="size-3.5" />
          {images.length}/5
        </span>
      </button>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-slate-900">
            {t('property.roomOfType', { type: t(`enums.roomType.${room.room_type}`) })}
          </p>
          <Badge tone={room.is_available ? 'success' : 'neutral'} dot>
            {room.is_available ? t('property.available') : t('property.fullyBooked')}
          </Badge>
        </div>
        <p className="mt-1 text-sm">
          <span className="text-lg font-extrabold text-slate-900">{formatPrice(room.price_per_bed)}</span>
          <span className="ms-1 text-slate-400">{t('property.perBed')}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <LuBedDouble className="size-4" />
            {t('property.bedsFree', { available: room.available_beds, total: room.number_of_beds })}
          </span>
          {room.available_from && (
            <span className="inline-flex items-center gap-1.5">
              <LuCalendarDays className="size-4" />
              {formatDate(room.available_from, i18n.language)}
            </span>
          )}
        </div>
        {amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenities.map(({ key, icon: AIcon }) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                <AIcon className="size-3.5" />
                {t(`property.amenities.${key}`)}
              </span>
            ))}
          </div>
        )}
        {room.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{room.description}</p>}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2 sm:flex-col">
        <Button variant="secondary" size="sm" onClick={onEdit} disabled={disabled} leftIcon={<LuPencil className="size-3.5" />} className="flex-1">
          {t('landlord.rooms.editRoom')}
        </Button>
        <Button variant="outline" size="sm" onClick={onPhotos} disabled={disabled} leftIcon={<LuImages className="size-3.5" />} className="flex-1">
          {t('landlord.rooms.photos')}
        </Button>
        <Button variant="danger-soft" size="sm" onClick={onDelete} disabled={disabled} leftIcon={<LuTrash2 className="size-3.5" />} className="flex-1">
          {t('landlord.rooms.deleteRoom')}
        </Button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ManageRoomsPage() {
  const { id: propertyId } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revisionNote, setRevisionNote] = useState('')
  const [editing, setEditing] = useState<null | '__new__' | string>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [photosRoom, setPhotosRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    Promise.all([landlordService.myProperties(), landlordService.getRooms(propertyId)])
      .then(([propRes, roomsRes]) => {
        setProperty(propRes.data.find((p) => p.id === propertyId) ?? null)
        setRooms(roomsRes.data)
      })
      .catch(() => setError(t('landlord.rooms.loadError')))
      .finally(() => setLoading(false))
  }, [propertyId, t])

  // After any room mutation on an APPROVED property (which the backend resets to PENDING),
  // store the landlord's revision note so the admin can see it during re-review.
  async function afterMutation() {
    if (property?.verification_status !== 'APPROVED') return
    if (propertyId && revisionNote.trim()) {
      try {
        await propertiesService.update(propertyId, { revision_note: revisionNote.trim() })
      } catch {
        // Non-critical — the room change itself succeeded
      }
    }
    setProperty((p) => (p ? { ...p, verification_status: 'PENDING' } : p))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      await landlordService.deleteRoom(deleteTarget.id)
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      await afterMutation()
      setDeleteTarget(null)
    } catch {
      setActionError(t('landlord.rooms.deleteError'))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // Functional updates: ImageUpload may report several uploads from one stale closure
  function updateRoomImages(roomId: string, update: (imgs: PropertyImage[]) => PropertyImage[]) {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, images: update(r.images ?? []) } : r)))
    setPhotosRoom((r) => (r && r.id === roomId ? { ...r, images: update(r.images ?? []) } : r))
  }

  if (!propertyId) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in sm:px-6 lg:py-12">
      <PageHeader
        back={{ to: '/dashboard', label: t('landlord.rooms.backToProperties') }}
        title={t('landlord.rooms.title')}
        subtitle={
          property && (
            <span className="inline-flex flex-wrap items-center gap-2">
              {property.title} · {property.city}
              <PropertyStatusBadge status={property.verification_status} />
            </span>
          )
        }
        actions={
          <>
            {property?.verification_status === 'APPROVED' && (
              <LinkButton to={`/listings/${property.id}`} variant="outline" rightIcon={<LuArrowUpRight className="size-4 rtl:-scale-x-100" />}>
                {t('dashboard.view')}
              </LinkButton>
            )}
            {editing !== '__new__' && (
              <Button variant="accent" onClick={() => setEditing('__new__')} disabled={editing !== null} leftIcon={<LuPlus className="size-4" />}>
                {t('landlord.rooms.addRoom')}
              </Button>
            )}
          </>
        }
      />

      {/* APPROVED → PENDING notice + revision note */}
      {property?.verification_status === 'APPROVED' && (
        <div className="mb-6 space-y-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex gap-3 text-sm text-amber-800">
            <LuTriangleAlert className="mt-0.5 size-5 shrink-0" />
            {t('landlord.rooms.approvedNotice')}
          </div>
          <Field label={t('landlord.rooms.revisionNote')} hint={t('landlord.rooms.revisionNoteHint')}>
            <Textarea
              rows={2}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder={t('landlord.rooms.revisionNotePlaceholder')}
            />
          </Field>
        </div>
      )}

      {actionError && <Alert tone="danger" className="mb-4">{actionError}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="space-y-4">
          {editing === '__new__' && (
            <RoomEditor
              propertyId={propertyId}
              onDetailsSaved={() => void afterMutation()}
              onSaved={(room, images) => {
                setRooms((r) => [{ ...room, images }, ...r])
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          )}

          {rooms.length === 0 && editing !== '__new__' ? (
            <EmptyState
              icon={<LuBedDouble />}
              title={t('landlord.rooms.noRooms')}
              description={t('landlord.rooms.noRoomsHint')}
              action={
                <Button variant="accent" onClick={() => setEditing('__new__')} leftIcon={<LuPlus className="size-4" />}>
                  {t('landlord.rooms.addRoom')}
                </Button>
              }
            />
          ) : (
            rooms.map((room) =>
              editing === room.id ? (
                <RoomEditor
                  key={room.id}
                  propertyId={propertyId}
                  initial={room}
                  initialImages={room.images ?? []}
                  onDetailsSaved={() => void afterMutation()}
                  onSaved={(updated, images) => {
                    setRooms((prev) => prev.map((r) => (r.id === updated.id ? { ...updated, images } : r)))
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <RoomRow
                  key={room.id}
                  room={room}
                  disabled={editing !== null}
                  onEdit={() => setEditing(room.id)}
                  onDelete={() => setDeleteTarget(room)}
                  onPhotos={() => setPhotosRoom(room)}
                />
              ),
            )
          )}
        </div>
      )}

      {/* Photos manager */}
      <Modal
        open={photosRoom !== null}
        onClose={() => setPhotosRoom(null)}
        title={t('landlord.rooms.images')}
        description={photosRoom ? t('property.roomOfType', { type: t(`enums.roomType.${photosRoom.room_type}`) }) : undefined}
        icon={<LuImages />}
        size="lg"
        footer={
          <Button variant="primary" className="ms-auto" onClick={() => setPhotosRoom(null)}>
            {t('inquiry.close')}
          </Button>
        }
      >
        {photosRoom && (
          <ImageUpload
            entityId={photosRoom.id}
            entityType="ROOM"
            images={photosRoom.images ?? []}
            maxImages={5}
            onUploaded={(img) => updateRoomImages(photosRoom.id, (imgs) => [...imgs, img])}
            onDeleted={(id) => updateRoomImages(photosRoom.id, (imgs) => imgs.filter((i) => i.id !== id))}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('landlord.rooms.confirmDeleteTitle')}
        description={t('landlord.rooms.confirmDeleteRoom')}
        confirmLabel={t('landlord.rooms.deleteRoom')}
        cancelLabel={t('addProperty.rooms.form.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        icon={<LuTrash2 className="text-red-500" />}
      />
    </div>
  )
}
