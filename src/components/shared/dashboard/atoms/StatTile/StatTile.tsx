import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { statTileToneClassNames, type StatTileTone } from './stat-tile.variants'

type StatTileClassNames = {
  root?: ComponentProps<'div'>['className']
  value?: ComponentProps<'p'>['className']
  label?: ComponentProps<'p'>['className']
}

export type StatTileProps = ComponentProps<'div'> & {
  label: ReactNode
  value: ReactNode
  tone?: StatTileTone
  classNames?: StatTileClassNames
}

export function StatTile({ label, value, tone = 'neutral', className, classNames, ...props }: StatTileProps) {
  return (
    <div className={cn('rounded-lg bg-neutral-50 py-3 text-center', className, classNames?.root)} {...props}>
      <p className={cn('font-semibold', statTileToneClassNames[tone], classNames?.value)}>{value}</p>
      <p className={cn('text-[10px] text-light-text', classNames?.label)}>{label}</p>
    </div>
  )
}
