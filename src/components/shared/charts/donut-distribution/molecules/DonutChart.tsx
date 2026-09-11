import { memo, useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

import { getChartTotal, getPercentage } from '../utils'
import type { DonutDistributionItem } from '../types'
import { cn } from '@/lib/utils'

type DonutChartProps = {
  data: DonutDistributionItem[]
  valueLabel?: string
  className?: string
}

export const DonutChart = memo(function DonutChart({ data, valueLabel = 'Value', className }: DonutChartProps) {
  const total = useMemo(() => getChartTotal(data), [data])

  const chartData = useMemo(() => {
    return data
      .filter((item) => item.value > 0)
      .map((item) => ({
        ...item,
        percentage: getPercentage(item.value, total),
      }))
  }, [data, total])

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      value: {
        label: valueLabel,
      },
    }

    data.forEach((item) => {
      config[item.key] = {
        label: item.label,
        color: item.color,
      }
    })

    return config
  }, [data, valueLabel])

  if (!total) {
    return (
      <div
        className={cn(
          'mx-auto flex size-37.5 items-center justify-center rounded-full border text-sm text-muted-foreground',
          className
        )}
      >
        No data
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className={cn('mx-auto size-37.5', className)}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={49}
          outerRadius={68}
          startAngle={0}
          endAngle={360}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {chartData.map((item) => (
            <Cell key={item.key} fill={`var(--color-${item.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
})
