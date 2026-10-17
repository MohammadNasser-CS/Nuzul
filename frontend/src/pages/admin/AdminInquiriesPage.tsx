import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowUpRight,
  LuBedDouble,
  LuCalendarDays,
  LuCircleCheck,
  LuHouse,
  LuInbox,
  LuMessageCircle,
  LuPhoneCall,
  LuRotateCcw,
  LuTriangleAlert,
  LuX,
} from 'react-icons/lu'
import { inquiriesService } from '@/services/inquiries'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Skeleton } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { InquiryStatusBadge } from '@/lib/status'
import { formatDate, formatPrice, initialOf } from '@/lib/format'
import type { Inquiry, InquiryStatus } from '@/types'

// ── WhatsApp link helper ───────────────────────────────────────────────────────
function waHref(phone: string, text: string): string {
  // Normalize Palestinian local numbers: 05x → +9705x (PA country code +970)
  let p = phone.replace(/[\s\-().]/g, '')
  if (/^05/.test(p)) p = '+970' + p.slice(1)
  else if (!p.startsWith('+')) p = '+' + p
  return `https://wa.me/${p.replace('+', '')}?text=${encodeURIComponent(text)}`
}

function Person({ label, name, phone, tone }: { label: string; name: string; phone: string; tone: 'brand' | 'accent' }) {
  const avatar = tone === 'brand' ? 'bg-brand-100 text-brand-700' : 'bg-accent-100 text-accent-700'
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatar}`}>
        {initialOf(name)}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-900">{name || '—'}</p>
        <p dir="ltr" className="text-xs text-slate-500 rtl:text-end">
          {phone || '—'}
        </p>
      </div>
    </div>
  )
}

// ── Inquiry card ──────────────────────────────────────────────────────────────
function InquiryCard({
  inquiry,
  onStatusChange,
}: {
  inquiry: Inquiry
  onStatusChange: (id: string, s: InquiryStatus) => Promise<string | null>
}) {
  const { t, i18n } = useTranslation()
  const [updating, setUpdating] = useState<InquiryStatus | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)

  async function update(s: InquiryStatus) {
    setUpdating(s)
    setCardError(null)
    const err = await onStatusChange(inquiry.id, s)
    if (err) setCardError(err)
    setUpdating(null)
  }

  // WhatsApp message pre-filled for admin to send to student
  const waText = [
    t('admin.inquiries.waGreeting', { name: inquiry.student_name }),
    inquiry.property ? `🏠 ${inquiry.property.title}, ${inquiry.property.city}` : '',
    inquiry.room ? `🛏 ${inquiry.room.room_type} — ${formatPrice(inquiry.room.price_per_bed)}` : '',
    inquiry.message ? `💬 "${inquiry.message}"` : '',
    t('admin.inquiries.waSignature'),
  ]
    .filter(Boolean)
    .join('\n')

  const active = inquiry.status === 'PENDING' || inquiry.status === 'CONTACTED'

  return (
    <article className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <InquiryStatusBadge status={inquiry.status} />
        <span className="text-xs text-slate-400">{formatDate(inquiry.created_at, i18n.language)}</span>
      </div>

      {/* Property + room — deep link */}
      {(inquiry.property || inquiry.room) && (
        <Link
          to={`/listings/${inquiry.property_id}${inquiry.room_id ? `?room=${inquiry.room_id}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LuHouse className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            {inquiry.property && (
              <p className="truncate font-bold text-slate-900 group-hover:text-brand-700">
                {inquiry.property.title} <span className="font-normal text-slate-400">· {inquiry.property.city}</span>
              </p>
            )}
            {inquiry.room && (
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <LuBedDouble className="size-3.5" />
                {t(`enums.roomType.${inquiry.room.room_type}`)} ·{' '}
                <span className="font-bold text-slate-800">{formatPrice(inquiry.room.price_per_bed)}</span>
              </p>
            )}
          </div>
          <LuArrowUpRight className="size-4 shrink-0 text-slate-400 group-hover:text-brand-600 rtl:-scale-x-100" />
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Person label={t('admin.inquiries.studentLabel')} name={inquiry.student_name} phone={inquiry.student_phone} tone="brand" />
        <Person label={t('admin.inquiries.landlordLabel')} name={inquiry.landlord_name} phone={inquiry.landlord_phone} tone="accent" />
      </div>

      {(inquiry.move_in_date || inquiry.message) && (
        <div className="space-y-2">
          {inquiry.move_in_date && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              <LuCalendarDays className="size-3.5" />
              {t('admin.inquiries.moveInDate')}: {formatDate(inquiry.move_in_date, i18n.language)}
            </p>
          )}
          {inquiry.message && (
            <blockquote className="whitespace-pre-wrap rounded-2xl border-s-4 border-brand-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {inquiry.message}
            </blockquote>
          )}
        </div>
      )}

      {cardError && <Alert tone="danger">{cardError}</Alert>}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        {active && inquiry.student_phone && (
          <a
            href={waHref(inquiry.student_phone, waText)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (inquiry.status === 'PENDING') update('CONTACTED')
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <LuMessageCircle className="size-4" />
            {t('admin.inquiries.whatsappStudent')}
          </a>
        )}
        {active && inquiry.landlord_phone && (
          <a
            href={waHref(
              inquiry.landlord_phone,
              t('admin.inquiries.waLandlordText', { property: inquiry.property?.title ?? '', student: inquiry.student_name }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <LuMessageCircle className="size-4" />
            {t('admin.inquiries.whatsappLandlord')}
          </a>
        )}

        <div className="ms-auto flex flex-wrap gap-2">
          {inquiry.status === 'PENDING' && (
            <Button size="sm" variant="secondary" loading={updating === 'CONTACTED'} disabled={!!updating} onClick={() => update('CONTACTED')} leftIcon={<LuPhoneCall className="size-3.5" />}>
              {t('admin.inquiries.markContacted')}
            </Button>
          )}
          {inquiry.status === 'CONTACTED' && (
            <Button size="sm" variant="success" loading={updating === 'BOOKED'} disabled={!!updating} onClick={() => update('BOOKED')} leftIcon={<LuCircleCheck className="size-3.5" />}>
              {t('admin.inquiries.markBooked')}
            </Button>
          )}
          {active && (
            <Button size="sm" variant="danger-soft" loading={updating === 'CANCELLED'} disabled={!!updating} onClick={() => update('CANCELLED')} leftIcon={<LuX className="size-3.5" />}>
              {t('admin.inquiries.cancelInquiry')}
            </Button>
          )}
          {inquiry.status === 'CANCELLED' && (
            <Button size="sm" variant="outline" loading={updating === 'PENDING'} disabled={!!updating} onClick={() => update('PENDING')} leftIcon={<LuRotateCcw className="size-3.5" />}>
              {t('admin.inquiries.reopen')}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS: { label: string; value: InquiryStatus | 'ALL' }[] = [
  { label: 'admin.inquiries.all', value: 'ALL' },
  { label: 'admin.inquiries.pending', value: 'PENDING' },
  { label: 'admin.inquiries.contacted', value: 'CONTACTED' },
  { label: 'admin.inquiries.booked', value: 'BOOKED' },
  { label: 'admin.inquiries.cancelled', value: 'CANCELLED' },
]

const EMPTY_COUNTS: Record<InquiryStatus, number> = { PENDING: 0, CONTACTED: 0, BOOKED: 0, CANCELLED: 0 }

export default function AdminInquiriesPage() {
  const { t } = useTranslation()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [counts, setCounts] = useState<Record<InquiryStatus, number>>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<InquiryStatus | 'ALL'>('ALL')

  useEffect(() => {
    setLoading(true)
    setError(null)
    inquiriesService
      .adminList(tab === 'ALL' ? undefined : tab)
      .then((r) => {
        setInquiries(r.data.data)
        setCounts(r.data.counts)
      })
      .catch(() => setError(t('admin.inquiries.error')))
      .finally(() => setLoading(false))
  }, [tab, t])

  async function handleStatusChange(id: string, status: InquiryStatus): Promise<string | null> {
    try {
      const res = await inquiriesService.updateStatus(id, status)
      const updated = res.data
      setInquiries((prev) => {
        const next = prev.map((i) => (i.id === id ? updated : i))
        // When on a filtered tab, remove the inquiry if it no longer belongs
        return tab !== 'ALL' && updated.status !== tab ? next.filter((i) => i.id !== id) : next
      })
      // Refresh tab-badge counts
      inquiriesService
        .adminList(undefined)
        .then((r) => setCounts(r.data.counts))
        .catch(() => {})
      return null
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      return e?.response?.data?.detail ?? t('admin.inquiries.updateError')
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('admin.inquiries.title')}
        subtitle={counts.PENDING > 0 ? t('admin.inquiries.pendingSubtitle', { count: counts.PENDING }) : t('admin.inquiries.subtitle')}
        className="mb-6"
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={TABS.map(({ label, value }) => ({
          value,
          label: t(label),
          count: value === 'ALL' ? total : (counts[value as InquiryStatus] ?? 0),
        }))}
      />

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={<LuTriangleAlert />} title={error} />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={<LuInbox />} title={t('admin.inquiries.noInquiries')} description={t('admin.properties.allCaughtUp')} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {inquiries.map((inq) => (
            <InquiryCard key={inq.id} inquiry={inq} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
