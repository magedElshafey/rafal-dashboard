import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

export function CoverageZoneSummary({ zones }: { zones: readonly string[] }) {
  const { t } = useTranslation()
  if (zones.length === 0) return <span className="text-content-secondary">{t('warehouses.noCoverageZones')}</span>
  const visible = zones.slice(0, 2)
  return (
    <div className="flex max-w-full flex-wrap gap-1" title={zones.join(', ')}>
      {visible.map((zone) => (
        <Badge key={zone} variant="secondary" className="max-w-36">
          <bdi className="truncate" dir="auto">
            {zone}
          </bdi>
        </Badge>
      ))}
      {zones.length > 2 ? (
        <Badge variant="outline" aria-label={t('warehouses.moreCoverageZones', { count: zones.length - 2 })}>
          +{zones.length - 2}
        </Badge>
      ) : null}
    </div>
  )
}
