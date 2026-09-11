import { memo } from 'react'

import { cn } from '@/lib/utils'

type DonutLegendItemProps = {
  label: string
  color: string
  value: number
  suffix?: string
  align?: 'start' | 'end'
  className?: string
}

export const DonutLegendItem = memo(function DonutLegendItem({
  label,
  color,
  value,
  suffix,
  align = 'start',
  className,
}: DonutLegendItemProps) {
  return (
    <div className={cn('flex items-center gap-2', align === 'end' && 'justify-end', className)}>
      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />

      <div className="leading-tight">
        <p className="text-sm font-normal text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  )
})
