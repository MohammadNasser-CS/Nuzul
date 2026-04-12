import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  images: string[]
  onClose?: () => void
  /** If provided, renders inline (no modal overlay) */
  inline?: boolean
}

export function ImageGallery({ images, onClose, inline = false }: Props) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!onClose) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  if (!images.length) return null

  const content = (
    <div className={inline ? 'w-full' : 'relative z-10 max-w-3xl w-full mx-4'}>
      {/* Main image */}
      <div className="relative bg-black rounded-xl overflow-hidden">
        <img
          src={images[current]}
          alt=""
          className={`w-full object-contain ${inline ? 'max-h-72' : 'max-h-[70vh]'}`}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={t('gallery.prev')}
              className="absolute start-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label={t('gallery.next')}
              className="absolute end-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            >
              ›
            </button>
            <span className="absolute bottom-3 start-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {current + 1} / {images.length}
            </span>
          </>
        )}

        {!inline && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 end-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  if (inline) return content

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {content}
    </div>
  )
}
