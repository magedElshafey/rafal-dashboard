import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import type { Banner } from '@/modules/banners/types/banner.types'
import { getBannerScheduleState } from '@/modules/banners/utils/banner.utils'

export function BannerSchedule({ banner }: { banner: Banner }) {
  const { t, i18n } = useTranslation()
  const state = getBannerScheduleState(banner)
  const variant =
    state === 'current' || state === 'unscheduled' ? 'success' : state === 'upcoming' ? 'warning' : 'outline'
  const dates = [banner.starts_at, banner.ends_at]
    .filter((date): date is string => Boolean(date))
    .map((date) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(date)))
    .join(' – ')

  return (
    <div className="min-w-0 space-y-1">
      <Badge variant={variant}>{t(`banners.schedule.${state}`)}</Badge>
      {dates ? <p className="max-w-48 whitespace-normal text-xs text-content-secondary">{dates}</p> : null}
    </div>
  )
}
