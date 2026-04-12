import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { imagesService } from '@/services/images'
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFirstUpload = images.length === 0
  const canUpload = !maxImages || images.length < maxImages

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !canUpload) return
    setError(null)
    setUploading(true)

    const toUpload = Array.from(files).slice(0, maxImages ? maxImages - images.length : files.length)

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      if (file.size > 5 * 1024 * 1024) {
        setError(t('imageUpload.fileTooLarge'))
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
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    try {
      await imagesService.delete(id)
      onDeleted(id)
    } catch {
      setError(t('imageUpload.deleteFailed'))
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {canUpload && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <p className="text-sm text-gray-500">{t('imageUpload.uploading')}</p>
          ) : (
            <>
              <p className="text-2xl mb-2">📷</p>
              <p className="text-sm font-medium text-gray-700">{t('imageUpload.clickOrDrag')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('imageUpload.hint')}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden">
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute top-1 inset-s-1 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-full">
                  {t('imageUpload.primary')}
                </span>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                title={t('imageUpload.delete')}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
