import { memo, useMemo } from 'react'

import { DonutLegendItem } from '../atoms/DonutLegendItem'
import { DonutChart } from '../molecules/DonutChart'
import type { DonutDistributionCardProps } from '../types'
import { getChartTotal, getPercentage } from '../utils'
import { cn } from '@/lib/utils'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import DashboardHeading from '@/components/shared/data-display/heading/DashboardHeading'

export const DonutDistributionCard = memo(function DonutDistributionCard({
  title,
  data,
  valueLabel,
  legendValue = 'percentage',
  orientation = 'vertical',
  className,
  chartClassName,
  isLoading,
  emptyText = 'No data available',
}: DonutDistributionCardProps) {
  const total = useMemo(() => getChartTotal(data), [data])

  if (isLoading) {
    return (
      <DashboardCard>
        <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />

        <div className="mx-auto mt-7 size-37.5 animate-pulse rounded-full bg-muted" />

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </div>
      </DashboardCard>
    )
  }

  if (!total) {
    return (
      <DashboardCard className={cn(className)}>
        <DashboardHeading title={title} />

        <div className="flex  items-center justify-center text-sm text-neutral-600 mt-8">{emptyText}</div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard className={cn(className)}>
      <DashboardHeading title={title} />

      <div
        className={cn(
          'mt-7',
          orientation === 'horizontal' && 'grid gap-6 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-center'
        )}
      >
        <div className="flex justify-center">
          <DonutChart data={data} valueLabel={valueLabel} className={chartClassName} />
        </div>

        <div
          className={cn(
            'grid items-center gap-6',
            orientation === 'vertical' ? 'mt-6 grid-cols-2' : 'grid-cols-1 gap-3'
          )}
        >
          {data.map((item, index) => (
            <DonutLegendItem
              key={item.key}
              label={item.label}
              color={item.color}
              value={legendValue === 'value' ? item.value : getPercentage(item.value, total)}
              suffix={legendValue === 'percentage' ? '%' : undefined}
              align={orientation === 'vertical' && index % 2 !== 0 ? 'end' : 'start'}
            />
          ))}
        </div>
      </div>
    </DashboardCard>
  )
})
