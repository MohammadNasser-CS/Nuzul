import { useTranslation } from 'react-i18next'
import { LuBadgeCheck, LuCircleCheck, LuCircleX, LuClock, LuPhoneCall } from 'react-icons/lu'
import { Badge } from '@/components/ui/Feedback'
import type { Tone } from '@/components/ui/Feedback'
import type { InquiryStatus, Property } from '@/types'

const PROPERTY_STATUS: Record<Property['verification_status'], { tone: Tone; icon: typeof LuClock }> = {
  PENDING: { tone: 'warning', icon: LuClock },
  APPROVED: { tone: 'success', icon: LuBadgeCheck },
  REJECTED: { tone: 'danger', icon: LuCircleX },
}

const INQUIRY_STATUS: Record<InquiryStatus, { tone: Tone; icon: typeof LuClock }> = {
  PENDING: { tone: 'warning', icon: LuClock },
  CONTACTED: { tone: 'info', icon: LuPhoneCall },
  BOOKED: { tone: 'success', icon: LuCircleCheck },
  CANCELLED: { tone: 'neutral', icon: LuCircleX },
}

export function PropertyStatusBadge({ status, className }: { status: Property['verification_status']; className?: string }) {
  const { t } = useTranslation()
  const { tone, icon: Icon } = PROPERTY_STATUS[status]
  return (
    <Badge tone={tone} icon={<Icon />} className={className}>
      {t(`enums.propertyStatus.${status}`)}
    </Badge>
  )
}

export function InquiryStatusBadge({ status, className }: { status: InquiryStatus; className?: string }) {
  const { t } = useTranslation()
  const { tone, icon: Icon } = INQUIRY_STATUS[status]
  return (
    <Badge tone={tone} icon={<Icon />} className={className}>
      {t(`enums.inquiryStatus.${status}`)}
    </Badge>
  )
}
