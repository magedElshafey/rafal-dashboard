export type DonutDistributionItem = {
  key: string
  label: string
  value: number
  color: string
}

export type DonutDistributionCardProps = {
  title: string
  data: DonutDistributionItem[]
  valueLabel?: string
  legendValue?: 'percentage' | 'value'
  orientation?: 'vertical' | 'horizontal'
  className?: string
  chartClassName?: string
  isLoading?: boolean
  emptyText?: string
}
