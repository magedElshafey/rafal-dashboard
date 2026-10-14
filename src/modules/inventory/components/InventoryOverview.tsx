import { Boxes, Gauge, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { InventoryPage } from '@/modules/inventory/types/inventory.types'

export function InventoryOverview({ data, filtered = false }: { data?: InventoryPage; filtered?: boolean }) {
  const { t, i18n } = useTranslation()
  const numbers = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 20 })
  const signals = [
    { key: 'totalRecords', icon: Boxes, value: data?.meta.total },
    { key: 'pageRecords', icon: Layers, value: data?.items.length },
    { key: 'lowStockThreshold', icon: Gauge, value: data?.meta.low_stock_threshold },
  ] as const
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      aria-label={t('inventory.overview')}
      aria-hidden={!data || undefined}
    >
      {signals.map(({ key, icon: Icon, value }) => (
        <DashboardCard key={key} padding="lg" className="flex items-center gap-3">
          <span className="rounded-lg bg-muted p-2.5 text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t(key === 'totalRecords' && filtered ? 'inventory.filters.totalRecords' : `inventory.${key}`)}</p>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {value === undefined ? <Skeleton className="h-7 w-16" /> : numbers.format(value)}
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  )
}
