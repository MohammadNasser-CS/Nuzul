import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCalendarDays, LuCircleCheck, LuPhone, LuSend, LuUser } from 'react-icons/lu'
import { inquiriesService } from '@/services/inquiries'
import { useAuth } from '@/hooks/useAuth'
import { ROOM_TYPE_ICONS } from '@/lib/amenities'
import { formatPrice } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'
import { Button, LinkButton } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Feedback'
import type { Room } from '@/types'

interface Props {
  room: Room
  propertyTitle?: string
  onClose: () => void
}

export function InquiryModal({ room, propertyTitle, onClose }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const TypeIcon = ROOM_TYPE_ICONS[room.room_type]

  const quickMessages = [t('inquiry.quick.available'), t('inquiry.quick.visit'), t('inquiry.quick.bills')]

  async function handleSubmit(e: FormEvent) {
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
      if (e.response?.status === 429) setError(t('inquiry.alreadySent'))
      else if (e.response?.status === 400) setError(t('inquiry.roomUnavailable'))
      else setError(t('inquiry.error'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Modal open onClose={onClose} size="md" hideClose>
        <div className="py-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-scale-in">
            <LuCircleCheck className="size-9" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-slate-900">{t('inquiry.success')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('inquiry.successText')}</p>

          <ol className="mt-6 space-y-3 text-start">
            {[t('inquiry.next.s1'), t('inquiry.next.s2'), t('inquiry.next.s3')].map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('inquiry.close')}
            </Button>
            <LinkButton to="/dashboard" variant="primary">
              {t('inquiry.viewMine')}
            </LinkButton>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('inquiry.title')}
      description={t('inquiry.subtitle')}
      icon={<LuSend className="rtl:-scale-x-100" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('inquiry.cancel')}
          </Button>
          <Button
            type="submit"
            form="inquiry-form"
            variant="accent"
            loading={loading}
            className="flex-[2]"
            leftIcon={<LuSend className="size-4 rtl:-scale-x-100" />}
          >
            {loading ? t('inquiry.submitting') : t('inquiry.submit')}
          </Button>
        </>
      }
    >
      <form id="inquiry-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Room summary */}
        <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
          {room.images?.[0] ? (
            <img src={room.images[0].image_url} alt="" className="size-14 rounded-xl object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <TypeIcon className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {propertyTitle && <p className="truncate text-xs text-slate-500">{propertyTitle}</p>}
            <p className="font-bold text-slate-900">
              {t('property.roomOfType', { type: t(`enums.roomType.${room.room_type}`) })}
            </p>
            <p className="text-sm">
              <span className="font-extrabold text-accent-600">{formatPrice(room.price_per_bed)}</span>
              <span className="ms-1 text-xs text-slate-400">{t('property.perBed')}</span>
            </p>
          </div>
        </div>

        {/* Shared contact details */}
        {(user?.full_name || user?.phone_number) && (
          <div className="rounded-2xl bg-brand-50/60 p-3">
            <p className="mb-2 text-xs font-bold text-brand-700">{t('inquiry.sharedDetails')}</p>
            <div className="flex flex-wrap gap-2">
              {user.full_name && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  <LuUser className="size-3.5 text-slate-400" />
                  {user.full_name}
                </span>
              )}
              {user.phone_number && (
                <span dir="ltr" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  <LuPhone className="size-3.5 text-slate-400" />
                  {user.phone_number}
                </span>
              )}
            </div>
          </div>
        )}

        <Field label={t('inquiry.moveInDate')} optional>
          <Input
            type="date"
            icon={<LuCalendarDays />}
            value={moveInDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setMoveInDate(e.target.value)}
          />
        </Field>

        <Field label={t('inquiry.message')} optional>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickMessages.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setMessage((m) => (m ? `${m}\n${q}` : q))}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                + {q}
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('inquiry.messagePlaceholder')}
          />
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Modal>
  )
}
