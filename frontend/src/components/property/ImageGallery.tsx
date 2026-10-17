import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu'
import { cn } from '@/lib/format'

interface Props {
  images: string[]
  onClose: () => void
  startIndex?: number
}

/** Full-screen lightbox with keyboard, thumbnail and swipe navigation. */
export function ImageGallery({ images, onClose, startIndex = 0 }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const [current, setCurrent] = useState(startIndex)
  const touchX = useRef<number | null>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') (isRTL ? next : prev)()
      if (e.key === 'ArrowRight') (isRTL ? prev : next)()
    }
    window.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next, isRTL])

  // Keep the active thumbnail in view
  useEffect(() => {
    const el = thumbsRef.current?.children[current] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [current])

  if (!images.length) return null

  const arrowBtn =
    'absolute top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25'

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <span className="text-sm font-semibold tabular-nums text-white/80">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/25"
        >
          <LuX className="size-5" />
        </button>
      </div>

      {/* Main image */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) {
            const forward = isRTL ? dx > 0 : dx < 0
            ;(forward ? next : prev)()
          }
          touchX.current = null
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <img
          key={current}
          src={images[current]}
          alt=""
          className="max-h-full max-w-full rounded-xl object-contain animate-scale-in select-none"
        />
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label={t('gallery.prev')} className={cn(arrowBtn, 'start-4 hidden sm:flex')}>
              <LuChevronLeft className="size-6 rtl:rotate-180" />
            </button>
            <button onClick={next} aria-label={t('gallery.next')} className={cn(arrowBtn, 'end-4 hidden sm:flex')}>
              <LuChevronRight className="size-6 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div ref={thumbsRef} className="flex justify-start gap-2 overflow-x-auto px-4 py-4 scrollbar-none sm:justify-center">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                i === current ? 'ring-white' : 'opacity-50 ring-transparent hover:opacity-90',
              )}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
