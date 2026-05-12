import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminService } from '@/services/admin'
import type { AdminProperty } from '@/types'

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

// ── Reject modal ───────────────────────────────────────────────────────────────

interface RejectModalProps {
  property: AdminProperty
  onClose: () => void
  onConfirm: (reason: string, notes: string) => Promise<void>
}

function RejectModal({ property, onClose, onConfirm }: RejectModalProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { reasonRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) { setError(t('admin.properties.rejectModal.reasonRequired')); return }
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(reason.trim(), notes.trim())
      onClose()
    } catch {
      setError(t('admin.properties.rejectError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">{t('admin.properties.rejectModal.title')}</h2>
        <p className="text-sm text-gray-600 truncate">{property.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('admin.properties.rejectModal.reason')}
              <span className="text-red-500 ms-0.5">*</span>
            </label>
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('admin.properties.rejectModal.reasonPlaceholder')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('admin.properties.rejectModal.notes')}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('admin.properties.rejectModal.notesPlaceholder')}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('admin.properties.rejectModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? t('admin.properties.rejectModal.submitting')
                : t('admin.properties.rejectModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Property card ──────────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: AdminProperty
  onApprove: (p: AdminProperty) => void
  onReject: (p: AdminProperty) => void
  approving: boolean
}

function PropertyCard({ property: p, onApprove, onReject, approving }: PropertyCardProps) {
  const { t } = useTranslation()

  const cover = p.images?.find(i => i.is_primary)?.image_url ?? p.images?.[0]?.image_url
  const roomCount  = p.rooms?.length ?? 0
  const imageCount = p.images?.length ?? 0
  const canApprove = roomCount > 0 && imageCount > 0

  const approveTooltip = !canApprove
    ? roomCount === 0 && imageCount === 0
      ? t('admin.properties.approveDisabledBoth')
      : roomCount === 0
        ? t('admin.properties.approveDisabledRooms')
        : t('admin.properties.approveDisabledImages')
    : undefined

  const statusColors: Record<string, string> = {
    PENDING:  'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100  text-green-700',
    REJECTED: 'bg-red-100    text-red-700',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
      {/* Cover image */}
      <div className="sm:w-40 h-36 sm:h-auto flex-shrink-0 bg-gray-100">
        {cover ? (
          <img src={cover} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{p.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[p.verification_status]}`}>
            {t(`enums.propertyStatus.${p.verification_status}`)}
          </span>
        </div>

        {/* Meta */}
        <p className="text-xs text-gray-500">{p.city} · {t(`enums.propertyType.${p.property_type}`)}</p>

        {/* Landlord */}
        {p.landlord_name && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">{t('admin.properties.landlord')}:</span>{' '}
            {p.landlord_name}
            {p.landlord_phone && (
              <a
                href={`https://wa.me/${p.landlord_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-2 text-green-600 hover:underline"
              >
                {p.landlord_phone}
              </a>
            )}
          </p>
        )}

        {/* Counts */}
        <p className="text-xs text-gray-500">
          {roomCount} {t('admin.properties.rooms')} · {imageCount} {t('admin.properties.images')}
        </p>

        {/* Landlord revision note (shown when PENDING after an edit) */}
        {p.verification_status === 'PENDING' && p.revision_note && (
          <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
            <p className="font-semibold text-amber-700">📝 {t('admin.properties.revisionNote')}</p>
            <p className="text-amber-800 line-clamp-3">{p.revision_note}</p>
          </div>
        )}

        {/* Rejection reason (if rejected) */}
        {p.verification_status === 'REJECTED' && p.rejection_reason && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 line-clamp-2">
            {p.rejection_reason}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
          {/* Approve */}
          <div className="relative group">
            <button
              onClick={() => canApprove && onApprove(p)}
              disabled={!canApprove || approving || p.verification_status === 'APPROVED'}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {approving ? '…' : t('admin.properties.approve')}
            </button>
            {approveTooltip && (
              <div className="absolute bottom-full mb-1 start-0 w-48 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 hidden group-hover:block z-10 pointer-events-none">
                {approveTooltip}
              </div>
            )}
          </div>

          {/* Reject */}
          <button
            onClick={() => onReject(p)}
            disabled={p.verification_status === 'REJECTED'}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('admin.properties.reject')}
          </button>

          {/* View listing */}
          {p.verification_status === 'APPROVED' && (
            <Link
              to={`/listings/${p.id}`}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('admin.properties.viewListing')} ↗
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = (searchParams.get('status') as Tab | null) ?? 'PENDING'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [properties, setProperties] = useState<AdminProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminProperty | null>(null)

  // Load all properties once — filter in-memory for instant tab switching
  useEffect(() => {
    setLoading(true)
    adminService
      .listProperties()
      .then(res => setProperties(res.data))
      .catch(() => setError(t('admin.properties.error')))
      .finally(() => setLoading(false))
  }, [t])

  // Sync tab → search param
  function switchTab(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'ALL') {
      setSearchParams({})
    } else {
      setSearchParams({ status: tab })
    }
  }

  // Derived counts from loaded data
  const counts = {
    ALL:      properties.length,
    PENDING:  properties.filter(p => p.verification_status === 'PENDING').length,
    APPROVED: properties.filter(p => p.verification_status === 'APPROVED').length,
    REJECTED: properties.filter(p => p.verification_status === 'REJECTED').length,
  }

  const visible = activeTab === 'ALL'
    ? properties
    : properties.filter(p => p.verification_status === activeTab)

  async function handleApprove(p: AdminProperty) {
    setApprovingId(p.id)
    setActionError(null)
    try {
      const res = await adminService.approveProperty(p.id)
      setProperties(prev =>
        prev.map(x => x.id === p.id ? { ...x, ...res.data } : x)
      )
    } catch {
      setActionError(t('admin.properties.approveError'))
    } finally {
      setApprovingId(null)
    }
  }

  async function handleRejectConfirm(reason: string, notes: string) {
    if (!rejectTarget) return
    const res = await adminService.rejectProperty(rejectTarget.id, reason, notes || undefined)
    setProperties(prev =>
      prev.map(x => x.id === rejectTarget.id ? { ...x, ...res.data } : x)
    )
  }

  const tabs: Tab[] = ['PENDING', 'ALL', 'APPROVED', 'REJECTED']
  const tabLabels: Record<Tab, string> = {
    ALL:      t('admin.properties.all'),
    PENDING:  t('admin.properties.pending'),
    APPROVED: t('admin.properties.approved'),
    REJECTED: t('admin.properties.rejected'),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.properties.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tabLabels[tab]}
            {counts[tab] > 0 && (
              <span className={`ms-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {(error || actionError) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          {error ?? actionError}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <p className="text-center text-gray-500 py-10">{t('admin.properties.noProperties')}</p>
      ) : (
        <div className="space-y-4">
          {visible.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              approving={approvingId === p.id}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          property={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  )
}
