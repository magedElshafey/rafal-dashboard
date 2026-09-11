import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { useRemainingTime } from '@/hooks/useRemainingTime'
import type { DateInput } from '@/utils/date/date.helpers'

type RemainingTimeBadgeProps = {
  target: DateInput
  isUpcoming: boolean
  fallback?: ReactNode
}

export function RemainingTimeBadge({ isUpcoming, fallback = null, ...props }: RemainingTimeBadgeProps) {
  return isUpcoming ? <ActiveRemainingTimeBadge {...props} fallback={fallback} /> : fallback
}

function ActiveRemainingTimeBadge({ target, fallback }: Omit<RemainingTimeBadgeProps, 'isUpcoming'>) {
  const { text, variant } = useRemainingTime(target)
  return text && variant ? <Badge variant={variant}>{text}</Badge> : fallback
}
