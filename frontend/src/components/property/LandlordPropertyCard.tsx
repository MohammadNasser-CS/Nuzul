import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuArrowUpRight, LuBedDouble, LuHouse, LuMapPin, LuSettings2 } from 'react-icons/lu'
import { coverImageOf } from '@/lib/format'
import { PropertyStatusBadge } from '@/lib/status'
import { LinkButton } from '@/components/ui/Button'
import type { Property } from '@/types'

/** Property card from the landlord's point of view: status, feedback and management actions. */
export function LandlordPropertyCard({ property: p }: { property: Property }) {
  const { t } = useTranslation()
  const cover = coverImageOf(p)
  const roomCount = p.rooms?.length ?? 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-shadow hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={p.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-300">
            <LuHouse className="size-10" />
          </div>
        )}
        <PropertyStatusBadge status={p.verification_status} className="absolute top-3 start-3 shadow-sm ring-0" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-bold text-slate-900">{p.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <LuMapPin className="size-3.5" />
              {p.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <LuBedDouble className="size-3.5" />
              {roomCount} {roomCount === 1 ? t('property.room') : t('property.rooms')}
            </span>
            <span>{t(`enums.propertyType.${p.property_type}`)}</span>
          </div>
        </div>

        {p.verification_status === 'REJECTED' && p.rejection_reason && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            <span className="font-bold">{t('dashboard.rejectionReason')}: </span>
            {p.rejection_reason}
          </div>
        )}
        {p.verification_status === 'PENDING' && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {p.revision_note ? p.revision_note : t('dashboard.pendingHint')}
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-1">
          <LinkButton
            to={`/landlord/properties/${p.id}/rooms`}
            variant="secondary"
            size="sm"
            block
            leftIcon={<LuSettings2 className="size-4" />}
          >
            {t('dashboard.manage')}
          </LinkButton>
          {p.verification_status === 'APPROVED' && (
            <Link
              to={`/listings/${p.id}`}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('dashboard.view')}
              <LuArrowUpRight className="size-3.5 rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
