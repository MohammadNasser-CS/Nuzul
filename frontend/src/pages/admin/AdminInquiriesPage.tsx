import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inquiriesService } from '@/services/inquiries'
import type { Inquiry, InquiryStatus } from '@/types'

// ── WhatsApp link helper ───────────────────────────────────────────────────────
function waHref(phone: string, text: string): string {
  // Normalize Palestinian local numbers: 05x → +9705x (PA country code +970)
  let p = phone.replace(/[\s\-().]/g, '')
  if (/^05/.test(p)) p = '+970' + p.slice(1)
  else if (!p.startsWith('+')) p = '+' + p
  return `https://wa.me/${p.replace('+', '')}?text=${encodeURIComponent(text)}`
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InquiryStatus }) {
  const { t } = useTranslation()
  const styles: Record<InquiryStatus, string> = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
    BOOKED:    'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-500 border-red-200',
  }
  const icons: Record<InquiryStatus, string> = {
    PENDING:   '🕐',
    CONTACTED: '📞',
    BOOKED:    '✅',
    CANCELLED: '✕',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}>
      <span>{icons[status]}</span>
      {t(`enums.inquiryStatus.${status}`)}
    </span>
  )
}

// ── Inquiry card ──────────────────────────────────────────────────────────────
function InquiryCard({
  inquiry,
  onStatusChange,
}: {
  inquiry: Inquiry
  onStatusChange: (id: string, s: InquiryStatus) => Promise<void>
}) {
  const { t } = useTranslation()
  const [updating, setUpdating] = useState(false)

  async function update(s: InquiryStatus) {
    setUpdating(true)
    await onStatusChange(inquiry.id, s)
    setUpdating(false)
  }

  // WhatsApp message pre-filled for admin to send to student
  const waText = [
    t('admin.inquiries.waGreeting', { name: inquiry.student_name }),
    inquiry.property ? `🏠 ${inquiry.property.title}, ${inquiry.property.city}` : '',
    inquiry.room ? `🛏 ${inquiry.room.room_type} — ₪${Math.round(parseFloat(inquiry.room.price_per_bed)).toLocaleString()}` : '',
    inquiry.message ? `💬 "${inquiry.message}"` : '',
    t('admin.inquiries.waSignature'),
  ].filter(Boolean).join('\n')

  const date = new Date(inquiry.created_at).toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      {/* Top row: status + date */}
      <div className="flex items-center justify-between">
        <StatusBadge status={inquiry.status} />
        <span className="text-xs text-gray-400">{date}</span>
      </div>

      {/* Property + room — clickable deep-link */}
      {(inquiry.property || inquiry.room) && (
        <Link
          to={`/listings/${inquiry.property_id}${inquiry.room_id ? `?room=${inquiry.room_id}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-gray-50 hover:bg-brand-50 border border-transparent hover:border-brand-200 rounded-xl px-4 py-3 text-sm space-y-0.5 transition-colors"
        >
          {inquiry.property && (
            <p className="font-medium text-gray-800 group-hover:text-brand-700">
              🏠 {inquiry.property.title}
              <span className="text-gray-400 group-hover:text-brand-400 font-normal ms-1">· {inquiry.property.city}</span>
            </p>
          )}
          {inquiry.room && (
            <p className="text-gray-500 text-xs">
              🛏 {t(`enums.roomType.${inquiry.room.room_type}`)}
              {' '}·{' '}
              <span className="text-brand-600 font-semibold">
                ₪{Math.round(parseFloat(inquiry.room.price_per_bed)).toLocaleString()}
              </span>
              <span className="text-gray-400"> {t('property.perBed')}</span>
            </p>
          )}
          <p className="text-xs text-brand-500 group-hover:text-brand-600 pt-0.5 font-medium">
            {t('admin.inquiries.viewProperty')}
          </p>
        </Link>
      )}

      {/* Student + landlord info */}
      <div className="grid grid-cols-2 gap-3">
        {/* Student */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
            {(inquiry.student_name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t('admin.inquiries.studentLabel')}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{inquiry.student_name || '—'}</p>
            <p className="text-xs text-gray-500">{inquiry.student_phone || '—'}</p>
          </div>
        </div>

        {/* Landlord */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
            {(inquiry.landlord_name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t('admin.inquiries.landlordLabel')}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{inquiry.landlord_name || '—'}</p>
            <p className="text-xs text-gray-500">{inquiry.landlord_phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {inquiry.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">
          "{inquiry.message}"
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">

        {/* ── WhatsApp buttons (only while inquiry is still active) ── */}
        {(inquiry.status === 'PENDING' || inquiry.status === 'CONTACTED') && (
          <>
            {inquiry.student_phone && (
              <a
                href={waHref(inquiry.student_phone, waText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { if (inquiry.status === 'PENDING') update('CONTACTED') }}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>📲</span>
                {t('admin.inquiries.whatsappStudent')}
              </a>
            )}
            {inquiry.landlord_phone && (
              <a
                href={waHref(inquiry.landlord_phone, t('admin.inquiries.waLandlordText', {
                  property: inquiry.property?.title ?? '',
                  student: inquiry.student_name,
                }))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>🏠</span>
                {t('admin.inquiries.whatsappLandlord')}
              </a>
            )}
          </>
        )}

        {/* ── Status-advance buttons ── */}

        {/* PENDING → CONTACTED */}
        {inquiry.status === 'PENDING' && (
          <button
            disabled={updating}
            onClick={() => update('CONTACTED')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {t('admin.inquiries.markContacted')}
          </button>
        )}

        {/* CONTACTED → BOOKED */}
        {inquiry.status === 'CONTACTED' && (
          <button
            disabled={updating}
            onClick={() => update('BOOKED')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {t('admin.inquiries.markBooked')}
          </button>
        )}

        {/* PENDING or CONTACTED → CANCELLED */}
        {(inquiry.status === 'PENDING' || inquiry.status === 'CONTACTED') && (
          <button
            disabled={updating}
            onClick={() => update('CANCELLED')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {t('admin.inquiries.cancelInquiry')}
          </button>
        )}

        {/* CANCELLED → PENDING (reopen) */}
        {inquiry.status === 'CANCELLED' && (
          <button
            disabled={updating}
            onClick={() => update('PENDING')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('admin.inquiries.reopen')}
          </button>
        )}

      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS: { label: string; value: InquiryStatus | 'ALL' }[] = [
  { label: 'admin.inquiries.all',       value: 'ALL' },
  { label: 'admin.inquiries.pending',   value: 'PENDING' },
  { label: 'admin.inquiries.contacted', value: 'CONTACTED' },
  { label: 'admin.inquiries.booked',    value: 'BOOKED' },
  { label: 'admin.inquiries.cancelled', value: 'CANCELLED' },
]

const EMPTY_COUNTS: Record<InquiryStatus, number> = {
  PENDING: 0, CONTACTED: 0, BOOKED: 0, CANCELLED: 0,
}

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

  async function handleStatusChange(id: string, status: InquiryStatus) {
    try {
      const res = await inquiriesService.updateStatus(id, status)
      // Update the card in the list
      setInquiries((prev) => prev.map((i) => (i.id === id ? res.data : i)))
      // Refresh counts from backend to keep badges accurate
      inquiriesService
        .adminList(tab === 'ALL' ? undefined : tab)
        .then((r) => setCounts(r.data.counts))
        .catch(() => {})
    } catch {
      // silently ignore — card UI stays at old state
    }
  }

  const pendingCount = counts.PENDING

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.inquiries.title')}</h1>
        {pendingCount > 0 && (
          <p className="text-sm text-yellow-600 mt-0.5">
            {pendingCount} {t('admin.inquiries.pendingCount')}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ label, value }) => {
          // ALL tab sums all status counts so it's always accurate
          const count = value === 'ALL'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[value as InquiryStatus] ?? 0
          return (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(label)}
              <span className={`ms-1.5 text-xs ${tab === value ? 'text-brand-600' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p className="text-3xl mb-2">⚠</p>
          <p>{error}</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-base font-medium text-gray-500">{t('admin.inquiries.noInquiries')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <InquiryCard
              key={inq.id}
              inquiry={inq}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
