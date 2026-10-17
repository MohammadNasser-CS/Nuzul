import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuImagePlus, LuLoaderCircle, LuStar, LuTrash2 } from 'react-icons/lu'
import { imagesService } from '@/services/images'
import { cn } from '@/lib/format'
import { Alert } from '@/components/ui/Feedback'
import type { PropertyImage } from '@/types'

interface Props {
  entityId: string
  entityType: 'PROPERTY' | 'ROOM'
  images: PropertyImage[]
  onUploaded: (image: PropertyImage) => void
  onDeleted: (id: string) => void
  maxImages?: number
}

export function ImageUpload({ entityId, entityType, images, onUploaded, onDeleted, maxImages }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFirstUpload = images.length === 0
  const canUpload = !maxImages || images.length < maxImages

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !canUpload) return
    setError(null)

    const toUpload = Array.from(files).slice(0, maxImages ? maxImages - images.length : files.length)
    setUploading(toUpload.length)

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      if (file.size > 5 * 1024 * 1024) {
        setError(t('imageUpload.fileTooLarge'))
        setUploading((n) => n - 1)
        continue
      }
      try {
        const res = await imagesService.upload({
          entity_id: entityId,
          entity_type: entityType,
          is_primary: entityType === 'PROPERTY' && isFirstUpload && i === 0,
          file,
        })
        onUploaded(res.data)
      } catch {
        setError(t('imageUpload.uploadFailed'))
      }
      setUploading((n) => n - 1)
    }
    setUploading(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await imagesService.delete(id)
      onDeleted(id)
    } catch {
      setError(t('imageUpload.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <img src={img.image_url} alt="" className="size-full object-cover" />
            {img.is_primary && (
              <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-accent-700 shadow-sm">
                <LuStar className="size-3 fill-current" />
                {t('imageUpload.primary')}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              disabled={deletingId === img.id}
              title={t('imageUpload.delete')}
              aria-label={t('imageUpload.delete')}
              className="absolute top-2 end-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-opacity hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              {deletingId === img.id ? <LuLoaderCircle className="size-4 animate-spin" /> : <LuTrash2 className="size-4" />}
            </button>
          </div>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100">
            <LuLoaderCircle className="size-6 animate-spin text-brand-500" />
          </div>
        ))}

        {canUpload && (
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFiles(e.dataTransfer.files)
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition-colors',
              images.length === 0 && uploading === 0 ? 'col-span-2 aspect-[2/1] sm:col-span-4 sm:aspect-[4/1]' : 'aspect-square',
              dragging ? 'border-accent-500 bg-accent-50' : 'border-slate-300 bg-slate-50/50 hover:border-brand-400 hover:bg-brand-50/40',
            )}
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
              <LuImagePlus className="size-5.5" />
            </span>
            <span className="text-sm font-bold text-slate-700">{t('imageUpload.clickOrDrag')}</span>
            {images.length === 0 && <span className="text-xs text-slate-400">{t('imageUpload.hint')}</span>}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {maxImages && (
        <p className="text-xs text-slate-400">{t('imageUpload.counter', { count: images.length, max: maxImages })}</p>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
