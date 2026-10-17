import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuArrowUpRight,
  LuBedDouble,
  LuCheck,
  LuHouse,
  LuImages,
  LuInbox,
  LuMapPin,
  LuMessageCircle,
  LuNotebookPen,
  LuX,
} from 'react-icons/lu'
import { adminService } from '@/services/admin'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Field, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { PropertyStatusBadge } from '@/lib/status'
import { coverImageOf, formatDate } from '@/lib/format'
import type { AdminProperty } from '@/types'

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

// ── Reject modal ───────────────────────────────────────────────────────────────
function RejectModal({
  property,
  onClose,
  onConfirm,
}: {
  property: AdminProperty
  onClose: () => void
  onConfirm: (reason: string, notes: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return setError(t('admin.properties.rejectModal.reasonRequired'))
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
    <Modal
      open
      onClose={onClose}
      title={t('admin.properties.rejectModal.title')}
      description={property.title}
      icon={<LuX className="text-red-500" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('admin.properties.rejectModal.cancel')}
          </Button>
          <Button type="submit" form="reject-form" variant="danger" loading={submitting} className="flex-1">
            {submitting ? t('admin.properties.rejectModal.submitting') : t('admin.properties.rejectModal.submit')}
          </Button>
        </>
      }
    >
      <form id="reject-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('admin.properties.rejectModal.reason')} required>
          <Textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('admin.properties.rejectModal.reasonPlaceholder')}
            rows={3}
          />
        </Field>
        <Field label={t('admin.properties.rejectModal.notes')}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('admin.properties.rejectModal.notesPlaceholder')}
            rows={2}
          />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Modal>
  )
}

// ── Moderation card ───────────────────────────────────────────────────────────
function ModerationCard({
  property: p,
  onApprove,
  onReject,
  approving,
}: {
  property: AdminProperty
  onApprove: (p: AdminProperty) => void
  onReject: (p: AdminProperty) => void
  approving: boolean
}) {
  const { t, i18n } = useTranslation()
  const cover = coverImageOf(p)
  const roomCount = p.rooms?.length ?? 0
  const imageCount = p.images?.length ?? 0
  const canApprove = roomCount > 0 && imageCount > 0

  const approveBlocker = !canApprove
    ? roomCount === 0 && imageCount === 0
      ? t('admin.properties.approveDisabledBoth')
      : roomCount === 0
        ? t('admin.properties.approveDisabledRooms')
        : t('admin.properties.approveDisabledImages')
    : null

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      <div className="flex flex-col sm:flex-row">
        {/* Cover */}
        <div className="relative aspect-[16/9] shrink-0 bg-slate-100 sm:aspect-auto sm:w-56">
          {cover ? (
            <img src={cover} alt={p.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full min-h-32 items-center justify-center text-slate-300">
              <LuHouse className="size-10" />
            </div>
          )}
          <PropertyStatusBadge status={p.verification_status} className="absolute top-3 start-3 shadow-sm ring-0" />
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <div>
            <h3 className="line-clamp-1 text-base font-extrabold text-slate-900">{p.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <LuMapPin className="size-3.5" />
                {p.city}
              </span>
              <span>{t(`enums.propertyType.${p.property_type}`)}</span>
              <span className={`inline-flex items-center gap-1 ${roomCount === 0 ? 'font-semibold text-red-600' : ''}`}>
                <LuBedDouble className="size-3.5" />
                {roomCount} {t('admin.properties.rooms')}
              </span>
              <span className={`inline-flex items-center gap-1 ${imageCount === 0 ? 'font-semibold text-red-600' : ''}`}>
                <LuImages className="size-3.5" />
                {imageCount} {t('admin.properties.images')}
              </span>
            </div>
          </div>

          {p.landlord_name && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{t('admin.properties.landlord')}:</span>
              <span className="font-semibold text-slate-800">{p.landlord_name}</span>
              {p.landlord_phone && (
                <a
                  href={`https://wa.me/${p.landlord_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <LuMessageCircle className="size-3.5" />
                  {p.landlord_phone}
                </a>
              )}
              <span className="text-xs text-slate-400">· {formatDate(p.created_at, i18n.language)}</span>
            </div>
          )}

          {p.verification_status === 'PENDING' && p.revision_note && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <p className="mb-0.5 inline-flex items-center gap-1.5 font-bold text-amber-800">
                <LuNotebookPen className="size-4" />
                {t('admin.properties.revisionNote')}
              </p>
              <p className="line-clamp-3 text-amber-900">{p.revision_note}</p>
            </div>
          )}

          {p.verification_status === 'REJECTED' && p.rejection_reason && (
            <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{p.rejection_reason}</p>
          )}

          {approveBlocker && p.verification_status !== 'APPROVED' && (
            <p className="text-xs font-semibold text-red-600">{approveBlocker}</p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="success"
              size="sm"
              onClick={() => canApprove && onApprove(p)}
              disabled={!canApprove || p.verification_status === 'APPROVED'}
              loading={approving}
              leftIcon={<LuCheck className="size-4" />}
            >
              {t('admin.properties.approve')}
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              onClick={() => onReject(p)}
              disabled={p.verification_status === 'REJECTED'}
              leftIcon={<LuX className="size-4" />}
            >
              {t('admin.properties.reject')}
            </Button>
            {p.verification_status === 'APPROVED' && (
              <Link
                to={`/listings/${p.id}`}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {t('admin.properties.viewListing')}
                <LuArrowUpRight className="size-3.5 rtl:-scale-x-100" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
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
      .then((res) => setProperties(res.data))
      .catch(() => setError(t('admin.properties.error')))
      .finally(() => setLoading(false))
  }, [t])

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    setSearchParams(tab === 'ALL' ? {} : { status: tab })
  }

  const counts: Record<Tab, number> = {
    ALL: properties.length,
    PENDING: properties.filter((p) => p.verification_status === 'PENDING').length,
    APPROVED: properties.filter((p) => p.verification_status === 'APPROVED').length,
    REJECTED: properties.filter((p) => p.verification_status === 'REJECTED').length,
  }

  const visible = activeTab === 'ALL' ? properties : properties.filter((p) => p.verification_status === activeTab)

  async function handleApprove(p: AdminProperty) {
    setApprovingId(p.id)
    setActionError(null)
    try {
      const res = await adminService.approveProperty(p.id)
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...res.data } : x)))
    } catch {
      setActionError(t('admin.properties.approveError'))
    } finally {
      setApprovingId(null)
    }
  }

  async function handleRejectConfirm(reason: string, notes: string) {
    if (!rejectTarget) return
    const res = await adminService.rejectProperty(rejectTarget.id, reason, notes || undefined)
    setProperties((prev) => prev.map((x) => (x.id === rejectTarget.id ? { ...x, ...res.data } : x)))
  }

  const tabs: Tab[] = ['PENDING', 'ALL', 'APPROVED', 'REJECTED']
  const tabLabels: Record<Tab, string> = {
    ALL: t('admin.properties.all'),
    PENDING: t('admin.properties.pending'),
    APPROVED: t('admin.properties.approved'),
    REJECTED: t('admin.properties.rejected'),
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('admin.properties.title')} subtitle={t('admin.properties.subtitle')} className="mb-6" />

      <Tabs
        className="mb-6"
        value={activeTab}
        onChange={switchTab}
        items={tabs.map((tab) => ({ value: tab, label: tabLabels[tab], count: loading ? undefined : counts[tab] }))}
      />

      {(error || actionError) && <Alert tone="danger" className="mb-4">{error ?? actionError}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<LuInbox />} title={t('admin.properties.noProperties')} description={t('admin.properties.allCaughtUp')} />
      ) : (
        <div className="space-y-4">
          {visible.map((p) => (
            <ModerationCard
              key={p.id}
              property={p}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              approving={approvingId === p.id}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal property={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleRejectConfirm} />
      )}
    </div>
  )
}
