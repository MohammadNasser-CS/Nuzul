import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inquiriesService } from '@/services/inquiries'
import { useAuth } from '@/hooks/useAuth'
import type { Room } from '@/types'

interface Props {
  room: Room
  onClose: () => void
}

export function InquiryModal({ room, onClose }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await inquiriesService.create({
        room_id: room.id,
        message: message || undefined,
        move_in_date: moveInDate || undefined,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string }; status?: number } }
      if (e.response?.status === 429) {
        setError(t('inquiry.alreadySent'))
      } else if (e.response?.status === 400) {
        setError(t('inquiry.roomUnavailable'))
      } else {
        setError(t('inquiry.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const price = Math.round(parseFloat(room.price_per_bed))

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t('inquiry.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="text-base font-semibold text-gray-900">
                {t('inquiry.success')}
              </h3>
              <p className="text-sm text-gray-500">{t('inquiry.successText')}</p>
              <button
                onClick={onClose}
                className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {t('inquiry.close')}
              </button>
            </div>
          ) : (
            /* ── Form ──────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room summary */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-lg">
                  🛏
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {t(`enums.roomType.${room.room_type}`)}
                  </p>
                  <p className="text-xs text-brand-600 font-semibold">
                    ₪{price.toLocaleString()}
                    <span className="text-gray-400 font-normal ms-1">
                      {t('property.perBed')}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">{t('inquiry.subtitle')}</p>

              {/* Student contact preview — read-only */}
              {(user?.full_name || user?.phone_number) && (
                <div className="grid grid-cols-2 gap-2">
                  {user.full_name && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">{t('inquiry.yourName')}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user.full_name}</p>
                    </div>
                  )}
                  {user.phone_number && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">{t('inquiry.yourPhone')}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user.phone_number}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Desired move-in date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inquiry.moveInDate')}
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inquiry.message')}
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('inquiry.messagePlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  {t('inquiry.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  {loading ? t('inquiry.submitting') : t('inquiry.submit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
